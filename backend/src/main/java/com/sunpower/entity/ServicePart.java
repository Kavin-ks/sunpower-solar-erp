package com.sunpower.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "service_parts")
public class ServicePart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    @JsonIgnore
    private ServiceTicket serviceTicket;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    private boolean coveredByWarranty;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal finalCharge; // 0.00 if covered by warranty

    public ServicePart() {}

    public ServicePart(ServiceTicket serviceTicket, Product product, Integer quantity, BigDecimal unitPrice, boolean coveredByWarranty) {
        this.serviceTicket = serviceTicket;
        this.product = product;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.coveredByWarranty = coveredByWarranty;
        this.finalCharge = coveredByWarranty ? BigDecimal.ZERO : unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ServiceTicket getServiceTicket() { return serviceTicket; }
    public void setServiceTicket(ServiceTicket serviceTicket) { this.serviceTicket = serviceTicket; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public boolean isCoveredByWarranty() { return coveredByWarranty; }
    public void setCoveredByWarranty(boolean coveredByWarranty) {
        this.coveredByWarranty = coveredByWarranty;
        this.finalCharge = coveredByWarranty ? BigDecimal.ZERO : this.unitPrice.multiply(BigDecimal.valueOf(this.quantity));
    }
    public BigDecimal getFinalCharge() { return finalCharge; }
    public void setFinalCharge(BigDecimal finalCharge) { this.finalCharge = finalCharge; }
}
