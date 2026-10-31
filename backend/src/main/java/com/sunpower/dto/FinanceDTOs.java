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

        // Backward compatibility helpers for older controllers
        public BigDecimal getTechnicianCost() { return installationLaborCost != null ? installationLaborCost : BigDecimal.ZERO; }
        public void setTechnicianCost(BigDecimal technicianCost) { this.installationLaborCost = technicianCost; }
        public BigDecimal getRecordedExpenses() { return otherExpenses != null ? otherExpenses : BigDecimal.ZERO; }
        public void setRecordedExpenses(BigDecimal recordedExpenses) { this.otherExpenses = recordedExpenses; }
    }

    public static class TechnicianPayoutRequest {
        @NotNull(message = "Technician ID is required")
        private Long technicianId;

        private Long installationId;

        @NotNull(message = "Hours counted is required")
        @DecimalMin(value = "0.1", message = "Hours must be greater than zero")
        private BigDecimal hoursCounted;

        private BigDecimal applicableRate = BigDecimal.valueOf(250.00);

        @NotNull(message = "Amount paid is required")
        @DecimalMin(value = "0.01", message = "Amount paid must be greater than zero")
        private BigDecimal amountPaid;

        private String paymentMethod = "Bank Transfer";
        private String referenceNumber;
        private String notes;

        public TechnicianPayoutRequest() {}

        public Long getTechnicianId() { return technicianId; }
        public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
        public Long getInstallationId() { return installationId; }
        public void setInstallationId(Long installationId) { this.installationId = installationId; }
        public BigDecimal getHoursCounted() { return hoursCounted; }
        public void setHoursCounted(BigDecimal hoursCounted) { this.hoursCounted = hoursCounted; }
        public BigDecimal getApplicableRate() { return applicableRate; }
        public void setApplicableRate(BigDecimal applicableRate) { this.applicableRate = applicableRate; }
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
        private BigDecimal totalTaxCollected = BigDecimal.ZERO;
        private BigDecimal totalCashCollected = BigDecimal.ZERO;
        private BigDecimal totalConfirmedOrderValue = BigDecimal.ZERO;
        private BigDecimal totalPaymentsReceived = BigDecimal.ZERO;
        private BigDecimal totalOutstandingReceivables = BigDecimal.ZERO;
        private BigDecimal totalHardwareCost = BigDecimal.ZERO;
        private BigDecimal totalInstallationLaborCost = BigDecimal.ZERO;
        private BigDecimal totalOperationalExpenses = BigDecimal.ZERO;
        private BigDecimal totalProjectProfit = BigDecimal.ZERO;
        private BigDecimal averageProfitMargin = BigDecimal.ZERO;
        private BigDecimal pendingTechnicianPayouts = BigDecimal.ZERO;
        private BigDecimal subsidiesPendingReceipt = BigDecimal.ZERO;
        private List<MonthlyTrendItem> monthlyRevenueTrends = new ArrayList<>();
        private List<CategoryDistributionItem> expenseCategoryBreakdown = new ArrayList<>();
        private List<StatusCountItem> paymentStatusDistribution = new ArrayList<>();
        private List<StatusCountItem> subsidyStatusDistribution = new ArrayList<>();

        public FinanceDashboardDTO() {}

        public BigDecimal getTotalInvoicedRevenue() { return totalInvoicedRevenue; }
        public void setTotalInvoicedRevenue(BigDecimal totalInvoicedRevenue) { this.totalInvoicedRevenue = totalInvoicedRevenue; }
        public BigDecimal getTotalRecognizedRevenue() { return totalRecognizedRevenue; }
        public void setTotalRecognizedRevenue(BigDecimal totalRecognizedRevenue) { this.totalRecognizedRevenue = totalRecognizedRevenue; }
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
        public BigDecimal getTotalHardwareCost() { return totalHardwareCost; }
        public void setTotalHardwareCost(BigDecimal totalHardwareCost) { this.totalHardwareCost = totalHardwareCost; }
        public BigDecimal getTotalInstallationLaborCost() { return totalInstallationLaborCost; }
        public void setTotalInstallationLaborCost(BigDecimal totalInstallationLaborCost) { this.totalInstallationLaborCost = totalInstallationLaborCost; }
        public BigDecimal getTotalOperationalExpenses() { return totalOperationalExpenses; }
        public void setTotalOperationalExpenses(BigDecimal totalOperationalExpenses) { this.totalOperationalExpenses = totalOperationalExpenses; }
        public BigDecimal getTotalProjectProfit() { return totalProjectProfit; }
        public void setTotalProjectProfit(BigDecimal totalProjectProfit) { this.totalProjectProfit = totalProjectProfit; }
        public BigDecimal getAverageProfitMargin() { return averageProfitMargin; }
        public void setAverageProfitMargin(BigDecimal averageProfitMargin) { this.averageProfitMargin = averageProfitMargin; }
        public BigDecimal getPendingTechnicianPayouts() { return pendingTechnicianPayouts; }
        public void setPendingTechnicianPayouts(BigDecimal pendingTechnicianPayouts) { this.pendingTechnicianPayouts = pendingTechnicianPayouts; }
        public BigDecimal getSubsidiesPendingReceipt() { return subsidiesPendingReceipt; }
        public void setSubsidiesPendingReceipt(BigDecimal subsidiesPendingReceipt) { this.subsidiesPendingReceipt = subsidiesPendingReceipt; }
        public List<MonthlyTrendItem> getMonthlyRevenueTrends() { return monthlyRevenueTrends; }
        public void setMonthlyRevenueTrends(List<MonthlyTrendItem> monthlyRevenueTrends) { this.monthlyRevenueTrends = monthlyRevenueTrends; }
        public List<CategoryDistributionItem> getExpenseCategoryBreakdown() { return expenseCategoryBreakdown; }
        public void setExpenseCategoryBreakdown(List<CategoryDistributionItem> expenseCategoryBreakdown) { this.expenseCategoryBreakdown = expenseCategoryBreakdown; }
        public List<StatusCountItem> getPaymentStatusDistribution() { return paymentStatusDistribution; }
        public void setPaymentStatusDistribution(List<StatusCountItem> paymentStatusDistribution) { this.paymentStatusDistribution = paymentStatusDistribution; }
        public List<StatusCountItem> getSubsidyStatusDistribution() { return subsidyStatusDistribution; }
        public void setSubsidyStatusDistribution(List<StatusCountItem> subsidyStatusDistribution) { this.subsidyStatusDistribution = subsidyStatusDistribution; }
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
}
