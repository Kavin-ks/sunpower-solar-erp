package com.sunpower.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 30)
    private String invoiceNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    private LocalDate invoiceDate;
    private LocalDate dueDate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal cgstAmount = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal sgstAmount = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal igstAmount = BigDecimal.ZERO;

    @Column(length = 50)
    private String hsnSacCode = "SAC 998731"; // Solar PV Installation & Commissioning

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal balanceAmount = BigDecimal.ZERO;

    @Column(nullable = false, length = 30)
    private String status = "ISSUED"; // ISSUED, PAID, PARTIALLY_PAID, CANCELLED

    @Column(length = 50)
    private String gstin = "33AAACS1234F1Z5";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String cancellationReason;

    private LocalDateTime cancelledAt;

    @Column(length = 100)
    private String cancelledBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (invoiceDate == null) {
            invoiceDate = LocalDate.now();
        }
        if (dueDate == null) {
            dueDate = invoiceDate.plusDays(15);
        }
        if (invoiceNumber == null && id != null) {
            invoiceNumber = "INV-" + String.format("%05d", id);
        }
        balanceAmount = totalAmount.subtract(paidAmount != null ? paidAmount : BigDecimal.ZERO);
        calculateTaxBreakdown();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (totalAmount != null && paidAmount != null) {
            balanceAmount = totalAmount.subtract(paidAmount);
        }
        calculateTaxBreakdown();
    }

    private void calculateTaxBreakdown() {
        if (taxAmount != null && taxAmount.compareTo(BigDecimal.ZERO) > 0) {
            boolean isInterstate = false;
            if (customer != null && customer.getState() != null) {
                String st = customer.getState().trim();
                if (!st.isEmpty() && !st.equalsIgnoreCase("Tamil Nadu") && !st.equalsIgnoreCase("TN")) {
                    isInterstate = true;
                }
            }
            if (isInterstate) {
                igstAmount = taxAmount;
                cgstAmount = BigDecimal.ZERO;
                sgstAmount = BigDecimal.ZERO;
            } else {
                cgstAmount = taxAmount.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
                sgstAmount = taxAmount.subtract(cgstAmount);
                igstAmount = BigDecimal.ZERO;
            }
        }
    }

    public Invoice() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public SalesOrder getSalesOrder() { return salesOrder; }
    public void setSalesOrder(SalesOrder salesOrder) { this.salesOrder = salesOrder; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public LocalDate getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(LocalDate invoiceDate) { this.invoiceDate = invoiceDate; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public BigDecimal getCgstAmount() { return cgstAmount; }
    public void setCgstAmount(BigDecimal cgstAmount) { this.cgstAmount = cgstAmount; }
    public BigDecimal getSgstAmount() { return sgstAmount; }
    public void setSgstAmount(BigDecimal sgstAmount) { this.sgstAmount = sgstAmount; }
    public BigDecimal getIgstAmount() { return igstAmount; }
    public void setIgstAmount(BigDecimal igstAmount) { this.igstAmount = igstAmount; }
    public String getHsnSacCode() { return hsnSacCode; }
    public void setHsnSacCode(String hsnSacCode) { this.hsnSacCode = hsnSacCode; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
    public BigDecimal getBalanceAmount() { return balanceAmount; }
    public void setBalanceAmount(BigDecimal balanceAmount) { this.balanceAmount = balanceAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
    public String getCancelledBy() { return cancelledBy; }
    public void setCancelledBy(String cancelledBy) { this.cancelledBy = cancelledBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
