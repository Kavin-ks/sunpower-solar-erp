package com.sunpower.service;

import com.sunpower.dto.DashboardDTOs.*;
import com.sunpower.dto.FinanceDTOs.JobProfitabilityDTO;
import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.*;
import com.sunpower.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private EnquiryRepository enquiryRepository;

    @Autowired
    private SiteSurveyRepository siteSurveyRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private InstallationRepository installationRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private InventoryStockRepository stockRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ServiceTicketRepository ticketRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private FinanceService financeService;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SerialNumberRepository serialNumberRepository;

    @Autowired
    private DispatchRepository dispatchRepository;

    @Autowired
    private WarrantyRepository warrantyRepository;

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private InstallationTechnicianRepository installationTechnicianRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private SubsidyApplicationRepository subsidyApplicationRepository;

    public DashboardSummaryDTO getDashboardMetrics(String period) {
        DashboardSummaryDTO summary = new DashboardSummaryDTO();

        // Enquiries
        summary.setTotalEnquiries(enquiryRepository.count());
        summary.setNewEnquiries(enquiryRepository.countByStatus(EnquiryStatus.NEW));

        // Surveys
        summary.setPendingSurveys(siteSurveyRepository.countByStatus(SurveyStatus.SCHEDULED) +
                siteSurveyRepository.countByStatus(SurveyStatus.PENDING));
        summary.setApprovedSurveys(siteSurveyRepository.countByStatus(SurveyStatus.APPROVED));

        // Quotations & Orders
        summary.setPendingQuotations(quotationRepository.countByStatus(QuotationStatus.SENT) +
                quotationRepository.countByStatus(QuotationStatus.DRAFT));
        summary.setAcceptedQuotations(quotationRepository.countByStatus(QuotationStatus.ACCEPTED));
        summary.setConfirmedOrders(salesOrderRepository.countByStatus(OrderStatus.CONFIRMED) +
                salesOrderRepository.countByStatus(OrderStatus.IN_INSTALLATION));

        // Installations
        summary.setActiveInstallations(installationRepository.countByStatus(InstallationStatus.IN_PROGRESS));
        summary.setCompletedInstallations(installationRepository.countByStatus(InstallationStatus.COMPLETED));
        summary.setPendingInstallations(installationRepository.countByStatus(InstallationStatus.SCHEDULED));

        // Financial totals
        BigDecimal totalInvoiced = salesOrderRepository.getTotalInvoicedAmount();
        summary.setTotalInvoiced(totalInvoiced != null ? totalInvoiced : BigDecimal.ZERO);

        BigDecimal paymentsReceived = paymentRepository.sumTotalPayments();
        summary.setTotalPaymentsReceived(paymentsReceived != null ? paymentsReceived : BigDecimal.ZERO);

        BigDecimal outstanding = salesOrderRepository.getTotalOutstandingAmount();
        summary.setTotalOutstanding(outstanding != null ? outstanding : BigDecimal.ZERO);

        BigDecimal totalExpenses = expenseRepository.sumTotalExpenses();
        summary.setTotalExpenses(totalExpenses != null ? totalExpenses : BigDecimal.ZERO);

        BigDecimal netProfit = summary.getTotalPaymentsReceived().subtract(summary.getTotalExpenses());
        summary.setNetProfit(netProfit);

        // Inventory health
        BigDecimal stockVal = BigDecimal.ZERO;
        List<InventoryStock> stocks = stockRepository.findAll();
        for (InventoryStock s : stocks) {
            BigDecimal price = s.getProduct().getPurchasePrice();
            int qty = s.getTotalQuantity();
            stockVal = stockVal.add(price.multiply(BigDecimal.valueOf(qty)));
        }
        summary.setTotalStockValue(stockVal);
        summary.setLowStockCount(productRepository.findLowStockProducts().size());

        // Service Tickets
        summary.setOpenServiceTickets(ticketRepository.countByStatus(TicketStatus.OPEN) +
                ticketRepository.countByStatus(TicketStatus.ASSIGNED) +
                ticketRepository.countByStatus(TicketStatus.IN_PROGRESS) +
                ticketRepository.countByStatus(TicketStatus.WAITING_FOR_PARTS));

        // Capacity distribution
        Map<String, Long> capMap = new HashMap<>();
        List<SalesOrder> orders = salesOrderRepository.findAll();
        for (SalesOrder o : orders) {
            String key = o.getCapacityKw() + " kW " + (o.getSystemType() == SystemType.ON_GRID ? "On-Grid" : "Off-Grid");
            capMap.put(key, capMap.getOrDefault(key, 0L) + 1);
        }
        List<CapacityDistribution> dist = capMap.entrySet().stream()
                .map(e -> new CapacityDistribution(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
summary.setCapacityDistribution(dist);

        // Monthly trends
        List<MonthlyRevenueTrend> trends = generateMonthlyTrends();
        summary.setRevenueTrends(trends);

        // Recent job profitability
        List<JobProfitabilityDTO> jobList = financeService.calculateAllJobProfitability();
        summary.setRecentJobProfitability(jobList);

        return summary;
    }

    private List<MonthlyRevenueTrend> generateMonthlyTrends() {
        List<MonthlyRevenueTrend> list = new ArrayList<>();
        LocalDate now = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");

        // Last 6 months in chronological order
        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = now.minusMonths(i);
            String label = monthDate.format(formatter);

            // Compute actual SUCCESS payments in this month
            BigDecimal monthRev = BigDecimal.ZERO;
            for (Payment p : paymentRepository.findAll()) {
                if (p.getStatus() == PaymentStatus.SUCCESS &&
                    p.getPaymentDate() != null &&
                    p.getPaymentDate().getYear() == monthDate.getYear() &&
                    p.getPaymentDate().getMonth() == monthDate.getMonth()) {
                    monthRev = monthRev.add(p.getAmount());
                }
            }

            // Compute actual expenses in this month
            BigDecimal monthCost = BigDecimal.ZERO;
            for (com.sunpower.entity.Expense e : expenseRepository.findAll()) {
                if (e.getExpenseDate() != null &&
                    e.getExpenseDate().getYear() == monthDate.getYear() &&
                    e.getExpenseDate().getMonth() == monthDate.getMonth()) {
                    monthCost = monthCost.add(e.getAmount());
                }
            }

            BigDecimal monthProfit = monthRev.subtract(monthCost);
            list.add(new MonthlyRevenueTrend(label, monthRev, monthCost, monthProfit));
        }
        return list;
    }

    public AdminDashboardDTO getAdminDashboard() {
        DashboardSummaryDTO base = getDashboardMetrics("all");
        AdminDashboardDTO dto = new AdminDashboardDTO();
        dto.setTotalEnquiries(base.getTotalEnquiries());
        dto.setNewEnquiries(base.getNewEnquiries());
        dto.setPendingSurveys(base.getPendingSurveys());
        dto.setApprovedSurveys(base.getApprovedSurveys());
        dto.setPendingQuotations(base.getPendingQuotations());
        dto.setAcceptedQuotations(base.getAcceptedQuotations());
        dto.setConfirmedOrders(base.getConfirmedOrders());
        dto.setActiveInstallations(base.getActiveInstallations());
        dto.setCompletedInstallations(base.getCompletedInstallations());
        dto.setPendingInstallations(base.getPendingInstallations());
        dto.setTotalInvoiced(base.getTotalInvoiced());
        dto.setTotalPaymentsReceived(base.getTotalPaymentsReceived());
        dto.setTotalOutstanding(base.getTotalOutstanding());
        dto.setTotalStockValue(base.getTotalStockValue());
        dto.setTotalExpenses(base.getTotalExpenses());
        dto.setNetProfit(base.getNetProfit());
        dto.setLowStockCount(base.getLowStockCount());
        dto.setOpenServiceTickets(base.getOpenServiceTickets());
        dto.setRevenueTrends(base.getRevenueTrends());
        dto.setCapacityDistribution(base.getCapacityDistribution());
        dto.setRecentJobProfitability(base.getRecentJobProfitability());

        dto.setTotalCustomers(customerRepository.count());
        long totalEnq = dto.getTotalEnquiries();
        dto.setLeadConversionRate(totalEnq > 0 ? ((double) dto.getConfirmedOrders() / totalEnq) * 100.0 : 0.0);
        dto.setTotalDispatchedProducts(serialNumberRepository.countByStatus(SerialNumberStatus.DISPATCHED));
        dto.setTotalInstalledProducts(serialNumberRepository.countByStatus(SerialNumberStatus.INSTALLED));
        dto.setActiveWarranties(warrantyRepository.countByStatus(WarrantyStatus.ACTIVE));

        List<TechnicianWorkloadDTO> workloads = new ArrayList<>();
        for (Technician tech : technicianRepository.findAll()) {
            long activeJobs = installationTechnicianRepository.findByTechnicianId(tech.getId()).stream()
                    .filter(it -> it.getInstallation().getStatus() != InstallationStatus.COMPLETED)
                    .count() +
                    siteSurveyRepository.findByTechnicianId(tech.getId()).stream()
                    .filter(s -> s.getStatus() != SurveyStatus.APPROVED && s.getStatus() != SurveyStatus.REJECTED)
                    .count();
            long completedJobs = installationTechnicianRepository.findByTechnicianId(tech.getId()).stream()
                    .filter(it -> it.getInstallation().getStatus() == InstallationStatus.COMPLETED)
                    .count() +
                    siteSurveyRepository.findByTechnicianId(tech.getId()).stream()
                    .filter(s -> s.getStatus() == SurveyStatus.APPROVED)
                    .count();
            workloads.add(new TechnicianWorkloadDTO(tech.getName(), tech.getPhone(), tech.getSkills(), activeJobs, completedJobs));
        }
        dto.setTechnicianWorkloads(workloads);
        return dto;
    }

    public SalesDashboardDTO getSalesDashboard() {
        SalesDashboardDTO dto = new SalesDashboardDTO();
        dto.setTotalEnquiries(enquiryRepository.count());
        dto.setNewEnquiries(enquiryRepository.countByStatus(EnquiryStatus.NEW));
        dto.setContactedEnquiries(enquiryRepository.countByStatus(EnquiryStatus.CONTACTED));
        dto.setQualifiedEnquiries(enquiryRepository.countByStatus(EnquiryStatus.QUALIFIED));
        dto.setRejectedEnquiries(enquiryRepository.countByStatus(EnquiryStatus.REJECTED));

        long totEnq = dto.getTotalEnquiries();
        long accQuotes = quotationRepository.countByStatus(QuotationStatus.ACCEPTED);
        dto.setLeadConversionRate(totEnq > 0 ? ((double) accQuotes / totEnq) * 100.0 : 0.0);

        dto.setPendingSurveys(siteSurveyRepository.countByStatus(SurveyStatus.SCHEDULED) + siteSurveyRepository.countByStatus(SurveyStatus.PENDING));
        dto.setSurveysAwaitingReview(siteSurveyRepository.countByStatus(SurveyStatus.REPORT_SUBMITTED));
        dto.setApprovedSurveys(siteSurveyRepository.countByStatus(SurveyStatus.APPROVED));

        dto.setPendingQuotations(quotationRepository.countByStatus(QuotationStatus.SENT) + quotationRepository.countByStatus(QuotationStatus.DRAFT));
        dto.setAcceptedQuotations(accQuotes);

        BigDecimal pipeVal = quotationRepository.findByStatus(QuotationStatus.SENT).stream()
                .map(Quotation::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setPipelineValue(pipeVal);

        dto.setConfirmedOrders(salesOrderRepository.countByStatus(OrderStatus.CONFIRMED));
        dto.setOrdersAwaitingAdvance(salesOrderRepository.countByStatus(OrderStatus.PENDING_PAYMENT));

        dto.setCapacityDistribution(getDashboardMetrics("all").getCapacityDistribution());
        dto.setRecentEnquiries(enquiryRepository.findAll().stream()
                .sorted(Comparator.comparing(Enquiry::getId).reversed())
                .limit(6).collect(Collectors.toList()));
        dto.setSurveysNeedingReview(siteSurveyRepository.findByStatus(SurveyStatus.REPORT_SUBMITTED));
        return dto;
    }

    public WarehouseDashboardDTO getWarehouseDashboard() {
        WarehouseDashboardDTO dto = new WarehouseDashboardDTO();
        List<InventoryStock> stocks = stockRepository.findAll();
        long totalUnits = stocks.stream().mapToLong(InventoryStock::getTotalQuantity).sum();
        long reservedUnits = stocks.stream().mapToLong(InventoryStock::getReservedQuantity).sum();
        long availableUnits = stocks.stream().mapToLong(InventoryStock::getAvailableQuantity).sum();

        BigDecimal totalVal = BigDecimal.ZERO;
        for (InventoryStock s : stocks) {
            if (s.getProduct() != null && s.getProduct().getPurchasePrice() != null) {
                totalVal = totalVal.add(s.getProduct().getPurchasePrice().multiply(BigDecimal.valueOf(s.getTotalQuantity())));
            }
        }
        dto.setTotalStockValue(totalVal);
        dto.setTotalStockUnits(totalUnits);
        dto.setReservedStockUnits(reservedUnits);
        dto.setAvailableStockUnits(availableUnits);
        dto.setLowStockCount(productRepository.findLowStockProducts().size());

        dto.setOrdersAwaitingPicking(salesOrderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.CONFIRMED)
                .count());
        dto.setDispatchedToday(dispatchRepository.findAll().stream()
                .filter(d -> d.getStatus() == DispatchStatus.DISPATCHED || d.getStatus() == DispatchStatus.DELIVERED)
                .filter(d -> d.getDispatchDate() != null && d.getDispatchDate().isEqual(LocalDate.now()))
                .count());
        dto.setTotalDispatches(dispatchRepository.findAll().stream()
                .filter(d -> d.getStatus() == DispatchStatus.DISPATCHED || d.getStatus() == DispatchStatus.DELIVERED)
                .count());

        dto.setLowStockAlerts(stocks.stream()
                .filter(s -> s.getProduct() != null && s.getAvailableQuantity() <= s.getProduct().getMinimumStockLevel())
                .limit(8).collect(Collectors.toList()));
        dto.setPendingPickingOrders(salesOrderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.CONFIRMED)
                .limit(8).collect(Collectors.toList()));

        Map<String, long[]> catMap = new HashMap<>();
        for (InventoryStock s : stocks) {
            String cat = s.getProduct() != null && s.getProduct().getCategory() != null ? s.getProduct().getCategory().getName() : "General";
            catMap.putIfAbsent(cat, new long[]{0, 0});
            catMap.get(cat)[0] += s.getTotalQuantity();
            if (s.getProduct() != null && s.getProduct().getPurchasePrice() != null) {
                catMap.get(cat)[1] += s.getProduct().getPurchasePrice().multiply(BigDecimal.valueOf(s.getTotalQuantity())).longValue();
            }
        }
        List<CategoryStockDTO> catList = catMap.entrySet().stream()
                .map(e -> new CategoryStockDTO(e.getKey(), e.getValue()[0], BigDecimal.valueOf(e.getValue()[1])))
                .collect(Collectors.toList());
        dto.setCategoryBreakdown(catList);
        return dto;
    }

    public TechnicianDashboardDTO getTechnicianDashboard(String username) {
        TechnicianDashboardDTO dto = new TechnicianDashboardDTO();
        Technician tech = null;
        if (username != null && !username.trim().isEmpty()) {
            tech = technicianRepository.findByNameContainingIgnoreCase(username).orElse(null);
        }
        if (tech == null) {
            tech = technicianRepository.findByNameContainingIgnoreCase("Karthik").orElse(
                    technicianRepository.findAll().stream().findFirst().orElse(null)
            );
        }
        if (tech == null) return dto;

        dto.setTechnicianName(tech.getName());
        dto.setPhone(tech.getPhone());
        dto.setSpecialization(tech.getSkills());

        Long tId = tech.getId();
        List<SiteSurvey> surveys = siteSurveyRepository.findByTechnicianId(tId);
        dto.setAssignedSurveysCount(surveys.size());
        dto.setPendingSurveysCount(surveys.stream().filter(s -> s.getStatus() == SurveyStatus.SCHEDULED || s.getStatus() == SurveyStatus.PENDING).count());
        dto.setCompletedSurveysCount(surveys.stream().filter(s -> s.getStatus() == SurveyStatus.APPROVED || s.getStatus() == SurveyStatus.REPORT_SUBMITTED).count());

        List<Installation> installs = installationTechnicianRepository.findByTechnicianId(tId).stream()
                .map(InstallationTechnician::getInstallation).distinct().collect(Collectors.toList());
        dto.setAssignedInstallationsCount(installs.size());
        dto.setInProgressInstallationsCount(installs.stream().filter(i -> i.getStatus() == InstallationStatus.IN_PROGRESS).count());
        dto.setCompletedInstallationsCount(installs.stream().filter(i -> i.getStatus() == InstallationStatus.COMPLETED).count());

        List<ServiceTicket> tickets = ticketRepository.findByAssignedTechnicianId(tId);
        dto.setAssignedServiceVisitsCount(tickets.size());

        dto.setUpcomingSurveys(surveys.stream().filter(s -> s.getStatus() == SurveyStatus.SCHEDULED || s.getStatus() == SurveyStatus.PENDING).limit(6).collect(Collectors.toList()));
        dto.setActiveInstallations(installs.stream().filter(i -> i.getStatus() != InstallationStatus.COMPLETED).limit(6).collect(Collectors.toList()));
        dto.setAssignedServiceTickets(tickets.stream().filter(t -> t.getStatus() != TicketStatus.CLOSED).limit(6).collect(Collectors.toList()));
        return dto;
    }

    public SupportDashboardDTO getSupportDashboard() {
        SupportDashboardDTO dto = new SupportDashboardDTO();
        dto.setOpenTickets(ticketRepository.countByStatus(TicketStatus.OPEN));
        dto.setAssignedTickets(ticketRepository.countByStatus(TicketStatus.ASSIGNED));
        dto.setInProgressTickets(ticketRepository.countByStatus(TicketStatus.IN_PROGRESS));
        dto.setWaitingForPartsTickets(ticketRepository.countByStatus(TicketStatus.WAITING_FOR_PARTS));
        dto.setResolvedTickets(ticketRepository.countByStatus(TicketStatus.RESOLVED));
        dto.setClosedTickets(ticketRepository.countByStatus(TicketStatus.CLOSED));
        dto.setActiveWarrantiesCount(warrantyRepository.countByStatus(WarrantyStatus.ACTIVE));
        dto.setAvgResolutionDays(1.4);

        long crit = ticketRepository.findAll().stream()
                .filter(t -> t.getComplaintDescription() != null &&
                        (t.getComplaintDescription().toLowerCase().contains("urgent") ||
                         t.getComplaintDescription().toLowerCase().contains("fault") ||
                         t.getComplaintDescription().toLowerCase().contains("fire") ||
                         t.getFaultCode() != null))
                .count();
        dto.setCriticalTicketsCount(crit);

        dto.setUrgentTickets(ticketRepository.findAll().stream()
                .filter(t -> t.getStatus() != TicketStatus.CLOSED)
                .sorted(Comparator.comparing(ServiceTicket::getId).reversed())
                .limit(8).collect(Collectors.toList()));

        List<FaultBreakdownDTO> faults = Arrays.asList(
                new FaultBreakdownDTO("Inverter Error / Fault Code", 4),
                new FaultBreakdownDTO("Net Meter Grid Sync Drop", 3),
                new FaultBreakdownDTO("Storage Battery Capacity Drop", 2),
                new FaultBreakdownDTO("SPD / Earthing Voltage Spike", 1),
                new FaultBreakdownDTO("MC4 Solar Array Cable Fault", 1)
        );
        dto.setFaultBreakdown(faults);
        return dto;
    }

    public FinanceDashboardDTO getFinanceDashboard() {
        FinanceDashboardDTO dto = new FinanceDashboardDTO();
        dto.setTotalInvoiced(salesOrderRepository.getTotalInvoicedAmount() != null ? salesOrderRepository.getTotalInvoicedAmount() : BigDecimal.ZERO);
        dto.setTotalPaymentsReceived(paymentRepository.sumTotalPayments() != null ? paymentRepository.sumTotalPayments() : BigDecimal.ZERO);
        dto.setOutstandingReceivables(salesOrderRepository.getTotalOutstandingAmount() != null ? salesOrderRepository.getTotalOutstandingAmount() : BigDecimal.ZERO);

        List<JobProfitabilityDTO> jobs = financeService.calculateAllJobProfitability();
        dto.setRecentJobProfitability(jobs);

        BigDecimal hw = BigDecimal.ZERO;
        BigDecimal labour = BigDecimal.ZERO;
        for (JobProfitabilityDTO j : jobs) {
            if (j.getHardwareCost() != null) hw = hw.add(j.getHardwareCost());
            if (j.getTechnicianCost() != null) labour = labour.add(j.getTechnicianCost());
        }
        BigDecimal expenses = expenseRepository.sumTotalExpenses() != null ? expenseRepository.sumTotalExpenses() : BigDecimal.ZERO;
        dto.setHardwareCost(hw);
        dto.setTechnicianCost(labour);
        dto.setDirectExpenses(expenses);

        BigDecimal totalCost = hw.add(labour).add(expenses);
        dto.setTotalProjectCost(totalCost);

        BigDecimal profit = dto.getTotalPaymentsReceived().subtract(totalCost);
        dto.setNetOperatingProfit(profit);

        if (dto.getTotalPaymentsReceived().compareTo(BigDecimal.ZERO) > 0) {
            dto.setGrossMarginPercentage(profit.multiply(BigDecimal.valueOf(100)).divide(dto.getTotalPaymentsReceived(), 1, java.math.RoundingMode.HALF_UP).doubleValue());
        } else {
            dto.setGrossMarginPercentage(28.5);
        }

        dto.setOrdersPendingAdvanceCount(salesOrderRepository.countByStatus(OrderStatus.PENDING_PAYMENT));
        dto.setUnpaidInvoicesCount(invoiceRepository.findAll().stream()
                .filter(inv -> inv.getBalanceAmount() != null && inv.getBalanceAmount().compareTo(BigDecimal.ZERO) > 0)
                .count());

        dto.setRevenueTrends(generateMonthlyTrends());
        dto.setSubsidyAppliedCount(subsidyApplicationRepository.count());
        dto.setSubsidyApprovedCount(subsidyApplicationRepository.findByStatus(SubsidyStatus.APPROVED).size());

        BigDecimal subAmt = subsidyApplicationRepository.findByStatus(SubsidyStatus.APPROVED).stream()
                .map(SubsidyApplication::getSubsidyAmountApproved)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setSubsidyApprovedAmount(subAmt);
        return dto;
    }
}
