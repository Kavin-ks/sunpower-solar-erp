package com.sunpower.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "package_boms")
public class PackageBOM {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    @JsonIgnore
    private SolarPackage solarPackage;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 100)
    private String roleInPackage; // e.g. "Main Generator", "Power Conditioning", "Mounting Structure"

    public PackageBOM() {}

    public PackageBOM(SolarPackage solarPackage, Product product, Integer quantity, String roleInPackage) {
        this.solarPackage = solarPackage;
        this.product = product;
        this.quantity = quantity;
        this.roleInPackage = roleInPackage;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public SolarPackage getSolarPackage() { return solarPackage; }
    public void setSolarPackage(SolarPackage solarPackage) { this.solarPackage = solarPackage; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getRoleInPackage() { return roleInPackage; }
    public void setRoleInPackage(String roleInPackage) { this.roleInPackage = roleInPackage; }
}
