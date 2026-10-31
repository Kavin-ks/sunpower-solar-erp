package com.sunpower.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "dispatch_items")
public class DispatchItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispatch_id", nullable = false)
    @JsonIgnore
    private Dispatch dispatch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "serial_number_id")
    private SerialNumber serialNumber; // Set if product is serialized

    public DispatchItem() {}

    public DispatchItem(Dispatch dispatch, Product product, Integer quantity, SerialNumber serialNumber) {
        this.dispatch = dispatch;
        this.product = product;
        this.quantity = quantity;
        this.serialNumber = serialNumber;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Dispatch getDispatch() { return dispatch; }
    public void setDispatch(Dispatch dispatch) { this.dispatch = dispatch; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public SerialNumber getSerialNumber() { return serialNumber; }
    public void setSerialNumber(SerialNumber serialNumber) { this.serialNumber = serialNumber; }
}
