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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enquiries")
public class EnquiryController {

    @Autowired
    private EnquiryService enquiryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")    public ResponseEntity<Enquiry> getEnquiryById(@PathVariable Long id) {
        return ResponseEntity.ok(enquiryService.getEnquiryById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SALES')")    public ResponseEntity<Enquiry> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody EnquiryStatusUpdateRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Sales Lead";
        Enquiry enquiry = enquiryService.updateStatus(id, request, actor);
        return ResponseEntity.ok(enquiry);
    }

    @PatchMapping("/{id}/assign/{userId}")
    @PreAuthorize("hasAnyRole('SALES')")
    public ResponseEntity<Enquiry> assignToSales(
            @PathVariable Long id,
            @PathVariable Long userId,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Admin";
        Enquiry enquiry = enquiryService.assignToSales(id, userId, actor);
        return ResponseEntity.ok(enquiry);
    }
}
