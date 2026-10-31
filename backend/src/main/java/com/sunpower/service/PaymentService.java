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
        return paymentRepository.findAll();
    }

    public List<Payment> getPaymentsByOrderId(Long orderId) {
        return paymentRepository.findBySalesOrderId(orderId);
    }

    public List<Payment> getPaymentsByCustomerId(Long customerId) {
        return paymentRepository.findByCustomerId(customerId);
    }

    @Transactional
    public Payment recordPayment(PaymentRecordRequest request) {
        SalesOrder order = salesOrderRepository.findById(request.getSalesOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Sales order not found with id: " + request.getSalesOrderId()));

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }

        BigDecimal remaining = order.getRemainingBalance();
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
        payment.setReferenceNumber(request.getReferenceNumber());
        payment.setNotes(request.getNotes());

        payment = paymentRepository.save(payment);
        if (payment.getPaymentNumber() == null) {
            payment.setPaymentNumber("PAY-" + String.format("%05d", payment.getId()));
            payment = paymentRepository.save(payment);
        }

        // Update SalesOrder balances
        BigDecimal newTotalPaid = (order.getTotalPaid() != null ? order.getTotalPaid() : BigDecimal.ZERO).add(request.getAmount());
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
            if (invoice.getBalanceAmount().compareTo(BigDecimal.ZERO) == 0) {
                invoice.setStatus("PAID");
            } else if (newTotalPaid.compareTo(BigDecimal.ZERO) > 0) {
                invoice.setStatus("PARTIALLY_PAID");
            }
            invoiceRepository.save(invoice);
        });

        return payment;
    }
}
