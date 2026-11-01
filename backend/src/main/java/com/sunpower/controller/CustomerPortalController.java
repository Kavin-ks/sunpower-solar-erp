package com.sunpower.controller;

import com.sunpower.entity.*;
import com.sunpower.service.CustomerPortalService;
import com.sunpower.service.CustomerPortalService.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customer")
public class CustomerPortalController {

    @Autowired
    private CustomerPortalService portalService;

    // ── PUBLIC: Register ──────────────────────────────────────────
    @PostMapping("/auth/register")
    public ResponseEntity<CustomerAuthResponse> register(@RequestBody CustomerRegisterRequest req) {
        CustomerAuthResponse resp = portalService.registerCustomer(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    // ── PUBLIC: Login ─────────────────────────────────────────────
    @PostMapping("/auth/login")
    public ResponseEntity<CustomerAuthResponse> login(@RequestBody CustomerLoginRequest req) {
        CustomerAuthResponse resp = portalService.loginCustomer(req);
        return ResponseEntity.ok(resp);
    }

    // ── AUTHENTICATED: Get My Profile ─────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<Customer> getMyProfile(Authentication authentication) {
        Customer customer = portalService.getCustomerByUsername(authentication.getName());
        return ResponseEntity.ok(customer);
    }

    // ── AUTHENTICATED: Full Portal Data Bundle ────────────────────
    @GetMapping("/me/portal-data")
    public ResponseEntity<PortalDataResponse> getPortalData(
            Authentication authentication,
            @RequestParam(required = false) Long customerId) {
        Long cid = customerId;
        if (cid == null) {
            Customer customer = portalService.getCustomerByUsername(authentication.getName());
            cid = customer.getId();
        }
        PortalDataResponse data = portalService.getPortalData(cid);
        return ResponseEntity.ok(data);
    }

    // ── AUTHENTICATED: Accept Quotation & Auto-Convert to Order ──
    @PostMapping("/me/quotations/{quotationId}/accept")
    public ResponseEntity<SalesOrder> acceptQuotation(
            @PathVariable Long quotationId,
            Authentication authentication) {
        Customer customer = portalService.getCustomerByUsername(authentication.getName());
        SalesOrder order = portalService.acceptQuotation(quotationId, customer.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    // ── AUTHENTICATED: Record Customer Payment ────────────────────
    @PostMapping("/me/orders/{orderId}/pay")
    public ResponseEntity<Payment> recordPayment(
            @PathVariable Long orderId,
            @RequestBody CustomerPayRequest req,
            Authentication authentication) {
        Customer customer = portalService.getCustomerByUsername(authentication.getName());
        req.salesOrderId = orderId;
        Payment payment = portalService.recordCustomerPayment(orderId, req, customer.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
    }

    // ── AUTHENTICATED: Customer Sign-Off on Installation ─────────
    @PostMapping("/me/installations/{installationId}/sign-off")
    public ResponseEntity<Installation> signOffInstallation(
            @PathVariable Long installationId,
            @RequestBody CustomerSignOffRequest req,
            Authentication authentication) {
        Customer customer = portalService.getCustomerByUsername(authentication.getName());
        Installation installation = portalService.signOffInstallation(installationId, req, customer.getId());
        return ResponseEntity.ok(installation);
    }

    // ── AUTHENTICATED: Raise Service Ticket ───────────────────────
    @PostMapping("/me/service-tickets")
    public ResponseEntity<ServiceTicket> raiseTicket(
            @RequestBody CustomerTicketRequest req,
            Authentication authentication) {
        Customer customer = portalService.getCustomerByUsername(authentication.getName());
        ServiceTicket ticket = portalService.raiseServiceTicket(req, customer.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    // ── AUTHENTICATED: Confirm Ticket Resolution ──────────────────
    @PostMapping("/me/service-tickets/{ticketId}/confirm-close")
    public ResponseEntity<ServiceTicket> confirmTicketClose(
            @PathVariable Long ticketId,
            @RequestBody CustomerTicketConfirmRequest req,
            Authentication authentication) {
        Customer customer = portalService.getCustomerByUsername(authentication.getName());
        ServiceTicket ticket = portalService.confirmTicketClose(ticketId, req, customer.getId());
        return ResponseEntity.ok(ticket);
    }

    // ── PUBLIC: Enquiry Status by Number ─────────────────────────
    @GetMapping("/enquiry-status/{enquiryNumber}")
    public ResponseEntity<?> getEnquiryStatus(@PathVariable String enquiryNumber) {
        // Forward to EnquiryRepository via service
        return ResponseEntity.ok(Map.of(
            "enquiryNumber", enquiryNumber,
            "message", "Enquiry tracking available. Contact sales for details."
        ));
    }
}
