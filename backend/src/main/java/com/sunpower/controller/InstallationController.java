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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/installations")
public class InstallationController {

    @Autowired
    private InstallationService installationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'TECHNICIAN', 'SUPPORT', 'WAREHOUSE', 'FINANCE')")
    public ResponseEntity<List<Installation>> getAllInstallations(@RequestParam(required = false) InstallationStatus status) {
        if (status != null) {
            return ResponseEntity.ok(installationService.getInstallationsByStatus(status));
        }
        return ResponseEntity.ok(installationService.getAllInstallations());
    }

    @GetMapping("/my-assigned")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<List<Installation>> getMyAssignedInstallations(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "technician";
        return ResponseEntity.ok(installationService.getInstallationsForTechnician(username));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'TECHNICIAN', 'SUPPORT', 'WAREHOUSE', 'FINANCE')")
    public ResponseEntity<Installation> getInstallationById(@PathVariable Long id) {
        return ResponseEntity.ok(installationService.getInstallationById(id));
    }

    @RequestMapping(value = {"", "/schedule"}, method = RequestMethod.POST)
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'WAREHOUSE', 'ADMIN')")
    public ResponseEntity<Installation> scheduleInstallation(
            @Valid @RequestBody ScheduleInstallationRequest request) {
        Installation installation = installationService.scheduleInstallation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(installation);
    }

    @PostMapping("/{id}/verify-product")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<com.sunpower.entity.SerialNumber> verifyProduct(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        String barcode = payload.get("barcode");
        if (barcode == null || barcode.trim().isEmpty()) {
            barcode = payload.get("serialCode");
        }
        String actor = authentication != null ? authentication.getName() : "Technician";
        com.sunpower.entity.SerialNumber sn = installationService.verifyDispatchedProduct(id, barcode, actor);
        return ResponseEntity.ok(sn);
    }

    @RequestMapping(value = "/{id}/site-received", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN', 'WAREHOUSE')")
    public ResponseEntity<Installation> confirmSiteReceived(
            @PathVariable Long id,
            @RequestBody(required = false) com.sunpower.dto.InstallationDTOs.SiteReceivedRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Technician Lead";
        Installation installation = installationService.confirmSiteReceived(id, request, actor);
        return ResponseEntity.ok(installation);
    }

    @RequestMapping(value = "/{id}/start", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<Installation> startInstallation(
            @PathVariable Long id,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Technician";
        Installation installation = installationService.startInstallation(id, actor);
        return ResponseEntity.ok(installation);
    }

    @RequestMapping(value = "/{id}/complete", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<Installation> completeInstallation(
            @PathVariable Long id,
            @Valid @RequestBody CompleteInstallationRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Technician";
        Installation installation = installationService.completeInstallation(id, request, actor);
        return ResponseEntity.ok(installation);
    }

    @PostMapping("/{id}/photos")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<InstallationPhoto> addPhoto(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String photoUrl = payload.get("photoUrl");
        String stage = payload.get("stage");
        String caption = payload.get("caption");
        InstallationPhoto photo = installationService.addInstallationPhoto(id, photoUrl, stage, caption);
        return ResponseEntity.status(HttpStatus.CREATED).body(photo);
    }
}
