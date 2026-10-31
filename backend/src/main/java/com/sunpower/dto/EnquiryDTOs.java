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
}
