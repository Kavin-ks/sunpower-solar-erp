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
        for (QuotationItem qItem : quotation.getItems()) {
            InventoryStock stock = inventoryStockRepository.findByProductId(qItem.getProduct().getId())
                    .orElseThrow(() -> new IllegalStateException("Inventory record missing for product: " + qItem.getProduct().getName()));
            if (stock.getAvailableQuantity() < qItem.getQuantity()) {
                throw new IllegalStateException("Insufficient inventory: Product '" + qItem.getProduct().getName() +
                        "' requires " + qItem.getQuantity() + " units, but only " + stock.getAvailableQuantity() + " are available in warehouse.");
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
        for (QuotationItem qItem : quotation.getItems()) {
            OrderItem oItem = new OrderItem(order, qItem.getProduct(), qItem.getQuantity(), qItem.getUnitPrice());
            orderItems.add(oItem);

            // Reserve the needed stock
            InventoryStock stock = inventoryStockRepository.findByProductId(qItem.getProduct().getId()).get();
            int needed = qItem.getQuantity();

            stock.setReservedQuantity(stock.getReservedQuantity() + needed);
            stock.setAvailableQuantity(stock.getAvailableQuantity() - needed);
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

        orderItemRepository.saveAll(orderItems);
        order.setItems(orderItems);

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
        return salesOrderRepository.save(order);
    }
}
