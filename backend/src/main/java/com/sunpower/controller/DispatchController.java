package com.sunpower.controller;

import com.sunpower.dto.DispatchDTOs.AssignSerialNumberRequest;
import com.sunpower.dto.DispatchDTOs.ConfirmDeliveryRequest;
import com.sunpower.dto.DispatchDTOs.DispatchCreateRequest;
import com.sunpower.entity.Dispatch;
import com.sunpower.service.DispatchService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dispatches")
public class DispatchController {

    @Autowired
    private DispatchService dispatchService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE', 'TECHNICIAN', 'DIRECTOR')")
    public ResponseEntity<List<Dispatch>> getAllDispatches() {
        return ResponseEntity.ok(dispatchService.getAllDispatches());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE', 'TECHNICIAN', 'DIRECTOR')")
    public ResponseEntity<Dispatch> getDispatchById(@PathVariable Long id) {
        return ResponseEntity.ok(dispatchService.getDispatchById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'DIRECTOR')")
    public ResponseEntity<Dispatch> createDispatch(
            @Valid @RequestBody DispatchCreateRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Warehouse Lead";
        Dispatch dispatch = dispatchService.createDispatch(request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(dispatch);
    }

    @PostMapping("/assign-serial")
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'DIRECTOR')")
    public ResponseEntity<Dispatch> assignSerialNumber(
            @Valid @RequestBody AssignSerialNumberRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Warehouse Staff";
        Dispatch dispatch = dispatchService.assignSerialNumber(request, actor);
        return ResponseEntity.ok(dispatch);
    }

    @PostMapping("/{id}/confirm-dispatch")
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'DIRECTOR')")
    public ResponseEntity<Dispatch> confirmDispatch(
            @PathVariable Long id,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Warehouse Lead";
        Dispatch dispatch = dispatchService.confirmDispatch(id, actor);
        return ResponseEntity.ok(dispatch);
    }

    @PostMapping("/{id}/confirm-delivery")
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'DIRECTOR')")
    public ResponseEntity<Dispatch> confirmDelivery(
            @PathVariable Long id,
            @Valid @RequestBody ConfirmDeliveryRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Logistics Manager";
        Dispatch dispatch = dispatchService.confirmDelivery(id, request, actor);
        return ResponseEntity.ok(dispatch);
    }
}
