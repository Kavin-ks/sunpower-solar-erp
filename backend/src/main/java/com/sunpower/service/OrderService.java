package com.sunpower.service;

import com.sunpower.dto.OrderDTOs.OrderConvertRequest;
import com.sunpower.dto.OrderDTOs.OrderStatusUpdateRequest;
import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.OrderStatus;
import com.sunpower.entity.enums.Enums.QuotationStatus;
import com.sunpower.entity.enums.Enums.StockMovementType;
import com.sunpower.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private InventoryStockRepository inventoryStockRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private SubsidyApplicationRepository subsidyApplicationRepository;

    @Autowired
    private DispatchRepository dispatchRepository;

    @Autowired
    private DispatchItemRepository dispatchItemRepository;

    @Autowired
    private InstallationRepository installationRepository;

    @Autowired
    private PackageBOMRepository packageBOMRepository;

    public List<SalesOrder> getAllOrders() {
        return salesOrderRepository.findAll();
    }

    public SalesOrder getOrderById(Long id) {
        return salesOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sales order not found with id: " + id));
    }

    public List<SalesOrder> getOrdersByStatus(OrderStatus status) {
        return salesOrderRepository.findByStatus(status);
    }

    @Transactional
    public SalesOrder convertQuotationToOrder(OrderConvertRequest request, String createdBy) {
        Quotation quotation = quotationRepository.findById(request.getQuotationId())
                .orElseThrow(() -> new IllegalArgumentException("Quotation not found with id: " + request.getQuotationId()));

        // 1. Validate quotation acceptance before conversion
        if (quotation.getStatus() != QuotationStatus.ACCEPTED) {
            throw new IllegalStateException("Quotation " + quotation.getQuotationNumber() +
                    " must be ACCEPTED by the customer before it can be converted to an order. Current status is " + quotation.getStatus());
        }

        // 2. Prevent duplicate conversion
        if (salesOrderRepository.existsByQuotationId(quotation.getId())) {
            throw new IllegalStateException("A sales order has already been created for quotation " + quotation.getQuotationNumber());
        }

        // 3. Pre-validate stock availability for all required BOM products before making any reservations
        List<QuotationItem> checkItems = quotation.getItems();
        if (checkItems != null && !checkItems.isEmpty()) {
            for (QuotationItem qItem : checkItems) {
                InventoryStock stock = inventoryStockRepository.findByProductId(qItem.getProduct().getId())
                        .orElseThrow(() -> new IllegalStateException("Inventory record missing for product: " + qItem.getProduct().getName()));
                if (stock.getAvailableQuantity() < qItem.getQuantity()) {
                    throw new IllegalStateException("Insufficient inventory: Product '" + qItem.getProduct().getName() +
                            "' requires " + qItem.getQuantity() + " units, but only " + stock.getAvailableQuantity() + " are available in warehouse.");
                }
            }
        } else if (quotation.getSolarPackage() != null) {
            List<PackageBOM> bomList = packageBOMRepository.findBySolarPackageId(quotation.getSolarPackage().getId());
            for (PackageBOM bom : bomList) {
                InventoryStock stock = inventoryStockRepository.findByProductId(bom.getProduct().getId())
                        .orElseThrow(() -> new IllegalStateException("Inventory record missing for product: " + bom.getProduct().getName()));
                if (stock.getAvailableQuantity() < bom.getQuantity()) {
                    throw new IllegalStateException("Insufficient inventory: Product '" + bom.getProduct().getName() +
                            "' requires " + bom.getQuantity() + " units, but only " + stock.getAvailableQuantity() + " are available in warehouse.");
                }
            }
        }

        // 4. Generate guaranteed unique Order Number
        String orderNumber;
        int attempts = 0;
        do {
            orderNumber = "ORD-" + LocalDate.now().getYear() + "-" + String.format("%04d", (int)(Math.random() * 9000 + 1000));
            attempts++;
            if (attempts > 50) {
                orderNumber = "ORD-" + System.currentTimeMillis();
                break;
            }
        } while (salesOrderRepository.existsByOrderNumber(orderNumber));

        SalesOrder order = new SalesOrder();
        order.setOrderNumber(orderNumber);
        order.setCustomer(quotation.getCustomer());
        order.setQuotation(quotation);
        order.setSolarPackage(quotation.getSolarPackage());
        order.setSystemType(quotation.getSystemType());
        order.setCapacityKw(quotation.getCapacityKw());
        order.setOrderDate(LocalDate.now());
        order.setTotalAmount(quotation.getTotalAmount());
        order.setTotalPaid(BigDecimal.ZERO);
        order.setRemainingBalance(quotation.getTotalAmount());
        order.setStatus(OrderStatus.PENDING_PAYMENT);

        // Calculate advance required (default 30% per standard Solar EPC terms)
        BigDecimal advancePercentage = request.getAdvancePercentage() != null ?
                request.getAdvancePercentage() : BigDecimal.valueOf(30.00);
        BigDecimal advanceRequired = request.getAdvanceRequiredAmount() != null ?
                request.getAdvanceRequiredAmount() :
                quotation.getTotalAmount().multiply(advancePercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        order.setAdvanceRequired(advanceRequired);

        order = salesOrderRepository.save(order);

        // Copy quotation items to order items and reserve inventory stock transactionally
        List<OrderItem> orderItems = new ArrayList<>();
        List<QuotationItem> qItems = quotation.getItems();
        if ((qItems == null || qItems.isEmpty()) && quotation.getSolarPackage() != null) {
            List<PackageBOM> bomList = packageBOMRepository.findBySolarPackageId(quotation.getSolarPackage().getId());
            for (PackageBOM bom : bomList) {
                OrderItem oItem = new OrderItem(order, bom.getProduct(), bom.getQuantity(), bom.getProduct().getSellingPrice());
                orderItems.add(oItem);

                // Reserve stock
                InventoryStock stock = inventoryStockRepository.findByProductId(bom.getProduct().getId())
                        .orElseGet(() -> {
                            InventoryStock s = new InventoryStock(bom.getProduct(), bom.getProduct().getCurrentStock(), 0, "Main Warehouse");
                            return inventoryStockRepository.save(s);
                        });

                int needed = bom.getQuantity();
                stock.setReservedQuantity(stock.getReservedQuantity() + needed);
                stock.setAvailableQuantity(Math.max(0, stock.getAvailableQuantity() - needed));
                inventoryStockRepository.save(stock);

                StockMovement movement = new StockMovement(
                        bom.getProduct(),
                        StockMovementType.ADJUSTMENT,
                        -needed,
                        order.getOrderNumber(),
                        "Hard-reserved " + needed + " units for confirmed sales order " + order.getOrderNumber(),
                        createdBy != null ? createdBy : "Sales System"
                );
                stockMovementRepository.save(movement);
            }
        } else if (qItems != null) {
            for (QuotationItem qItem : qItems) {
                OrderItem oItem = new OrderItem(order, qItem.getProduct(), qItem.getQuantity(), qItem.getUnitPrice());
                orderItems.add(oItem);

                // Reserve the needed stock
                InventoryStock stock = inventoryStockRepository.findByProductId(qItem.getProduct().getId())
                        .orElseGet(() -> {
                            InventoryStock s = new InventoryStock(qItem.getProduct(), qItem.getProduct().getCurrentStock(), 0, "Main Warehouse");
                            return inventoryStockRepository.save(s);
                        });
                int needed = qItem.getQuantity();

                stock.setReservedQuantity(stock.getReservedQuantity() + needed);
                stock.setAvailableQuantity(Math.max(0, stock.getAvailableQuantity() - needed));
                inventoryStockRepository.save(stock);

                // Log stock movement audit
                StockMovement movement = new StockMovement(
                        qItem.getProduct(),
                        StockMovementType.ADJUSTMENT,
                        -needed,
                        order.getOrderNumber(),
                        "Hard-reserved " + needed + " units for confirmed sales order " + order.getOrderNumber(),
                        createdBy != null ? createdBy : "Sales System"
                );
                stockMovementRepository.save(movement);
            }
        }

        orderItemRepository.saveAll(orderItems);
        if (order.getItems() == null) {
            order.setItems(new ArrayList<>());
        } else {
            order.getItems().clear();
        }
        order.getItems().addAll(orderItems);

        // Generate GST Tax Invoice with reconciled Subtotal + Tax = Total
        BigDecimal installationCharge = quotation.getInstallationFee() != null ? quotation.getInstallationFee() : BigDecimal.ZERO;
        BigDecimal taxableSubtotal = quotation.getSubtotal().add(installationCharge);

        Invoice invoice = new Invoice();
        invoice.setSalesOrder(order);
        invoice.setCustomer(order.getCustomer());
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setDueDate(LocalDate.now().plusDays(15));
        invoice.setSubtotal(taxableSubtotal);
        invoice.setTaxAmount(quotation.getTaxAmount());
        invoice.setTotalAmount(quotation.getTotalAmount());
        invoice.setPaidAmount(BigDecimal.ZERO);
        invoice.setBalanceAmount(quotation.getTotalAmount());
        invoice.setStatus("ISSUED");
        invoice = invoiceRepository.save(invoice);
        if (invoice.getInvoiceNumber() == null) {
            invoice.setInvoiceNumber("INV-" + LocalDate.now().getYear() + "-" + String.format("%04d", invoice.getId()));
            invoiceRepository.save(invoice);
        }

        // If subsidy required from enquiry, initialize PM Surya Ghar subsidy application
        if (quotation.getSiteSurvey().getEnquiry() != null && quotation.getSiteSurvey().getEnquiry().isSubsidyRequired()) {
            SubsidyApplication subsidy = new SubsidyApplication();
            subsidy.setCustomer(order.getCustomer());
            subsidy.setSalesOrder(order);
            subsidy.setSubsidyAmountClaimed(BigDecimal.valueOf(78000.00)); // Standard PM Surya Ghar DBT subsidy
            subsidy.setStatus(com.sunpower.entity.enums.Enums.SubsidyStatus.DOCUMENTS_PENDING);
            subsidy = subsidyApplicationRepository.save(subsidy);
            if (subsidy.getApplicationNumber() == null) {
                subsidy.setApplicationNumber("SUB-" + LocalDate.now().getYear() + "-" + String.format("%04d", subsidy.getId()));
                subsidyApplicationRepository.save(subsidy);
            }
        }

        return order;
    }

    @Transactional
    public SalesOrder updateOrderStatus(Long id, OrderStatusUpdateRequest request) {
        SalesOrder order = getOrderById(id);
        order.setStatus(request.getStatus());
        order = salesOrderRepository.save(order);

        if (request.getStatus() == OrderStatus.CONFIRMED) {
            ensureDispatchAndInstallation(order);
        } else if (request.getStatus() == OrderStatus.CANCELLED) {
            releaseOrderReservations(order);
        }

        return order;
    }

    @Transactional
    public void releaseOrderReservations(SalesOrder order) {
        if (order == null || order.getId() == null) return;
        List<OrderItem> items = order.getItems() != null && !order.getItems().isEmpty() ?
                order.getItems() : orderItemRepository.findBySalesOrderId(order.getId());
        for (OrderItem item : items) {
            inventoryStockRepository.findByProductId(item.getProduct().getId()).ifPresent(stock -> {
                int toRelease = Math.min(stock.getReservedQuantity(), item.getQuantity());
                if (toRelease > 0) {
                    stock.setReservedQuantity(stock.getReservedQuantity() - toRelease);
                    stock.setAvailableQuantity(stock.getAvailableQuantity() + toRelease);
                    inventoryStockRepository.save(stock);

                    StockMovement movement = new StockMovement(
                            item.getProduct(),
                            StockMovementType.RETURN,
                            toRelease,
                            order.getOrderNumber(),
                            "Reservation released due to cancellation of order " + order.getOrderNumber(),
                            "Warehouse Inventory System"
                    );
                    stockMovementRepository.save(movement);
                }
            });
        }
    }

    @Transactional
    public void ensureDispatchAndInstallation(SalesOrder order) {
        if (order == null || order.getId() == null) return;

        // 1. Ensure Dispatch exists
        List<Dispatch> existingDispatches = dispatchRepository.findBySalesOrderId(order.getId());
        if (existingDispatches == null || existingDispatches.isEmpty()) {
            Dispatch dispatch = new Dispatch();
            dispatch.setSalesOrder(order);
            dispatch.setCustomer(order.getCustomer());
            dispatch.setStatus(com.sunpower.entity.enums.Enums.DispatchStatus.PICKING);
            dispatch.setDispatchNotes("Auto-created on order confirmation");
            dispatch = dispatchRepository.save(dispatch);
            if (dispatch.getDispatchNumber() == null) {
                String dspNum;
                long offset = 0;
                do {
                    dspNum = "DSP-" + String.format("%05d", dispatch.getId() + offset);
                    offset++;
                } while (dispatchRepository.findByDispatchNumber(dspNum).isPresent());
                dispatch.setDispatchNumber(dspNum);
                dispatch = dispatchRepository.save(dispatch);
            }

            List<DispatchItem> dispatchItems = new ArrayList<>();
            List<OrderItem> items = order.getItems() != null && !order.getItems().isEmpty() ?
                    order.getItems() : orderItemRepository.findBySalesOrderId(order.getId());
            for (OrderItem orderItem : items) {
                Product product = orderItem.getProduct();
                if (product.isSerialized() && (product.getProductCode() == null || !product.getProductCode().toUpperCase().contains("PANEL"))) {
                    for (int i = 0; i < orderItem.getQuantity(); i++) {
                        dispatchItems.add(new DispatchItem(dispatch, product, 1, null));
                    }
                } else {
                    dispatchItems.add(new DispatchItem(dispatch, product, orderItem.getQuantity(), null));
                }
            }
            dispatchItemRepository.saveAll(dispatchItems);
            dispatch.setItems(dispatchItems);
        }

        // 2. Ensure Installation exists
        java.util.Optional<Installation> existingInstallation = installationRepository.findBySalesOrderId(order.getId());
        if (existingInstallation.isEmpty()) {
            Installation installation = new Installation();
            installation.setSalesOrder(order);
            installation.setCustomer(order.getCustomer());
            installation.setScheduledDate(LocalDate.now().plusDays(3));
            installation.setInstalledCapacityKw(order.getCapacityKw());
            installation.setStatus(com.sunpower.entity.enums.Enums.InstallationStatus.SCHEDULED);
            installation.setWorkNotes("Auto-scheduled on order confirmation");
            installation = installationRepository.save(installation);
            if (installation.getInstallationNumber() == null) {
                installation.setInstallationNumber("INS-" + String.format("%05d", installation.getId()));
                installationRepository.save(installation);
            }
        }

        // 3. Ensure SubsidyApplication exists if subsidy was opted
        boolean subsidyOpted = (order.getQuotation() != null &&
                order.getQuotation().getSiteSurvey() != null &&
                order.getQuotation().getSiteSurvey().getEnquiry() != null &&
                order.getQuotation().getSiteSurvey().getEnquiry().isSubsidyRequired());

        if (subsidyOpted) {
            java.util.Optional<SubsidyApplication> existingSubsidy = subsidyApplicationRepository.findBySalesOrderId(order.getId());
            if (existingSubsidy.isEmpty()) {
                SubsidyApplication subsidy = new SubsidyApplication();
                subsidy.setCustomer(order.getCustomer());
                subsidy.setSalesOrder(order);
                subsidy.setSubsidyAmountClaimed(BigDecimal.valueOf(78000.00));
                subsidy.setStatus(com.sunpower.entity.enums.Enums.SubsidyStatus.DOCUMENTS_PENDING);
                subsidy = subsidyApplicationRepository.save(subsidy);
                if (subsidy.getApplicationNumber() == null) {
                    subsidy.setApplicationNumber("SUB-" + LocalDate.now().getYear() + "-" + String.format("%04d", subsidy.getId()));
                    subsidyApplicationRepository.save(subsidy);
                }
            }
        }
    }
}
