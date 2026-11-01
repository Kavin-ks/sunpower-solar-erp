package com.sunpower.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class InstallationDTOs {

    public static class ScheduleInstallationRequest {
        @NotNull(message = "Sales Order ID is required")
        private Long salesOrderId;

        @NotNull(message = "Scheduled date is required")
        private LocalDate scheduledDate;

        @NotNull(message = "At least one technician must be assigned")
        private List<AssignedTechnicianRequest> technicians;

        private String workNotes;

        public ScheduleInstallationRequest() {}

        public Long getSalesOrderId() { return salesOrderId; }
        public void setSalesOrderId(Long salesOrderId) { this.salesOrderId = salesOrderId; }
        public LocalDate getScheduledDate() { return scheduledDate; }
        public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }
        public List<AssignedTechnicianRequest> getTechnicians() { return technicians; }
        public void setTechnicians(List<AssignedTechnicianRequest> technicians) { this.technicians = technicians; }
        public String getWorkNotes() { return workNotes; }
        public void setWorkNotes(String workNotes) { this.workNotes = workNotes; }
    }

    public static class AssignedTechnicianRequest {
        @NotNull(message = "Technician ID is required")
        private Long technicianId;
        private String roleInCrew; // "Lead Electrician", "Mounting Specialist"

        public AssignedTechnicianRequest() {}

        public Long getTechnicianId() { return technicianId; }
        public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
        public String getRoleInCrew() { return roleInCrew; }
        public void setRoleInCrew(String roleInCrew) { this.roleInCrew = roleInCrew; }
    }

    public static class CompleteInstallationRequest {
        private LocalDateTime actualStartTime;
        private LocalDateTime actualFinishTime;

        @NotNull(message = "Installed capacity is required")
        private BigDecimal installedCapacityKw;

        private boolean panelMountingConfirmed = true;
        private boolean wiringConfirmed = true;
        private boolean earthingConfirmed = true;
        private boolean testingPassed = true;

        private String testingNotes; // e.g. "Generating 4.9 kW at 1:15 PM, voltage stable"
        private String customerSigneeName;
        private String customerSignatureUrl;
        private String customerAcceptanceNote;
        private String workNotes;

        // Technician hours & payouts
        private List<TechnicianHoursRequest> technicianHours;

        public CompleteInstallationRequest() {}

        public LocalDateTime getActualStartTime() { return actualStartTime; }
        public void setActualStartTime(LocalDateTime actualStartTime) { this.actualStartTime = actualStartTime; }
        public LocalDateTime getActualFinishTime() { return actualFinishTime; }
        public void setActualFinishTime(LocalDateTime actualFinishTime) { this.actualFinishTime = actualFinishTime; }
        public BigDecimal getInstalledCapacityKw() { return installedCapacityKw; }
        public void setInstalledCapacityKw(BigDecimal installedCapacityKw) { this.installedCapacityKw = installedCapacityKw; }
        public boolean isPanelMountingConfirmed() { return panelMountingConfirmed; }
        public void setPanelMountingConfirmed(boolean panelMountingConfirmed) { this.panelMountingConfirmed = panelMountingConfirmed; }
        public boolean isWiringConfirmed() { return wiringConfirmed; }
        public void setWiringConfirmed(boolean wiringConfirmed) { this.wiringConfirmed = wiringConfirmed; }
        public boolean isEarthingConfirmed() { return earthingConfirmed; }
        public void setEarthingConfirmed(boolean earthingConfirmed) { this.earthingConfirmed = earthingConfirmed; }
        public boolean isTestingPassed() { return testingPassed; }
        public void setTestingPassed(boolean testingPassed) { this.testingPassed = testingPassed; }
        public String getTestingNotes() { return testingNotes; }
        public void setTestingNotes(String testingNotes) { this.testingNotes = testingNotes; }
        public String getCustomerSigneeName() { return customerSigneeName; }
        public void setCustomerSigneeName(String customerSigneeName) { this.customerSigneeName = customerSigneeName; }
        public String getCustomerSignatureUrl() { return customerSignatureUrl; }
        public void setCustomerSignatureUrl(String customerSignatureUrl) { this.customerSignatureUrl = customerSignatureUrl; }
        public String getCustomerAcceptanceNote() { return customerAcceptanceNote; }
        public void setCustomerAcceptanceNote(String customerAcceptanceNote) { this.customerAcceptanceNote = customerAcceptanceNote; }
        public String getWorkNotes() { return workNotes; }
        public void setWorkNotes(String workNotes) { this.workNotes = workNotes; }
        public List<TechnicianHoursRequest> getTechnicianHours() { return technicianHours; }
        public void setTechnicianHours(List<TechnicianHoursRequest> technicianHours) { this.technicianHours = technicianHours; }
    }

    public static class VerifyProductRequest {
        @NotNull(message = "Scanned barcode or serial code is required")
        private String barcode;

        public VerifyProductRequest() {}
        public VerifyProductRequest(String barcode) { this.barcode = barcode; }
        public String getBarcode() { return barcode; }
        public void setBarcode(String barcode) { this.barcode = barcode; }
    }

    public static class TechnicianHoursRequest {
        private Long technicianId;
        private BigDecimal hoursWorked;
        private BigDecimal payoutAmount;

        public TechnicianHoursRequest() {}

        public Long getTechnicianId() { return technicianId; }
        public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
        public BigDecimal getHoursWorked() { return hoursWorked; }
        public void setHoursWorked(BigDecimal hoursWorked) { this.hoursWorked = hoursWorked; }
        public BigDecimal getPayoutAmount() { return payoutAmount; }
        public void setPayoutAmount(BigDecimal payoutAmount) { this.payoutAmount = payoutAmount; }
    }
}
