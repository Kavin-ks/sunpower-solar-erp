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

    @Column(length = 50)
    private String purchaseReference;

    private LocalDate dispatchDate;
    private LocalDate deliveryDate;

    @OneToMany(mappedBy = "serialNumber", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<SerialNumberHistory> history = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public SerialNumber() {}

    public SerialNumber(String serialCode, Product product, String purchaseReference, String warehouseLocation) {
        this.serialCode = serialCode;
        this.product = product;
        this.purchaseReference = purchaseReference;
        this.warehouseLocation = warehouseLocation;
        this.status = SerialNumberStatus.IN_STOCK;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSerialCode() { return serialCode; }
    public void setSerialCode(String serialCode) { this.serialCode = serialCode; }
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
    public String getPurchaseReference() { return purchaseReference; }
    public void setPurchaseReference(String purchaseReference) { this.purchaseReference = purchaseReference; }
    public LocalDate getDispatchDate() { return dispatchDate; }
    public void setDispatchDate(LocalDate dispatchDate) { this.dispatchDate = dispatchDate; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
    public List<SerialNumberHistory> getHistory() { return history; }
    public void setHistory(List<SerialNumberHistory> history) { this.history = history; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
