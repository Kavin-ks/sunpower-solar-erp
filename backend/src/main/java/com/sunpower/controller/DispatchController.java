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
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dispatches")
public class DispatchController {

    @Autowired
    private DispatchService dispatchService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE', 'TECHNICIAN')")    public ResponseEntity<Dispatch> getDispatchById(@PathVariable Long id) {
        return ResponseEntity.ok(dispatchService.getDispatchById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('WAREHOUSE')")    public ResponseEntity<Dispatch> assignSerialNumber(
            @Valid @RequestBody AssignSerialNumberRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Warehouse Staff";
        Dispatch dispatch = dispatchService.assignSerialNumber(request, actor);
        return ResponseEntity.ok(dispatch);
    }

    @PostMapping("/{id}/scan-barcode")
    @PreAuthorize("hasAnyRole('WAREHOUSE')")
    public ResponseEntity<Dispatch> scanBarcode(
            @PathVariable Long id,
            @Valid @RequestBody ScanBarcodeRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Warehouse Scanner";
        Dispatch dispatch = dispatchService.scanBarcodeForDispatch(id, request.getBarcode(), request.getDispatchItemId(), actor);
        return ResponseEntity.ok(dispatch);
    }

    @RequestMapping(value = {"/{id}/confirm-dispatch", "/{id}/dispatch"}, method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('WAREHOUSE')")    public ResponseEntity<Dispatch> confirmDispatch(
            @PathVariable Long id,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Warehouse Lead";
        Dispatch dispatch = dispatchService.confirmDispatch(id, actor);
        return ResponseEntity.ok(dispatch);
    }

    @RequestMapping(value = {"/{id}/confirm-delivery", "/{id}/deliver"}, method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('WAREHOUSE')")    public ResponseEntity<Dispatch> confirmDelivery(
            @PathVariable Long id,
            @RequestBody(required = false) ConfirmDeliveryRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Logistics Manager";
        if (request == null) {
            request = new ConfirmDeliveryRequest();
        }
        Dispatch dispatch = dispatchService.confirmDelivery(id, request, actor);
        return ResponseEntity.ok(dispatch);
    }
}
