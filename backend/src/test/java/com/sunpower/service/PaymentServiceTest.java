package com.sunpower.service;

import com.sunpower.dto.PaymentDTOs.PaymentRecordRequest;
import com.sunpower.entity.Customer;
import com.sunpower.entity.Invoice;
import com.sunpower.entity.Payment;
import com.sunpower.entity.SalesOrder;
import com.sunpower.entity.enums.Enums.OrderStatus;
import com.sunpower.entity.enums.Enums.PaymentMethod;
import com.sunpower.entity.enums.Enums.PaymentStatus;
import com.sunpower.entity.enums.Enums.PaymentType;
import com.sunpower.repository.InvoiceRepository;
import com.sunpower.repository.PaymentRepository;
import com.sunpower.repository.SalesOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private SalesOrderRepository salesOrderRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private PaymentService paymentService;

    private SalesOrder sampleOrder;
    private Customer sampleCustomer;

    @BeforeEach
    void setUp() {
        sampleCustomer = new Customer();
        sampleCustomer.setId(1L);
        sampleCustomer.setFullName("Ramesh Kumar");

        sampleOrder = new SalesOrder();
        sampleOrder.setId(101L);
        sampleOrder.setOrderNumber("SO-00101");
        sampleOrder.setCustomer(sampleCustomer);
        sampleOrder.setTotalAmount(new BigDecimal("300000.00"));
        sampleOrder.setAdvanceRequired(new BigDecimal("60000.00"));
        sampleOrder.setTotalPaid(BigDecimal.ZERO);
        sampleOrder.setRemainingBalance(new BigDecimal("300000.00"));
        sampleOrder.setStatus(OrderStatus.PENDING_PAYMENT);
    }

    @Test
    void testRecordPayment_Success_AdvancePaymentConfirmsOrder() {
        PaymentRecordRequest request = new PaymentRecordRequest();
        request.setSalesOrderId(101L);
        request.setAmount(new BigDecimal("60000.00"));
        request.setMethod(PaymentMethod.BANK_TRANSFER);
        request.setType(PaymentType.ADVANCE);
        request.setReferenceNumber("UTR12345678");

        when(salesOrderRepository.findById(101L)).thenReturn(Optional.of(sampleOrder));
        when(paymentRepository.existsByReferenceNumberAndStatus("UTR12345678", PaymentStatus.SUCCESS)).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            p.setId(1L);
            p.setPaymentNumber("REC-00001");
            return p;
        });
        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment payment = paymentService.recordPayment(request);

        assertNotNull(payment);
        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        assertEquals(0, new BigDecimal("60000.00").compareTo(sampleOrder.getTotalPaid()));
        assertEquals(0, new BigDecimal("240000.00").compareTo(sampleOrder.getRemainingBalance()));
        assertEquals(OrderStatus.CONFIRMED, sampleOrder.getStatus());
        verify(paymentRepository, atLeastOnce()).save(any(Payment.class));
        verify(salesOrderRepository).save(sampleOrder);
    }

    @Test
    void testRecordPayment_DuplicateReference_ThrowsException() {
        PaymentRecordRequest request = new PaymentRecordRequest();
        request.setSalesOrderId(101L);
        request.setAmount(new BigDecimal("50000.00"));
        request.setMethod(PaymentMethod.UPI);
        request.setType(PaymentType.PROGRESS);
        request.setReferenceNumber("DUPLICATE_REF_01");

        when(salesOrderRepository.findById(101L)).thenReturn(Optional.of(sampleOrder));
        when(paymentRepository.existsByReferenceNumberAndStatus("DUPLICATE_REF_01", PaymentStatus.SUCCESS)).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> paymentService.recordPayment(request));
        assertTrue(ex.getMessage().contains("Duplicate transaction error"));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void testRecordPayment_Overpayment_ThrowsException() {
        PaymentRecordRequest request = new PaymentRecordRequest();
        request.setSalesOrderId(101L);
        request.setAmount(new BigDecimal("350000.00")); // Order is only 300,000
        request.setMethod(PaymentMethod.BANK_TRANSFER);
        request.setType(PaymentType.FULL);
        request.setReferenceNumber("UTR999999");

        when(salesOrderRepository.findById(101L)).thenReturn(Optional.of(sampleOrder));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> paymentService.recordPayment(request));
        assertTrue(ex.getMessage().contains("Overpayment error"));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void testReversePayment_Success_RestoresBalanceAndMarksReversed() {
        Payment payment = new Payment();
        payment.setId(50L);
        payment.setPaymentNumber("REC-00050");
        payment.setSalesOrder(sampleOrder);
        payment.setCustomer(sampleCustomer);
        payment.setAmount(new BigDecimal("50000.00"));
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaymentDate(LocalDate.now());

        sampleOrder.setTotalPaid(new BigDecimal("50000.00"));
        sampleOrder.setRemainingBalance(new BigDecimal("250000.00"));
        sampleOrder.setStatus(OrderStatus.CONFIRMED);

        Invoice invoice = new Invoice();
        invoice.setId(201L);
        invoice.setSalesOrder(sampleOrder);
        invoice.setTotalAmount(new BigDecimal("300000.00"));
        invoice.setPaidAmount(new BigDecimal("50000.00"));
        invoice.setBalanceAmount(new BigDecimal("250000.00"));
        invoice.setStatus("PARTIALLY_PAID");

        when(paymentRepository.findById(50L)).thenReturn(Optional.of(payment));
        when(invoiceRepository.findBySalesOrderId(101L)).thenReturn(Optional.of(invoice));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment reversed = paymentService.reversePayment(50L, "Customer cheque bounced by bank", "Finance Admin");

        assertNotNull(reversed);
        assertEquals(PaymentStatus.REVERSED, reversed.getStatus());
        assertEquals("Customer cheque bounced by bank", reversed.getReversalReason());
        assertEquals("Finance Admin", reversed.getReversedBy());
        assertNotNull(reversed.getReversedAt());

        // Order balance restored
        assertEquals(0, BigDecimal.ZERO.compareTo(sampleOrder.getTotalPaid()));
        assertEquals(0, new BigDecimal("300000.00").compareTo(sampleOrder.getRemainingBalance()));
        assertEquals(OrderStatus.PENDING_PAYMENT, sampleOrder.getStatus());

        // Invoice balance restored
        assertEquals(0, BigDecimal.ZERO.compareTo(invoice.getPaidAmount()));
        assertEquals(0, new BigDecimal("300000.00").compareTo(invoice.getBalanceAmount()));
        assertEquals("ISSUED", invoice.getStatus());

        verify(salesOrderRepository).save(sampleOrder);
        verify(invoiceRepository).save(invoice);
    }
}
