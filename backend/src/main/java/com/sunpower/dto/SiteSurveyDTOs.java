package com.sunpower.dto;

import com.sunpower.entity.enums.Enums.SurveyStatus;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class SiteSurveyDTOs {

    public static class SurveyScheduleRequest {
        @NotNull(message = "Customer ID is required")
        private Long customerId;

        private Long enquiryId;

        @NotNull(message = "Technician ID is required")
        private Long technicianId;

        @NotNull(message = "Scheduled date is required")
        private LocalDate scheduledDate;

        private String roofDirection;
        private String roofTilt;
        private BigDecimal availableRoofAreaSqFt;
        private BigDecimal cableDistanceMeters;
        private String shadingAssessment;
        private String gridSuitability;
        private String surveyNotes;

        public SurveyScheduleRequest() {}

        public Long getCustomerId() { return customerId; }
        public void setCustomerId(Long customerId) { this.customerId = customerId; }
        public Long getEnquiryId() { return enquiryId; }
        public void setEnquiryId(Long enquiryId) { this.enquiryId = enquiryId; }
        public Long getTechnicianId() { return technicianId; }
        public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
        public LocalDate getScheduledDate() { return scheduledDate; }
        public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }
        public String getRoofDirection() { return roofDirection; }
        public void setRoofDirection(String roofDirection) { this.roofDirection = roofDirection; }
        public String getRoofTilt() { return roofTilt; }
        public void setRoofTilt(String roofTilt) { this.roofTilt = roofTilt; }
        public BigDecimal getAvailableRoofAreaSqFt() { return availableRoofAreaSqFt; }
        public void setAvailableRoofAreaSqFt(BigDecimal availableRoofAreaSqFt) { this.availableRoofAreaSqFt = availableRoofAreaSqFt; }
        public BigDecimal getCableDistanceMeters() { return cableDistanceMeters; }
        public void setCableDistanceMeters(BigDecimal cableDistanceMeters) { this.cableDistanceMeters = cableDistanceMeters; }
        public String getShadingAssessment() { return shadingAssessment; }
        public void setShadingAssessment(String shadingAssessment) { this.shadingAssessment = shadingAssessment; }
        public String getGridSuitability() { return gridSuitability; }
        public void setGridSuitability(String gridSuitability) { this.gridSuitability = gridSuitability; }
        public String getSurveyNotes() { return surveyNotes; }
        public void setSurveyNotes(String surveyNotes) { this.surveyNotes = surveyNotes; }
    }

    public static class SurveyApprovalRequest {
        @NotNull(message = "Approval status is required (APPROVED or REJECTED)")
        private SurveyStatus status; // APPROVED, REJECTED

        private String approvalNotes;

        public SurveyApprovalRequest() {}

        public SurveyStatus getStatus() { return status; }
        public void setStatus(SurveyStatus status) { this.status = status; }
        public String getApprovalNotes() { return approvalNotes; }
        public void setApprovalNotes(String approvalNotes) { this.approvalNotes = approvalNotes; }
    }
}
