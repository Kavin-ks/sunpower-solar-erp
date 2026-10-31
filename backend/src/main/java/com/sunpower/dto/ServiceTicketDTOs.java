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

        public TicketResolveRequest() {}

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
        @NotBlank(message = "Customer confirmation remarks are required")
        private String confirmationNotes;

        public CustomerConfirmationRequest() {}

        public String getConfirmationNotes() { return confirmationNotes; }
        public void setConfirmationNotes(String confirmationNotes) { this.confirmationNotes = confirmationNotes; }
    }
}
