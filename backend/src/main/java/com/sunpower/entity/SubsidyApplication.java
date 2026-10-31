package com.sunpower.entity;

import com.sunpower.entity.enums.Enums.SubsidyStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "subsidy_applications")
public class SubsidyApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 30)
    private String applicationNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @Column(length = 100)
    private String nationalPortalRegNumber; // e.g. "MNRE-SP-2026-89412"

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subsidyAmountClaimed = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal subsidyAmountApproved = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SubsidyStatus status = SubsidyStatus.NOT_STARTED;

    private LocalDate submissionDate;
    private LocalDate approvalDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (applicationNumber == null && id != null) {
            applicationNumber = "SUB-" + String.format("%05d", id);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public SubsidyApplication() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getApplicationNumber() { return applicationNumber; }
    public void setApplicationNumber(String applicationNumber) { this.applicationNumber = applicationNumber; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public SalesOrder getSalesOrder() { return salesOrder; }
    public void setSalesOrder(SalesOrder salesOrder) { this.salesOrder = salesOrder; }
    public String getNationalPortalRegNumber() { return nationalPortalRegNumber; }
    public void setNationalPortalRegNumber(String nationalPortalRegNumber) { this.nationalPortalRegNumber = nationalPortalRegNumber; }
    public BigDecimal getSubsidyAmountClaimed() { return subsidyAmountClaimed; }
    public void setSubsidyAmountClaimed(BigDecimal subsidyAmountClaimed) { this.subsidyAmountClaimed = subsidyAmountClaimed; }
    public BigDecimal getSubsidyAmountApproved() { return subsidyAmountApproved; }
    public void setSubsidyAmountApproved(BigDecimal subsidyAmountApproved) { this.subsidyAmountApproved = subsidyAmountApproved; }
    public SubsidyStatus getStatus() { return status; }
    public void setStatus(SubsidyStatus status) { this.status = status; }
    public LocalDate getSubmissionDate() { return submissionDate; }
    public void setSubmissionDate(LocalDate submissionDate) { this.submissionDate = submissionDate; }
    public LocalDate getApprovalDate() { return approvalDate; }
    public void setApprovalDate(LocalDate approvalDate) { this.approvalDate = approvalDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
