package com.sunpower.controller;

import com.sunpower.dto.ServiceTicketDTOs.CustomerConfirmationRequest;
import com.sunpower.dto.ServiceTicketDTOs.TicketCreateRequest;
import com.sunpower.dto.ServiceTicketDTOs.TicketResolveRequest;
import com.sunpower.entity.ServiceTicket;
import com.sunpower.entity.enums.Enums.TicketStatus;
import com.sunpower.service.ServiceTicketService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-tickets")
public class ServiceTicketController {

    @Autowired
    private ServiceTicketService serviceTicketService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPPORT', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<List<ServiceTicket>> getAllTickets(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TicketStatus status) {
        if (status != null) {
            return ResponseEntity.ok(serviceTicketService.getTicketsByStatus(status));
        }
        if (search != null && !search.trim().isEmpty()) {
            return ResponseEntity.ok(serviceTicketService.searchTickets(search));
        }
        return ResponseEntity.ok(serviceTicketService.getAllTickets());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPPORT', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ServiceTicket> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(serviceTicketService.getTicketById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPPORT')")
    public ResponseEntity<ServiceTicket> createTicket(
            @Valid @RequestBody TicketCreateRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Customer Support";
        ServiceTicket ticket = serviceTicketService.createTicket(request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @PatchMapping("/{id}/assign/{technicianId}")
    @PreAuthorize("hasRole('SUPPORT')")
    public ResponseEntity<ServiceTicket> assignTechnician(
            @PathVariable Long id,
            @PathVariable Long technicianId,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Support Coordinator";
        ServiceTicket ticket = serviceTicketService.assignTechnician(id, technicianId, actor);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('SUPPORT', 'TECHNICIAN')")
    public ResponseEntity<ServiceTicket> resolveTicket(
            @PathVariable Long id,
            @Valid @RequestBody TicketResolveRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Service Technician";
        ServiceTicket ticket = serviceTicketService.resolveTicket(id, request, actor);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/{id}/confirm-and-close")
    @PreAuthorize("hasRole('SUPPORT')")
    public ResponseEntity<ServiceTicket> confirmAndClose(
            @PathVariable Long id,
            @Valid @RequestBody CustomerConfirmationRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Customer Support Lead";
        ServiceTicket ticket = serviceTicketService.confirmAndClose(id, request, actor);
        return ResponseEntity.ok(ticket);
    }
}
