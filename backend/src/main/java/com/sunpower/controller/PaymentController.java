package com.sunpower.controller;

import com.sunpower.dto.PaymentDTOs.PaymentRecordRequest;
import com.sunpower.dto.PaymentDTOs.PaymentReversalRequest;
import com.sunpower.entity.Payment;
import com.sunpower.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES', 'DIRECTOR')")
    public ResponseEntity<List<Payment>> getAllPayments(
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) Long customerId) {
        if (orderId != null) {
            return ResponseEntity.ok(paymentService.getPaymentsByOrderId(orderId));
        }
        if (customerId != null) {
            return ResponseEntity.ok(paymentService.getPaymentsByCustomerId(customerId));
        }
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FINANCE', 'DIRECTOR')")
    public ResponseEntity<Payment> recordPayment(@Valid @RequestBody PaymentRecordRequest request) {
        Payment payment = paymentService.recordPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
    }

    @PostMapping("/{id}/reverse")
    public ResponseEntity<Payment> reversePayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentReversalRequest request,
            Authentication authentication) {
        String reversedBy = authentication != null ? authentication.getName() : "Finance Officer";
        Payment reversed = paymentService.reversePayment(id, request.getReason(), reversedBy);
        return ResponseEntity.ok(reversed);
    }
}
