package com.sunpower.controller;

import com.sunpower.entity.Technician;
import com.sunpower.service.TechnicianService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/technicians")
public class TechnicianController {

    @Autowired
    private TechnicianService technicianService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SALES', 'ADMIN', 'DIRECTOR', 'TECHNICIAN', 'SUPPORT', 'WAREHOUSE', 'FINANCE')")
    public ResponseEntity<List<Technician>> getAllTechnicians(@RequestParam(required = false) Boolean availableOnly) {
        if (Boolean.TRUE.equals(availableOnly)) {
            return ResponseEntity.ok(technicianService.getAvailableTechnicians());
        }
        return ResponseEntity.ok(technicianService.getActiveTechnicians());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Technician> getTechnicianById(@PathVariable Long id) {
        return ResponseEntity.ok(technicianService.getTechnicianById(id));
    }

    @PostMapping
    public ResponseEntity<Technician> createTechnician(@RequestBody Technician technician) {
        Technician created = technicianService.createTechnician(technician);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Technician> updateTechnician(@PathVariable Long id, @RequestBody Technician technician) {
        Technician updated = technicianService.updateTechnician(id, technician);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> deleteTechnician(@PathVariable Long id) {
        technicianService.deleteTechnician(id);
        return ResponseEntity.noContent().build();
    }
}
