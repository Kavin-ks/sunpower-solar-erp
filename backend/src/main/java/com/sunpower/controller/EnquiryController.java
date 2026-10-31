package com.sunpower.controller;

import com.sunpower.dto.EnquiryDTOs.EnquiryCreateRequest;
import com.sunpower.dto.EnquiryDTOs.EnquiryStatusUpdateRequest;
import com.sunpower.entity.Enquiry;
import com.sunpower.entity.enums.Enums.EnquiryStatus;
import com.sunpower.service.EnquiryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enquiries")
public class EnquiryController {

    @Autowired
    private EnquiryService enquiryService;

    @PostMapping("/public")
    public ResponseEntity<Enquiry> submitPublicEnquiry(@Valid @RequestBody com.sunpower.dto.EnquiryDTOs.PublicEnquiryRequest request) {
        Enquiry enquiry = enquiryService.createPublicEnquiry(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(enquiry);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'DIRECTOR')")
    public ResponseEntity<List<Enquiry>> getAllEnquiries(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) EnquiryStatus status) {
        if (status != null) {
            return ResponseEntity.ok(enquiryService.getEnquiriesByStatus(status));
        }
        if (search != null && !search.trim().isEmpty()) {
            return ResponseEntity.ok(enquiryService.searchEnquiries(search));
        }
        return ResponseEntity.ok(enquiryService.getAllEnquiries());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'DIRECTOR')")
    public ResponseEntity<Enquiry> getEnquiryById(@PathVariable Long id) {
        return ResponseEntity.ok(enquiryService.getEnquiryById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SALES', 'DIRECTOR')")
    public ResponseEntity<Enquiry> createEnquiry(@Valid @RequestBody EnquiryCreateRequest request, Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Sales Team";
        Enquiry enquiry = enquiryService.createEnquiry(request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(enquiry);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SALES', 'DIRECTOR')")
    public ResponseEntity<Enquiry> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody EnquiryStatusUpdateRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Sales Lead";
        Enquiry enquiry = enquiryService.updateStatus(id, request, actor);
        return ResponseEntity.ok(enquiry);
    }

    @PatchMapping("/{id}/assign/{userId}")
    @PreAuthorize("hasAnyRole('SALES', 'DIRECTOR')")
    public ResponseEntity<Enquiry> assignToSales(
            @PathVariable Long id,
            @PathVariable Long userId,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Sales Manager";
        Enquiry enquiry = enquiryService.assignToSales(id, userId, actor);
        return ResponseEntity.ok(enquiry);
    }
}
