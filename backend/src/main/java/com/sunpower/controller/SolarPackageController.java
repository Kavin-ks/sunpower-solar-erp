package com.sunpower.controller;

import com.sunpower.dto.SolarPackageDTOs.SolarPackageDetailDTO;
import com.sunpower.entity.SolarPackage;
import com.sunpower.entity.enums.Enums.SystemType;
import com.sunpower.service.SolarPackageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/packages")
public class SolarPackageController {

    @Autowired
    private SolarPackageService solarPackageService;

    @GetMapping
    public ResponseEntity<List<SolarPackage>> getAllPackages() {
        return ResponseEntity.ok(solarPackageService.getActivePackages());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SolarPackageDetailDTO> getPackageById(@PathVariable Long id) {
        return ResponseEntity.ok(solarPackageService.getPackageDetails(id));
    }

    @GetMapping("/lookup")
    public ResponseEntity<SolarPackageDetailDTO> lookupPackage(
            @RequestParam SystemType systemType,
            @RequestParam BigDecimal capacityKw) {
        return ResponseEntity.ok(solarPackageService.findPackageByTypeAndCapacity(systemType, capacityKw));
    }
}
