package com.sunpower.controller;

import com.sunpower.entity.InventoryStock;
import com.sunpower.entity.StockMovement;
import com.sunpower.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE', 'SALES', 'FINANCE', 'DIRECTOR')")
    public ResponseEntity<List<InventoryStock>> getAllStock() {
        return ResponseEntity.ok(inventoryService.getAllStock());
    }

    @GetMapping("/product/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE', 'SALES', 'FINANCE', 'DIRECTOR')")
    public ResponseEntity<InventoryStock> getStockByProductId(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getStockByProductId(productId));
    }

    @GetMapping("/movements")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE', 'FINANCE', 'DIRECTOR')")
    public ResponseEntity<List<StockMovement>> getMovements(@RequestParam(required = false) Long productId) {
        if (productId != null) {
            return ResponseEntity.ok(inventoryService.getMovementsByProductId(productId));
        }
        return ResponseEntity.ok(inventoryService.getRecentMovements());
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'DIRECTOR')")
    public ResponseEntity<InventoryStock> adjustStock(
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {
        Long productId = Long.valueOf(payload.get("productId").toString());
        int delta = Integer.parseInt(payload.get("quantityDelta").toString());
        String reason = payload.get("reason") != null ? payload.get("reason").toString() : "Manual warehouse adjustment";
        String actor = authentication != null ? authentication.getName() : "Warehouse Officer";

        InventoryStock stock = inventoryService.adjustStock(productId, delta, reason, actor);
        return ResponseEntity.ok(stock);
    }
}
