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

        if (quotation.getStatus() != QuotationStatus.ACCEPTED) {
            quotation.setStatus(QuotationStatus.ACCEPTED);
            quotationRepository.save(quotation);
        }

        SalesOrder order = new SalesOrder();
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

        // Calculate advance required
        BigDecimal advancePercentage = request.getAdvancePercentage() != null ?
                request.getAdvancePercentage() : BigDecimal.valueOf(20.00);
        BigDecimal advanceRequired = request.getAdvanceRequiredAmount() != null ?
                request.getAdvanceRequiredAmount() :
                quotation.getTotalAmount().multiply(advancePercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        order.setAdvanceRequired(advanceRequired);

        order = salesOrderRepository.save(order);
        if (order.getOrderNumber() == null) {
            order.setOrderNumber("ORD-" + String.format("%05d", order.getId()));
            order = salesOrderRepository.save(order);
        }

        // Copy quotation items to order items and reserve inventory stock
        List<OrderItem> orderItems = new ArrayList<>();
        for (QuotationItem qItem : quotation.getItems()) {
            OrderItem oItem = new OrderItem(order, qItem.getProduct(), qItem.getQuantity(), qItem.getUnitPrice());
            orderItems.add(oItem);

            // Reserve stock
            InventoryStock stock = inventoryStockRepository.findByProductId(qItem.getProduct().getId())
                    .orElseGet(() -> {
                        InventoryStock s = new InventoryStock(qItem.getProduct(), qItem.getProduct().getCurrentStock(), 0, "Main Warehouse");
                        return inventoryStockRepository.save(s);
                    });

            int available = stock.getAvailableQuantity();
            int needed = qItem.getQuantity();

            // Reserve the needed stock
            stock.setReservedQuantity(stock.getReservedQuantity() + needed);
            stock.setAvailableQuantity(Math.max(0, available - needed));
            inventoryStockRepository.save(stock);

            // Log movement
            StockMovement movement = new StockMovement(
                    qItem.getProduct(),
                    StockMovementType.ADJUSTMENT,
                    -needed,
                    order.getOrderNumber(),
                    "Reserved " + needed + " units for order " + order.getOrderNumber(),
                    createdBy != null ? createdBy : "System"
            );
            stockMovementRepository.save(movement);
        }

        orderItemRepository.saveAll(orderItems);
        if (order.getItems() == null) {
            order.setItems(new ArrayList<>());
        } else {
            order.getItems().clear();
        }
        order.getItems().addAll(orderItems);

        // Generate preliminary invoice
        Invoice invoice = new Invoice();
        invoice.setSalesOrder(order);
        invoice.setCustomer(order.getCustomer());
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setDueDate(LocalDate.now().plusDays(15));
        invoice.setSubtotal(quotation.getSubtotal());
        invoice.setTaxAmount(quotation.getTaxAmount());
        invoice.setTotalAmount(quotation.getTotalAmount());
        invoice.setPaidAmount(BigDecimal.ZERO);
        invoice.setBalanceAmount(quotation.getTotalAmount());
        invoice.setStatus("ISSUED");
        invoice = invoiceRepository.save(invoice);
        if (invoice.getInvoiceNumber() == null) {
            invoice.setInvoiceNumber("INV-" + String.format("%05d", invoice.getId()));
            invoiceRepository.save(invoice);
        }

        // If subsidy required from enquiry, initialize subsidy application
        if (quotation.getSiteSurvey().getEnquiry() != null && quotation.getSiteSurvey().getEnquiry().isSubsidyRequired()) {
            SubsidyApplication subsidy = new SubsidyApplication();
            subsidy.setCustomer(order.getCustomer());
            subsidy.setSalesOrder(order);
            subsidy.setSubsidyAmountClaimed(BigDecimal.valueOf(78000.00)); // Default PM Surya Ghar subsidy estimate
            subsidy.setStatus(com.sunpower.entity.enums.Enums.SubsidyStatus.DOCUMENTS_PENDING);
            subsidy = subsidyApplicationRepository.save(subsidy);
            if (subsidy.getApplicationNumber() == null) {
                subsidy.setApplicationNumber("SUB-" + String.format("%05d", subsidy.getId()));
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
