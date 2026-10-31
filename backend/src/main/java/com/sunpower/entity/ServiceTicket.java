package com.sunpower.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sunpower.entity.enums.Enums.TicketStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "service_tickets")
public class ServiceTicket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 30)
    private String ticketNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "serial_number_id")
    private SerialNumber serialNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "installation_id")
    private Installation installation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "warranty_id")
    private Warranty warranty;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String complaintDescription;

    @Column(length = 50)
    private String faultCode; // e.g. "ERR-E04", "ERR-GRID-SYNC"

    private LocalDate reportedDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_technician_id")
    private Technician assignedTechnician;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TicketStatus status = TicketStatus.OPEN;

    private boolean underWarranty = true;

    @Column(precision = 10, scale = 2)
    private BigDecimal laborCharges = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal partsCharges = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalCustomerCharges = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String diagnosisNotes;

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    private boolean customerConfirmed = false;
    private LocalDateTime customerConfirmedAt;
    private String customerConfirmationNotes;

    @Column(length = 50)
    private String submissionSource = "CUSTOMER_PORTAL"; // CUSTOMER_PORTAL, OFFICER_ASSISTED

    @Column(length = 100)
    private String reportedBy;

    @Column(length = 500)
    private String complaintPhotoUrl;

    @Column(length = 500)
    private String repairPhotoUrl;

    @Column(length = 500)
    private String beforePhotoUrl;

    @Column(length = 500)
    private String afterPhotoUrl;

    @Column(columnDefinition = "TEXT")
    private String testingResults;

    private LocalDateTime technicianCompletedAt;

    @Column(length = 50)
    private String warrantyCoverageStatus; // ACTIVE_COVERED, ACTIVE_EXCLUDED, EXPIRED, PENDING_VERIFICATION

    @Column(length = 100)
    private String chargeStatusText;

    @OneToMany(mappedBy = "serviceTicket", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<ServiceActivity> activities = new ArrayList<>();

    @OneToMany(mappedBy = "serviceTicket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ServicePart> parts = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (reportedDate == null) {
            reportedDate = LocalDate.now();
        }
        if (ticketNumber == null && id != null) {
            ticketNumber = "TCK-" + String.format("%05d", id);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public ServiceTicket() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTicketNumber() { return ticketNumber; }
    public void setTicketNumber(String ticketNumber) { this.ticketNumber = ticketNumber; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public SerialNumber getSerialNumber() { return serialNumber; }
    public void setSerialNumber(SerialNumber serialNumber) { this.serialNumber = serialNumber; }
    public Installation getInstallation() { return installation; }
    public void setInstallation(Installation installation) { this.installation = installation; }
    public Warranty getWarranty() { return warranty; }
    public void setWarranty(Warranty warranty) { this.warranty = warranty; }
    public String getComplaintDescription() { return complaintDescription; }
    public void setComplaintDescription(String complaintDescription) { this.complaintDescription = complaintDescription; }
    public String getFaultCode() { return faultCode; }
    public void setFaultCode(String faultCode) { this.faultCode = faultCode; }
    public LocalDate getReportedDate() { return reportedDate; }
    public void setReportedDate(LocalDate reportedDate) { this.reportedDate = reportedDate; }
    public Technician getAssignedTechnician() { return assignedTechnician; }
    public void setAssignedTechnician(Technician assignedTechnician) { this.assignedTechnician = assignedTechnician; }
    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }
    public boolean isUnderWarranty() { return underWarranty; }
    public void setUnderWarranty(boolean underWarranty) { this.underWarranty = underWarranty; }
    public BigDecimal getLaborCharges() { return laborCharges; }
    public void setLaborCharges(BigDecimal laborCharges) { this.laborCharges = laborCharges; }
    public BigDecimal getPartsCharges() { return partsCharges; }
    public void setPartsCharges(BigDecimal partsCharges) { this.partsCharges = partsCharges; }
    public BigDecimal getTotalCustomerCharges() { return totalCustomerCharges; }
    public void setTotalCustomerCharges(BigDecimal totalCustomerCharges) { this.totalCustomerCharges = totalCustomerCharges; }
    public String getDiagnosisNotes() { return diagnosisNotes; }
    public void setDiagnosisNotes(String diagnosisNotes) { this.diagnosisNotes = diagnosisNotes; }
    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
    public boolean isCustomerConfirmed() { return customerConfirmed; }
    public void setCustomerConfirmed(boolean customerConfirmed) { this.customerConfirmed = customerConfirmed; }
    public LocalDateTime getCustomerConfirmedAt() { return customerConfirmedAt; }
    public void setCustomerConfirmedAt(LocalDateTime customerConfirmedAt) { this.customerConfirmedAt = customerConfirmedAt; }
    public String getCustomerConfirmationNotes() { return customerConfirmationNotes; }
    public void setCustomerConfirmationNotes(String customerConfirmationNotes) { this.customerConfirmationNotes = customerConfirmationNotes; }
    public List<ServiceActivity> getActivities() { return activities; }
    public void setActivities(List<ServiceActivity> activities) { this.activities = activities; }
    public List<ServicePart> getParts() { return parts; }
    public void setParts(List<ServicePart> parts) { this.parts = parts; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getSubmissionSource() { return submissionSource; }
    public void setSubmissionSource(String submissionSource) { this.submissionSource = submissionSource; }
    public String getReportedBy() { return reportedBy; }
    public void setReportedBy(String reportedBy) { this.reportedBy = reportedBy; }
    public String getComplaintPhotoUrl() { return complaintPhotoUrl; }
    public void setComplaintPhotoUrl(String complaintPhotoUrl) { this.complaintPhotoUrl = complaintPhotoUrl; }
    public String getRepairPhotoUrl() { return repairPhotoUrl; }
    public void setRepairPhotoUrl(String repairPhotoUrl) { this.repairPhotoUrl = repairPhotoUrl; }
    public String getBeforePhotoUrl() { return beforePhotoUrl; }
    public void setBeforePhotoUrl(String beforePhotoUrl) { this.beforePhotoUrl = beforePhotoUrl; }
    public String getAfterPhotoUrl() { return afterPhotoUrl; }
    public void setAfterPhotoUrl(String afterPhotoUrl) { this.afterPhotoUrl = afterPhotoUrl; }
    public String getTestingResults() { return testingResults; }
    public void setTestingResults(String testingResults) { this.testingResults = testingResults; }
    public LocalDateTime getTechnicianCompletedAt() { return technicianCompletedAt; }
    public void setTechnicianCompletedAt(LocalDateTime technicianCompletedAt) { this.technicianCompletedAt = technicianCompletedAt; }
    public String getWarrantyCoverageStatus() { return warrantyCoverageStatus; }
    public void setWarrantyCoverageStatus(String warrantyCoverageStatus) { this.warrantyCoverageStatus = warrantyCoverageStatus; }
    public String getChargeStatusText() { return chargeStatusText; }
    public void setChargeStatusText(String chargeStatusText) { this.chargeStatusText = chargeStatusText; }
}
