package com.sunpower.controller;

import com.sunpower.entity.Warranty;
import com.sunpower.service.WarrantyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/warranties")
public class WarrantyController {

    @Autowired
    private WarrantyService warrantyService;

    @GetMapping
    public ResponseEntity<List<Warranty>> getAllWarranties(@RequestParam(required = false) Long customerId) {
        if (customerId != null) {
            return ResponseEntity.ok(warrantyService.getWarrantiesByCustomerId(customerId));
        }
        return ResponseEntity.ok(warrantyService.getAllWarranties());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Warranty> getWarrantyById(@PathVariable Long id) {
        return ResponseEntity.ok(warrantyService.getWarrantyById(id));
    }

    @GetMapping("/serial/{serialCode}")
    public ResponseEntity<?> getWarrantyBySerialCode(@PathVariable String serialCode) {
        return warrantyService.getWarrantyBySerialCode(serialCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/evaluate")
    public ResponseEntity<com.sunpower.dto.ServiceTicketDTOs.WarrantyDecisionDTO> evaluateWarranty(
            @RequestParam String serialCode,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String faultCategory) {
        return ResponseEntity.ok(warrantyService.evaluateWarranty(serialCode, customerId, faultCategory));
    }
}
