package com.sunpower.entity;

import com.sunpower.entity.enums.Enums.WarrantyStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "warranties")
public class Warranty {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 30)
    private String warrantyNumber;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "serial_number_id", unique = true)
    private SerialNumber serialNumber; // Unique serial number if serialized

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    private Long installationId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private LocalDate deliveryDate;
    private LocalDate warrantyStartDate;
    private LocalDate warrantyEndDate;
    private LocalDate installationDate;

    @Column(nullable = false)
    private Integer durationMonths;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WarrantyStatus status = WarrantyStatus.ACTIVE;

    @Column(columnDefinition = "TEXT")
    private String termsAndConditions;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (warrantyNumber == null && id != null) {
            warrantyNumber = "WR-" + String.format("%05d", id);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Warranty() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getWarrantyNumber() { return warrantyNumber; }
    public void setWarrantyNumber(String warrantyNumber) { this.warrantyNumber = warrantyNumber; }
    public SerialNumber getSerialNumber() { return serialNumber; }
    public void setSerialNumber(SerialNumber serialNumber) { this.serialNumber = serialNumber; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public SalesOrder getSalesOrder() { return salesOrder; }
    public void setSalesOrder(SalesOrder salesOrder) { this.salesOrder = salesOrder; }
    public Long getInstallationId() { return installationId; }
    public void setInstallationId(Long installationId) { this.installationId = installationId; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
    public LocalDate getWarrantyStartDate() { return warrantyStartDate; }
    public void setWarrantyStartDate(LocalDate warrantyStartDate) { this.warrantyStartDate = warrantyStartDate; }
    public LocalDate getWarrantyEndDate() { return warrantyEndDate; }
    public void setWarrantyEndDate(LocalDate warrantyEndDate) { this.warrantyEndDate = warrantyEndDate; }
    public LocalDate getInstallationDate() { return installationDate; }
    public void setInstallationDate(LocalDate installationDate) { this.installationDate = installationDate; }
    public Integer getDurationMonths() { return durationMonths; }
    public void setDurationMonths(Integer durationMonths) { this.durationMonths = durationMonths; }
    public WarrantyStatus getStatus() { return status; }
    public void setStatus(WarrantyStatus status) { this.status = status; }
    public String getTermsAndConditions() { return termsAndConditions; }
    public void setTermsAndConditions(String termsAndConditions) { this.termsAndConditions = termsAndConditions; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public boolean isValidCurrently() {
        if (status != WarrantyStatus.ACTIVE) return false;
        LocalDate now = LocalDate.now();
        return (warrantyStartDate != null && !now.isBefore(warrantyStartDate)) &&
               (warrantyEndDate != null && !now.isAfter(warrantyEndDate));
    }
}
