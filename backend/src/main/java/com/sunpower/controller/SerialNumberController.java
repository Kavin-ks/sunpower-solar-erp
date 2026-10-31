package com.sunpower.controller;

import com.sunpower.entity.SerialNumber;
import com.sunpower.service.SerialNumberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/serial-numbers")
public class SerialNumberController {

    @Autowired
    private SerialNumberService serialNumberService;

    @GetMapping
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'ADMIN', 'SUPPORT', 'TECHNICIAN')")
    public ResponseEntity<List<SerialNumber>> getAllSerialNumbers(@RequestParam(required = false) String search) {
        if (search != null && !search.trim().isEmpty()) {
            return ResponseEntity.ok(serialNumberService.searchSerialNumbers(search));
        }
        return ResponseEntity.ok(serialNumberService.getAllSerialNumbers());
    }

    @GetMapping("/available/{productId}")
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'ADMIN', 'SUPPORT', 'TECHNICIAN')")
    public ResponseEntity<List<SerialNumber>> getAvailableSerials(@PathVariable Long productId) {
        return ResponseEntity.ok(serialNumberService.getAvailableSerialsForProduct(productId));
    }

    @GetMapping("/lookup/{serialCode}")
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'ADMIN', 'SUPPORT', 'TECHNICIAN')")
    public ResponseEntity<?> lookupSerial(@PathVariable String serialCode) {
        return serialNumberService.findBySerialCode(serialCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('WAREHOUSE')")
    public ResponseEntity<SerialNumber> registerSerialNumber(
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        Long productId = Long.valueOf(payload.get("productId"));
        String serialCode = payload.get("serialCode");
        String purchaseRef = payload.get("purchaseReference");
        String location = payload.get("location");
        String actor = authentication != null ? authentication.getName() : "Warehouse Staff";

        SerialNumber sn = serialNumberService.registerSerialNumber(productId, serialCode, purchaseRef, location, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(sn);
    }
}
