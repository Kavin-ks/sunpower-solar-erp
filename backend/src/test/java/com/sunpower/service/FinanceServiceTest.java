package com.sunpower.service;

import com.sunpower.dto.FinanceDTOs.*;
import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.ExpenseCategory;
import com.sunpower.entity.enums.Enums.ExpenseStatus;
import com.sunpower.entity.enums.Enums.SubsidyStatus;
import com.sunpower.entity.enums.Enums.SystemType;
import com.sunpower.entity.enums.Enums.TechnicianPayoutStatus;
import com.sunpower.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FinanceServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private SalesOrderRepository salesOrderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private SubsidyApplicationRepository subsidyApplicationRepository;

    @Mock
    private TechnicianPaymentRepository technicianPaymentRepository;

    @Mock
    private InstallationRepository installationRepository;

    @Mock
    private TechnicianRepository technicianRepository;

    @Mock
    private ServiceTicketRepository serviceTicketRepository;

    @Mock
    private PurchaseRepository purchaseRepository;

    @Mock
    private SupplierPaymentRepository supplierPaymentRepository;


    @InjectMocks
    private FinanceService financeService;

    private Customer sampleCustomer;
    private SalesOrder sampleOrder;

    @BeforeEach
    void setUp() {
        sampleCustomer = new Customer();
        sampleCustomer.setId(1L);
        sampleCustomer.setFullName("Karthik Raja");

        sampleOrder = new SalesOrder();
        sampleOrder.setId(201L);
        sampleOrder.setOrderNumber("SO-00201");
        sampleOrder.setCustomer(sampleCustomer);
        sampleOrder.setCapacityKw(new BigDecimal("5.0"));
        sampleOrder.setSystemType(SystemType.ON_GRID);
        sampleOrder.setTotalAmount(new BigDecimal("315000.00")); // Invoiced total incl. GST
        sampleOrder.setTotalPaid(new BigDecimal("315000.00"));
        sampleOrder.setRemainingBalance(BigDecimal.ZERO);
    }

    @Test
    void testCreateExpense_DuplicatePrevention() {
        ExpenseCreateRequest request = new ExpenseCreateRequest();
        request.setTitle("Freight to site");
        request.setAmount(new BigDecimal("4500.00"));
        request.setCategory(ExpenseCategory.TRANSPORT);
        request.setExpenseDate(LocalDate.now());

        when(expenseRepository.existsByTitleAndAmountAndExpenseDate("Freight to site", new BigDecimal("4500.00"), LocalDate.now()))
                .thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> financeService.createExpense(request));
        assertTrue(ex.getMessage().contains("Duplicate expense error"));
        verify(expenseRepository, never()).save(any(Expense.class));
    }

    @Test
    void testCreateExpense_Success() {
        ExpenseCreateRequest request = new ExpenseCreateRequest();
        request.setTitle("Site earthing pit material");
        request.setAmount(new BigDecimal("3200.00"));
        request.setCategory(ExpenseCategory.INSTALLATION);
        request.setExpenseDate(LocalDate.now());
        request.setPaidTo("Hardware Mart");

        when(expenseRepository.existsByTitleAndAmountAndExpenseDate(any(), any(), any())).thenReturn(false);
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> {
            Expense e = inv.getArgument(0);
            e.setId(10L);
            return e;
        });

        Expense saved = financeService.createExpense(request);
        assertNotNull(saved);
        assertEquals(0, new BigDecimal("3200.00").compareTo(saved.getAmount()));
        assertEquals("Site earthing pit material", saved.getTitle());
    }

    @Test
    void testCancelInvoice_Success() {
        Invoice invoice = new Invoice();
        invoice.setId(11L);
        invoice.setInvoiceNumber("INV-00011");
        invoice.setStatus("ISSUED");

        when(invoiceRepository.findById(11L)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));

        Invoice cancelled = financeService.cancelInvoice(11L, "Customer requested order restructure", "Lead Accountant");

        assertNotNull(cancelled);
        assertEquals("CANCELLED", cancelled.getStatus());
        assertEquals("Customer requested order restructure", cancelled.getCancellationReason());
        assertEquals("Lead Accountant", cancelled.getCancelledBy());
        assertNotNull(cancelled.getCancelledAt());
    }

    @Test
    void testRecordTechnicianPayout_CalculatesHoursAndStatus() {
        Technician tech = new Technician();
        tech.setId(5L);
        tech.setName("Praveen Kumar");

        TechnicianPayoutRequest request = new TechnicianPayoutRequest();
        request.setTechnicianId(5L);
        request.setHoursCounted(new BigDecimal("10.0"));
        request.setApplicableRate(new BigDecimal("250.00")); // Calculated = 2500
        request.setAmountPaid(new BigDecimal("2000.00")); // Paid 2000, 500 remaining

        when(technicianRepository.findById(5L)).thenReturn(Optional.of(tech));
        when(technicianPaymentRepository.save(any(TechnicianPayment.class))).thenAnswer(inv -> {
            TechnicianPayment tp = inv.getArgument(0);
            tp.setId(99L);
            return tp;
        });

        TechnicianPayment result = financeService.recordTechnicianPayout(request);

        assertNotNull(result);
        assertEquals(0, new BigDecimal("2500.00").compareTo(result.getCalculatedAmount()));
        assertEquals(0, new BigDecimal("2000.00").compareTo(result.getAmountPaid()));
        assertEquals(0, new BigDecimal("500.00").compareTo(result.getRemainingAmount()));
        assertEquals(TechnicianPayoutStatus.PARTIALLY_PAID, result.getStatus());
    }

    @Test
    void testUpdateSubsidyStatus_RecalculatesPendingAmount() {
        SubsidyApplication sub = new SubsidyApplication();
        sub.setId(7L);
        sub.setApplicationNumber("SUB-00007");
        sub.setSubsidyAmountClaimed(new BigDecimal("78000.00"));
        sub.setStatus(SubsidyStatus.SUBMITTED);

        SubsidyUpdateRequest request = new SubsidyUpdateRequest();
        request.setStatus(SubsidyStatus.APPROVED);
        request.setNationalPortalRegNumber("TN-SURYA-9988");
        request.setSubsidyAmountApproved(new BigDecimal("78000.00"));
        request.setSanctionDate(LocalDate.now());
        request.setAmountReceived(new BigDecimal("30000.00"));

        when(subsidyApplicationRepository.findById(7L)).thenReturn(Optional.of(sub));
        when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenAnswer(inv -> inv.getArgument(0));

        SubsidyApplication updated = financeService.updateSubsidyStatus(7L, request);

        assertNotNull(updated);
        assertEquals(SubsidyStatus.APPROVED, updated.getStatus());
        assertEquals("TN-SURYA-9988", updated.getNationalPortalRegNumber());
        assertEquals(0, new BigDecimal("78000.00").compareTo(updated.getSubsidyAmountApproved()));
        assertEquals(0, new BigDecimal("30000.00").compareTo(updated.getAmountReceived()));
        assertEquals(0, new BigDecimal("48000.00").compareTo(updated.getPendingSubsidyAmount()));
    }

    @Test
    void testCalculateJobProfitability_AccountingRevenueExcludesGST() {
        // Order Total = 315,000 (Subtotal = 300,000, GST 5% = 15,000)
        Quotation quote = new Quotation();
        quote.setSubtotal(new BigDecimal("300000.00"));
        quote.setTaxAmount(new BigDecimal("15000.00"));
        sampleOrder.setQuotation(quote);

        when(salesOrderRepository.findAll()).thenReturn(Collections.singletonList(sampleOrder));
        when(installationRepository.findBySalesOrderId(201L)).thenReturn(Optional.empty());
        when(expenseRepository.findBySalesOrderId(201L)).thenReturn(Collections.emptyList());

        var list = financeService.calculateAllJobProfitability();

        assertNotNull(list);
        assertEquals(1, list.size());
        var job = list.get(0);
        assertEquals("SO-00201", job.getOrderNumber());
        // Recognized Revenue must equal subtotal (excluding GST), NOT the gross 315,000
        assertEquals(0, new BigDecimal("300000.00").compareTo(job.getRecognizedRevenue()));
        assertEquals(0, new BigDecimal("15000.00").compareTo(job.getTaxAmount()));
        assertEquals(0, new BigDecimal("315000.00").compareTo(job.getOrderAmount()));
    }

    @Test
    void testApproveExpense_Success() {
        Expense exp = new Expense();
        exp.setId(15L);
        exp.setTitle("Crane rental");
        exp.setAmount(new BigDecimal("12000.00"));
        exp.setStatus(ExpenseStatus.PENDING);

        when(expenseRepository.findById(15L)).thenReturn(Optional.of(exp));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> inv.getArgument(0));

        Expense approved = financeService.approveExpense(15L, "Finance Manager");

        assertNotNull(approved);
        assertEquals(ExpenseStatus.APPROVED, approved.getStatus());
        assertEquals("Finance Manager", approved.getApprovedBy());
        assertNotNull(approved.getApprovedAt());
    }

    @Test
    void testRejectExpense_Success() {
        Expense exp = new Expense();
        exp.setId(16L);
        exp.setTitle("Unverified travel bill");
        exp.setStatus(ExpenseStatus.PENDING);

        when(expenseRepository.findById(16L)).thenReturn(Optional.of(exp));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> inv.getArgument(0));

        Expense rejected = financeService.rejectExpense(16L, "No valid GST invoice attached", "Auditor");

        assertNotNull(rejected);
        assertEquals(ExpenseStatus.REJECTED, rejected.getStatus());
        assertEquals("No valid GST invoice attached", rejected.getRejectionReason());
        assertEquals("Auditor", rejected.getApprovedBy());
    }

    @Test
    void testRecordSupplierPayment_Success() {
        Purchase purchase = new Purchase();
        purchase.setId(88L);
        purchase.setSupplierName("Tata Power Solar Panels");
        purchase.setTotalAmount(new BigDecimal("150000.00"));
        purchase.setPaidAmount(new BigDecimal("50000.00"));
        purchase.setRemainingBalance(new BigDecimal("100000.00"));

        SupplierPaymentRequest request = new SupplierPaymentRequest();
        request.setPurchaseId(88L);
        request.setAmount(new BigDecimal("60000.00"));
        request.setPaymentMethod("Bank Transfer");
        request.setReferenceNumber("UTR-TATA-8877");

        when(purchaseRepository.findById(88L)).thenReturn(Optional.of(purchase));
        when(supplierPaymentRepository.existsByReferenceNumberAndStatus("UTR-TATA-8877", "SUCCESS")).thenReturn(false);
        when(supplierPaymentRepository.save(any(SupplierPayment.class))).thenAnswer(inv -> {
            SupplierPayment sp = inv.getArgument(0);
            sp.setId(1L);
            return sp;
        });

        SupplierPayment sp = financeService.recordSupplierPayment(request);

        assertNotNull(sp);
        assertEquals(0, new BigDecimal("60000.00").compareTo(sp.getAmount()));
        assertEquals(0, new BigDecimal("110000.00").compareTo(purchase.getPaidAmount()));
        assertEquals(0, new BigDecimal("40000.00").compareTo(purchase.getRemainingBalance()));
        assertEquals("PARTIALLY_PAID", purchase.getPaymentStatus());
    }

    @Test
    void testRecordSupplierPayment_Overpayment_ThrowsException() {
        Purchase purchase = new Purchase();
        purchase.setId(89L);
        purchase.setRemainingBalance(new BigDecimal("25000.00"));

        SupplierPaymentRequest request = new SupplierPaymentRequest();
        request.setPurchaseId(89L);
        request.setAmount(new BigDecimal("30000.00"));

        when(purchaseRepository.findById(89L)).thenReturn(Optional.of(purchase));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> financeService.recordSupplierPayment(request));
        assertTrue(ex.getMessage().contains("exceeds remaining balance"));
        verify(supplierPaymentRepository, never()).save(any(SupplierPayment.class));
    }

    @Test
    void testRecordSupplierPayment_DuplicateReference_ThrowsException() {
        Purchase purchase = new Purchase();
        purchase.setId(90L);
        purchase.setRemainingBalance(new BigDecimal("50000.00"));

        SupplierPaymentRequest request = new SupplierPaymentRequest();
        request.setPurchaseId(90L);
        request.setAmount(new BigDecimal("10000.00"));
        request.setReferenceNumber("UTR-DUP-1234");

        when(purchaseRepository.findById(90L)).thenReturn(Optional.of(purchase));
        when(supplierPaymentRepository.existsByReferenceNumberAndStatus("UTR-DUP-1234", "SUCCESS")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> financeService.recordSupplierPayment(request));
        assertTrue(ex.getMessage().contains("Duplicate reference error"));
        verify(supplierPaymentRepository, never()).save(any(SupplierPayment.class));
    }

    @Test
    void testGenerateGstReport_AccurateCalculations() {
        when(invoiceRepository.sumTotalCgst()).thenReturn(new BigDecimal("18000.00"));
        when(invoiceRepository.sumTotalSgst()).thenReturn(new BigDecimal("18000.00"));
        when(invoiceRepository.sumTotalIgst()).thenReturn(BigDecimal.ZERO);
        when(invoiceRepository.sumTotalOutputTax()).thenReturn(new BigDecimal("36000.00"));
        when(purchaseRepository.sumTotalPurchases()).thenReturn(new BigDecimal("118000.00"));

        GstReportDTO gst = financeService.getGstReport("THIS_MONTH");

        assertNotNull(gst);
        assertEquals(0, new BigDecimal("18000.00").compareTo(gst.getOutputCgst()));
        assertEquals(0, new BigDecimal("18000.00").compareTo(gst.getOutputSgst()));
        assertEquals(0, new BigDecimal("36000.00").compareTo(gst.getTotalOutputGst()));
        assertEquals(0, new BigDecimal("18000.00").compareTo(gst.getInputGst()));
        assertEquals(0, new BigDecimal("18000.00").compareTo(gst.getNetGstPayable()));
    }
}
