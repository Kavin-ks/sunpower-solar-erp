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
    public ResponseEntity<List<Expense>> getAllExpenses() {
        return ResponseEntity.ok(financeService.getAllExpenses());
    }

    @PostMapping("/expenses")
    public ResponseEntity<Expense> createExpense(@Valid @RequestBody ExpenseCreateRequest request) {
        Expense expense = financeService.createExpense(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(expense);
    }

    @GetMapping("/invoices")
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(financeService.getAllInvoices());
    }

    @GetMapping("/invoices/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(financeService.getInvoiceById(id));
    }

    @GetMapping("/subsidies")
    public ResponseEntity<List<SubsidyApplication>> getAllSubsidies() {
        return ResponseEntity.ok(financeService.getAllSubsidies());
    }

    @PatchMapping("/subsidies/{id}/status")
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
    public ResponseEntity<List<JobProfitabilityDTO>> getJobProfitability() {
        return ResponseEntity.ok(financeService.calculateAllJobProfitability());
    }
}
