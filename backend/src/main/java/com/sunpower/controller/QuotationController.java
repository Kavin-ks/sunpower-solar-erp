package com.sunpower.controller;

import com.sunpower.dto.QuotationDTOs.QuotationCreateRequest;
import com.sunpower.dto.QuotationDTOs.QuotationStatusUpdateRequest;
import com.sunpower.entity.Quotation;
import com.sunpower.service.QuotationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quotations")
public class QuotationController {

    @Autowired
    private QuotationService quotationService;

    @GetMapping
    public ResponseEntity<List<Quotation>> getAllQuotations(@RequestParam(required = false) Long customerId) {
        if (customerId != null) {
            return ResponseEntity.ok(quotationService.getQuotationsByCustomerId(customerId));
        }
        return ResponseEntity.ok(quotationService.getAllQuotations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Quotation> getQuotationById(@PathVariable Long id) {
        return ResponseEntity.ok(quotationService.getQuotationById(id));
    }

    @PostMapping
    public ResponseEntity<Quotation> createQuotation(
            @Valid @RequestBody QuotationCreateRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Sales Officer";
        Quotation quotation = quotationService.createQuotation(request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(quotation);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Quotation> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody QuotationStatusUpdateRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Sales Officer";
        Quotation quotation = quotationService.updateStatus(id, request, actor);
        return ResponseEntity.ok(quotation);
    }
}
