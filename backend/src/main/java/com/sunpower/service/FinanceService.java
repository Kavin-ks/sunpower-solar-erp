package com.sunpower.service;

import com.sunpower.dto.FinanceDTOs.ExpenseCreateRequest;
import com.sunpower.dto.FinanceDTOs.JobProfitabilityDTO;
import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.SubsidyStatus;
import com.sunpower.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class FinanceService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private SubsidyApplicationRepository subsidyApplicationRepository;

    @Autowired
    private TechnicianPaymentRepository technicianPaymentRepository;

    @Autowired
    private InstallationRepository installationRepository;

    @Autowired
    private ServiceTicketRepository serviceTicketRepository;

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + id));
    }

    public List<SubsidyApplication> getAllSubsidies() {
        return subsidyApplicationRepository.findAll();
    }

    public List<TechnicianPayment> getAllTechnicianPayments() {
        return technicianPaymentRepository.findAll();
    }

    @Transactional
    public Expense createExpense(ExpenseCreateRequest request) {
        Expense expense = new Expense();
        expense.setCategory(request.getCategory());
        expense.setAmount(request.getAmount());
        expense.setExpenseDate(request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now());
        expense.setTitle(request.getTitle());
        expense.setDescription(request.getDescription());
        expense.setPaidTo(request.getPaidTo());
        expense.setPaymentMethod(request.getPaymentMethod());

        if (request.getSalesOrderId() != null) {
            SalesOrder order = salesOrderRepository.findById(request.getSalesOrderId()).orElse(null);
            expense.setSalesOrder(order);
        }

        expense = expenseRepository.save(expense);
        if (expense.getExpenseNumber() == null) {
            expense.setExpenseNumber("EXP-" + String.format("%05d", expense.getId()));
            expense = expenseRepository.save(expense);
        }

        return expense;
    }

    @Transactional
    public SubsidyApplication updateSubsidyStatus(Long id, SubsidyStatus status, String notes, String regNumber, BigDecimal approvedAmount) {
        SubsidyApplication sub = subsidyApplicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subsidy application not found with id: " + id));

        sub.setStatus(status);
        if (notes != null) sub.setNotes(notes);
        if (regNumber != null) sub.setNationalPortalRegNumber(regNumber);
        if (approvedAmount != null) sub.setSubsidyAmountApproved(approvedAmount);

        if (status == SubsidyStatus.SUBMITTED && sub.getSubmissionDate() == null) {
            sub.setSubmissionDate(LocalDate.now());
        } else if (status == SubsidyStatus.APPROVED && sub.getApprovalDate() == null) {
            sub.setApprovalDate(LocalDate.now());
        }

        return subsidyApplicationRepository.save(sub);
    }

    public List<JobProfitabilityDTO> calculateAllJobProfitability() {
        List<SalesOrder> orders = salesOrderRepository.findAll();
        List<JobProfitabilityDTO> list = new ArrayList<>();

        for (SalesOrder order : orders) {
            list.add(calculateJobProfitability(order));
        }

        return list;
    }

    public JobProfitabilityDTO calculateJobProfitability(SalesOrder order) {
        JobProfitabilityDTO dto = new JobProfitabilityDTO();
        dto.setOrderId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setCustomerName(order.getCustomer().getFullName());
        dto.setSystemType(order.getSystemType().name());
        dto.setCapacityKw(order.getCapacityKw());
        dto.setOrderAmount(order.getTotalAmount());

        // Cash received
        BigDecimal revenue = order.getTotalPaid() != null ? order.getTotalPaid() : BigDecimal.ZERO;
        dto.setRevenueReceived(revenue);
        dto.setOutstandingBalance(order.getRemainingBalance());

        // Hardware cost (sum of BOM item purchase prices)
        BigDecimal hardwareCost = BigDecimal.ZERO;
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                BigDecimal itemCost = item.getProduct().getPurchasePrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                hardwareCost = hardwareCost.add(itemCost);
            }
        }
        dto.setHardwareCost(hardwareCost);

        // Sum installation technicians payout amount
        BigDecimal technicianCost = BigDecimal.ZERO;
        java.util.Optional<Installation> instOpt = installationRepository.findBySalesOrderId(order.getId());
        if (instOpt.isPresent() && instOpt.get().getAssignedTechnicians() != null) {
            for (InstallationTechnician it : instOpt.get().getAssignedTechnicians()) {
                if (it.getPayoutAmount() != null) {
                    technicianCost = technicianCost.add(it.getPayoutAmount());
                }
            }
        }

        // Recorded expenses for this job
        List<Expense> jobExpenses = expenseRepository.findBySalesOrderId(order.getId());
        BigDecimal otherExpenses = BigDecimal.ZERO;

        for (Expense exp : jobExpenses) {
            if (exp.getCategory() == com.sunpower.entity.enums.Enums.ExpenseCategory.TECHNICIAN_PAYOUT) {
                if (technicianCost.compareTo(BigDecimal.ZERO) == 0) {
                    technicianCost = technicianCost.add(exp.getAmount());
                }
            } else {
                otherExpenses = otherExpenses.add(exp.getAmount());
            }
        }

        // If no technician expense was recorded, calculate estimated installation labor (₹3,500 per kW)
        if (technicianCost.compareTo(BigDecimal.ZERO) == 0 && order.getStatus() != com.sunpower.entity.enums.Enums.OrderStatus.PENDING_PAYMENT) {
            technicianCost = BigDecimal.valueOf(3500.00).multiply(order.getCapacityKw());
        }

        dto.setTechnicianCost(technicianCost);
        dto.setRecordedExpenses(otherExpenses);

        BigDecimal totalCost = hardwareCost.add(technicianCost).add(otherExpenses);
        dto.setTotalCost(totalCost);

        // Net Realized Profit = Revenue Received - Total Cost
        BigDecimal profit = revenue.subtract(totalCost);
        dto.setNetProfit(profit);

        // Net Profit Margin % = (Net Realized Profit / Revenue Received) * 100
        if (revenue.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal margin = profit.multiply(BigDecimal.valueOf(100)).divide(revenue, 2, RoundingMode.HALF_UP);
            dto.setProfitMarginPercentage(margin);
        } else if (order.getTotalAmount() != null && order.getTotalAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal orderProfit = order.getTotalAmount().subtract(totalCost);
            BigDecimal margin = orderProfit.multiply(BigDecimal.valueOf(100)).divide(order.getTotalAmount(), 2, RoundingMode.HALF_UP);
            dto.setProfitMarginPercentage(margin);
        } else {
            dto.setProfitMarginPercentage(BigDecimal.ZERO);
        }

        // Subsidy Application status
        subsidyApplicationRepository.findBySalesOrderId(order.getId()).ifPresentOrElse(
                sub -> dto.setSubsidyStatus(sub.getStatus() != null ? sub.getStatus().name() : "PENDING"),
                () -> dto.setSubsidyStatus("NOT_APPLIED")
        );

        // Open Service Tickets count
        if (order.getCustomer() != null && order.getCustomer().getId() != null) {
            long openCount = serviceTicketRepository.findByCustomerId(order.getCustomer().getId()).stream()
                    .filter(t -> t.getStatus() != com.sunpower.entity.enums.Enums.TicketStatus.CLOSED)
                    .count();
            dto.setOpenServiceTicketsCount(openCount);
        } else {
            dto.setOpenServiceTicketsCount(0);
        }

        return dto;
    }

    public byte[] generateJobProfitabilityCsv() {
        List<JobProfitabilityDTO> jobs = calculateAllJobProfitability();
        StringBuilder csv = new StringBuilder();
        csv.append("Order #,Customer,System Type,Capacity (kW),Order Amount (INR),Revenue Received (INR),Hardware BOM Cost (INR),Technician Cost (INR),Direct Expenses (INR),Total Cost (INR),Net Realized Profit (INR),Net Margin (%),Balance Due (INR)\n");

        for (JobProfitabilityDTO job : jobs) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f\n",
                    job.getOrderNumber() != null ? job.getOrderNumber() : "N/A",
                    job.getCustomerName() != null ? job.getCustomerName().replace("\"", "\"\"") : "N/A",
                    job.getSystemType() != null ? job.getSystemType() : "ON_GRID",
                    job.getCapacityKw() != null ? job.getCapacityKw() : BigDecimal.ZERO,
                    job.getOrderAmount() != null ? job.getOrderAmount() : BigDecimal.ZERO,
                    job.getRevenueReceived() != null ? job.getRevenueReceived() : BigDecimal.ZERO,
                    job.getHardwareCost() != null ? job.getHardwareCost() : BigDecimal.ZERO,
                    job.getTechnicianCost() != null ? job.getTechnicianCost() : BigDecimal.ZERO,
                    job.getRecordedExpenses() != null ? job.getRecordedExpenses() : BigDecimal.ZERO,
                    job.getTotalCost() != null ? job.getTotalCost() : BigDecimal.ZERO,
                    job.getNetProfit() != null ? job.getNetProfit() : BigDecimal.ZERO,
                    job.getProfitMarginPercentage() != null ? job.getProfitMarginPercentage() : BigDecimal.ZERO,
                    job.getOutstandingBalance() != null ? job.getOutstandingBalance() : BigDecimal.ZERO
            ));
        }
        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    public byte[] generateInvoicesCsv() {
        List<Invoice> invoices = getAllInvoices();
        StringBuilder csv = new StringBuilder();
        csv.append("Invoice #,Invoice Date,Customer,Order #,Taxable Subtotal (INR),GST Tax (INR),Total Invoice Amount (INR),Paid Amount (INR),Balance Due (INR),Status,GSTIN\n");

        for (Invoice inv : invoices) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",%.2f,%.2f,%.2f,%.2f,%.2f,\"%s\",\"%s\"\n",
                    inv.getInvoiceNumber() != null ? inv.getInvoiceNumber() : "N/A",
                    inv.getInvoiceDate() != null ? inv.getInvoiceDate().toString() : "N/A",
                    inv.getCustomer() != null ? inv.getCustomer().getFullName().replace("\"", "\"\"") : "N/A",
                    inv.getSalesOrder() != null ? inv.getSalesOrder().getOrderNumber() : "N/A",
                    inv.getSubtotal() != null ? inv.getSubtotal() : BigDecimal.ZERO,
                    inv.getTaxAmount() != null ? inv.getTaxAmount() : BigDecimal.ZERO,
                    inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO,
                    inv.getPaidAmount() != null ? inv.getPaidAmount() : BigDecimal.ZERO,
                    inv.getBalanceAmount() != null ? inv.getBalanceAmount() : BigDecimal.ZERO,
                    inv.getStatus() != null ? inv.getStatus() : "ISSUED",
                    inv.getGstin() != null ? inv.getGstin() : "N/A"
            ));
        }
        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    public byte[] generateExpensesCsv() {
        List<Expense> expenses = getAllExpenses();
        StringBuilder csv = new StringBuilder();
        csv.append("Expense #,Date,Title,Category,Paid To,Payment Method,Linked Order #,Amount (INR),Description\n");

        for (Expense exp : expenses) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%.2f,\"%s\"\n",
                    exp.getExpenseNumber() != null ? exp.getExpenseNumber() : "N/A",
                    exp.getExpenseDate() != null ? exp.getExpenseDate().toString() : "N/A",
                    exp.getTitle() != null ? exp.getTitle().replace("\"", "\"\"") : "N/A",
                    exp.getCategory() != null ? exp.getCategory().name() : "OTHER",
                    exp.getPaidTo() != null ? exp.getPaidTo().replace("\"", "\"\"") : "N/A",
                    exp.getPaymentMethod() != null ? exp.getPaymentMethod() : "N/A",
                    exp.getSalesOrder() != null ? exp.getSalesOrder().getOrderNumber() : "General Overhead",
                    exp.getAmount() != null ? exp.getAmount() : BigDecimal.ZERO,
                    exp.getDescription() != null ? exp.getDescription().replace("\"", "\"\"") : ""
            ));
        }
        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
}
