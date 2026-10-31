package com.sunpower.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "installation_photos")
public class InstallationPhoto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "installation_id", nullable = false)
    @JsonIgnore
    private Installation installation;

    @Column(nullable = false, length = 255)
    private String photoUrl;

    @Column(length = 100)
    private String stage; // "Mounting", "Wiring", "Inverter", "Earthing", "Full Rooftop"

    @Column(length = 255)
    private String caption;

    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }

    public InstallationPhoto() {}

    public InstallationPhoto(Installation installation, String photoUrl, String stage, String caption) {
        this.installation = installation;
        this.photoUrl = photoUrl;
        this.stage = stage;
        this.caption = caption;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Installation getInstallation() { return installation; }
    public void setInstallation(Installation installation) { this.installation = installation; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}
