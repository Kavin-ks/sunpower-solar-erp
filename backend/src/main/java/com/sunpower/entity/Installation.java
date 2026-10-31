package com.sunpower.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.sunpower.entity.enums.Enums.InstallationStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "installations")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Installation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 30)
    private String installationNumber;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    private LocalDate scheduledDate;
    private LocalDateTime actualStartTime;
    private LocalDateTime actualFinishTime;

    @Column(precision = 4, scale = 2)
    private BigDecimal installedCapacityKw;

    private boolean panelMountingConfirmed = false;
    private boolean wiringConfirmed = false;
    private boolean earthingConfirmed = false;
    private boolean testingPassed = false;

    @Column(length = 255)
    private String testingNotes; // e.g. "Generating 4.8 kW at peak noon, grid sync verified"

    @Column(columnDefinition = "TEXT")
    private String customerAcceptanceNote;

    @Column(length = 100)
    private String customerSigneeName;

    @Column(columnDefinition = "LONGTEXT")
    private String customerSignatureUrl;

    private LocalDateTime customerSignedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InstallationStatus status = InstallationStatus.SCHEDULED;

    @Column(columnDefinition = "TEXT")
    private String workNotes;

    @OneToMany(mappedBy = "installation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<InstallationTechnician> assignedTechnicians = new ArrayList<>();

    @OneToMany(mappedBy = "installation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InstallationPhoto> photos = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (installationNumber == null && id != null) {
            installationNumber = "INS-" + String.format("%05d", id);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Installation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getInstallationNumber() { return installationNumber; }
    public void setInstallationNumber(String installationNumber) { this.installationNumber = installationNumber; }
    public SalesOrder getSalesOrder() { return salesOrder; }
    public void setSalesOrder(SalesOrder salesOrder) { this.salesOrder = salesOrder; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }
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
    public String getCustomerAcceptanceNote() { return customerAcceptanceNote; }
    public void setCustomerAcceptanceNote(String customerAcceptanceNote) { this.customerAcceptanceNote = customerAcceptanceNote; }
    public String getCustomerSigneeName() { return customerSigneeName; }
    public void setCustomerSigneeName(String customerSigneeName) { this.customerSigneeName = customerSigneeName; }
    public String getCustomerSignatureUrl() { return customerSignatureUrl; }
    public void setCustomerSignatureUrl(String customerSignatureUrl) { this.customerSignatureUrl = customerSignatureUrl; }
    public LocalDateTime getCustomerSignedAt() { return customerSignedAt; }
    public void setCustomerSignedAt(LocalDateTime customerSignedAt) { this.customerSignedAt = customerSignedAt; }
    public InstallationStatus getStatus() { return status; }
    public void setStatus(InstallationStatus status) { this.status = status; }
    public String getWorkNotes() { return workNotes; }
    public void setWorkNotes(String workNotes) { this.workNotes = workNotes; }
    public List<InstallationTechnician> getAssignedTechnicians() { return assignedTechnicians; }
    public void setAssignedTechnicians(List<InstallationTechnician> assignedTechnicians) { this.assignedTechnicians = assignedTechnicians; }
    public List<InstallationPhoto> getPhotos() { return photos; }
    public void setPhotos(List<InstallationPhoto> photos) { this.photos = photos; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
