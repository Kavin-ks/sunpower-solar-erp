package com.sunpower.service;

import com.sunpower.dto.FinanceDTOs.*;
import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.ExpenseCategory;
import com.sunpower.entity.enums.Enums.SubsidyStatus;
import com.sunpower.entity.enums.Enums.TechnicianPayoutStatus;
import com.sunpower.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
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
        if (existing.isPresent()) {
            return existing.get();
        }

        Invoice invoice = new Invoice();
        invoice.setSalesOrder(order);
        invoice.setCustomer(order.getCustomer());
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setDueDate(LocalDate.now().plusDays(15));

        BigDecimal subtotal = order.getQuotation() != null ? order.getQuotation().getSubtotal() :
                order.getTotalAmount().multiply(new BigDecimal("100.00")).divide(new BigDecimal("113.80"), 2, RoundingMode.HALF_UP);
        BigDecimal tax = order.getQuotation() != null ? order.getQuotation().getTaxAmount() :
                order.getTotalAmount().subtract(subtotal);

        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(tax);
        invoice.setTotalAmount(order.getTotalAmount());
        invoice.setPaidAmount(order.getTotalPaid() != null ? order.getTotalPaid() : BigDecimal.ZERO);
        invoice.setBalanceAmount(order.getRemainingBalance());
        invoice.setStatus(order.getRemainingBalance().compareTo(BigDecimal.ZERO) == 0 ? "PAID" :
                (order.getTotalPaid() != null && order.getTotalPaid().compareTo(BigDecimal.ZERO) > 0 ? "PARTIALLY_PAID" : "ISSUED"));
        invoice.setHsnSacCode("70% Goods (HSN 8541 @ 12%) + 30% Services (SAC 998731 @ 18%)");

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

        if (request.getNotes() != null) {
            sub.setNotes(request.getNotes());
        }

        if (request.getStatus() == SubsidyStatus.SUBMITTED && sub.getSubmissionDate() == null) {
            sub.setSubmissionDate(LocalDate.now());
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

        sub.recalculatePending();
        return subsidyApplicationRepository.save(sub);
    }

    @Transactional
    public TechnicianPayment recordTechnicianPayout(TechnicianPayoutRequest request) {
        Technician tech = technicianRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new IllegalArgumentException("Technician not found with id: " + request.getTechnicianId()));

        if (request.getReferenceNumber() != null && !request.getReferenceNumber().trim().isEmpty()) {
            if (technicianPaymentRepository.existsByReferenceNumber(request.getReferenceNumber().trim())) {
                throw new IllegalArgumentException("Duplicate payout reference: A payout with reference/UTR '" +
                        request.getReferenceNumber().trim() + "' has already been recorded.");
            }
        }

        Installation installation = null;
        if (request.getInstallationId() != null) {
            installation = installationRepository.findById(request.getInstallationId()).orElse(null);
            if (installation != null) {
                if (installation.getStatus() == com.sunpower.entity.enums.Enums.InstallationStatus.CANCELLED) {
                    throw new IllegalStateException("Cannot disburse technician payout: Installation " +
                            installation.getInstallationNumber() + " is CANCELLED.");
                }
                if (technicianPaymentRepository.existsByInstallationIdAndTechnicianId(installation.getId(), tech.getId())) {
                    throw new IllegalArgumentException("Duplicate payout error: Technician '" + tech.getName() +
                            "' has already received a payout for installation " + installation.getInstallationNumber());
                }
            }
        }

        BigDecimal rate = request.getApplicableRate() != null ? request.getApplicableRate() : BigDecimal.valueOf(250.00);
        BigDecimal hours = request.getHoursCounted() != null ? request.getHoursCounted() : BigDecimal.ZERO;
        BigDecimal calculated = hours.multiply(rate);
        BigDecimal amountPaid = request.getAmountPaid() != null ? request.getAmountPaid() : calculated;

        TechnicianPayment tp = new TechnicianPayment();
        tp.setTechnician(tech);
        tp.setInstallation(installation);
        tp.setHoursCounted(hours);
        tp.setHourlyRate(rate);
        tp.setCalculatedAmount(calculated);
        tp.setAmount(amountPaid);
        tp.setAmountPaid(amountPaid);
        tp.setPaymentDate(LocalDate.now());
        tp.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "Bank Transfer");
        tp.setReferenceNumber(request.getReferenceNumber());
        tp.setNotes(request.getNotes());
        tp.recalculateTotals();

        tp = technicianPaymentRepository.save(tp);
        if (tp.getPaymentNumber() == null) {
            tp.setPaymentNumber("TPAY-" + String.format("%05d", tp.getId()));
            tp = technicianPaymentRepository.save(tp);
        }

        // If linked to an installation with a sales order, record project expense if not already present
        if (installation != null && installation.getSalesOrder() != null) {
            boolean alreadyLogged = expenseRepository.findBySalesOrderId(installation.getSalesOrder().getId()).stream()
                    .anyMatch(e -> e.getCategory() == ExpenseCategory.TECHNICIAN_PAYOUT && e.getPaidTo().equalsIgnoreCase(tech.getName()));
            if (!alreadyLogged) {
                Expense exp = new Expense();
                exp.setCategory(ExpenseCategory.TECHNICIAN_PAYOUT);
                exp.setSalesOrder(installation.getSalesOrder());
                exp.setAmount(amountPaid);
                exp.setExpenseDate(LocalDate.now());
                exp.setTitle("Technician Payout - " + tech.getName());
                exp.setDescription("Disbursed payout for job " + installation.getInstallationNumber());
                exp.setPaidTo(tech.getName());
                exp.setPaymentMethod(tp.getPaymentMethod());
                expenseRepository.save(exp);
            }
        }

        return tp;
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
        dto.setCustomerName(order.getCustomer() != null ? order.getCustomer().getFullName() : "N/A");
        dto.setSystemType(order.getSystemType() != null ? order.getSystemType().name() : "ON_GRID");
        dto.setCapacityKw(order.getCapacityKw() != null ? order.getCapacityKw() : BigDecimal.ZERO);
        dto.setOrderAmount(order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);

        // Revenue baseline: Exclude GST collected from business recognized revenue
        BigDecimal taxAmount;
        if (order.getQuotation() != null && order.getQuotation().getTaxAmount() != null) {
            taxAmount = order.getQuotation().getTaxAmount();
        } else {
            // Standard Solar EPC Turnkey Composite Scheme: 70% Goods @ 12% + 30% Services @ 18% = 13.80% composite GST
            taxAmount = dto.getOrderAmount().multiply(new BigDecimal("13.80"))
                    .divide(new BigDecimal("113.80"), 2, RoundingMode.HALF_UP);
        }
        dto.setTaxAmount(taxAmount);

        BigDecimal recognizedRevenue = dto.getOrderAmount().subtract(taxAmount);
        dto.setRecognizedRevenue(recognizedRevenue);

        // Cash collected
        BigDecimal cashReceived = order.getTotalPaid() != null ? order.getTotalPaid() : BigDecimal.ZERO;
        dto.setRevenueReceived(cashReceived);
        dto.setOutstandingBalance(order.getRemainingBalance() != null ? order.getRemainingBalance() : dto.getOrderAmount().subtract(cashReceived));

        // 1. Hardware BOM Cost: purchase prices from inventory
        BigDecimal hardwareCost = BigDecimal.ZERO;
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
if (item.getProduct() != null && item.getProduct().getPurchasePrice() != null) {
                    BigDecimal itemCost = item.getProduct().getPurchasePrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    hardwareCost = hardwareCost.add(itemCost);
                }
            }
        }
        dto.setHardwareCost(hardwareCost);

        // 2. Installation Labor Cost: pull actual recorded crew hours and payouts
        BigDecimal laborCost = BigDecimal.ZERO;
        Optional<Installation> instOpt = installationRepository.findBySalesOrderId(order.getId());
        if (instOpt.isPresent()) {
            Installation inst = instOpt.get();
            if (inst.getAssignedTechnicians() != null && !inst.getAssignedTechnicians().isEmpty()) {
                for (InstallationTechnician it : inst.getAssignedTechnicians()) {
                    if (it.getPayoutAmount() != null && it.getPayoutAmount().compareTo(BigDecimal.ZERO) > 0) {
                        laborCost = laborCost.add(it.getPayoutAmount());
                    }
                }
            }
        }

        // Check if direct technician payout expenses were logged
        List<Expense> jobExpenses = expenseRepository.findBySalesOrderId(order.getId());
        BigDecimal techExpenseSum = BigDecimal.ZERO;
        BigDecimal transportCost = BigDecimal.ZERO;
        BigDecimal serviceCost = BigDecimal.ZERO;
        BigDecimal otherExpenses = BigDecimal.ZERO;

        for (Expense exp : jobExpenses) {
            if (exp.getCategory() == ExpenseCategory.TECHNICIAN_PAYOUT) {
                techExpenseSum = techExpenseSum.add(exp.getAmount());
            } else if (exp.getCategory() == ExpenseCategory.TRANSPORT) {
                transportCost = transportCost.add(exp.getAmount());
            } else if (exp.getCategory() == ExpenseCategory.SERVICE_REPAIR) {
                serviceCost = serviceCost.add(exp.getAmount());
            } else {
                otherExpenses = otherExpenses.add(exp.getAmount());
            }
        }

        // Avoid double-counting labor if both installation crew and tech expense exist
        if (laborCost.compareTo(BigDecimal.ZERO) == 0) {
            laborCost = techExpenseSum;
        }

        // Also check if any service tickets are linked to this order's installation or warranty
        if (instOpt.isPresent()) {
            List<ServiceTicket> tickets = serviceTicketRepository.findByInstallationSalesOrderId(order.getId());
            for (ServiceTicket st : tickets) {
                List<Expense> ticketExpenses = expenseRepository.findAll().stream()
                        .filter(e -> e.getServiceTicket() != null && e.getServiceTicket().getId().equals(st.getId()))
                        .toList();
                for (Expense te : ticketExpenses) {
                    serviceCost = serviceCost.add(te.getAmount());
                }
            }
        }

        dto.setInstallationLaborCost(laborCost);
        dto.setTransportCost(transportCost);
        dto.setServiceRepairCost(serviceCost);
        dto.setOtherExpenses(otherExpenses);

        BigDecimal totalProjectCost = hardwareCost.add(laborCost).add(transportCost).add(serviceCost).add(otherExpenses);
        dto.setTotalCost(totalProjectCost);

        // Accounting Net Profit = Recognized Project Revenue - Total Project Cost
        BigDecimal netProfit = recognizedRevenue.subtract(totalProjectCost);
        dto.setNetProfit(netProfit);

        // Cash Profit = Cash Collected (less tax portion) - Total Project Cost
        BigDecimal cashNetRevenue = cashReceived.subtract(
                taxAmount.multiply(cashReceived).divide(dto.getOrderAmount().compareTo(BigDecimal.ZERO) > 0 ? dto.getOrderAmount() : BigDecimal.ONE, 2, RoundingMode.HALF_UP)
        );
        dto.setCashProfit(cashNetRevenue.subtract(totalProjectCost));

        if (recognizedRevenue.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal margin = netProfit.multiply(BigDecimal.valueOf(100)).divide(recognizedRevenue, 2, RoundingMode.HALF_UP);
            dto.setProfitMarginPercentage(margin);
        } else {
            dto.setProfitMarginPercentage(BigDecimal.ZERO);
        }

        // Profitability Status
        if (netProfit.compareTo(BigDecimal.ZERO) < 0) {
            dto.setProfitabilityStatus("LOSS_MAKING");
        } else if (dto.getProfitMarginPercentage().compareTo(BigDecimal.valueOf(25.00)) < 0) {
            dto.setProfitabilityStatus("LOW_MARGIN");
        } else {
            dto.setProfitabilityStatus("PROFITABLE");
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

        // 1. KPI Totals
        BigDecimal totalInvoiced = filteredOrders.stream()
                .map(SalesOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalInvoicedRevenue(totalInvoiced);

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

        dto.setTotalOutstandingReceivables(totalInvoiced.subtract(cashCollected));

        BigDecimal totalHardware = allProfitability.stream()
                .map(JobProfitabilityDTO::getHardwareCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalHardwareCost(totalHardware);

        BigDecimal totalLabor = allProfitability.stream()
                .map(JobProfitabilityDTO::getInstallationLaborCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalInstallationLaborCost(totalLabor);

        List<Expense> allExpenses = expenseRepository.findAll();
        List<Expense> filteredExpenses = allExpenses.stream()
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

        BigDecimal totalProfit = allProfitability.stream()
                .map(JobProfitabilityDTO::getNetProfit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalProjectProfit(totalProfit);

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

        // Aging analysis (0-30, 31-60, 61-90, 90+ days)
        LocalDate today = LocalDate.now();
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

        // 2. Monthly Revenue, Cost, Profit Trends
        Map<String, BigDecimal[]> monthMap = new LinkedHashMap<>();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM yyyy");

        // Populate recent 6 months in chronological order
        LocalDate now = LocalDate.now();
        for (int i = 5; i >= 0; i--) {
            LocalDate m = now.minusMonths(i);
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

        // Direct Project Costs: include Hardware BOM and Installation Labor per month
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

        // Operational and job expenses
        for (Expense e : allExpenses) {
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

        // 3. Expense Category Breakdown
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

        // 4. Payment Status Distribution
        Map<String, Object[]> payMap = new HashMap<>();
        for (Payment p : allPayments) {
            String s = p.getStatus().name();
            Object[] val = payMap.computeIfAbsent(s, k -> new Object[]{0L, BigDecimal.ZERO});
            val[0] = (Long) val[0] + 1;
            val[1] = ((BigDecimal) val[1]).add(p.getAmount());
        }
        List<StatusCountItem> payStatusList = payMap.entrySet().stream()
                .map(e -> new StatusCountItem(e.getKey(), (Long) e.getValue()[0], (BigDecimal) e.getValue()[1]))
                .collect(Collectors.toList());
        dto.setPaymentStatusDistribution(payStatusList);

        // 5. Subsidy Status Distribution
        Map<String, Object[]> subMap = new HashMap<>();
        for (SubsidyApplication sub : subsidyApplicationRepository.findAll()) {
            String s = sub.getStatus().name();
            Object[] val = subMap.computeIfAbsent(s, k -> new Object[]{0L, BigDecimal.ZERO});
            val[0] = (Long) val[0] + 1;
            val[1] = ((BigDecimal) val[1]).add(sub.getSubsidyAmountApproved() != null ? sub.getSubsidyAmountApproved() : sub.getSubsidyAmountClaimed());
        }
        List<StatusCountItem> subStatusList = subMap.entrySet().stream()
                .map(e -> new StatusCountItem(e.getKey(), (Long) e.getValue()[0], (BigDecimal) e.getValue()[1]))
                .collect(Collectors.toList());
        dto.setSubsidyStatusDistribution(subStatusList);

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
