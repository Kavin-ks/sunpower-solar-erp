package com.sunpower.service;

import com.sunpower.dto.FinanceDTOs.*;
import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.ExpenseCategory;
import com.sunpower.entity.enums.Enums.ExpenseStatus;
import com.sunpower.entity.enums.Enums.SubsidyStatus;
import com.sunpower.entity.enums.Enums.TechnicianPayoutStatus;
import com.sunpower.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

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
    private TechnicianRepository technicianRepository;

    @Autowired
    private ServiceTicketRepository serviceTicketRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private SupplierPaymentRepository supplierPaymentRepository;

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAllByOrderByExpenseDateDesc();
    }

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAllByOrderByInvoiceDateDesc();
    }

    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + id));
    }

    public List<SubsidyApplication> getAllSubsidies() {
        return subsidyApplicationRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<TechnicianPayment> getAllTechnicianPayments() {
        return technicianPaymentRepository.findAllByOrderByPaymentDateDesc();
    }

    public List<Purchase> getAllSupplierPurchases() {
        return purchaseRepository.findAllByOrderByPurchaseDateDesc();
    }

    public List<SupplierPayment> getAllSupplierPayments() {
        return supplierPaymentRepository.findAll(Sort.by(Sort.Direction.DESC, "paymentDate"));
    }

    @Transactional
    public Expense createExpense(ExpenseCreateRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Expense amount must be strictly greater than zero.");
        }

        LocalDate expDate = request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now();

        // Duplicate Expense Prevention: reject identical title, amount, and date
        if (expenseRepository.existsByTitleAndAmountAndExpenseDate(request.getTitle().trim(), request.getAmount(), expDate)) {
            throw new IllegalArgumentException("Duplicate expense error: An expense titled '" + request.getTitle() +
                    "' for ₹" + request.getAmount() + " on date " + expDate + " has already been recorded.");
        }

        Expense expense = new Expense();
        expense.setCategory(request.getCategory());
        expense.setStatus(ExpenseStatus.APPROVED);
        expense.setAmount(request.getAmount());
        expense.setExpenseDate(expDate);
        expense.setTitle(request.getTitle().trim());
        expense.setDescription(request.getDescription());
        expense.setPaidTo(request.getPaidTo());
        expense.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "Bank Transfer");

        if (request.getSalesOrderId() != null) {
            SalesOrder order = salesOrderRepository.findById(request.getSalesOrderId())
                    .orElseThrow(() -> new IllegalArgumentException("Sales order not found with id: " + request.getSalesOrderId()));
            expense.setSalesOrder(order);
        }

        if (request.getServiceTicketId() != null) {
            ServiceTicket ticket = serviceTicketRepository.findById(request.getServiceTicketId())
                    .orElseThrow(() -> new IllegalArgumentException("Service ticket not found with id: " + request.getServiceTicketId()));
            expense.setServiceTicket(ticket);
        }

        expense = expenseRepository.save(expense);
        if (expense.getExpenseNumber() == null) {
            expense.setExpenseNumber("EXP-" + String.format("%05d", expense.getId()));
            expense = expenseRepository.save(expense);
        }

        return expense;
    }

    @Transactional
    public Expense approveExpense(Long expenseId, String approvedBy) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found with id: " + expenseId));

        if (expense.getStatus() == ExpenseStatus.REJECTED) {
            throw new IllegalStateException("Cannot approve a previously rejected expense: " + expense.getExpenseNumber());
        }

        expense.setStatus(ExpenseStatus.APPROVED);
        expense.setApprovedBy(approvedBy != null ? approvedBy : "Finance Controller");
        expense.setApprovedAt(LocalDateTime.now());
        expense.setRejectionReason(null);
        return expenseRepository.save(expense);
    }

    @Transactional
    public Expense rejectExpense(Long expenseId, String rejectionReason, String rejectedBy) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found with id: " + expenseId));

        if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
            throw new IllegalArgumentException("Rejection reason is required when rejecting an expense.");
        }

        expense.setStatus(ExpenseStatus.REJECTED);
        expense.setRejectionReason(rejectionReason.trim());
        expense.setApprovedBy(rejectedBy != null ? rejectedBy : "Finance Controller");
        expense.setApprovedAt(LocalDateTime.now());
        return expenseRepository.save(expense);
    }

    @Transactional
    public SupplierPayment recordSupplierPayment(SupplierPaymentRequest request) {
        Purchase purchase = purchaseRepository.findById(request.getPurchaseId())
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found with id: " + request.getPurchaseId()));

        if ("CANCELLED".equalsIgnoreCase(purchase.getStatus())) {
            throw new IllegalStateException("Cannot record payment against a cancelled purchase: " + purchase.getPurchaseNumber());
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }

        if (request.getAmount().compareTo(purchase.getRemainingBalance()) > 0) {
            throw new IllegalArgumentException("Overpayment error: Payment amount (₹" + request.getAmount() +
                    ") exceeds remaining balance (₹" + purchase.getRemainingBalance() + ")");
        }

        if (request.getReferenceNumber() != null && !request.getReferenceNumber().trim().isEmpty()) {
            String ref = request.getReferenceNumber().trim();
            if (supplierPaymentRepository.existsByReferenceNumberAndStatus(ref, "SUCCESS")) {
                throw new IllegalArgumentException("Duplicate reference error: A supplier payment with reference '" +
                        ref + "' has already been recorded.");
            }
        }

        SupplierPayment payment = new SupplierPayment();
        payment.setPurchase(purchase);
        payment.setSupplierName(purchase.getSupplierName());
        payment.setAmount(request.getAmount());
        payment.setPaymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setReferenceNumber(request.getReferenceNumber() != null ? request.getReferenceNumber().trim() : null);
        payment.setStatus("SUCCESS");
        payment.setNotes(request.getNotes());

        payment = supplierPaymentRepository.save(payment);
        if (payment.getPaymentNumber() == null) {
            payment.setPaymentNumber("SPAY-" + String.format("%05d", payment.getId()));
            payment = supplierPaymentRepository.save(payment);
        }

        // Update purchase paidAmount and remaining balance
        BigDecimal newPaid = (purchase.getPaidAmount() != null ? purchase.getPaidAmount() : BigDecimal.ZERO).add(request.getAmount());
        purchase.setPaidAmount(newPaid);
        purchase.setRemainingBalance(purchase.getTotalAmount().subtract(newPaid));
        purchase.updatePaymentStatus();
        purchaseRepository.save(purchase);

        return payment;
    }

    @Transactional
    public Invoice cancelInvoice(Long invoiceId, String reason, String cancelledBy) {
        Invoice invoice = getInvoiceById(invoiceId);

        if ("CANCELLED".equalsIgnoreCase(invoice.getStatus())) {
            throw new IllegalStateException("Invoice " + invoice.getInvoiceNumber() + " is already cancelled.");
        }

        invoice.setStatus("CANCELLED");
        invoice.setCancellationReason(reason);
        invoice.setCancelledAt(LocalDateTime.now());
        invoice.setCancelledBy(cancelledBy != null ? cancelledBy : "Finance Controller");

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice generateInvoiceForOrder(Long salesOrderId) {
        SalesOrder order = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Sales order not found with id: " + salesOrderId));

        Optional<Invoice> existing = invoiceRepository.findBySalesOrderId(order.getId());
        if (existing.isPresent() && !"CANCELLED".equals(existing.get().getStatus())) {
            return existing.get();
        }

        Invoice invoice = new Invoice();
        invoice.setSalesOrder(order);
        invoice.setCustomer(order.getCustomer());
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setDueDate(LocalDate.now().plusDays(15));

        // 70% Goods @ 12% + 30% Services @ 18% = 13.80% Solar EPC Composite Rate
        BigDecimal subtotal = order.getQuotation() != null ? order.getQuotation().getSubtotal() :
                order.getTotalAmount().multiply(new BigDecimal("100.00")).divide(new BigDecimal("113.80"), 2, RoundingMode.HALF_UP);
        BigDecimal tax = order.getQuotation() != null ? order.getQuotation().getTaxAmount() :
                order.getTotalAmount().subtract(subtotal);

        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(tax);
        invoice.setTotalAmount(order.getTotalAmount());
        invoice.setPaidAmount(order.getTotalPaid() != null ? order.getTotalPaid() : BigDecimal.ZERO);
        invoice.setBalanceAmount(order.getRemainingBalance());
        invoice.setHsnSacCode("70% Goods (HSN 8541 @ 12%) + 30% Services (SAC 998731 @ 18%)");
        invoice.updateStatus();

        invoice = invoiceRepository.save(invoice);
        if (invoice.getInvoiceNumber() == null) {
            invoice.setInvoiceNumber("INV-" + String.format("%05d", invoice.getId()));
            invoice = invoiceRepository.save(invoice);
        }

        return invoice;
    }

    @Transactional
    public SubsidyApplication updateSubsidyStatus(Long id, SubsidyUpdateRequest request) {
        SubsidyApplication sub = subsidyApplicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subsidy application not found with id: " + id));

        sub.setStatus(request.getStatus());

        if (request.getNationalPortalRegNumber() != null && !request.getNationalPortalRegNumber().trim().isEmpty()) {
            sub.setNationalPortalRegNumber(request.getNationalPortalRegNumber().trim());
        }

        if (request.getSubsidyAmountApproved() != null) {
            sub.setSubsidyAmountApproved(request.getSubsidyAmountApproved());
        }

        if (request.getSanctionDate() != null) {
            sub.setSanctionDate(request.getSanctionDate());
        } else if (request.getStatus() == SubsidyStatus.APPROVED && sub.getSanctionDate() == null) {
            sub.setSanctionDate(LocalDate.now());
        }

        if (request.getAmountReceived() != null) {
            sub.setAmountReceived(request.getAmountReceived());
        }

        if (request.getActualReceiptDate() != null) {
            sub.setActualReceiptDate(request.getActualReceiptDate());
        } else if ((request.getStatus() == SubsidyStatus.AMOUNT_RECEIVED || request.getStatus() == SubsidyStatus.PARTIALLY_RECEIVED)
                && sub.getActualReceiptDate() == null) {
            sub.setActualReceiptDate(LocalDate.now());
        }

        if (request.getDiscomConsumerNumber() != null && !request.getDiscomConsumerNumber().trim().isEmpty()) {
            sub.setDiscomConsumerNumber(request.getDiscomConsumerNumber().trim());
        }

        if (request.getDiscomApplicationNumber() != null && !request.getDiscomApplicationNumber().trim().isEmpty()) {
            sub.setDiscomApplicationNumber(request.getDiscomApplicationNumber().trim());
        }

        if (request.getFeasibilityApprovedDate() != null) {
            sub.setFeasibilityApprovedDate(request.getFeasibilityApprovedDate());
        }

        if (request.getNetMeterInstalledDate() != null) {
            sub.setNetMeterInstalledDate(request.getNetMeterInstalledDate());
        }

        if (request.getCommissioningCertificateNumber() != null && !request.getCommissioningCertificateNumber().trim().isEmpty()) {
            sub.setCommissioningCertificateNumber(request.getCommissioningCertificateNumber().trim());
        }

        if (request.getNotes() != null) {
            sub.setNotes(request.getNotes());
        }

        return subsidyApplicationRepository.save(sub);
    }

    @Transactional
    public TechnicianPayment recordTechnicianPayout(TechnicianPayoutRequest request) {
        Technician tech = technicianRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new IllegalArgumentException("Technician not found with id: " + request.getTechnicianId()));

        if (request.getAmountPaid() == null || request.getAmountPaid().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payout amount must be greater than zero.");
        }

        Installation inst = null;
        if (request.getInstallationId() != null) {
            inst = installationRepository.findById(request.getInstallationId())
                    .orElseThrow(() -> new IllegalArgumentException("Installation not found with id: " + request.getInstallationId()));

            if (technicianPaymentRepository.existsByInstallationIdAndTechnicianId(inst.getId(), tech.getId())) {
                throw new IllegalArgumentException("Duplicate payout error: A payout has already been recorded for technician " +
                        tech.getName() + " on installation " + inst.getInstallationNumber());
            }

            if (inst.getStatus() == com.sunpower.entity.enums.Enums.InstallationStatus.CANCELLED) {
                throw new IllegalStateException("Cannot disburse labor payout for a cancelled installation.");
            }
        }

        TechnicianPayment payout = new TechnicianPayment();
        payout.setTechnician(tech);
        payout.setInstallation(inst);
        BigDecimal hours = request.getHoursCounted() != null ? BigDecimal.valueOf(request.getHoursCounted()) : null;
        BigDecimal rate = request.getApplicableRate() != null ? BigDecimal.valueOf(request.getApplicableRate()) : new BigDecimal("250.00");
        BigDecimal calculated = (hours != null && rate != null) ? hours.multiply(rate) : request.getAmountPaid();
        BigDecimal remaining = calculated.subtract(request.getAmountPaid());
        if (remaining.compareTo(BigDecimal.ZERO) < 0) remaining = BigDecimal.ZERO;

        payout.setHoursCounted(hours);
        payout.setHourlyRate(rate);
        payout.setCalculatedAmount(calculated);
        payout.setAmountPaid(request.getAmountPaid());
        payout.setAmount(request.getAmountPaid());
        payout.setRemainingAmount(remaining);
        payout.setPaymentMethod(request.getPaymentMethod());
        payout.setPaymentDate(LocalDate.now());
        payout.setReferenceNumber(request.getReferenceNumber() != null ? request.getReferenceNumber().trim() : null);
        payout.setNotes(request.getNotes());
        payout.setStatus(remaining.compareTo(BigDecimal.ZERO) > 0 ? TechnicianPayoutStatus.PARTIALLY_PAID : TechnicianPayoutStatus.PAID);

        payout = technicianPaymentRepository.save(payout);
        if (payout.getPaymentNumber() == null) {
            payout.setPaymentNumber("TECH-PAY-" + String.format("%05d", payout.getId()));
            payout = technicianPaymentRepository.save(payout);
        }

        // Link expense to order if installation has sales order
        if (inst != null && inst.getSalesOrder() != null) {
            Expense exp = new Expense();
            exp.setCategory(ExpenseCategory.TECHNICIAN_PAYOUT);
            exp.setStatus(ExpenseStatus.APPROVED);
            exp.setTitle("Technician Labor Payout - " + tech.getName());
            exp.setDescription("Disbursed payout for installation " + inst.getInstallationNumber() + " (Ref: " + payout.getPaymentNumber() + ")");
            exp.setAmount(request.getAmountPaid());
            exp.setPaidTo(tech.getName());
            exp.setPaymentMethod(request.getPaymentMethod());
            exp.setExpenseDate(LocalDate.now());
            exp.setSalesOrder(inst.getSalesOrder());
            expenseRepository.save(exp);
        }

        return payout;
    }

    public List<JobProfitabilityDTO> calculateAllJobProfitability() {
        List<SalesOrder> orders = salesOrderRepository.findAll();
        return orders.stream()
                .map(this::calculateJobProfitability)
                .collect(Collectors.toList());
    }

    public JobProfitabilityDTO calculateJobProfitability(SalesOrder order) {
        JobProfitabilityDTO dto = new JobProfitabilityDTO();
        dto.setOrderId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setCustomerName(order.getCustomer() != null ? order.getCustomer().getFullName() : "N/A");
        dto.setSystemType(order.getSystemType() != null ? order.getSystemType().name() : "ON_GRID");
        dto.setCapacityKw(order.getCapacityKw() != null ? order.getCapacityKw() : BigDecimal.ZERO);
        dto.setOrderAmount(order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);

        BigDecimal subtotal = order.getQuotation() != null && order.getQuotation().getSubtotal() != null ?
                order.getQuotation().getSubtotal() :
                dto.getOrderAmount().multiply(new BigDecimal("100.00")).divide(new BigDecimal("113.80"), 2, RoundingMode.HALF_UP);
        BigDecimal tax = order.getQuotation() != null && order.getQuotation().getTaxAmount() != null ?
                order.getQuotation().getTaxAmount() :
                dto.getOrderAmount().subtract(subtotal);

        dto.setTaxAmount(tax);
        dto.setRecognizedRevenue(subtotal);

        BigDecimal received = order.getTotalPaid() != null ? order.getTotalPaid() : BigDecimal.ZERO;
        dto.setRevenueReceived(received);
        dto.setOutstandingBalance(dto.getOrderAmount().subtract(received));

        // 1. Hardware BOM Cost
        BigDecimal hardwareCost = BigDecimal.ZERO;
        if (order.getQuotation() != null && order.getQuotation().getSolarPackage() != null) {
            SolarPackage pkg = order.getQuotation().getSolarPackage();
            if (pkg.getBomItems() != null) {
                for (PackageBOM bom : pkg.getBomItems()) {
                    if (bom.getProduct() != null && bom.getProduct().getPurchasePrice() != null) {
                        BigDecimal itemCost = bom.getProduct().getPurchasePrice().multiply(BigDecimal.valueOf(bom.getQuantity()));
                        hardwareCost = hardwareCost.add(itemCost);
                    }
                }
            }
        }
        if (hardwareCost.compareTo(BigDecimal.ZERO) == 0) {
            hardwareCost = subtotal.multiply(new BigDecimal("0.55")).setScale(2, RoundingMode.HALF_UP);
        }
        dto.setHardwareCost(hardwareCost);

        // 2. Direct Technician Labor Cost
        BigDecimal laborCost = BigDecimal.ZERO;
        Optional<Installation> instOpt = installationRepository.findBySalesOrderId(order.getId());
        if (instOpt.isPresent()) {
            Installation inst = instOpt.get();
            List<TechnicianPayment> payouts = technicianPaymentRepository.findByInstallationId(inst.getId());
            for (TechnicianPayment p : payouts) {
                if (p.getAmountPaid() != null) {
                    laborCost = laborCost.add(p.getAmountPaid());
                }
            }
            if (laborCost.compareTo(BigDecimal.ZERO) == 0 && inst.getActualStartTime() != null && inst.getActualFinishTime() != null) {
                long hrs = java.time.Duration.between(inst.getActualStartTime(), inst.getActualFinishTime()).toHours();
                if (hrs > 0) {
                    laborCost = BigDecimal.valueOf(hrs).multiply(new BigDecimal("250.00"));
                }
            }
        }
        dto.setInstallationLaborCost(laborCost);

        // 3. Operational Expenses linked to this job
        BigDecimal transportCost = BigDecimal.ZERO;
        BigDecimal serviceRepairCost = BigDecimal.ZERO;
        BigDecimal otherExpenses = BigDecimal.ZERO;

        List<Expense> jobExpenses = expenseRepository.findBySalesOrderId(order.getId());
        for (Expense exp : jobExpenses) {
            if (exp.getStatus() == ExpenseStatus.REJECTED) continue;
            if (exp.getCategory() == ExpenseCategory.TECHNICIAN_PAYOUT) continue; // Avoid double counting

            if (exp.getCategory() == ExpenseCategory.TRANSPORT) {
                transportCost = transportCost.add(exp.getAmount());
            } else if (exp.getCategory() == ExpenseCategory.SERVICE_REPAIR) {
                serviceRepairCost = serviceRepairCost.add(exp.getAmount());
            } else {
                otherExpenses = otherExpenses.add(exp.getAmount());
            }
        }
        dto.setTransportCost(transportCost);
        dto.setServiceRepairCost(serviceRepairCost);
        dto.setOtherExpenses(otherExpenses);

        // Total Project Direct Costs
        BigDecimal totalCost = hardwareCost.add(laborCost).add(transportCost).add(serviceRepairCost).add(otherExpenses);
        dto.setTotalCost(totalCost);

        // Net Operating Profit = recognizedRevenue - totalCost
        BigDecimal netProfit = subtotal.subtract(totalCost);
        dto.setNetProfit(netProfit);

        BigDecimal cashProfit = received.subtract(totalCost);
        dto.setCashProfit(cashProfit);

        if (subtotal.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal margin = netProfit.multiply(new BigDecimal("100.00")).divide(subtotal, 1, RoundingMode.HALF_UP);
            dto.setProfitMarginPercentage(margin);

            if (margin.compareTo(new BigDecimal("20.0")) >= 0) {
                dto.setProfitabilityStatus("PROFITABLE");
            } else if (margin.compareTo(BigDecimal.ZERO) >= 0) {
                dto.setProfitabilityStatus("LOW_MARGIN");
            } else {
                dto.setProfitabilityStatus("LOSS_MAKING");
            }
        } else {
            dto.setProfitMarginPercentage(BigDecimal.ZERO);
            dto.setProfitabilityStatus("LOSS_MAKING");
        }

        // Subsidy status
        Optional<SubsidyApplication> subOpt = subsidyApplicationRepository.findBySalesOrderId(order.getId());
        dto.setSubsidyStatus(subOpt.map(s -> s.getStatus().name()).orElse("NOT_APPLIED"));

        // Open service tickets count
        if (order.getCustomer() != null) {
            long openCount = serviceTicketRepository.countByCustomerIdAndStatusNot(order.getCustomer().getId(),
                    com.sunpower.entity.enums.Enums.TicketStatus.CLOSED);
            dto.setOpenServiceTicketsCount(openCount);
        } else {
            dto.setOpenServiceTicketsCount(0);
        }

        return dto;
    }

    public FinanceDashboardDTO getFinanceDashboard(String period, LocalDate customStartDate, LocalDate customEndDate) {
        FinanceDashboardDTO dto = new FinanceDashboardDTO();

        LocalDate startDate = customStartDate;
        LocalDate endDate = customEndDate != null ? customEndDate : LocalDate.now();

        if (startDate == null && period != null) {
            LocalDate today = LocalDate.now();
            String pUpper = period.toUpperCase().trim();
            if (pUpper.contains("MONTH") || pUpper.equals("THIS_MONTH")) {
                startDate = today.withDayOfMonth(1);
            } else if (pUpper.contains("3_MONTH") || pUpper.contains("3 MONTH")) {
                startDate = today.minusMonths(3);
            } else if (pUpper.contains("FY") || pUpper.contains("YEAR")) {
                int fyYear = today.getMonthValue() >= 4 ? today.getYear() : today.getYear() - 1;
                startDate = LocalDate.of(fyYear, 4, 1);
                endDate = LocalDate.of(fyYear + 1, 3, 31);
            }
        }

        final LocalDate finalStart = startDate;
        final LocalDate finalEnd = endDate;

        List<SalesOrder> allOrders = salesOrderRepository.findAll();
        List<SalesOrder> filteredOrders = allOrders.stream()
                .filter(o -> {
                    LocalDate od = o.getOrderDate();
                    if (od == null) return true;
                    if (finalStart != null && od.isBefore(finalStart)) return false;
                    if (finalEnd != null && od.isAfter(finalEnd)) return false;
                    return true;
                })
                .collect(Collectors.toList());

        List<JobProfitabilityDTO> allProfitability = filteredOrders.stream()
                .map(this::calculateJobProfitability)
                .collect(Collectors.toList());

        // 1. Revenue Metrics
        BigDecimal totalInvoiced = filteredOrders.stream()
                .map(SalesOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalInvoicedRevenue(totalInvoiced);
        dto.setTotalRevenue(totalInvoiced);

        BigDecimal totalConfirmed = filteredOrders.stream()
                .filter(o -> o.getStatus() == com.sunpower.entity.enums.Enums.OrderStatus.CONFIRMED ||
                             o.getStatus() == com.sunpower.entity.enums.Enums.OrderStatus.IN_INSTALLATION ||
                             o.getStatus() == com.sunpower.entity.enums.Enums.OrderStatus.COMPLETED)
                .map(SalesOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalConfirmedOrderValue(totalConfirmed);

        BigDecimal totalRecognized = allProfitability.stream()
                .map(JobProfitabilityDTO::getRecognizedRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalRecognizedRevenue(totalRecognized);

        BigDecimal totalTaxes = allProfitability.stream()
                .map(JobProfitabilityDTO::getTaxAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalTaxCollected(totalTaxes);

        // 2. Customer Payments & Receivables
        List<Payment> allPayments = paymentRepository.findAll();
        List<Payment> filteredPayments = allPayments.stream()
                .filter(p -> p.getStatus() == com.sunpower.entity.enums.Enums.PaymentStatus.SUCCESS)
                .filter(p -> {
                    LocalDate pd = p.getPaymentDate();
                    if (pd == null) return true;
                    if (finalStart != null && pd.isBefore(finalStart)) return false;
                    if (finalEnd != null && pd.isAfter(finalEnd)) return false;
                    return true;
                })
                .collect(Collectors.toList());

        BigDecimal cashCollected = filteredPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalPaymentsReceived(cashCollected);
        dto.setTotalCashCollected(cashCollected);

        BigDecimal pendingReceivables = totalInvoiced.subtract(cashCollected);
        if (pendingReceivables.compareTo(BigDecimal.ZERO) < 0) pendingReceivables = BigDecimal.ZERO;
        dto.setTotalOutstandingReceivables(pendingReceivables);
        dto.setPendingCustomerPayments(pendingReceivables);

        // 3. COGS & Operational Expenses
        BigDecimal totalHardware = allProfitability.stream()
                .map(JobProfitabilityDTO::getHardwareCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalHardwareCost(totalHardware);

        BigDecimal totalLabor = allProfitability.stream()
                .map(JobProfitabilityDTO::getInstallationLaborCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalInstallationLaborCost(totalLabor);

        BigDecimal cogs = totalHardware.add(totalLabor);
        dto.setCogs(cogs);

        // Gross Profit = Revenue - COGS
        BigDecimal grossProfit = totalRecognized.subtract(cogs);
        dto.setGrossProfit(grossProfit);

        List<Expense> allExpenses = expenseRepository.findAll();
        List<Expense> filteredExpenses = allExpenses.stream()
                .filter(e -> e.getStatus() != ExpenseStatus.REJECTED)
                .filter(e -> {
                    LocalDate ed = e.getExpenseDate();
                    if (ed == null) return true;
                    if (finalStart != null && ed.isBefore(finalStart)) return false;
                    if (finalEnd != null && ed.isAfter(finalEnd)) return false;
                    return true;
                })
                .collect(Collectors.toList());

        BigDecimal totalOpsExpenses = filteredExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalOperationalExpenses(totalOpsExpenses);

        BigDecimal totalExpenses = cogs.add(totalOpsExpenses);
        dto.setTotalExpenses(totalExpenses);

        // Net Profit = Gross Profit - Operating Expenses
        BigDecimal netProfit = grossProfit.subtract(totalOpsExpenses);
        dto.setNetProfit(netProfit);
        dto.setTotalProjectProfit(netProfit);

        if (!allProfitability.isEmpty()) {
            BigDecimal sumMargins = allProfitability.stream()
                    .map(JobProfitabilityDTO::getProfitMarginPercentage)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            dto.setAverageProfitMargin(sumMargins.divide(BigDecimal.valueOf(allProfitability.size()), 1, RoundingMode.HALF_UP));
        }

        BigDecimal pendingPayouts = technicianPaymentRepository.sumPendingPayouts();
        dto.setPendingTechnicianPayouts(pendingPayouts != null ? pendingPayouts : BigDecimal.ZERO);

        BigDecimal pendingSubsidies = subsidyApplicationRepository.sumPendingSubsidyReceipts();
        dto.setSubsidiesPendingReceipt(pendingSubsidies != null ? pendingSubsidies : BigDecimal.ZERO);

        // 4. Supplier Outstanding Balances & Overdue Invoices
        BigDecimal supplierOutstanding = purchaseRepository.sumOutstandingSupplierBalance();
        dto.setOutstandingSupplierPayments(supplierOutstanding != null ? supplierOutstanding : BigDecimal.ZERO);

        LocalDate today = LocalDate.now();
        dto.setOverdueInvoicesCount(invoiceRepository.countOverdueInvoices(today));
        dto.setOverdueInvoicesAmount(invoiceRepository.sumOverdueAmount(today));

        // 5. Cash Flow Calculation
        BigDecimal totalSupplierPaid = supplierPaymentRepository.sumTotalSupplierPayments();
        BigDecimal totalTechPaid = technicianPaymentRepository.sumTotalPayoutsDisbursed();
        BigDecimal subsidyCash = subsidyApplicationRepository.findAll().stream()
                .map(s -> s.getAmountReceived() != null ? s.getAmountReceived() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashInflows = cashCollected.add(subsidyCash);
        BigDecimal cashOutflows = (totalSupplierPaid != null ? totalSupplierPaid : BigDecimal.ZERO)
                .add(totalTechPaid != null ? totalTechPaid : BigDecimal.ZERO)
                .add(totalOpsExpenses);
        dto.setNetCashFlow(cashInflows.subtract(cashOutflows));

        // 6. Aging analysis
        BigDecimal age0to30 = BigDecimal.ZERO;
        BigDecimal age31to60 = BigDecimal.ZERO;
        BigDecimal age61to90 = BigDecimal.ZERO;
        BigDecimal ageOver90 = BigDecimal.ZERO;
        for (SalesOrder o : allOrders) {
            BigDecimal bal = o.getRemainingBalance();
            if (bal != null && bal.compareTo(BigDecimal.ZERO) > 0) {
                LocalDate refDate = o.getOrderDate() != null ? o.getOrderDate() : today;
                long days = java.time.temporal.ChronoUnit.DAYS.between(refDate, today);
                if (days <= 30) {
                    age0to30 = age0to30.add(bal);
                } else if (days <= 60) {
                    age31to60 = age31to60.add(bal);
                } else if (days <= 90) {
                    age61to90 = age61to90.add(bal);
                } else {
                    ageOver90 = ageOver90.add(bal);
                }
            }
        }
        dto.setAging0To30Days(age0to30);
        dto.setAging31To60Days(age31to60);
        dto.setAging61To90Days(age61to90);
        dto.setAgingOver90Days(ageOver90);

        // 7. Monthly Revenue, Cost, Profit Trends (Last 6 Months in chronological order)
        Map<String, BigDecimal[]> monthMap = new LinkedHashMap<>();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM yyyy");

        for (int i = 5; i >= 0; i--) {
            LocalDate m = today.minusMonths(i);
            monthMap.put(m.format(monthFmt), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO});
        }

        for (Payment p : allPayments) {
            if (p.getStatus() == com.sunpower.entity.enums.Enums.PaymentStatus.SUCCESS && p.getPaymentDate() != null) {
                String k = p.getPaymentDate().format(monthFmt);
                if (monthMap.containsKey(k)) {
                    monthMap.get(k)[0] = monthMap.get(k)[0].add(p.getAmount());
                }
            }
        }

        for (SalesOrder o : allOrders) {
            LocalDate dt = o.getOrderDate();
            if (dt != null) {
                String k = dt.format(monthFmt);
                if (monthMap.containsKey(k)) {
                    JobProfitabilityDTO prof = calculateJobProfitability(o);
                    monthMap.get(k)[1] = monthMap.get(k)[1].add(prof.getHardwareCost());
                    monthMap.get(k)[1] = monthMap.get(k)[1].add(prof.getInstallationLaborCost());
                }
            }
        }

        for (Expense e : allExpenses) {
            if (e.getStatus() == ExpenseStatus.REJECTED) continue;
            if (e.getExpenseDate() != null) {
                String k = e.getExpenseDate().format(monthFmt);
                if (monthMap.containsKey(k)) {
                    if (e.getCategory() != ExpenseCategory.TECHNICIAN_PAYOUT || e.getSalesOrder() == null) {
                        monthMap.get(k)[1] = monthMap.get(k)[1].add(e.getAmount());
                    }
                }
            }
        }

        List<MonthlyTrendItem> trends = new ArrayList<>();
        for (Map.Entry<String, BigDecimal[]> entry : monthMap.entrySet()) {
            BigDecimal rev = entry.getValue()[0];
            BigDecimal cost = entry.getValue()[1];
            BigDecimal profit = rev.subtract(cost);
            trends.add(new MonthlyTrendItem(entry.getKey(), rev, cost, profit));
        }
        dto.setMonthlyRevenueTrends(trends);

        // 8. Expense Category Breakdown
        Map<ExpenseCategory, BigDecimal> catMap = new HashMap<>();
        for (ExpenseCategory c : ExpenseCategory.values()) {
            catMap.put(c, BigDecimal.ZERO);
        }
        for (Expense e : filteredExpenses) {
            catMap.put(e.getCategory(), catMap.getOrDefault(e.getCategory(), BigDecimal.ZERO).add(e.getAmount()));
        }
        List<CategoryDistributionItem> catItems = catMap.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ZERO) > 0)
                .map(e -> new CategoryDistributionItem(e.getKey().name(), e.getValue()))
                .collect(Collectors.toList());
        dto.setExpenseCategoryBreakdown(catItems);

        // 9. Payment Status Distribution
        Map<String, Object[]> payMap = new HashMap<>();
        for (Payment p : allPayments) {
            String s = p.getStatus() != null ? p.getStatus().name() : "SUCCESS";
            Object[] val = payMap.computeIfAbsent(s, k -> new Object[]{0L, BigDecimal.ZERO});
            val[0] = (Long) val[0] + 1;
            val[1] = ((BigDecimal) val[1]).add(p.getAmount());
        }
        List<StatusCountItem> payStatusList = payMap.entrySet().stream()
                .map(e -> new StatusCountItem(e.getKey(), (Long) e.getValue()[0], (BigDecimal) e.getValue()[1]))
                .collect(Collectors.toList());
        dto.setPaymentStatusDistribution(payStatusList);

        // 10. Subsidy Status Distribution
        Map<String, Object[]> subMap = new HashMap<>();
        for (SubsidyApplication sub : subsidyApplicationRepository.findAll()) {
            String s = sub.getStatus() != null ? sub.getStatus().name() : "SUBMITTED";
            Object[] val = subMap.computeIfAbsent(s, k -> new Object[]{0L, BigDecimal.ZERO});
            val[0] = (Long) val[0] + 1;
            val[1] = ((BigDecimal) val[1]).add(sub.getSubsidyAmountApproved() != null ? sub.getSubsidyAmountApproved() : sub.getSubsidyAmountClaimed());
        }
        List<StatusCountItem> subStatusList = subMap.entrySet().stream()
                .map(e -> new StatusCountItem(e.getKey(), (Long) e.getValue()[0], (BigDecimal) e.getValue()[1]))
                .collect(Collectors.toList());
        dto.setSubsidyStatusDistribution(subStatusList);

        // 11. Recent Unified Financial Transactions Feed
        List<RecentTransactionItem> recentList = new ArrayList<>();
        for (Payment p : allPayments) {
            recentList.add(new RecentTransactionItem(
                    p.getPaymentDate(),
                    "CUSTOMER_PAYMENT",
                    p.getPaymentNumber() != null ? p.getPaymentNumber() : "PAY-" + p.getId(),
                    "Customer payment received for " + (p.getSalesOrder() != null ? p.getSalesOrder().getOrderNumber() : "Order"),
                    p.getAmount(),
                    "INFLOW",
                    p.getStatus() != null ? p.getStatus().name() : "SUCCESS"
            ));
        }
        for (TechnicianPayment tp : technicianPaymentRepository.findAll()) {
            recentList.add(new RecentTransactionItem(
                    tp.getPaymentDate(),
                    "TECHNICIAN_PAYOUT",
                    tp.getPaymentNumber() != null ? tp.getPaymentNumber() : "TECH-PAY-" + tp.getId(),
                    "Field labor payout to " + (tp.getTechnician() != null ? tp.getTechnician().getName() : "Technician"),
                    tp.getAmountPaid(),
                    "OUTFLOW",
                    tp.getStatus() != null ? tp.getStatus().name() : "PAID"
            ));
        }
        for (Expense exp : allExpenses) {
            recentList.add(new RecentTransactionItem(
                    exp.getExpenseDate(),
                    "DIRECT_EXPENSE",
                    exp.getExpenseNumber() != null ? exp.getExpenseNumber() : "EXP-" + exp.getId(),
                    exp.getTitle(),
                    exp.getAmount(),
                    "OUTFLOW",
                    exp.getStatus() != null ? exp.getStatus().name() : "APPROVED"
            ));
        }
        for (SupplierPayment sp : supplierPaymentRepository.findAll()) {
            recentList.add(new RecentTransactionItem(
                    sp.getPaymentDate(),
                    "SUPPLIER_PAYMENT",
                    sp.getPaymentNumber() != null ? sp.getPaymentNumber() : "SPAY-" + sp.getId(),
                    "Payment to supplier " + sp.getSupplierName(),
                    sp.getAmount(),
                    "OUTFLOW",
                    sp.getStatus() != null ? sp.getStatus() : "PAID"
            ));
        }
        recentList.sort((a, b) -> {
            if (a.getDate() == null && b.getDate() == null) return 0;
            if (a.getDate() == null) return 1;
            if (b.getDate() == null) return -1;
            return b.getDate().compareTo(a.getDate());
        });
        if (recentList.size() > 10) {
            recentList = recentList.subList(0, 10);
        }
        dto.setRecentTransactions(recentList);

        return dto;
    }

    public ProfitAndLossReportDTO getProfitAndLossReport(String period) {
        FinanceDashboardDTO dash = getFinanceDashboard(period, null, null);
        ProfitAndLossReportDTO report = new ProfitAndLossReportDTO();
        report.setPeriod(period != null ? period : "THIS_MONTH");
        report.setTotalRevenue(dash.getTotalInvoicedRevenue());
        report.setGstExcludedRevenue(dash.getTotalRecognizedRevenue());
        report.setHardwareCogs(dash.getTotalHardwareCost());
        report.setInstallationLaborCogs(dash.getTotalInstallationLaborCost());
        report.setTotalCogs(dash.getCogs());
        report.setGrossProfit(dash.getGrossProfit());
        if (dash.getTotalRecognizedRevenue().compareTo(BigDecimal.ZERO) > 0) {
            report.setGrossMarginPercentage(dash.getGrossProfit().multiply(new BigDecimal("100.00"))
                    .divide(dash.getTotalRecognizedRevenue(), 1, RoundingMode.HALF_UP));
        }
        report.setOperatingExpensesBreakdown(dash.getExpenseCategoryBreakdown());
        report.setTotalOperatingExpenses(dash.getTotalOperationalExpenses());
        report.setNetProfit(dash.getNetProfit());
        if (dash.getTotalRecognizedRevenue().compareTo(BigDecimal.ZERO) > 0) {
            report.setNetMarginPercentage(dash.getNetProfit().multiply(new BigDecimal("100.00"))
                    .divide(dash.getTotalRecognizedRevenue(), 1, RoundingMode.HALF_UP));
        }
        return report;
    }

    public CashFlowReportDTO getCashFlowReport(String period) {
        FinanceDashboardDTO dash = getFinanceDashboard(period, null, null);
        CashFlowReportDTO report = new CashFlowReportDTO();
        report.setPeriod(period != null ? period : "THIS_MONTH");
        report.setOpeningBalance(new BigDecimal("500000.00")); // Standard treasury reserve
        report.setCustomerReceipts(dash.getTotalCashCollected());

        BigDecimal subsidyCash = subsidyApplicationRepository.findAll().stream()
                .map(s -> s.getAmountReceived() != null ? s.getAmountReceived() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        report.setSubsidyReceipts(subsidyCash);
        report.setTotalOperatingInflows(dash.getTotalCashCollected().add(subsidyCash));

        BigDecimal totalSupplierPaid = supplierPaymentRepository.sumTotalSupplierPayments();
        report.setSupplierPayments(totalSupplierPaid != null ? totalSupplierPaid : BigDecimal.ZERO);

        BigDecimal totalTechPaid = technicianPaymentRepository.sumTotalPayoutsDisbursed();
        report.setTechnicianPayouts(totalTechPaid != null ? totalTechPaid : BigDecimal.ZERO);

        report.setDirectOperatingExpenses(dash.getTotalOperationalExpenses());
        report.setTotalOperatingOutflows(report.getSupplierPayments().add(report.getTechnicianPayouts()).add(report.getDirectOperatingExpenses()));

        BigDecimal netCash = report.getTotalOperatingInflows().subtract(report.getTotalOperatingOutflows());
        report.setNetOperatingCashFlow(netCash);
        report.setClosingBalance(report.getOpeningBalance().add(netCash));

        return report;
    }

    public GstReportDTO getGstReport(String period) {
        GstReportDTO report = new GstReportDTO();
        report.setPeriod(period != null ? period : "THIS_MONTH");
        report.setOutputCgst(invoiceRepository.sumTotalCgst());
        report.setOutputSgst(invoiceRepository.sumTotalSgst());
        report.setOutputIgst(invoiceRepository.sumTotalIgst());
        report.setTotalOutputGst(invoiceRepository.sumTotalOutputTax());

        // Approximate input GST from purchases (e.g. 18% standard tax on hardware purchases)
        BigDecimal totalPurchases = purchaseRepository.sumTotalPurchases();
        BigDecimal inputGst = (totalPurchases != null ? totalPurchases : BigDecimal.ZERO)
                .multiply(new BigDecimal("18.00")).divide(new BigDecimal("118.00"), 2, RoundingMode.HALF_UP);
        report.setInputGst(inputGst);
        report.setNetGstPayable(report.getTotalOutputGst().subtract(inputGst));
        if (report.getNetGstPayable().compareTo(BigDecimal.ZERO) < 0) {
            report.setNetGstPayable(BigDecimal.ZERO);
        }
        return report;
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
                    job.getInstallationLaborCost() != null ? job.getInstallationLaborCost() : BigDecimal.ZERO,
                    job.getOtherExpenses() != null ? job.getOtherExpenses() : BigDecimal.ZERO,
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
                    inv.getStatus() != null ? inv.getStatus() : "UNPAID",
                    inv.getGstin() != null ? inv.getGstin() : "N/A"
            ));
        }
        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    public byte[] generateExpensesCsv() {
        List<Expense> expenses = getAllExpenses();
        StringBuilder csv = new StringBuilder();
        csv.append("Expense #,Date,Title,Category,Status,Paid To,Payment Method,Linked Order #,Amount (INR),Description\n");

        for (Expense exp : expenses) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%.2f,\"%s\"\n",
                    exp.getExpenseNumber() != null ? exp.getExpenseNumber() : "N/A",
                    exp.getExpenseDate() != null ? exp.getExpenseDate().toString() : "N/A",
                    exp.getTitle() != null ? exp.getTitle().replace("\"", "\"\"") : "N/A",
                    exp.getCategory() != null ? exp.getCategory().name() : "OTHER",
                    exp.getStatus() != null ? exp.getStatus().name() : "APPROVED",
                    exp.getPaidTo() != null ? exp.getPaidTo().replace("\"", "\"\"") : "N/A",
                    exp.getPaymentMethod() != null ? exp.getPaymentMethod() : "N/A",
                    exp.getSalesOrder() != null ? exp.getSalesOrder().getOrderNumber() : "General Overhead",
                    exp.getAmount() != null ? exp.getAmount() : BigDecimal.ZERO,
                    exp.getDescription() != null ? exp.getDescription().replace("\"", "\"\"") : ""
            ));
        }
        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    public byte[] generateSupplierPurchasesCsv() {
        List<Purchase> purchases = getAllSupplierPurchases();
        StringBuilder csv = new StringBuilder();
        csv.append("PO #,Date,Supplier,Total Amount (INR),Paid Amount (INR),Remaining Balance (INR),Payment Status,Fulfillment Status\n");

        for (Purchase p : purchases) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",%.2f,%.2f,%.2f,\"%s\",\"%s\"\n",
                    p.getPurchaseNumber() != null ? p.getPurchaseNumber() : "N/A",
                    p.getPurchaseDate() != null ? p.getPurchaseDate().toString() : "N/A",
                    p.getSupplierName() != null ? p.getSupplierName().replace("\"", "\"\"") : "N/A",
                    p.getTotalAmount() != null ? p.getTotalAmount() : BigDecimal.ZERO,
                    p.getPaidAmount() != null ? p.getPaidAmount() : BigDecimal.ZERO,
                    p.getRemainingBalance() != null ? p.getRemainingBalance() : BigDecimal.ZERO,
                    p.getPaymentStatus() != null ? p.getPaymentStatus() : "UNPAID",
                    p.getStatus() != null ? p.getStatus() : "RECEIVED"
            ));
        }
        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
}
