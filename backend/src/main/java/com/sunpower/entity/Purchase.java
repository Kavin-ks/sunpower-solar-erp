package com.sunpower.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchases")
public class Purchase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 30)
    private String purchaseNumber;

    @Column(nullable = false, length = 150)
    private String supplierName;

    private LocalDate purchaseDate;
    private LocalDate dueDate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal remainingBalance = BigDecimal.ZERO;

    @Column(nullable = false, length = 30)
    private String status = "RECEIVED"; // ORDERED, RECEIVED, CANCELLED

    @Column(nullable = false, length = 30)
    private String paymentStatus = "UNPAID"; // UNPAID, PARTIALLY_PAID, PAID, OVERDUE

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<PurchaseItem> items = new ArrayList<>();

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (purchaseDate == null) {
            purchaseDate = LocalDate.now();
        }
        if (dueDate == null) {
            dueDate = purchaseDate.plusDays(30);
        }
        if (purchaseNumber == null && id != null) {
            purchaseNumber = "PO-" + String.format("%05d", id);
        }
        if (paidAmount == null) {
            paidAmount = BigDecimal.ZERO;
        }
        if (totalAmount != null) {
            remainingBalance = totalAmount.subtract(paidAmount);
        }
        updatePaymentStatus();
    }

    @PreUpdate
    protected void onUpdate() {
        if (paidAmount == null) {
            paidAmount = BigDecimal.ZERO;
        }
        if (totalAmount != null) {
            remainingBalance = totalAmount.subtract(paidAmount);
        }
        updatePaymentStatus();
    }

    public void updatePaymentStatus() {
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            paymentStatus = "PAID";
        } else if (remainingBalance.compareTo(BigDecimal.ZERO) <= 0) {
            paymentStatus = "PAID";
        } else if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            paymentStatus = "PARTIALLY_PAID";
        } else if (dueDate != null && dueDate.isBefore(LocalDate.now())) {
            paymentStatus = "OVERDUE";
        } else {
            paymentStatus = "UNPAID";
        }
    }

    public Purchase() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPurchaseNumber() { return purchaseNumber; }
    public void setPurchaseNumber(String purchaseNumber) { this.purchaseNumber = purchaseNumber; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
    public BigDecimal getRemainingBalance() { return remainingBalance; }
    public void setRemainingBalance(BigDecimal remainingBalance) { this.remainingBalance = remainingBalance; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public List<PurchaseItem> getItems() { return items; }
    public void setItems(List<PurchaseItem> items) { this.items = items; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
