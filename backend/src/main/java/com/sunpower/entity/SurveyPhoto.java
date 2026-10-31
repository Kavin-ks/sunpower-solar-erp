package com.sunpower.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "survey_photos")
public class SurveyPhoto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    @JsonIgnore
    private SiteSurvey siteSurvey;

    @Column(nullable = false, length = 255)
    private String photoUrl;

    @Column(length = 100)
    private String caption;

    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }

    public SurveyPhoto() {}

    public SurveyPhoto(SiteSurvey siteSurvey, String photoUrl, String caption) {
        this.siteSurvey = siteSurvey;
        this.photoUrl = photoUrl;
        this.caption = caption;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public SiteSurvey getSiteSurvey() { return siteSurvey; }
    public void setSiteSurvey(SiteSurvey siteSurvey) { this.siteSurvey = siteSurvey; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}
