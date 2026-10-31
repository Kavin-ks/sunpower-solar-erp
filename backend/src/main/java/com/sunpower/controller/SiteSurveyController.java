package com.sunpower.controller;

import com.sunpower.dto.SiteSurveyDTOs.SurveyApprovalRequest;
import com.sunpower.dto.SiteSurveyDTOs.SurveyScheduleRequest;
import com.sunpower.entity.SiteSurvey;
import com.sunpower.entity.SurveyPhoto;
import com.sunpower.entity.enums.Enums.SurveyStatus;
import com.sunpower.service.SiteSurveyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/surveys")
public class SiteSurveyController {

    @Autowired
    private SiteSurveyService siteSurveyService;

    @GetMapping
    public ResponseEntity<List<SiteSurvey>> getAllSurveys(@RequestParam(required = false) SurveyStatus status) {
        if (status != null) {
            return ResponseEntity.ok(siteSurveyService.getSurveysByStatus(status));
        }
        return ResponseEntity.ok(siteSurveyService.getAllSurveys());
    }

    @GetMapping("/approved/customer/{customerId}")
    public ResponseEntity<List<SiteSurvey>> getApprovedSurveysByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(siteSurveyService.getApprovedSurveysByCustomerId(customerId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SiteSurvey> getSurveyById(@PathVariable Long id) {
        return ResponseEntity.ok(siteSurveyService.getSurveyById(id));
    }

    @PostMapping("/schedule")
    public ResponseEntity<SiteSurvey> scheduleSurvey(
            @Valid @RequestBody SurveyScheduleRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Sales Team";
        SiteSurvey survey = siteSurveyService.scheduleSurvey(request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(survey);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SiteSurvey> updateSurvey(@PathVariable Long id, @RequestBody SurveyScheduleRequest request) {
        SiteSurvey survey = siteSurveyService.updateSurveyDetails(id, request);
        return ResponseEntity.ok(survey);
    }

    @PatchMapping("/{id}/approval")
    public ResponseEntity<SiteSurvey> reviewAndApprove(
            @PathVariable Long id,
            @Valid @RequestBody SurveyApprovalRequest request,
            Authentication authentication) {
        String reviewer = authentication != null ? authentication.getName() : "Technical Manager";
        SiteSurvey survey = siteSurveyService.reviewAndApprove(id, request, reviewer);
        return ResponseEntity.ok(survey);
    }

    @PostMapping("/{id}/photos")
    public ResponseEntity<SurveyPhoto> addPhoto(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String url = payload.get("photoUrl");
        String caption = payload.get("caption");
        SurveyPhoto photo = siteSurveyService.addPhoto(id, url, caption);
        return ResponseEntity.status(HttpStatus.CREATED).body(photo);
    }
}
