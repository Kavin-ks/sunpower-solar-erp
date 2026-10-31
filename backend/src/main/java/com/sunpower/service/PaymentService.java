package com.sunpower.service;

import com.sunpower.dto.PaymentDTOs.PaymentRecordRequest;
import com.sunpower.entity.Invoice;
import com.sunpower.entity.Payment;
import com.sunpower.entity.SalesOrder;
import com.sunpower.entity.enums.Enums.OrderStatus;
import com.sunpower.entity.enums.Enums.PaymentStatus;
import com.sunpower.repository.InvoiceRepository;
import com.sunpower.repository.PaymentRepository;
import com.sunpower.repository.SalesOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    public List<Payment> getAllPayments() {
        return paymentRepository.findAllByOrderByPaymentDateDesc();
    }

    public List<Payment> getPaymentsByOrderId(Long orderId) {
        return paymentRepository.findBySalesOrderIdOrderByPaymentDateDesc(orderId);
    }

    public List<Payment> getPaymentsByCustomerId(Long customerId) {
        return paymentRepository.findByCustomerId(customerId);
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found with id: " + id));
    }

    @Transactional
    public Payment recordPayment(PaymentRecordRequest request) {
        SalesOrder order = salesOrderRepository.findById(request.getSalesOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Sales order not found with id: " + request.getSalesOrderId()));

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }

        // Duplicate Reference Number Prevention
        if (request.getReferenceNumber() != null && !request.getReferenceNumber().trim().isEmpty()) {
            String ref = request.getReferenceNumber().trim();
            if (paymentRepository.existsByReferenceNumberAndStatus(ref, PaymentStatus.SUCCESS)) {
                throw new IllegalArgumentException("Duplicate transaction error: A payment with reference/UTR '" +
                        ref + "' has already been recorded in the system.");
            }
        }

        BigDecimal remaining = order.getRemainingBalance() != null ? order.getRemainingBalance() : order.getTotalAmount();
        if (request.getAmount().compareTo(remaining) > 0) {
            throw new IllegalArgumentException("Overpayment error: Payment amount (₹" + request.getAmount() +
                    ") exceeds remaining balance (₹" + remaining + ")");
        }

        Payment payment = new Payment();
        payment.setSalesOrder(order);
        payment.setCustomer(order.getCustomer());
        payment.setAmount(request.getAmount());
        payment.setPaymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now());
        payment.setMethod(request.getMethod());
        payment.setType(request.getType());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setReferenceNumber(request.getReferenceNumber() != null ? request.getReferenceNumber().trim() : null);
        payment.setNotes(request.getNotes());

        payment = paymentRepository.save(payment);
        if (payment.getPaymentNumber() == null) {
            payment.setPaymentNumber("PAY-" + String.format("%05d", payment.getId()));
            payment = paymentRepository.save(payment);
        }

        // Update SalesOrder balances
        BigDecimal currentPaid = order.getTotalPaid() != null ? order.getTotalPaid() : BigDecimal.ZERO;
        BigDecimal newTotalPaid = currentPaid.add(request.getAmount());
        order.setTotalPaid(newTotalPaid);
        order.setRemainingBalance(order.getTotalAmount().subtract(newTotalPaid));

        // Business rule: If advance requirement is satisfied, confirm order
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT && newTotalPaid.compareTo(order.getAdvanceRequired()) >= 0) {
            order.setStatus(OrderStatus.CONFIRMED);
        }
        salesOrderRepository.save(order);

        // Update corresponding Invoice
        invoiceRepository.findBySalesOrderId(order.getId()).ifPresent(invoice -> {
            invoice.setPaidAmount(newTotalPaid);
            invoice.setBalanceAmount(order.getRemainingBalance());
            if (invoice.getBalanceAmount().compareTo(BigDecimal.ZERO) <= 0) {
                invoice.setStatus("PAID");
            } else if (newTotalPaid.compareTo(BigDecimal.ZERO) > 0) {
                invoice.setStatus("PARTIALLY_PAID");
            }
            invoiceRepository.save(invoice);
        });

        return payment;
    }

    @Transactional
    public Payment reversePayment(Long paymentId, String reason, String reversedBy) {
        Payment payment = getPaymentById(paymentId);

        if (payment.getStatus() == PaymentStatus.REVERSED) {
            throw new IllegalStateException("Payment " + payment.getPaymentNumber() + " is already reversed.");
        }

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new IllegalStateException("Only successful payments can be reversed. Current status: " + payment.getStatus());
        }

        payment.setStatus(PaymentStatus.REVERSED);
        payment.setReversalReason(reason);
        payment.setReversedAt(LocalDateTime.now());
        payment.setReversedBy(reversedBy != null ? reversedBy : "Finance Controller");
        payment = paymentRepository.save(payment);

        // Adjust Sales Order balances
        SalesOrder order = payment.getSalesOrder();
        if (order != null) {
            BigDecimal currentPaid = order.getTotalPaid() != null ? order.getTotalPaid() : BigDecimal.ZERO;
            BigDecimal newTotalPaid = currentPaid.subtract(payment.getAmount());
            if (newTotalPaid.compareTo(BigDecimal.ZERO) < 0) {
                newTotalPaid = BigDecimal.ZERO;
            }
            order.setTotalPaid(newTotalPaid);
            order.setRemainingBalance(order.getTotalAmount().subtract(newTotalPaid));

            // If advance payment was reversed and order was CONFIRMED without dispatch, revert to PENDING_PAYMENT
            if (order.getStatus() == OrderStatus.CONFIRMED && newTotalPaid.compareTo(order.getAdvanceRequired()) < 0) {
                order.setStatus(OrderStatus.PENDING_PAYMENT);
            }
            salesOrderRepository.save(order);

            // Adjust Invoice
            invoiceRepository.findBySalesOrderId(order.getId()).ifPresent(invoice -> {
                invoice.setPaidAmount(order.getTotalPaid());
                invoice.setBalanceAmount(order.getRemainingBalance());
                if (invoice.getBalanceAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    invoice.setStatus("PAID");
                } else if (invoice.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
                    invoice.setStatus("PARTIALLY_PAID");
                } else {
                    invoice.setStatus("ISSUED");
                }
                invoiceRepository.save(invoice);
            });
        }

        return payment;
    }
}
