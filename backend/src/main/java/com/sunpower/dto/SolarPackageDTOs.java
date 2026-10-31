package com.sunpower.dto;

import com.sunpower.entity.enums.Enums.SystemType;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class SolarPackageDTOs {

    public static class PackageBOMItemDTO {
        private Long id;
        private Long productId;
        private String productCode;
        private String productName;
        private String unit;
        private Integer quantity;
        private BigDecimal unitPrice;
        private String roleInPackage;

        public PackageBOMItemDTO() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public String getProductCode() { return productCode; }
        public void setProductCode(String productCode) { this.productCode = productCode; }
        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
        public String getRoleInPackage() { return roleInPackage; }
        public void setRoleInPackage(String roleInPackage) { this.roleInPackage = roleInPackage; }
    }

    public static class SolarPackageDetailDTO {
        private Long id;
        private String name;
        private SystemType systemType;
        private BigDecimal capacityKw;
        private String description;
        private BigDecimal basePrice;
        private boolean active;
        private List<PackageBOMItemDTO> bomItems;

        public SolarPackageDetailDTO() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public SystemType getSystemType() { return systemType; }
        public void setSystemType(SystemType systemType) { this.systemType = systemType; }
        public BigDecimal getCapacityKw() { return capacityKw; }
        public void setCapacityKw(BigDecimal capacityKw) { this.capacityKw = capacityKw; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getBasePrice() { return basePrice; }
        public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
        public List<PackageBOMItemDTO> getBomItems() { return bomItems; }
        public void setBomItems(List<PackageBOMItemDTO> bomItems) { this.bomItems = bomItems; }
    }
}
