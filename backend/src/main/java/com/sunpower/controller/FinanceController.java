package com.sunpower.controller;

import com.sunpower.dto.FinanceDTOs.*;
import com.sunpower.entity.Expense;
import com.sunpower.entity.Invoice;
import com.sunpower.entity.SubsidyApplication;
import com.sunpower.entity.TechnicianPayment;
import com.sunpower.service.FinanceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/finance")
@PreAuthorize("hasAnyRole('FINANCE', 'ADMIN')")
public class FinanceController {

    @Autowired
    private FinanceService financeService;

    @GetMapping("/dashboard")
    public ResponseEntity<FinanceDashboardDTO> getFinanceDashboard(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(financeService.getFinanceDashboard(period, startDate, endDate));
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

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(financeService.getAllInvoices());
    }

    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(financeService.getInvoiceById(id));
    }

    @PostMapping("/invoices/{id}/cancel")
    public ResponseEntity<Invoice> cancelInvoice(
            @PathVariable Long id,
            @Valid @RequestBody InvoiceCancelRequest request) {
        Invoice invoice = financeService.cancelInvoice(id, request.getReason(), request.getCancelledBy());
        return ResponseEntity.ok(invoice);
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

    @GetMapping("/job-profitability")
    public ResponseEntity<List<JobProfitabilityDTO>> getJobProfitability() {
        return ResponseEntity.ok(financeService.calculateAllJobProfitability());
    }
}
