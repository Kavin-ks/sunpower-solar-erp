package com.sunpower.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sunpower.entity.enums.Enums.SerialNumberStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "serial_number_histories")
public class SerialNumberHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "serial_number_id", nullable = false)
    @JsonIgnore
    private SerialNumber serialNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SerialNumberStatus status;

    @Column(nullable = false, length = 255)
    private String eventDescription;

    @Column(length = 100)
    private String locationOrRecipient;

    @Column(length = 100)
    private String recordedBy;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public SerialNumberHistory() {}

    public SerialNumberHistory(SerialNumber serialNumber, SerialNumberStatus status, String eventDescription, String locationOrRecipient, String recordedBy) {
        this.serialNumber = serialNumber;
        this.status = status;
        this.eventDescription = eventDescription;
        this.locationOrRecipient = locationOrRecipient;
        this.recordedBy = recordedBy;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public SerialNumber getSerialNumber() { return serialNumber; }
    public void setSerialNumber(SerialNumber serialNumber) { this.serialNumber = serialNumber; }
    public SerialNumberStatus getStatus() { return status; }
    public void setStatus(SerialNumberStatus status) { this.status = status; }
    public String getEventDescription() { return eventDescription; }
    public void setEventDescription(String eventDescription) { this.eventDescription = eventDescription; }
    public String getLocationOrRecipient() { return locationOrRecipient; }
    public void setLocationOrRecipient(String locationOrRecipient) { this.locationOrRecipient = locationOrRecipient; }
    public String getRecordedBy() { return recordedBy; }
    public void setRecordedBy(String recordedBy) { this.recordedBy = recordedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
