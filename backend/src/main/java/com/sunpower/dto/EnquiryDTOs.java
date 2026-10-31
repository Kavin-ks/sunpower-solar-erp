package com.sunpower.dto;

import com.sunpower.entity.enums.Enums.CustomerType;
import com.sunpower.entity.enums.Enums.EnquirySource;
import com.sunpower.entity.enums.Enums.EnquiryStatus;
import com.sunpower.entity.enums.Enums.SystemType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class EnquiryDTOs {

    public static class EnquiryCreateRequest {
        private Long customerId;

        // If customerId is null, create or match customer
        @NotBlank(message = "Customer full name is required")
        private String customerName;

        @NotBlank(message = "Customer phone number is required")
        private String customerPhone;

        private String customerEmail;
        private String customerAddress;
        private CustomerType customerType = CustomerType.RESIDENTIAL;

        @NotNull(message = "Requested capacity is required")
        @DecimalMin(value = "1.00", message = "Capacity must be at least 1 kW")
        @DecimalMax(value = "5.00", message = "Capacity must not exceed 5 kW")
        private BigDecimal requestedCapacityKw;

        @NotNull(message = "System type is required")
        private SystemType systemType = SystemType.ON_GRID;

        private boolean subsidyRequired = false;
        private BigDecimal monthlyElectricityBill;
        private BigDecimal shadowFreeAreaSqFt;
        private Boolean gridSuitable = true;
        private EnquirySource source = EnquirySource.MANUAL;
        private Long assignedToUserId;
        private String notes;

        public EnquiryCreateRequest() {}

        public Long getCustomerId() { return customerId; }
        public void setCustomerId(Long customerId) { this.customerId = customerId; }
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }
        public String getCustomerPhone() { return customerPhone; }
        public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
        public String getCustomerEmail() { return customerEmail; }
        public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
        public String getCustomerAddress() { return customerAddress; }
        public void setCustomerAddress(String customerAddress) { this.customerAddress = customerAddress; }
        public CustomerType getCustomerType() { return customerType; }
        public void setCustomerType(CustomerType customerType) { this.customerType = customerType; }
        public BigDecimal getRequestedCapacityKw() { return requestedCapacityKw; }
        public void setRequestedCapacityKw(BigDecimal requestedCapacityKw) { this.requestedCapacityKw = requestedCapacityKw; }
        public SystemType getSystemType() { return systemType; }
        public void setSystemType(SystemType systemType) { this.systemType = systemType; }
        public boolean isSubsidyRequired() { return subsidyRequired; }
        public void setSubsidyRequired(boolean subsidyRequired) { this.subsidyRequired = subsidyRequired; }
        public BigDecimal getMonthlyElectricityBill() { return monthlyElectricityBill; }
        public void setMonthlyElectricityBill(BigDecimal monthlyElectricityBill) { this.monthlyElectricityBill = monthlyElectricityBill; }
        public BigDecimal getShadowFreeAreaSqFt() { return shadowFreeAreaSqFt; }
        public void setShadowFreeAreaSqFt(BigDecimal shadowFreeAreaSqFt) { this.shadowFreeAreaSqFt = shadowFreeAreaSqFt; }
        public Boolean getGridSuitable() { return gridSuitable; }
        public void setGridSuitable(Boolean gridSuitable) { this.gridSuitable = gridSuitable; }
        public EnquirySource getSource() { return source; }
        public void setSource(EnquirySource source) { this.source = source; }
        public Long getAssignedToUserId() { return assignedToUserId; }
        public void setAssignedToUserId(Long assignedToUserId) { this.assignedToUserId = assignedToUserId; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class EnquiryStatusUpdateRequest {
        @NotNull(message = "Status is required")
        private EnquiryStatus status;
        private String actionNote;

        public EnquiryStatusUpdateRequest() {}

        public EnquiryStatus getStatus() { return status; }
        public void setStatus(EnquiryStatus status) { this.status = status; }
        public String getActionNote() { return actionNote; }
        public void setActionNote(String actionNote) { this.actionNote = actionNote; }
    }

    public static class PublicEnquiryRequest {
        @NotBlank(message = "Full name is required")
        private String fullName;

        @NotBlank(message = "Phone number is required")
        private String phone;

        private String email;

        @NotBlank(message = "Rooftop property address is required")
        private String address;

        @NotBlank(message = "City is required")
        private String city;

        private String state;

        private String pincode;

        private CustomerType customerType = CustomerType.RESIDENTIAL;

        @NotNull(message = "Requested solar capacity is required")
        @DecimalMin(value = "1.00", message = "System capacity must be between 1 kW and 5 kW")
        @DecimalMax(value = "5.00", message = "System capacity must be between 1 kW and 5 kW")
        private BigDecimal requestedCapacityKw;

        @NotNull(message = "System type is required (On-Grid or Off-Grid)")
        private SystemType systemType = SystemType.ON_GRID;

        private boolean subsidyRequired = true;
        private BigDecimal monthlyElectricityBill;
        private String notes;
        private EnquirySource source = EnquirySource.CUSTOMER_PORTAL;

        public PublicEnquiryRequest() {}

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        public String getPincode() { return pincode; }
        public void setPincode(String pincode) { this.pincode = pincode; }
        public CustomerType getCustomerType() { return customerType; }
        public void setCustomerType(CustomerType customerType) { this.customerType = customerType; }
        public BigDecimal getRequestedCapacityKw() { return requestedCapacityKw; }
        public void setRequestedCapacityKw(BigDecimal requestedCapacityKw) { this.requestedCapacityKw = requestedCapacityKw; }
        public SystemType getSystemType() { return systemType; }
        public void setSystemType(SystemType systemType) { this.systemType = systemType; }
        public boolean isSubsidyRequired() { return subsidyRequired; }
        public void setSubsidyRequired(boolean subsidyRequired) { this.subsidyRequired = subsidyRequired; }
        public BigDecimal getMonthlyElectricityBill() { return monthlyElectricityBill; }
        public void setMonthlyElectricityBill(BigDecimal monthlyElectricityBill) { this.monthlyElectricityBill = monthlyElectricityBill; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public EnquirySource getSource() { return source; }
        public void setSource(EnquirySource source) { this.source = source; }
    }

    public static class PublicEnquiryResponseDTO {
        private boolean success;
        private String enquiryNumber;
        private String message;
        private LocalDateTime submissionTime;

        public PublicEnquiryResponseDTO() {}

        public PublicEnquiryResponseDTO(boolean success, String enquiryNumber, String message, LocalDateTime submissionTime) {
            this.success = success;
            this.enquiryNumber = enquiryNumber;
            this.message = message;
            this.submissionTime = submissionTime;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getEnquiryNumber() { return enquiryNumber; }
        public void setEnquiryNumber(String enquiryNumber) { this.enquiryNumber = enquiryNumber; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public LocalDateTime getSubmissionTime() { return submissionTime; }
        public void setSubmissionTime(LocalDateTime submissionTime) { this.submissionTime = submissionTime; }
    }
}
