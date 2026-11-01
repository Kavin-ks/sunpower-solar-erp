package com.sunpower.dto;

import com.sunpower.entity.enums.Enums.ExpenseCategory;
import com.sunpower.entity.enums.Enums.SubsidyStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class FinanceDTOs {

    public static class ExpenseCreateRequest {
        @NotNull(message = "Category is required")
        private ExpenseCategory category;

        private Long salesOrderId;
        private Long serviceTicketId;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        private BigDecimal amount;

        private LocalDate expenseDate;

        @NotBlank(message = "Title is required")
        private String title;

        private String description;
        private String paidTo;
        private String paymentMethod = "Bank Transfer";

        public ExpenseCreateRequest() {}

        public ExpenseCategory getCategory() { return category; }
        public void setCategory(ExpenseCategory category) { this.category = category; }
        public Long getSalesOrderId() { return salesOrderId; }
        public void setSalesOrderId(Long salesOrderId) { this.salesOrderId = salesOrderId; }
        public Long getServiceTicketId() { return serviceTicketId; }
        public void setServiceTicketId(Long serviceTicketId) { this.serviceTicketId = serviceTicketId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public LocalDate getExpenseDate() { return expenseDate; }
        public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getPaidTo() { return paidTo; }
        public void setPaidTo(String paidTo) { this.paidTo = paidTo; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    }

    public static class ExpenseApprovalRequest {
        private String rejectionReason;

        public ExpenseApprovalRequest() {}
        public ExpenseApprovalRequest(String rejectionReason) { this.rejectionReason = rejectionReason; }
        public String getRejectionReason() { return rejectionReason; }
        public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    }

    public static class SupplierPaymentRequest {
        @NotNull(message = "Purchase ID is required")
        private Long purchaseId;

        @NotNull(message = "Payment amount is required")
        @DecimalMin(value = "1.00", message = "Payment amount must be greater than zero")
        private BigDecimal amount;

        private LocalDate paymentDate;

        @NotBlank(message = "Payment method is required")
        private String paymentMethod = "Bank Transfer";

        private String referenceNumber; // UTR or Cheque
        private String notes;

        public SupplierPaymentRequest() {}

        public Long getPurchaseId() { return purchaseId; }
        public void setPurchaseId(Long purchaseId) { this.purchaseId = purchaseId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public LocalDate getPaymentDate() { return paymentDate; }
        public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public String getReferenceNumber() { return referenceNumber; }
        public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class JobProfitabilityDTO {
        private Long orderId;
        private String orderNumber;
        private String customerName;
        private String systemType;
        private BigDecimal capacityKw;
        private BigDecimal orderAmount; // Contract Total (incl. GST)
        private BigDecimal taxAmount; // GST component
        private BigDecimal recognizedRevenue; // Excl. GST (True revenue baseline)
        private BigDecimal revenueReceived; // Cash collected
        private BigDecimal outstandingBalance;
        private BigDecimal hardwareCost;
        private BigDecimal installationLaborCost;
        private BigDecimal transportCost;
        private BigDecimal serviceRepairCost;
        private BigDecimal otherExpenses;
        private BigDecimal totalCost;
        private BigDecimal netProfit; // recognizedRevenue - totalCost
        private BigDecimal cashProfit; // revenueReceived - totalCost
        private BigDecimal profitMarginPercentage;
        private String profitabilityStatus; // PROFITABLE, LOW_MARGIN, LOSS_MAKING
        private String subsidyStatus;
        private long openServiceTicketsCount;

        public JobProfitabilityDTO() {}

        public Long getOrderId() { return orderId; }
        public void setOrderId(Long orderId) { this.orderId = orderId; }
        public String getOrderNumber() { return orderNumber; }
        public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }
        public String getSystemType() { return systemType; }
        public void setSystemType(String systemType) { this.systemType = systemType; }
        public BigDecimal getCapacityKw() { return capacityKw; }
        public void setCapacityKw(BigDecimal capacityKw) { this.capacityKw = capacityKw; }
        public BigDecimal getOrderAmount() { return orderAmount; }
        public void setOrderAmount(BigDecimal orderAmount) { this.orderAmount = orderAmount; }
        public BigDecimal getTaxAmount() { return taxAmount; }
        public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
        public BigDecimal getRecognizedRevenue() { return recognizedRevenue; }
        public void setRecognizedRevenue(BigDecimal recognizedRevenue) { this.recognizedRevenue = recognizedRevenue; }
        public BigDecimal getRevenueReceived() { return revenueReceived; }
        public void setRevenueReceived(BigDecimal revenueReceived) { this.revenueReceived = revenueReceived; }
        public BigDecimal getOutstandingBalance() { return outstandingBalance; }
        public void setOutstandingBalance(BigDecimal outstandingBalance) { this.outstandingBalance = outstandingBalance; }
        public BigDecimal getHardwareCost() { return hardwareCost; }
        public void setHardwareCost(BigDecimal hardwareCost) { this.hardwareCost = hardwareCost; }
        public BigDecimal getInstallationLaborCost() { return installationLaborCost; }
        public void setInstallationLaborCost(BigDecimal installationLaborCost) { this.installationLaborCost = installationLaborCost; }
        public BigDecimal getTransportCost() { return transportCost; }
        public void setTransportCost(BigDecimal transportCost) { this.transportCost = transportCost; }
        public BigDecimal getServiceRepairCost() { return serviceRepairCost; }
        public void setServiceRepairCost(BigDecimal serviceRepairCost) { this.serviceRepairCost = serviceRepairCost; }
        public BigDecimal getOtherExpenses() { return otherExpenses; }
        public void setOtherExpenses(BigDecimal otherExpenses) { this.otherExpenses = otherExpenses; }
        public BigDecimal getTotalCost() { return totalCost; }
        public void setTotalCost(BigDecimal totalCost) { this.totalCost = totalCost; }
        public BigDecimal getNetProfit() { return netProfit; }
        public void setNetProfit(BigDecimal netProfit) { this.netProfit = netProfit; }
        public BigDecimal getCashProfit() { return cashProfit; }
        public void setCashProfit(BigDecimal cashProfit) { this.cashProfit = cashProfit; }
        public BigDecimal getProfitMarginPercentage() { return profitMarginPercentage; }
        public void setProfitMarginPercentage(BigDecimal profitMarginPercentage) { this.profitMarginPercentage = profitMarginPercentage; }
        public String getProfitabilityStatus() { return profitabilityStatus; }
        public void setProfitabilityStatus(String profitabilityStatus) { this.profitabilityStatus = profitabilityStatus; }
        public String getSubsidyStatus() { return subsidyStatus; }
        public void setSubsidyStatus(String subsidyStatus) { this.subsidyStatus = subsidyStatus; }
        public long getOpenServiceTicketsCount() { return openServiceTicketsCount; }
        public void setOpenServiceTicketsCount(long openServiceTicketsCount) { this.openServiceTicketsCount = openServiceTicketsCount; }
        public BigDecimal getTechnicianCost() { return installationLaborCost != null ? installationLaborCost : BigDecimal.ZERO; }
        public void setTechnicianCost(BigDecimal technicianCost) { this.installationLaborCost = technicianCost; }
        public BigDecimal getRecordedExpenses() { return otherExpenses != null ? otherExpenses : BigDecimal.ZERO; }
        public void setRecordedExpenses(BigDecimal recordedExpenses) { this.otherExpenses = recordedExpenses; }
    }

    public static class TechnicianPayoutRequest {
        @NotNull(message = "Technician ID is required")
        private Long technicianId;

        private Long installationId;
        private Double hoursCounted;
        private Double applicableRate;

        @NotNull(message = "Payout amount is required")
        @DecimalMin(value = "1.00", message = "Amount must be positive")
        private BigDecimal amountPaid;

        @NotBlank(message = "Payment method is required")
        private String paymentMethod;

        @NotBlank(message = "Reference / UTR number is required")
        private String referenceNumber;

        private String notes;

        public TechnicianPayoutRequest() {}

        public Long getTechnicianId() { return technicianId; }
        public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
        public Long getInstallationId() { return installationId; }
        public void setInstallationId(Long installationId) { this.installationId = installationId; }
        public Double getHoursCounted() { return hoursCounted; }
        public void setHoursCounted(Double hoursCounted) { this.hoursCounted = hoursCounted; }
        public void setHoursCounted(BigDecimal hours) { this.hoursCounted = hours != null ? hours.doubleValue() : null; }
        public Double getApplicableRate() { return applicableRate; }
        public void setApplicableRate(Double applicableRate) { this.applicableRate = applicableRate; }
        public void setApplicableRate(BigDecimal rate) { this.applicableRate = rate != null ? rate.doubleValue() : null; }
        public BigDecimal getAmountPaid() { return amountPaid; }
        public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public String getReferenceNumber() { return referenceNumber; }
        public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class SubsidyUpdateRequest {
        @NotNull(message = "Subsidy status is required")
        private SubsidyStatus status;

        private String nationalPortalRegNumber;
        private BigDecimal subsidyAmountApproved;
        private LocalDate sanctionDate;
        private BigDecimal amountReceived;
        private LocalDate actualReceiptDate;
        private String notes;
        private String discomConsumerNumber;
        private String discomApplicationNumber;
        private LocalDate feasibilityApprovedDate;
        private LocalDate netMeterInstalledDate;
        private String commissioningCertificateNumber;

        public SubsidyUpdateRequest() {}

        public SubsidyStatus getStatus() { return status; }
        public void setStatus(SubsidyStatus status) { this.status = status; }
        public String getNationalPortalRegNumber() { return nationalPortalRegNumber; }
        public void setNationalPortalRegNumber(String nationalPortalRegNumber) { this.nationalPortalRegNumber = nationalPortalRegNumber; }
        public BigDecimal getSubsidyAmountApproved() { return subsidyAmountApproved; }
        public void setSubsidyAmountApproved(BigDecimal subsidyAmountApproved) { this.subsidyAmountApproved = subsidyAmountApproved; }
        public LocalDate getSanctionDate() { return sanctionDate; }
        public void setSanctionDate(LocalDate sanctionDate) { this.sanctionDate = sanctionDate; }
        public BigDecimal getAmountReceived() { return amountReceived; }
        public void setAmountReceived(BigDecimal amountReceived) { this.amountReceived = amountReceived; }
        public LocalDate getActualReceiptDate() { return actualReceiptDate; }
        public void setActualReceiptDate(LocalDate actualReceiptDate) { this.actualReceiptDate = actualReceiptDate; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public String getDiscomConsumerNumber() { return discomConsumerNumber; }
        public void setDiscomConsumerNumber(String discomConsumerNumber) { this.discomConsumerNumber = discomConsumerNumber; }
        public String getDiscomApplicationNumber() { return discomApplicationNumber; }
        public void setDiscomApplicationNumber(String discomApplicationNumber) { this.discomApplicationNumber = discomApplicationNumber; }
        public LocalDate getFeasibilityApprovedDate() { return feasibilityApprovedDate; }
        public void setFeasibilityApprovedDate(LocalDate feasibilityApprovedDate) { this.feasibilityApprovedDate = feasibilityApprovedDate; }
        public LocalDate getNetMeterInstalledDate() { return netMeterInstalledDate; }
        public void setNetMeterInstalledDate(LocalDate netMeterInstalledDate) { this.netMeterInstalledDate = netMeterInstalledDate; }
        public String getCommissioningCertificateNumber() { return commissioningCertificateNumber; }
        public void setCommissioningCertificateNumber(String commissioningCertificateNumber) { this.commissioningCertificateNumber = commissioningCertificateNumber; }
    }

    public static class InvoiceCancelRequest {
        @NotBlank(message = "Cancellation reason is required")
        private String reason;

        private String cancelledBy;

        public InvoiceCancelRequest() {}
        public InvoiceCancelRequest(String reason) { this.reason = reason; }
        public InvoiceCancelRequest(String reason, String cancelledBy) {
            this.reason = reason;
            this.cancelledBy = cancelledBy;
        }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getCancelledBy() { return cancelledBy; }
        public void setCancelledBy(String cancelledBy) { this.cancelledBy = cancelledBy; }
    }

    public static class FinanceDashboardDTO {
        private BigDecimal totalInvoicedRevenue = BigDecimal.ZERO;
        private BigDecimal totalRecognizedRevenue = BigDecimal.ZERO;
        private BigDecimal totalRevenue = BigDecimal.ZERO; // Authoritative revenue
        private BigDecimal totalTaxCollected = BigDecimal.ZERO;
        private BigDecimal totalCashCollected = BigDecimal.ZERO;
        private BigDecimal totalConfirmedOrderValue = BigDecimal.ZERO;
        private BigDecimal totalPaymentsReceived = BigDecimal.ZERO;
        private BigDecimal totalOutstandingReceivables = BigDecimal.ZERO;
        private BigDecimal pendingCustomerPayments = BigDecimal.ZERO;
        private BigDecimal totalHardwareCost = BigDecimal.ZERO;
        private BigDecimal totalInstallationLaborCost = BigDecimal.ZERO;
        private BigDecimal cogs = BigDecimal.ZERO; // Direct Cost of Goods Sold
        private BigDecimal grossProfit = BigDecimal.ZERO; // Revenue - COGS
        private BigDecimal totalOperationalExpenses = BigDecimal.ZERO;
        private BigDecimal totalExpenses = BigDecimal.ZERO; // COGS + Operational Expenses
        private BigDecimal totalProjectProfit = BigDecimal.ZERO;
        private BigDecimal netProfit = BigDecimal.ZERO; // Gross Profit - Operational Expenses
        private BigDecimal averageProfitMargin = BigDecimal.ZERO;
        private BigDecimal pendingTechnicianPayouts = BigDecimal.ZERO;
        private BigDecimal subsidiesPendingReceipt = BigDecimal.ZERO;
        private BigDecimal outstandingSupplierPayments = BigDecimal.ZERO;
        private long overdueInvoicesCount = 0;
        private BigDecimal overdueInvoicesAmount = BigDecimal.ZERO;
        private BigDecimal netCashFlow = BigDecimal.ZERO;

        private List<MonthlyTrendItem> monthlyRevenueTrends = new ArrayList<>();
        private List<CategoryDistributionItem> expenseCategoryBreakdown = new ArrayList<>();
        private List<StatusCountItem> paymentStatusDistribution = new ArrayList<>();
        private List<StatusCountItem> subsidyStatusDistribution = new ArrayList<>();
        private List<RecentTransactionItem> recentTransactions = new ArrayList<>();

        private BigDecimal aging0To30Days = BigDecimal.ZERO;
        private BigDecimal aging31To60Days = BigDecimal.ZERO;
        private BigDecimal aging61To90Days = BigDecimal.ZERO;
        private BigDecimal agingOver90Days = BigDecimal.ZERO;

        public FinanceDashboardDTO() {}

        public BigDecimal getTotalInvoicedRevenue() { return totalInvoicedRevenue; }
        public void setTotalInvoicedRevenue(BigDecimal totalInvoicedRevenue) { this.totalInvoicedRevenue = totalInvoicedRevenue; }
        public BigDecimal getTotalRecognizedRevenue() { return totalRecognizedRevenue; }
        public void setTotalRecognizedRevenue(BigDecimal totalRecognizedRevenue) { this.totalRecognizedRevenue = totalRecognizedRevenue; }
        public BigDecimal getTotalRevenue() { return totalRevenue; }
        public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
        public BigDecimal getTotalTaxCollected() { return totalTaxCollected; }
        public void setTotalTaxCollected(BigDecimal totalTaxCollected) { this.totalTaxCollected = totalTaxCollected; }
        public BigDecimal getTotalCashCollected() { return totalCashCollected; }
        public void setTotalCashCollected(BigDecimal totalCashCollected) { this.totalCashCollected = totalCashCollected; }
        public BigDecimal getTotalConfirmedOrderValue() { return totalConfirmedOrderValue; }
        public void setTotalConfirmedOrderValue(BigDecimal totalConfirmedOrderValue) { this.totalConfirmedOrderValue = totalConfirmedOrderValue; }
        public BigDecimal getTotalPaymentsReceived() { return totalPaymentsReceived; }
        public void setTotalPaymentsReceived(BigDecimal totalPaymentsReceived) { this.totalPaymentsReceived = totalPaymentsReceived; }
        public BigDecimal getTotalOutstandingReceivables() { return totalOutstandingReceivables; }
        public void setTotalOutstandingReceivables(BigDecimal totalOutstandingReceivables) { this.totalOutstandingReceivables = totalOutstandingReceivables; }
        public BigDecimal getPendingCustomerPayments() { return pendingCustomerPayments; }
        public void setPendingCustomerPayments(BigDecimal pendingCustomerPayments) { this.pendingCustomerPayments = pendingCustomerPayments; }
        public BigDecimal getTotalHardwareCost() { return totalHardwareCost; }
        public void setTotalHardwareCost(BigDecimal totalHardwareCost) { this.totalHardwareCost = totalHardwareCost; }
        public BigDecimal getTotalInstallationLaborCost() { return totalInstallationLaborCost; }
        public void setTotalInstallationLaborCost(BigDecimal totalInstallationLaborCost) { this.totalInstallationLaborCost = totalInstallationLaborCost; }
        public BigDecimal getCogs() { return cogs; }
        public void setCogs(BigDecimal cogs) { this.cogs = cogs; }
        public BigDecimal getGrossProfit() { return grossProfit; }
        public void setGrossProfit(BigDecimal grossProfit) { this.grossProfit = grossProfit; }
        public BigDecimal getTotalOperationalExpenses() { return totalOperationalExpenses; }
        public void setTotalOperationalExpenses(BigDecimal totalOperationalExpenses) { this.totalOperationalExpenses = totalOperationalExpenses; }
        public BigDecimal getTotalExpenses() { return totalExpenses; }
        public void setTotalExpenses(BigDecimal totalExpenses) { this.totalExpenses = totalExpenses; }
        public BigDecimal getTotalProjectProfit() { return totalProjectProfit; }
        public void setTotalProjectProfit(BigDecimal totalProjectProfit) { this.totalProjectProfit = totalProjectProfit; }
        public BigDecimal getNetProfit() { return netProfit; }
        public void setNetProfit(BigDecimal netProfit) { this.netProfit = netProfit; }
        public BigDecimal getAverageProfitMargin() { return averageProfitMargin; }
        public void setAverageProfitMargin(BigDecimal averageProfitMargin) { this.averageProfitMargin = averageProfitMargin; }
        public BigDecimal getPendingTechnicianPayouts() { return pendingTechnicianPayouts; }
        public void setPendingTechnicianPayouts(BigDecimal pendingTechnicianPayouts) { this.pendingTechnicianPayouts = pendingTechnicianPayouts; }
        public BigDecimal getSubsidiesPendingReceipt() { return subsidiesPendingReceipt; }
        public void setSubsidiesPendingReceipt(BigDecimal subsidiesPendingReceipt) { this.subsidiesPendingReceipt = subsidiesPendingReceipt; }
        public BigDecimal getOutstandingSupplierPayments() { return outstandingSupplierPayments; }
        public void setOutstandingSupplierPayments(BigDecimal outstandingSupplierPayments) { this.outstandingSupplierPayments = outstandingSupplierPayments; }
        public long getOverdueInvoicesCount() { return overdueInvoicesCount; }
        public void setOverdueInvoicesCount(long overdueInvoicesCount) { this.overdueInvoicesCount = overdueInvoicesCount; }
        public BigDecimal getOverdueInvoicesAmount() { return overdueInvoicesAmount; }
        public void setOverdueInvoicesAmount(BigDecimal overdueInvoicesAmount) { this.overdueInvoicesAmount = overdueInvoicesAmount; }
        public BigDecimal getNetCashFlow() { return netCashFlow; }
        public void setNetCashFlow(BigDecimal netCashFlow) { this.netCashFlow = netCashFlow; }

        public List<MonthlyTrendItem> getMonthlyRevenueTrends() { return monthlyRevenueTrends; }
        public void setMonthlyRevenueTrends(List<MonthlyTrendItem> monthlyRevenueTrends) { this.monthlyRevenueTrends = monthlyRevenueTrends; }
        public List<CategoryDistributionItem> getExpenseCategoryBreakdown() { return expenseCategoryBreakdown; }
        public void setExpenseCategoryBreakdown(List<CategoryDistributionItem> expenseCategoryBreakdown) { this.expenseCategoryBreakdown = expenseCategoryBreakdown; }
        public List<StatusCountItem> getPaymentStatusDistribution() { return paymentStatusDistribution; }
        public void setPaymentStatusDistribution(List<StatusCountItem> paymentStatusDistribution) { this.paymentStatusDistribution = paymentStatusDistribution; }
        public List<StatusCountItem> getSubsidyStatusDistribution() { return subsidyStatusDistribution; }
        public void setSubsidyStatusDistribution(List<StatusCountItem> subsidyStatusDistribution) { this.subsidyStatusDistribution = subsidyStatusDistribution; }
        public List<RecentTransactionItem> getRecentTransactions() { return recentTransactions; }
        public void setRecentTransactions(List<RecentTransactionItem> recentTransactions) { this.recentTransactions = recentTransactions; }

        public BigDecimal getAging0To30Days() { return aging0To30Days; }
        public void setAging0To30Days(BigDecimal aging0To30Days) { this.aging0To30Days = aging0To30Days; }
        public BigDecimal getAging31To60Days() { return aging31To60Days; }
        public void setAging31To60Days(BigDecimal aging31To60Days) { this.aging31To60Days = aging31To60Days; }
        public BigDecimal getAging61To90Days() { return aging61To90Days; }
        public void setAging61To90Days(BigDecimal aging61To90Days) { this.aging61To90Days = aging61To90Days; }
        public BigDecimal getAgingOver90Days() { return agingOver90Days; }
        public void setAgingOver90Days(BigDecimal agingOver90Days) { this.agingOver90Days = agingOver90Days; }
    }

    public static class MonthlyTrendItem {
        private String month;
        private BigDecimal revenue;
        private BigDecimal cost;
        private BigDecimal profit;

        public MonthlyTrendItem() {}
        public MonthlyTrendItem(String month, BigDecimal revenue, BigDecimal cost, BigDecimal profit) {
            this.month = month;
            this.revenue = revenue;
            this.cost = cost;
            this.profit = profit;
        }

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }
        public BigDecimal getRevenue() { return revenue; }
        public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
        public BigDecimal getCost() { return cost; }
        public void setCost(BigDecimal cost) { this.cost = cost; }
        public BigDecimal getProfit() { return profit; }
        public void setProfit(BigDecimal profit) { this.profit = profit; }
    }

    public static class CategoryDistributionItem {
        private String category;
        private BigDecimal amount;

        public CategoryDistributionItem() {}
        public CategoryDistributionItem(String category, BigDecimal amount) {
            this.category = category;
            this.amount = amount;
        }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }

    public static class StatusCountItem {
        private String status;
        private long count;
        private BigDecimal amount;

        public StatusCountItem() {}
        public StatusCountItem(String status, long count, BigDecimal amount) {
            this.status = status;
            this.count = count;
            this.amount = amount;
        }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }

    public static class RecentTransactionItem {
        private LocalDate date;
        private String type; // CUSTOMER_PAYMENT, TECHNICIAN_PAYOUT, DIRECT_EXPENSE, SUPPLIER_PAYMENT, SUBSIDY_RECEIPT
        private String referenceNumber;
        private String description;
        private BigDecimal amount;
        private String flow; // INFLOW, OUTFLOW
        private String status;

        public RecentTransactionItem() {}
        public RecentTransactionItem(LocalDate date, String type, String referenceNumber, String description, BigDecimal amount, String flow, String status) {
            this.date = date;
            this.type = type;
            this.referenceNumber = referenceNumber;
            this.description = description;
            this.amount = amount;
            this.flow = flow;
            this.status = status;
        }

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getReferenceNumber() { return referenceNumber; }
        public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getFlow() { return flow; }
        public void setFlow(String flow) { this.flow = flow; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class ProfitAndLossReportDTO {
        private String period;
        private BigDecimal totalRevenue = BigDecimal.ZERO;
        private BigDecimal gstExcludedRevenue = BigDecimal.ZERO;
        private BigDecimal hardwareCogs = BigDecimal.ZERO;
        private BigDecimal installationLaborCogs = BigDecimal.ZERO;
        private BigDecimal totalCogs = BigDecimal.ZERO;
        private BigDecimal grossProfit = BigDecimal.ZERO;
        private BigDecimal grossMarginPercentage = BigDecimal.ZERO;
        private List<CategoryDistributionItem> operatingExpensesBreakdown = new ArrayList<>();
        private BigDecimal totalOperatingExpenses = BigDecimal.ZERO;
        private BigDecimal netProfit = BigDecimal.ZERO;
        private BigDecimal netMarginPercentage = BigDecimal.ZERO;

        public ProfitAndLossReportDTO() {}

        public String getPeriod() { return period; }
        public void setPeriod(String period) { this.period = period; }
        public BigDecimal getTotalRevenue() { return totalRevenue; }
        public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
        public BigDecimal getGstExcludedRevenue() { return gstExcludedRevenue; }
        public void setGstExcludedRevenue(BigDecimal gstExcludedRevenue) { this.gstExcludedRevenue = gstExcludedRevenue; }
        public BigDecimal getHardwareCogs() { return hardwareCogs; }
        public void setHardwareCogs(BigDecimal hardwareCogs) { this.hardwareCogs = hardwareCogs; }
        public BigDecimal getInstallationLaborCogs() { return installationLaborCogs; }
        public void setInstallationLaborCogs(BigDecimal installationLaborCogs) { this.installationLaborCogs = installationLaborCogs; }
        public BigDecimal getTotalCogs() { return totalCogs; }
        public void setTotalCogs(BigDecimal totalCogs) { this.totalCogs = totalCogs; }
        public BigDecimal getGrossProfit() { return grossProfit; }
        public void setGrossProfit(BigDecimal grossProfit) { this.grossProfit = grossProfit; }
        public BigDecimal getGrossMarginPercentage() { return grossMarginPercentage; }
        public void setGrossMarginPercentage(BigDecimal grossMarginPercentage) { this.grossMarginPercentage = grossMarginPercentage; }
        public List<CategoryDistributionItem> getOperatingExpensesBreakdown() { return operatingExpensesBreakdown; }
        public void setOperatingExpensesBreakdown(List<CategoryDistributionItem> operatingExpensesBreakdown) { this.operatingExpensesBreakdown = operatingExpensesBreakdown; }
        public BigDecimal getTotalOperatingExpenses() { return totalOperatingExpenses; }
        public void setTotalOperatingExpenses(BigDecimal totalOperatingExpenses) { this.totalOperatingExpenses = totalOperatingExpenses; }
        public BigDecimal getNetProfit() { return netProfit; }
        public void setNetProfit(BigDecimal netProfit) { this.netProfit = netProfit; }
        public BigDecimal getNetMarginPercentage() { return netMarginPercentage; }
        public void setNetMarginPercentage(BigDecimal netMarginPercentage) { this.netMarginPercentage = netMarginPercentage; }
    }

    public static class CashFlowReportDTO {
        private String period;
        private BigDecimal openingBalance = BigDecimal.ZERO;
        private BigDecimal customerReceipts = BigDecimal.ZERO;
        private BigDecimal subsidyReceipts = BigDecimal.ZERO;
        private BigDecimal totalOperatingInflows = BigDecimal.ZERO;
        private BigDecimal supplierPayments = BigDecimal.ZERO;
        private BigDecimal technicianPayouts = BigDecimal.ZERO;
        private BigDecimal directOperatingExpenses = BigDecimal.ZERO;
        private BigDecimal totalOperatingOutflows = BigDecimal.ZERO;
        private BigDecimal netOperatingCashFlow = BigDecimal.ZERO;
        private BigDecimal closingBalance = BigDecimal.ZERO;

        public CashFlowReportDTO() {}

        public String getPeriod() { return period; }
        public void setPeriod(String period) { this.period = period; }
        public BigDecimal getOpeningBalance() { return openingBalance; }
        public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }
        public BigDecimal getCustomerReceipts() { return customerReceipts; }
        public void setCustomerReceipts(BigDecimal customerReceipts) { this.customerReceipts = customerReceipts; }
        public BigDecimal getSubsidyReceipts() { return subsidyReceipts; }
        public void setSubsidyReceipts(BigDecimal subsidyReceipts) { this.subsidyReceipts = subsidyReceipts; }
        public BigDecimal getTotalOperatingInflows() { return totalOperatingInflows; }
        public void setTotalOperatingInflows(BigDecimal totalOperatingInflows) { this.totalOperatingInflows = totalOperatingInflows; }
        public BigDecimal getSupplierPayments() { return supplierPayments; }
        public void setSupplierPayments(BigDecimal supplierPayments) { this.supplierPayments = supplierPayments; }
        public BigDecimal getTechnicianPayouts() { return technicianPayouts; }
        public void setTechnicianPayouts(BigDecimal technicianPayouts) { this.technicianPayouts = technicianPayouts; }
        public BigDecimal getDirectOperatingExpenses() { return directOperatingExpenses; }
        public void setDirectOperatingExpenses(BigDecimal directOperatingExpenses) { this.directOperatingExpenses = directOperatingExpenses; }
        public BigDecimal getTotalOperatingOutflows() { return totalOperatingOutflows; }
        public void setTotalOperatingOutflows(BigDecimal totalOperatingOutflows) { this.totalOperatingOutflows = totalOperatingOutflows; }
        public BigDecimal getNetOperatingCashFlow() { return netOperatingCashFlow; }
        public void setNetOperatingCashFlow(BigDecimal netOperatingCashFlow) { this.netOperatingCashFlow = netOperatingCashFlow; }
        public BigDecimal getClosingBalance() { return closingBalance; }
        public void setClosingBalance(BigDecimal closingBalance) { this.closingBalance = closingBalance; }
    }

    public static class GstReportDTO {
        private String period;
        private BigDecimal totalTaxableSales = BigDecimal.ZERO;
        private BigDecimal outputCgst = BigDecimal.ZERO;
        private BigDecimal outputSgst = BigDecimal.ZERO;
        private BigDecimal outputIgst = BigDecimal.ZERO;
        private BigDecimal totalOutputGst = BigDecimal.ZERO;
        private BigDecimal inputGst = BigDecimal.ZERO;
        private BigDecimal netGstPayable = BigDecimal.ZERO;

        public GstReportDTO() {}

        public String getPeriod() { return period; }
        public void setPeriod(String period) { this.period = period; }
        public BigDecimal getTotalTaxableSales() { return totalTaxableSales; }
        public void setTotalTaxableSales(BigDecimal totalTaxableSales) { this.totalTaxableSales = totalTaxableSales; }
        public BigDecimal getOutputCgst() { return outputCgst; }
        public void setOutputCgst(BigDecimal outputCgst) { this.outputCgst = outputCgst; }
        public BigDecimal getOutputSgst() { return outputSgst; }
        public void setOutputSgst(BigDecimal outputSgst) { this.outputSgst = outputSgst; }
        public BigDecimal getOutputIgst() { return outputIgst; }
        public void setOutputIgst(BigDecimal outputIgst) { this.outputIgst = outputIgst; }
        public BigDecimal getTotalOutputGst() { return totalOutputGst; }
        public void setTotalOutputGst(BigDecimal totalOutputGst) { this.totalOutputGst = totalOutputGst; }
        public BigDecimal getInputGst() { return inputGst; }
        public void setInputGst(BigDecimal inputGst) { this.inputGst = inputGst; }
        public BigDecimal getNetGstPayable() { return netGstPayable; }
        public void setNetGstPayable(BigDecimal netGstPayable) { this.netGstPayable = netGstPayable; }
    }
}
