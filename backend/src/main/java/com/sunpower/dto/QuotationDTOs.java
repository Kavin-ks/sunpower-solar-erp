package com.sunpower.dto;

import com.sunpower.entity.enums.Enums.QuotationStatus;
import com.sunpower.entity.enums.Enums.SystemType;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class QuotationDTOs {

    public static class QuotationCreateRequest {
        @NotNull(message = "Customer ID is required")
        private Long customerId;

        @NotNull(message = "Site Survey ID is required")
        private Long siteSurveyId;

        @NotNull(message = "Solar Package ID is required")
        private Long solarPackageId;

        private BigDecimal installationFee;
        private BigDecimal taxRatePercent = BigDecimal.valueOf(5.00); // 5% solar GST default
        private String notes;

        // Custom override items if modifying BOM defaults
        private List<QuotationCustomItemRequest> customItems;

        public QuotationCreateRequest() {}

        public Long getCustomerId() { return customerId; }
        public void setCustomerId(Long customerId) { this.customerId = customerId; }
        public Long getSiteSurveyId() { return siteSurveyId; }
        public void setSiteSurveyId(Long siteSurveyId) { this.siteSurveyId = siteSurveyId; }
        public Long getSolarPackageId() { return solarPackageId; }
        public void setSolarPackageId(Long solarPackageId) { this.solarPackageId = solarPackageId; }
        public BigDecimal getInstallationFee() { return installationFee; }
        public void setInstallationFee(BigDecimal installationFee) { this.installationFee = installationFee; }
        public BigDecimal getTaxRatePercent() { return taxRatePercent; }
        public void setTaxRatePercent(BigDecimal taxRatePercent) { this.taxRatePercent = taxRatePercent; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public List<QuotationCustomItemRequest> getCustomItems() { return customItems; }
        public void setCustomItems(List<QuotationCustomItemRequest> customItems) { this.customItems = customItems; }
    }

    public static class QuotationCustomItemRequest {
        private Long productId;
        private Integer quantity;
        private BigDecimal unitPrice;

        public QuotationCustomItemRequest() {}

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    }

    public static class QuotationStatusUpdateRequest {
        @NotNull(message = "Status is required")
        private QuotationStatus status;

        public QuotationStatusUpdateRequest() {}

        public QuotationStatus getStatus() { return status; }
        public void setStatus(QuotationStatus status) { this.status = status; }
    }
}
