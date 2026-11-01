package com.sunpower.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class DispatchDTOs {

    public static class DispatchCreateRequest {
        @NotNull(message = "Sales Order ID is required")
        private Long salesOrderId;

        private String vehicleNumber;
        private String driverName;
        private String driverPhone;
        private String dispatchNotes;

        public DispatchCreateRequest() {}

        public Long getSalesOrderId() { return salesOrderId; }
        public void setSalesOrderId(Long salesOrderId) { this.salesOrderId = salesOrderId; }
        public String getVehicleNumber() { return vehicleNumber; }
        public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }
        public String getDriverName() { return driverName; }
        public void setDriverName(String driverName) { this.driverName = driverName; }
        public String getDriverPhone() { return driverPhone; }
        public void setDriverPhone(String driverPhone) { this.driverPhone = driverPhone; }
        public String getDispatchNotes() { return dispatchNotes; }
        public void setDispatchNotes(String dispatchNotes) { this.dispatchNotes = dispatchNotes; }
    }

    public static class AssignSerialNumberRequest {
        @NotNull(message = "Dispatch Item ID is required")
        private Long dispatchItemId;

        @NotNull(message = "Serial Code is required")
        private String serialCode;

        public AssignSerialNumberRequest() {}

        public Long getDispatchItemId() { return dispatchItemId; }
        public void setDispatchItemId(Long dispatchItemId) { this.dispatchItemId = dispatchItemId; }
        public String getSerialCode() { return serialCode; }
        public void setSerialCode(String serialCode) { this.serialCode = serialCode; }
    }

    public static class ConfirmDeliveryRequest {
        @NotNull(message = "Delivery date is required")
        private LocalDate deliveryDate;

        private String notes;

        public ConfirmDeliveryRequest() {}

        public LocalDate getDeliveryDate() { return deliveryDate; }
        public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class ScanBarcodeRequest {
        @jakarta.validation.constraints.NotBlank(message = "Barcode or QR code is required")
        private String barcode;
        private Long dispatchItemId;

        public ScanBarcodeRequest() {}

        public String getBarcode() { return barcode; }
        public void setBarcode(String barcode) { this.barcode = barcode; }
        public Long getDispatchItemId() { return dispatchItemId; }
        public void setDispatchItemId(Long dispatchItemId) { this.dispatchItemId = dispatchItemId; }
    }

    public static class ConfirmDispatchRequest {
        private String vehicleNumber;
        private String driverName;
        private String driverPhone;
        private java.time.LocalDateTime dispatchDateTime;
        private String dispatchNotes;
        private Long teamLeadId;
        private List<Long> assignedTechnicianIds;

        public ConfirmDispatchRequest() {}

        public String getVehicleNumber() { return vehicleNumber; }
        public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }
        public String getDriverName() { return driverName; }
        public void setDriverName(String driverName) { this.driverName = driverName; }
        public String getDriverPhone() { return driverPhone; }
        public void setDriverPhone(String driverPhone) { this.driverPhone = driverPhone; }
        public java.time.LocalDateTime getDispatchDateTime() { return dispatchDateTime; }
        public void setDispatchDateTime(java.time.LocalDateTime dispatchDateTime) { this.dispatchDateTime = dispatchDateTime; }
        public String getDispatchNotes() { return dispatchNotes; }
        public void setDispatchNotes(String dispatchNotes) { this.dispatchNotes = dispatchNotes; }
        public Long getTeamLeadId() { return teamLeadId; }
        public void setTeamLeadId(Long teamLeadId) { this.teamLeadId = teamLeadId; }
        public List<Long> getAssignedTechnicianIds() { return assignedTechnicianIds; }
        public void setAssignedTechnicianIds(List<Long> assignedTechnicianIds) { this.assignedTechnicianIds = assignedTechnicianIds; }
    }
}
