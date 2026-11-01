package com.sunpower.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sunpower.entity.enums.Enums.SurveyStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "site_surveys")
public class SiteSurvey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 30)
    private String surveyNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "enquiry_id")
    private Enquiry enquiry;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "technician_id")
    private Technician technician;

    private LocalDate scheduledDate;

    @Column(length = 50)
    private String roofDirection; // e.g. South, South-East

    @Column(length = 30)
    private String roofTilt; // e.g. 15 deg, 25 deg

    @Column(precision = 8, scale = 2)
    private BigDecimal availableRoofAreaSqFt;

    @Column(precision = 6, scale = 2)
    private BigDecimal cableDistanceMeters;

    @Column(length = 100)
    private String shadingAssessment; // e.g. "Shadow Free", "Partial Shade"

    @Column(length = 100)
    private String gridSuitability; // e.g. "3-Phase 415V Suitable", "Single Phase 230V"

    @Column(columnDefinition = "TEXT")
    private String surveyNotes;

    @Column(length = 255)
    private String roofCondition;

    @Column(columnDefinition = "TEXT")
    private String structuralObservations;

    @Column(length = 50)
    private String inspectionRecommendation;

    private LocalDateTime reportSubmittedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SurveyStatus status = SurveyStatus.SCHEDULED;

    @Column(length = 100)
    private String approvedBy;

    private LocalDateTime approvalDate;

    @Column(columnDefinition = "TEXT")
    private String approvalNotes;

    @OneToMany(mappedBy = "siteSurvey", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SurveyPhoto> photos = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (surveyNumber == null && id != null) {
            surveyNumber = "SRV-" + String.format("%05d", id);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public SiteSurvey() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSurveyNumber() { return surveyNumber; }
    public void setSurveyNumber(String surveyNumber) { this.surveyNumber = surveyNumber; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public Enquiry getEnquiry() { return enquiry; }
    public void setEnquiry(Enquiry enquiry) { this.enquiry = enquiry; }
    public Technician getTechnician() { return technician; }
    public void setTechnician(Technician technician) { this.technician = technician; }
    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }
    public String getRoofDirection() { return roofDirection; }
    public void setRoofDirection(String roofDirection) { this.roofDirection = roofDirection; }
    public String getRoofTilt() { return roofTilt; }
    public void setRoofTilt(String roofTilt) { this.roofTilt = roofTilt; }
    public String getRoofCondition() { return roofCondition; }
    public void setRoofCondition(String roofCondition) { this.roofCondition = roofCondition; }
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
    public String getStructuralObservations() { return structuralObservations; }
    public void setStructuralObservations(String structuralObservations) { this.structuralObservations = structuralObservations; }
    public String getInspectionRecommendation() { return inspectionRecommendation; }
    public void setInspectionRecommendation(String inspectionRecommendation) { this.inspectionRecommendation = inspectionRecommendation; }
    public LocalDateTime getReportSubmittedAt() { return reportSubmittedAt; }
    public void setReportSubmittedAt(LocalDateTime reportSubmittedAt) { this.reportSubmittedAt = reportSubmittedAt; }
    public SurveyStatus getStatus() { return status; }
    public void setStatus(SurveyStatus status) { this.status = status; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public LocalDateTime getApprovalDate() { return approvalDate; }
    public void setApprovalDate(LocalDateTime approvalDate) { this.approvalDate = approvalDate; }
    public String getApprovalNotes() { return approvalNotes; }
    public void setApprovalNotes(String approvalNotes) { this.approvalNotes = approvalNotes; }
    public List<SurveyPhoto> getPhotos() { return photos; }
    public void setPhotos(List<SurveyPhoto> photos) { this.photos = photos; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
