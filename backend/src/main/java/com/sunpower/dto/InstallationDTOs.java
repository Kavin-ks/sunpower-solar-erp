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

        private List<AssignedTechnicianRequest> technicians;
        private List<Long> technicianIds;

        private String workNotes;

        public ScheduleInstallationRequest() {}

        public Long getSalesOrderId() { return salesOrderId; }
        public void setSalesOrderId(Long salesOrderId) { this.salesOrderId = salesOrderId; }
        public LocalDate getScheduledDate() { return scheduledDate; }
        public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }

        public List<AssignedTechnicianRequest> getTechnicians() {
            if ((technicians == null || technicians.isEmpty()) && technicianIds != null && !technicianIds.isEmpty()) {
                technicians = new java.util.ArrayList<>();
                for (Long tId : technicianIds) {
                    AssignedTechnicianRequest r = new AssignedTechnicianRequest();
                    r.setTechnicianId(tId);
                    r.setRoleInCrew("Installer");
                    technicians.add(r);
                }
            }
            return technicians;
        }

        public void setTechnicians(List<AssignedTechnicianRequest> technicians) { this.technicians = technicians; }
        public List<Long> getTechnicianIds() { return technicianIds; }
        public void setTechnicianIds(List<Long> technicianIds) { this.technicianIds = technicianIds; }
        public String getWorkNotes() { return workNotes; }
        public void setWorkNotes(String workNotes) { this.workNotes = workNotes; }
    }

    public static class AssignedTechnicianRequest {
        @NotNull(message = "Technician ID is required")
        private Long technicianId;
        private String roleInCrew; // "Lead Electrician", "Mounting Specialist"
        private Boolean isTeamLead = false;

        public AssignedTechnicianRequest() {}

        public Long getTechnicianId() { return technicianId; }
        public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
        public String getRoleInCrew() { return roleInCrew; }
        public void setRoleInCrew(String roleInCrew) { this.roleInCrew = roleInCrew; }
        public Boolean getIsTeamLead() { return isTeamLead; }
        public void setIsTeamLead(Boolean isTeamLead) { this.isTeamLead = isTeamLead != null ? isTeamLead : false; }
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
        private String completionPhotoUrl;
        private String completionReportPdfUrl;

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
        public String getCompletionPhotoUrl() { return completionPhotoUrl; }
        public void setCompletionPhotoUrl(String completionPhotoUrl) { this.completionPhotoUrl = completionPhotoUrl; }
        public String getCompletionReportPdfUrl() { return completionReportPdfUrl; }
        public void setCompletionReportPdfUrl(String completionReportPdfUrl) { this.completionReportPdfUrl = completionReportPdfUrl; }
        public List<TechnicianHoursRequest> getTechnicianHours() { return technicianHours; }
        public void setTechnicianHours(List<TechnicianHoursRequest> technicianHours) { this.technicianHours = technicianHours; }
    }

    public static class SiteReceivedRequest {
        private String arrivalPhotoUrl;
        private String notes;
        private List<String> verifiedSerialCodes;

        public SiteReceivedRequest() {}

        public String getArrivalPhotoUrl() { return arrivalPhotoUrl; }
        public void setArrivalPhotoUrl(String arrivalPhotoUrl) { this.arrivalPhotoUrl = arrivalPhotoUrl; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public List<String> getVerifiedSerialCodes() { return verifiedSerialCodes; }
        public void setVerifiedSerialCodes(List<String> verifiedSerialCodes) { this.verifiedSerialCodes = verifiedSerialCodes; }
    }

    public static class AddPhotoRequest {
        @NotNull(message = "Photo URL is required")
        private String photoUrl;
        private String stage; // "Arrival", "Mounting", "Wiring", "Inverter", "Earthing", "Completed Rooftop"
        private String caption;

        public AddPhotoRequest() {}

        public String getPhotoUrl() { return photoUrl; }
        public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
        public String getStage() { return stage; }
        public void setStage(String stage) { this.stage = stage; }
        public String getCaption() { return caption; }
        public void setCaption(String caption) { this.caption = caption; }
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
