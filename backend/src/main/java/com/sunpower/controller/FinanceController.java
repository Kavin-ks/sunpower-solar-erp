package com.sunpower.controller;

import com.sunpower.dto.FinanceDTOs.*;
import com.sunpower.entity.*;
import com.sunpower.service.FinanceService;
import com.sunpower.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/finance")
@PreAuthorize("hasAnyRole('FINANCE', 'ADMIN', 'DIRECTOR')")
public class FinanceController {

    @Autowired
    private FinanceService financeService;

    @Autowired
    private PaymentService paymentService;

    @GetMapping("/dashboard")
    public ResponseEntity<FinanceDashboardDTO> getFinanceDashboard(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(financeService.getFinanceDashboard(period, startDate, endDate));
    }

    @GetMapping("/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES', 'DIRECTOR')")
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/expenses")
    public ResponseEntity<List<Expense>> getAllExpenses() {
        return ResponseEntity.ok(financeService.getAllExpenses());
    }

    @PostMapping("/expenses")
    public ResponseEntity<Expense> createExpense(@Valid @RequestBody ExpenseCreateRequest request) {
        Expense expense = financeService.createExpense(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(expense);
    }

    @PostMapping("/expenses/{id}/approve")
    public ResponseEntity<Expense> approveExpense(
            @PathVariable Long id,
            @RequestBody(required = false) ExpenseApprovalRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Finance Lead";
        Expense expense = financeService.approveExpense(id, actor);
        return ResponseEntity.ok(expense);
    }

    @PostMapping("/expenses/{id}/reject")
    public ResponseEntity<Expense> rejectExpense(
            @PathVariable Long id,
            @RequestBody(required = false) ExpenseApprovalRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Finance Lead";
        String reason = (request != null && request.getRejectionReason() != null) ? request.getRejectionReason() : "Rejected by Finance Controller";
        Expense expense = financeService.rejectExpense(id, reason, actor);
        return ResponseEntity.ok(expense);
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES', 'DIRECTOR')")
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(financeService.getAllInvoices());
    }

    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES', 'DIRECTOR')")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(financeService.getInvoiceById(id));
    }

    @PostMapping("/invoices/generate/{orderId}")
    public ResponseEntity<Invoice> generateInvoiceForOrder(@PathVariable Long orderId) {
        Invoice invoice = financeService.generateInvoiceForOrder(orderId);
        return ResponseEntity.status(HttpStatus.CREATED).body(invoice);
    }

    @GetMapping("/subsidies")
    public ResponseEntity<List<SubsidyApplication>> getAllSubsidies() {
        return ResponseEntity.ok(financeService.getAllSubsidies());
    }

    @PatchMapping("/subsidies/{id}/status")
    public ResponseEntity<SubsidyApplication> updateSubsidyStatus(
            @PathVariable Long id,
            @Valid @RequestBody SubsidyUpdateRequest request) {
        SubsidyApplication sub = financeService.updateSubsidyStatus(id, request);
        return ResponseEntity.ok(sub);
    }

    @GetMapping("/technician-payouts")
    public ResponseEntity<List<TechnicianPayment>> getAllTechnicianPayments() {
        return ResponseEntity.ok(financeService.getAllTechnicianPayments());
    }

    @PostMapping("/technician-payouts")
    public ResponseEntity<TechnicianPayment> recordTechnicianPayout(
            @Valid @RequestBody TechnicianPayoutRequest request) {
        TechnicianPayment payout = financeService.recordTechnicianPayout(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(payout);
    }

    // --- Supplier Invoices and Payments ---

    @GetMapping("/suppliers/purchases")
    public ResponseEntity<List<Purchase>> getAllSupplierPurchases() {
        return ResponseEntity.ok(financeService.getAllSupplierPurchases());
    }

    @GetMapping("/suppliers/payments")
    public ResponseEntity<List<SupplierPayment>> getAllSupplierPayments() {
        return ResponseEntity.ok(financeService.getAllSupplierPayments());
    }

    @PostMapping("/suppliers/payments")
    public ResponseEntity<SupplierPayment> recordSupplierPayment(@Valid @RequestBody SupplierPaymentRequest request) {
        SupplierPayment payment = financeService.recordSupplierPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
    }

    // --- Financial Reports ---

    @GetMapping("/reports/profit-and-loss")
    public ResponseEntity<ProfitAndLossReportDTO> getProfitAndLossReport(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") String period) {
        return ResponseEntity.ok(financeService.getProfitAndLossReport(period));
    }

    @GetMapping("/reports/cash-flow")
    public ResponseEntity<CashFlowReportDTO> getCashFlowReport(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") String period) {
        return ResponseEntity.ok(financeService.getCashFlowReport(period));
    }

    @GetMapping("/reports/gst")
    public ResponseEntity<GstReportDTO> getGstReport(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") String period) {
        return ResponseEntity.ok(financeService.getGstReport(period));
    }

    @GetMapping("/job-profitability")
    public ResponseEntity<List<JobProfitabilityDTO>> getJobProfitability() {
        return ResponseEntity.ok(financeService.calculateAllJobProfitability());
    }

    // --- CSV Exports ---

    @GetMapping("/export/job-profitability")
    public ResponseEntity<byte[]> exportJobProfitabilityCsv() {
        byte[] csvBytes = financeService.generateJobProfitabilityCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=SunPower_Job_Profitability.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }

    @GetMapping("/export/invoices")
    public ResponseEntity<byte[]> exportInvoicesCsv() {
        byte[] csvBytes = financeService.generateInvoicesCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=SunPower_Invoices.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }

    @GetMapping("/export/expenses")
    public ResponseEntity<byte[]> exportExpensesCsv() {
        byte[] csvBytes = financeService.generateExpensesCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=SunPower_Expenses.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }

    @GetMapping("/export/suppliers")
    public ResponseEntity<byte[]> exportSupplierPurchasesCsv() {
        byte[] csvBytes = financeService.generateSupplierPurchasesCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=SunPower_Supplier_Purchases.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }
}
