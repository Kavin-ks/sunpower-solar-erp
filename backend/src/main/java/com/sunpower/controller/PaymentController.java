package com.sunpower.controller;

import com.sunpower.dto.PaymentDTOs.PaymentRecordRequest;
import com.sunpower.entity.Payment;
import com.sunpower.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @GetMapping
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

    @PostMapping
    public ResponseEntity<Payment> recordPayment(@Valid @RequestBody PaymentRecordRequest request) {
        Payment payment = paymentService.recordPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
    }
}
