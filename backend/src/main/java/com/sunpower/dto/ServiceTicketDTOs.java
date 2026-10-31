package com.sunpower.dto;

import com.sunpower.entity.enums.Enums.TicketStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class ServiceTicketDTOs {

    public static class TicketCreateRequest {
        private Long customerId;
        private String customerPhone;
        private String customerName;

        private String serialCode; // Look up warranty & product by serial code
        private Long serialNumberId;

        @NotBlank(message = "Complaint description is required")
        private String complaintDescription;

        private String faultCode; // e.g. "E04"
        private Long assignedTechnicianId;

        public TicketCreateRequest() {}

        public Long getCustomerId() { return customerId; }
        public void setCustomerId(Long customerId) { this.customerId = customerId; }
        public String getCustomerPhone() { return customerPhone; }
        public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }
        public String getSerialCode() { return serialCode; }
        public void setSerialCode(String serialCode) { this.serialCode = serialCode; }
        public Long getSerialNumberId() { return serialNumberId; }
        public void setSerialNumberId(Long serialNumberId) { this.serialNumberId = serialNumberId; }
        public String getComplaintDescription() { return complaintDescription; }
        public void setComplaintDescription(String complaintDescription) { this.complaintDescription = complaintDescription; }
        public String getFaultCode() { return faultCode; }
        public void setFaultCode(String faultCode) { this.faultCode = faultCode; }
        public Long getAssignedTechnicianId() { return assignedTechnicianId; }
        public void setAssignedTechnicianId(Long assignedTechnicianId) { this.assignedTechnicianId = assignedTechnicianId; }
    }

    public static class TicketResolveRequest {
        @NotBlank(message = "Diagnosis notes are required")
        private String diagnosisNotes;

        @NotBlank(message = "Resolution notes are required")
        private String resolutionNotes;

        private BigDecimal laborCharges = BigDecimal.ZERO;
        private List<ServicePartRequest> replacedParts;
        private String replacementSerialCode;

        public TicketResolveRequest() {}

        public String getReplacementSerialCode() { return replacementSerialCode; }
        public void setReplacementSerialCode(String replacementSerialCode) { this.replacementSerialCode = replacementSerialCode; }

        public String getDiagnosisNotes() { return diagnosisNotes; }
        public void setDiagnosisNotes(String diagnosisNotes) { this.diagnosisNotes = diagnosisNotes; }
        public String getResolutionNotes() { return resolutionNotes; }
        public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
        public BigDecimal getLaborCharges() { return laborCharges; }
        public void setLaborCharges(BigDecimal laborCharges) { this.laborCharges = laborCharges; }
        public List<ServicePartRequest> getReplacedParts() { return replacedParts; }
        public void setReplacedParts(List<ServicePartRequest> replacedParts) { this.replacedParts = replacedParts; }
    }

    public static class ServicePartRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;

        @NotNull(message = "Quantity is required")
        private Integer quantity;

        private BigDecimal unitPrice;

        public ServicePartRequest() {}

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    }

    public static class CustomerConfirmationRequest {
        private String confirmationNotes;
        private String customerSatisfactionNotes;
        private String confirmedByCustomerName;

        public CustomerConfirmationRequest() {}

        public String getConfirmationNotes() {
            if (confirmationNotes != null && !confirmationNotes.trim().isEmpty()) {
                return confirmationNotes;
            }
            return customerSatisfactionNotes != null ? customerSatisfactionNotes : "Customer confirmed satisfactory restoration of solar generation.";
        }

        public void setConfirmationNotes(String confirmationNotes) { this.confirmationNotes = confirmationNotes; }
        public String getCustomerSatisfactionNotes() { return customerSatisfactionNotes; }
        public void setCustomerSatisfactionNotes(String customerSatisfactionNotes) { this.customerSatisfactionNotes = customerSatisfactionNotes; }
        public String getConfirmedByCustomerName() { return confirmedByCustomerName; }
        public void setConfirmedByCustomerName(String confirmedByCustomerName) { this.confirmedByCustomerName = confirmedByCustomerName; }
    }

    public static class PublicComplaintRequest {
        @NotBlank(message = "Customer phone number is required")
        private String customerPhone;

        private String customerName;
        private String customerEmail;

        @NotBlank(message = "Equipment serial number is required")
        private String serialCode;

        private String faultCategory;

        @NotBlank(message = "Complaint description is required")
        private String complaintDescription;

        private String complaintPhotoUrl;

        public PublicComplaintRequest() {}

        public String getCustomerPhone() { return customerPhone; }
        public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }
        public String getCustomerEmail() { return customerEmail; }
        public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
        public String getSerialCode() { return serialCode; }
        public void setSerialCode(String serialCode) { this.serialCode = serialCode; }
        public String getFaultCategory() { return faultCategory; }
        public void setFaultCategory(String faultCategory) { this.faultCategory = faultCategory; }
        public String getComplaintDescription() { return complaintDescription; }
        public void setComplaintDescription(String complaintDescription) { this.complaintDescription = complaintDescription; }
        public String getComplaintPhotoUrl() { return complaintPhotoUrl; }
        public void setComplaintPhotoUrl(String complaintPhotoUrl) { this.complaintPhotoUrl = complaintPhotoUrl; }
    }

    public static class TechnicianJobCompleteRequest {
        @NotBlank(message = "Diagnosis notes are required")
        private String diagnosisNotes;

        @NotBlank(message = "Resolution notes are required")
        private String resolutionNotes;

        private String testingResults;
        private String beforePhotoUrl;
        private String afterPhotoUrl;
        private BigDecimal laborCharges = BigDecimal.ZERO;
        private List<ServicePartRequest> replacedParts;

        public TechnicianJobCompleteRequest() {}

        public String getDiagnosisNotes() { return diagnosisNotes; }
        public void setDiagnosisNotes(String diagnosisNotes) { this.diagnosisNotes = diagnosisNotes; }
        public String getResolutionNotes() { return resolutionNotes; }
        public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
        public String getTestingResults() { return testingResults; }
        public void setTestingResults(String testingResults) { this.testingResults = testingResults; }
        public String getBeforePhotoUrl() { return beforePhotoUrl; }
        public void setBeforePhotoUrl(String beforePhotoUrl) { this.beforePhotoUrl = beforePhotoUrl; }
        public String getAfterPhotoUrl() { return afterPhotoUrl; }
        public void setAfterPhotoUrl(String afterPhotoUrl) { this.afterPhotoUrl = afterPhotoUrl; }
        public BigDecimal getLaborCharges() { return laborCharges; }
        public void setLaborCharges(BigDecimal laborCharges) { this.laborCharges = laborCharges; }
        public List<ServicePartRequest> getReplacedParts() { return replacedParts; }
        public void setReplacedParts(List<ServicePartRequest> replacedParts) { this.replacedParts = replacedParts; }
    }

    public static class WarrantyDecisionDTO {
        private String serialCode;
        private String productName;
        private String productCategory;
        private java.time.LocalDate deliveryDate;
        private java.time.LocalDate warrantyStartDate;
        private java.time.LocalDate warrantyEndDate;
        private Integer durationMonths;
        private boolean warrantyActive;
        private boolean faultCovered;
        private String warrantyCoverageStatus;
        private String chargeStatusText;
        private BigDecimal estimatedCustomerCharge;
        private String decisionRationale;

        public WarrantyDecisionDTO() {}

        public String getSerialCode() { return serialCode; }
        public void setSerialCode(String serialCode) { this.serialCode = serialCode; }
        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
        public String getProductCategory() { return productCategory; }
        public void setProductCategory(String productCategory) { this.productCategory = productCategory; }
        public java.time.LocalDate getDeliveryDate() { return deliveryDate; }
        public void setDeliveryDate(java.time.LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
        public java.time.LocalDate getWarrantyStartDate() { return warrantyStartDate; }
        public void setWarrantyStartDate(java.time.LocalDate warrantyStartDate) { this.warrantyStartDate = warrantyStartDate; }
        public java.time.LocalDate getWarrantyEndDate() { return warrantyEndDate; }
        public void setWarrantyEndDate(java.time.LocalDate warrantyEndDate) { this.warrantyEndDate = warrantyEndDate; }
        public Integer getDurationMonths() { return durationMonths; }
        public void setDurationMonths(Integer durationMonths) { this.durationMonths = durationMonths; }
        public boolean isWarrantyActive() { return warrantyActive; }
        public void setWarrantyActive(boolean warrantyActive) { this.warrantyActive = warrantyActive; }
        public boolean isFaultCovered() { return faultCovered; }
        public void setFaultCovered(boolean faultCovered) { this.faultCovered = faultCovered; }
        public String getWarrantyCoverageStatus() { return warrantyCoverageStatus; }
        public void setWarrantyCoverageStatus(String warrantyCoverageStatus) { this.warrantyCoverageStatus = warrantyCoverageStatus; }
        public String getChargeStatusText() { return chargeStatusText; }
        public void setChargeStatusText(String chargeStatusText) { this.chargeStatusText = chargeStatusText; }
        public BigDecimal getEstimatedCustomerCharge() { return estimatedCustomerCharge; }
        public void setEstimatedCustomerCharge(BigDecimal estimatedCustomerCharge) { this.estimatedCustomerCharge = estimatedCustomerCharge; }
        public String getDecisionRationale() { return decisionRationale; }
        public void setDecisionRationale(String decisionRationale) { this.decisionRationale = decisionRationale; }
    }
}
