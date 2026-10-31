package com.sunpower.controller;

import com.sunpower.dto.ServiceTicketDTOs.CustomerConfirmationRequest;
import com.sunpower.dto.ServiceTicketDTOs.PublicComplaintRequest;
import com.sunpower.dto.ServiceTicketDTOs.TechnicianJobCompleteRequest;
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

    @GetMapping("/my-assigned")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN', 'SUPPORT')")
    public ResponseEntity<List<ServiceTicket>> getMyAssignedTickets(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "technician";
        return ResponseEntity.ok(serviceTicketService.getTicketsForTechnician(username));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPPORT', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ServiceTicket> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(serviceTicketService.getTicketById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPPORT', 'ADMIN')")
    public ResponseEntity<ServiceTicket> createTicket(
            @Valid @RequestBody TicketCreateRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Customer Support";
        ServiceTicket ticket = serviceTicketService.createTicket(request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @PatchMapping("/{id}/assign/{technicianId}")
    @PreAuthorize("hasAnyRole('SUPPORT', 'ADMIN')")
    public ResponseEntity<ServiceTicket> assignTechnician(
            @PathVariable Long id,
            @PathVariable Long technicianId,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Support Coordinator";
        ServiceTicket ticket = serviceTicketService.assignTechnician(id, technicianId, actor);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/{id}/start-work")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN', 'SUPPORT')")
    public ResponseEntity<ServiceTicket> startWork(
            @PathVariable Long id,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Technician";
        ServiceTicket ticket = serviceTicketService.startTechnicianWork(id, actor);
        return ResponseEntity.ok(ticket);
    }

    @RequestMapping(value = {"/{id}/technician-complete", "/{id}/complete-work"}, method = RequestMethod.POST)
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN', 'SUPPORT')")
    public ResponseEntity<ServiceTicket> technicianComplete(
            @PathVariable Long id,
            @Valid @RequestBody TechnicianJobCompleteRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Technician";
        ServiceTicket ticket = serviceTicketService.completeTechnicianWork(id, request, actor);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('SUPPORT', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<ServiceTicket> resolveTicket(
            @PathVariable Long id,
            @Valid @RequestBody TicketResolveRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Service Technician";
        ServiceTicket ticket = serviceTicketService.resolveTicket(id, request, actor);
        return ResponseEntity.ok(ticket);
    }

    @RequestMapping(value = {"/{id}/confirm-and-close", "/{id}/confirm-customer"}, method = RequestMethod.POST)
    @PreAuthorize("hasAnyRole('SUPPORT', 'ADMIN')")
    public ResponseEntity<ServiceTicket> confirmAndClose(
            @PathVariable Long id,
            @Valid @RequestBody CustomerConfirmationRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Customer Support Lead";
        ServiceTicket ticket = serviceTicketService.confirmAndClose(id, request, actor);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/{id}/reopen")
    @PreAuthorize("hasAnyRole('SUPPORT', 'ADMIN')")
    public ResponseEntity<ServiceTicket> reopenTicket(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> payload,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Customer Support";
        String reason = payload != null ? payload.get("reason") : "Customer reported issue unresolved";
        ServiceTicket ticket = serviceTicketService.reopenTicket(id, reason, actor);
        return ResponseEntity.ok(ticket);
    }

    // ==========================================
    // Public Endpoints for Customer Portal
    // ==========================================

    @PostMapping("/public/submit")
    public ResponseEntity<ServiceTicket> submitPublicComplaint(
            @Valid @RequestBody PublicComplaintRequest request) {
        ServiceTicket ticket = serviceTicketService.createPublicComplaint(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @GetMapping("/public/track/{ticketNumber}")
    public ResponseEntity<ServiceTicket> trackPublicComplaint(
            @PathVariable String ticketNumber,
            @RequestParam(required = false) String phone) {
        ServiceTicket ticket = serviceTicketService.getTicketForCustomer(ticketNumber, phone);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/public/confirm/{ticketNumber}")
    public ResponseEntity<ServiceTicket> confirmPublicComplaint(
            @PathVariable String ticketNumber,
            @Valid @RequestBody CustomerConfirmationRequest request) {
        ServiceTicket ticket = serviceTicketService.getTicketForCustomer(ticketNumber, null);
        ticket = serviceTicketService.confirmAndClose(ticket.getId(), request, "Customer (Portal)");
        return ResponseEntity.ok(ticket);
    }
}

