package com.sunpower.entity;

import com.sunpower.entity.enums.Enums.TechnicianPayoutStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "technician_payments")
public class TechnicianPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 30)
    private String paymentNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "technician_id", nullable = false)
    private Technician technician;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "installation_id")
    private Installation installation;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount; // Amount disbursed in this transaction

    private LocalDate paymentDate;

    @Column(precision = 5, scale = 2)
    private BigDecimal hoursCounted;

    @Column(precision = 10, scale = 2)
    private BigDecimal hourlyRate = BigDecimal.valueOf(250.00);

    @Column(precision = 10, scale = 2)
    private BigDecimal calculatedAmount = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal remainingAmount = BigDecimal.ZERO;

    @Column(length = 50)
    private String paymentMethod = "Bank Transfer"; // Bank Transfer, Cash, UPI

    @Column(length = 100)
    private String referenceNumber; // UTR or Txn ID

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private TechnicianPayoutStatus status = TechnicianPayoutStatus.PAID;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (paymentDate == null) {
            paymentDate = LocalDate.now();
        }
        if (paymentNumber == null && id != null) {
            paymentNumber = "TPAY-" + String.format("%05d", id);
        }
        recalculateTotals();
    }

    @PreUpdate
    protected void onUpdate() {
        recalculateTotals();
    }

    public void recalculateTotals() {
        if (calculatedAmount == null || calculatedAmount.compareTo(BigDecimal.ZERO) == 0) {
            if (hoursCounted != null && hourlyRate != null) {
                calculatedAmount = hoursCounted.multiply(hourlyRate);
            } else if (amount != null) {
                calculatedAmount = amount;
            }
        }
        if (amountPaid == null) {
            amountPaid = amount != null ? amount : BigDecimal.ZERO;
        }
        if (calculatedAmount != null) {
            remainingAmount = calculatedAmount.subtract(amountPaid);
            if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
                remainingAmount = BigDecimal.ZERO;
                status = TechnicianPayoutStatus.PAID;
            } else if (amountPaid.compareTo(BigDecimal.ZERO) > 0) {
                status = TechnicianPayoutStatus.PARTIALLY_PAID;
            } else {
                status = TechnicianPayoutStatus.PENDING;
            }
        }
    }

    public TechnicianPayment() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPaymentNumber() { return paymentNumber; }
    public void setPaymentNumber(String paymentNumber) { this.paymentNumber = paymentNumber; }
    public Technician getTechnician() { return technician; }
    public void setTechnician(Technician technician) { this.technician = technician; }
    public Installation getInstallation() { return installation; }
    public void setInstallation(Installation installation) { this.installation = installation; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) {
        this.amount = amount;
        if (this.amountPaid == null || this.amountPaid.compareTo(BigDecimal.ZERO) == 0) {
            this.amountPaid = amount;
        }
    }
    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
    public BigDecimal getHoursCounted() { return hoursCounted; }
    public void setHoursCounted(BigDecimal hoursCounted) { this.hoursCounted = hoursCounted; }
    public BigDecimal getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(BigDecimal hourlyRate) { this.hourlyRate = hourlyRate; }
    public BigDecimal getCalculatedAmount() { return calculatedAmount; }
    public void setCalculatedAmount(BigDecimal calculatedAmount) { this.calculatedAmount = calculatedAmount; }
    public BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }
    public BigDecimal getRemainingAmount() { return remainingAmount; }
    public void setRemainingAmount(BigDecimal remainingAmount) { this.remainingAmount = remainingAmount; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
    public TechnicianPayoutStatus getStatus() { return status != null ? status : TechnicianPayoutStatus.PAID; }
    public void setStatus(TechnicianPayoutStatus status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
