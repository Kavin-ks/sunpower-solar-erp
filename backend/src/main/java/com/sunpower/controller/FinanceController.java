package com.sunpower.controller;

import com.sunpower.dto.FinanceDTOs.ExpenseCreateRequest;
import com.sunpower.dto.FinanceDTOs.JobProfitabilityDTO;
import com.sunpower.entity.Expense;
import com.sunpower.entity.Invoice;
import com.sunpower.entity.SubsidyApplication;
import com.sunpower.entity.enums.Enums.SubsidyStatus;
import com.sunpower.service.FinanceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    @Autowired
    private FinanceService financeService;

    @GetMapping("/expenses")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'DIRECTOR')")
    public ResponseEntity<List<Expense>> getAllExpenses() {
        return ResponseEntity.ok(financeService.getAllExpenses());
    }

    @PostMapping("/expenses")
    @PreAuthorize("hasAnyRole('FINANCE', 'DIRECTOR')")
    public ResponseEntity<Expense> createExpense(@Valid @RequestBody ExpenseCreateRequest request) {
        Expense expense = financeService.createExpense(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(expense);
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

    @GetMapping("/subsidies")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'DIRECTOR')")
    public ResponseEntity<List<SubsidyApplication>> getAllSubsidies() {
        return ResponseEntity.ok(financeService.getAllSubsidies());
    }

    @PatchMapping("/subsidies/{id}/status")
    @PreAuthorize("hasAnyRole('FINANCE', 'DIRECTOR')")
    public ResponseEntity<SubsidyApplication> updateSubsidyStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        SubsidyStatus status = SubsidyStatus.valueOf(payload.get("status").toString());
        String notes = payload.get("notes") != null ? payload.get("notes").toString() : null;
        String regNumber = payload.get("nationalPortalRegNumber") != null ? payload.get("nationalPortalRegNumber").toString() : null;
        BigDecimal approvedAmount = payload.get("subsidyAmountApproved") != null ?
                new BigDecimal(payload.get("subsidyAmountApproved").toString()) : null;

        SubsidyApplication sub = financeService.updateSubsidyStatus(id, status, notes, regNumber, approvedAmount);
        return ResponseEntity.ok(sub);
    }

    @GetMapping("/job-profitability")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'DIRECTOR')")
    public ResponseEntity<List<JobProfitabilityDTO>> getJobProfitability() {
        return ResponseEntity.ok(financeService.calculateAllJobProfitability());
    }

    @GetMapping("/export/job-profitability")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'DIRECTOR')")
    public ResponseEntity<byte[]> exportJobProfitabilityCsv() {
        byte[] csvBytes = financeService.generateJobProfitabilityCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=SunPower_Job_Profitability.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }

    @GetMapping("/export/invoices")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'DIRECTOR')")
    public ResponseEntity<byte[]> exportInvoicesCsv() {
        byte[] csvBytes = financeService.generateInvoicesCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=SunPower_Invoices.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }

    @GetMapping("/export/expenses")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'DIRECTOR')")
    public ResponseEntity<byte[]> exportExpensesCsv() {
        byte[] csvBytes = financeService.generateExpensesCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=SunPower_Expenses.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }
}
