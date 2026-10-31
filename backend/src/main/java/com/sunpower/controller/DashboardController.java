package com.sunpower.controller;

import com.sunpower.dto.DashboardDTOs.*;
import com.sunpower.dto.FinanceDTOs.JobProfitabilityDTO;
import com.sunpower.service.DashboardService;
import com.sunpower.service.FinanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private FinanceService financeService;

    @GetMapping
    public ResponseEntity<DashboardSummaryDTO> getDashboardMetrics(@RequestParam(defaultValue = "all") String period) {
        return ResponseEntity.ok(dashboardService.getDashboardMetrics(period));
    }

    @GetMapping("/admin")
    public ResponseEntity<AdminDashboardDTO> getAdminDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }

    @GetMapping("/sales")
    public ResponseEntity<SalesDashboardDTO> getSalesDashboard() {
        return ResponseEntity.ok(dashboardService.getSalesDashboard());
    }

    @GetMapping("/warehouse")
    public ResponseEntity<WarehouseDashboardDTO> getWarehouseDashboard() {
        return ResponseEntity.ok(dashboardService.getWarehouseDashboard());
    }

    @GetMapping("/technician")
    public ResponseEntity<TechnicianDashboardDTO> getTechnicianDashboard(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(dashboardService.getTechnicianDashboard(username));
    }

    @GetMapping("/support")
    public ResponseEntity<SupportDashboardDTO> getSupportDashboard() {
        return ResponseEntity.ok(dashboardService.getSupportDashboard());
    }

    @GetMapping("/finance")
    public ResponseEntity<FinanceDashboardDTO> getFinanceDashboard() {
        return ResponseEntity.ok(dashboardService.getFinanceDashboard());
    }

    @GetMapping("/job-profitability")
    public ResponseEntity<List<JobProfitabilityDTO>> getJobProfitability() {
        return ResponseEntity.ok(financeService.calculateAllJobProfitability());
    }

    @GetMapping("/export-profitability-csv")
    public ResponseEntity<byte[]> exportProfitabilityCsv() {
        List<JobProfitabilityDTO> jobs = financeService.calculateAllJobProfitability();

        StringBuilder csv = new StringBuilder();
        csv.append("Order Number,Customer,System Type,Capacity (kW),Order Amount (INR),Revenue Received (INR),Hardware Cost (INR),Technician Cost (INR),Other Expenses (INR),Total Cost (INR),Net Profit (INR),Margin (%),Outstanding Balance (INR)\n");

        for (JobProfitabilityDTO job : jobs) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f\n",
                    job.getOrderNumber(),
                    job.getCustomerName(),
                    job.getSystemType(),
                    job.getCapacityKw(),
                    job.getOrderAmount(),
                    job.getRevenueReceived(),
                    job.getHardwareCost(),
                    job.getTechnicianCost(),
                    job.getRecordedExpenses(),
                    job.getTotalCost(),
                    job.getNetProfit(),
                    job.getProfitMarginPercentage(),
                    job.getOutstandingBalance()
            ));
        }

        byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=SunPower_Job_Profitability_Report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }
}
