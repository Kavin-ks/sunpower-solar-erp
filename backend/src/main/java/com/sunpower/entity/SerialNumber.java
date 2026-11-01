package com.sunpower.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sunpower.entity.enums.Enums.SerialNumberStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "serial_numbers")
public class SerialNumber {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String serialCode; // e.g. "INV-GROWATT-5K-98213"

    @Column(length = 100)
    private String barcodeValue;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SerialNumberStatus status = SerialNumberStatus.IN_STOCK;

    @Column(length = 100)
    private String warehouseLocation = "Main Warehouse - Rack A";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_order_id")
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    private Long dispatchId;
    private Long installationId;
    private Long technicianId;

    @Column(length = 50)
    private String purchaseReference;

    private LocalDate dispatchDate;
    private LocalDate deliveryDate;

    private LocalDateTime dispatchAt;
    private LocalDateTime siteReceivedAt;
    private LocalDateTime installationStartedAt;
    private LocalDateTime installationCompletedAt;

    private LocalDate warrantyStartDate;
    private LocalDate warrantyExpiryDate;

    @OneToMany(mappedBy = "serialNumber", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<SerialNumberHistory> history = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (barcodeValue == null && serialCode != null) {
            barcodeValue = serialCode;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (barcodeValue == null && serialCode != null) {
            barcodeValue = serialCode;
        }
    }

    public SerialNumber() {}

    public SerialNumber(String serialCode, Product product, String purchaseReference, String warehouseLocation) {
        this.serialCode = serialCode;
        this.barcodeValue = serialCode;
        this.product = product;
        this.purchaseReference = purchaseReference;
        this.warehouseLocation = warehouseLocation;
        this.status = SerialNumberStatus.IN_STOCK;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSerialCode() { return serialCode; }
    public void setSerialCode(String serialCode) { 
        this.serialCode = serialCode; 
        if (this.barcodeValue == null) this.barcodeValue = serialCode;
    }
    public String getBarcodeValue() { return barcodeValue != null ? barcodeValue : serialCode; }
    public void setBarcodeValue(String barcodeValue) { this.barcodeValue = barcodeValue; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public SerialNumberStatus getStatus() { return status; }
    public void setStatus(SerialNumberStatus status) { this.status = status; }
    public String getWarehouseLocation() { return warehouseLocation; }
    public void setWarehouseLocation(String warehouseLocation) { this.warehouseLocation = warehouseLocation; }
    public SalesOrder getSalesOrder() { return salesOrder; }
    public void setSalesOrder(SalesOrder salesOrder) { this.salesOrder = salesOrder; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public Long getDispatchId() { return dispatchId; }
    public void setDispatchId(Long dispatchId) { this.dispatchId = dispatchId; }
    public Long getInstallationId() { return installationId; }
    public void setInstallationId(Long installationId) { this.installationId = installationId; }
    public Long getTechnicianId() { return technicianId; }
    public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
    public String getPurchaseReference() { return purchaseReference; }
    public void setPurchaseReference(String purchaseReference) { this.purchaseReference = purchaseReference; }
    public LocalDate getDispatchDate() { return dispatchDate; }
    public void setDispatchDate(LocalDate dispatchDate) { this.dispatchDate = dispatchDate; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
    public LocalDateTime getDispatchAt() { return dispatchAt; }
    public void setDispatchAt(LocalDateTime dispatchAt) { this.dispatchAt = dispatchAt; }
    public LocalDateTime getSiteReceivedAt() { return siteReceivedAt; }
    public void setSiteReceivedAt(LocalDateTime siteReceivedAt) { this.siteReceivedAt = siteReceivedAt; }
    public LocalDateTime getInstallationStartedAt() { return installationStartedAt; }
    public void setInstallationStartedAt(LocalDateTime installationStartedAt) { this.installationStartedAt = installationStartedAt; }
    public LocalDateTime getInstallationCompletedAt() { return installationCompletedAt; }
    public void setInstallationCompletedAt(LocalDateTime installationCompletedAt) { this.installationCompletedAt = installationCompletedAt; }
    public LocalDate getWarrantyStartDate() { return warrantyStartDate; }
    public void setWarrantyStartDate(LocalDate warrantyStartDate) { this.warrantyStartDate = warrantyStartDate; }
    public LocalDate getWarrantyExpiryDate() { return warrantyExpiryDate; }
    public void setWarrantyExpiryDate(LocalDate warrantyExpiryDate) { this.warrantyExpiryDate = warrantyExpiryDate; }
    public List<SerialNumberHistory> getHistory() { return history; }
    public void setHistory(List<SerialNumberHistory> history) { this.history = history; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
