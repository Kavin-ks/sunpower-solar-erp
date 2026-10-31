package com.sunpower.controller;

import com.sunpower.dto.InstallationDTOs.CompleteInstallationRequest;
import com.sunpower.dto.InstallationDTOs.ScheduleInstallationRequest;
import com.sunpower.entity.Installation;
import com.sunpower.entity.InstallationPhoto;
import com.sunpower.entity.enums.Enums.InstallationStatus;
import com.sunpower.service.InstallationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/installations")
public class InstallationController {

    @Autowired
    private InstallationService installationService;

    @GetMapping
    public ResponseEntity<List<Installation>> getAllInstallations(@RequestParam(required = false) InstallationStatus status) {
        if (status != null) {
            return ResponseEntity.ok(installationService.getInstallationsByStatus(status));
        }
        return ResponseEntity.ok(installationService.getAllInstallations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Installation> getInstallationById(@PathVariable Long id) {
        return ResponseEntity.ok(installationService.getInstallationById(id));
    }

    @PostMapping("/schedule")
    public ResponseEntity<Installation> scheduleInstallation(
            @Valid @RequestBody ScheduleInstallationRequest request) {
        Installation installation = installationService.scheduleInstallation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(installation);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Installation> completeInstallation(
            @PathVariable Long id,
            @Valid @RequestBody CompleteInstallationRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Technician Lead";
        Installation installation = installationService.completeInstallation(id, request, actor);
        return ResponseEntity.ok(installation);
    }

    @PostMapping("/{id}/photos")
    public ResponseEntity<InstallationPhoto> addPhoto(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String photoUrl = payload.get("photoUrl");
        String stage = payload.get("stage");
        String caption = payload.get("caption");
        InstallationPhoto photo = installationService.addInstallationPhoto(id, photoUrl, stage, caption);
        return ResponseEntity.status(HttpStatus.CREATED).body(photo);
    }
}
