package com.sunpower.entity;

import com.sunpower.entity.enums.Enums.CustomerType;
import com.sunpower.entity.enums.Enums.EnquirySource;
import com.sunpower.entity.enums.Enums.EnquiryStatus;
import com.sunpower.entity.enums.Enums.SystemType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "enquiries")
public class Enquiry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 30)
    private String enquiryNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal requestedCapacityKw; // 1.00 to 5.00 kW

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SystemType systemType = SystemType.ON_GRID;

    private boolean subsidyRequired = false;

    @Column(precision = 10, scale = 2)
    private BigDecimal monthlyElectricityBill;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EnquirySource source = EnquirySource.MANUAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EnquiryStatus status = EnquiryStatus.NEW;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_to_user_id")
    private User assignedTo;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "enquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<EnquiryActivity> activities = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (enquiryNumber == null && id != null) {
            enquiryNumber = "ENQ-" + String.format("%05d", id);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Enquiry() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEnquiryNumber() { return enquiryNumber; }
    public void setEnquiryNumber(String enquiryNumber) { this.enquiryNumber = enquiryNumber; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public BigDecimal getRequestedCapacityKw() { return requestedCapacityKw; }
    public void setRequestedCapacityKw(BigDecimal requestedCapacityKw) { this.requestedCapacityKw = requestedCapacityKw; }
    public SystemType getSystemType() { return systemType; }
    public void setSystemType(SystemType systemType) { this.systemType = systemType; }
    public boolean isSubsidyRequired() { return subsidyRequired; }
    public void setSubsidyRequired(boolean subsidyRequired) { this.subsidyRequired = subsidyRequired; }
    public BigDecimal getMonthlyElectricityBill() { return monthlyElectricityBill; }
    public void setMonthlyElectricityBill(BigDecimal monthlyElectricityBill) { this.monthlyElectricityBill = monthlyElectricityBill; }
    public EnquirySource getSource() { return source; }
    public void setSource(EnquirySource source) { this.source = source; }
    public EnquiryStatus getStatus() { return status; }
    public void setStatus(EnquiryStatus status) { this.status = status; }
    public User getAssignedTo() { return assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public List<EnquiryActivity> getActivities() { return activities; }
    public void setActivities(List<EnquiryActivity> activities) { this.activities = activities; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
