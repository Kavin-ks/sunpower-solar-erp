package com.sunpower.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardDTOs {

    public static class DashboardSummaryDTO {
        // Enquiries
        private long totalEnquiries;
        private long newEnquiries;

        // Surveys
        private long pendingSurveys;
        private long approvedSurveys;

        // Quotations & Orders
        private long pendingQuotations;
        private long acceptedQuotations;
        private long confirmedOrders;

        // Installations
        private long activeInstallations;
        private long completedInstallations;
        private long pendingInstallations;

        // Financials
        private BigDecimal totalInvoiced;
        private BigDecimal totalPaymentsReceived;
        private BigDecimal totalOutstanding;
        private BigDecimal totalStockValue;
        private BigDecimal totalExpenses;
        private BigDecimal netProfit;

        // Inventory & Service
        private long lowStockCount;
        private long openServiceTickets;

        // Chart Data
        private List<MonthlyRevenueTrend> revenueTrends;
        private List<CapacityDistribution> capacityDistribution;
        private List<FinanceDTOs.JobProfitabilityDTO> recentJobProfitability;

        public DashboardSummaryDTO() {}

        public long getTotalEnquiries() { return totalEnquiries; }
        public void setTotalEnquiries(long totalEnquiries) { this.totalEnquiries = totalEnquiries; }
        public long getNewEnquiries() { return newEnquiries; }
        public void setNewEnquiries(long newEnquiries) { this.newEnquiries = newEnquiries; }
        public long getPendingSurveys() { return pendingSurveys; }
        public void setPendingSurveys(long pendingSurveys) { this.pendingSurveys = pendingSurveys; }
        public long getApprovedSurveys() { return approvedSurveys; }
        public void setApprovedSurveys(long approvedSurveys) { this.approvedSurveys = approvedSurveys; }
        public long getPendingQuotations() { return pendingQuotations; }
        public void setPendingQuotations(long pendingQuotations) { this.pendingQuotations = pendingQuotations; }
        public long getAcceptedQuotations() { return acceptedQuotations; }
        public void setAcceptedQuotations(long acceptedQuotations) { this.acceptedQuotations = acceptedQuotations; }
        public long getConfirmedOrders() { return confirmedOrders; }
        public void setConfirmedOrders(long confirmedOrders) { this.confirmedOrders = confirmedOrders; }
        public long getActiveInstallations() { return activeInstallations; }
        public void setActiveInstallations(long activeInstallations) { this.activeInstallations = activeInstallations; }
        public long getCompletedInstallations() { return completedInstallations; }
        public void setCompletedInstallations(long completedInstallations) { this.completedInstallations = completedInstallations; }
        public long getPendingInstallations() { return pendingInstallations; }
        public void setPendingInstallations(long pendingInstallations) { this.pendingInstallations = pendingInstallations; }
        public BigDecimal getTotalInvoiced() { return totalInvoiced; }
        public void setTotalInvoiced(BigDecimal totalInvoiced) { this.totalInvoiced = totalInvoiced; }
        public BigDecimal getTotalPaymentsReceived() { return totalPaymentsReceived; }
        public void setTotalPaymentsReceived(BigDecimal totalPaymentsReceived) { this.totalPaymentsReceived = totalPaymentsReceived; }
        public BigDecimal getTotalOutstanding() { return totalOutstanding; }
        public void setTotalOutstanding(BigDecimal totalOutstanding) { this.totalOutstanding = totalOutstanding; }
        public BigDecimal getTotalStockValue() { return totalStockValue; }
        public void setTotalStockValue(BigDecimal totalStockValue) { this.totalStockValue = totalStockValue; }
        public BigDecimal getTotalExpenses() { return totalExpenses; }
        public void setTotalExpenses(BigDecimal totalExpenses) { this.totalExpenses = totalExpenses; }
        public BigDecimal getNetProfit() { return netProfit; }
        public void setNetProfit(BigDecimal netProfit) { this.netProfit = netProfit; }
        public long getLowStockCount() { return lowStockCount; }
        public void setLowStockCount(long lowStockCount) { this.lowStockCount = lowStockCount; }
        public long getOpenServiceTickets() { return openServiceTickets; }
        public void setOpenServiceTickets(long openServiceTickets) { this.openServiceTickets = openServiceTickets; }
        public List<MonthlyRevenueTrend> getRevenueTrends() { return revenueTrends; }
        public void setRevenueTrends(List<MonthlyRevenueTrend> revenueTrends) { this.revenueTrends = revenueTrends; }
        public List<CapacityDistribution> getCapacityDistribution() { return capacityDistribution; }
        public void setCapacityDistribution(List<CapacityDistribution> capacityDistribution) { this.capacityDistribution = capacityDistribution; }
        public List<FinanceDTOs.JobProfitabilityDTO> getRecentJobProfitability() { return recentJobProfitability; }
        public void setRecentJobProfitability(List<FinanceDTOs.JobProfitabilityDTO> recentJobProfitability) { this.recentJobProfitability = recentJobProfitability; }
    }

    public static class MonthlyRevenueTrend {
        private String month;
        private BigDecimal revenue;
        private BigDecimal cost;
        private BigDecimal profit;

        public MonthlyRevenueTrend() {}
        public MonthlyRevenueTrend(String month, BigDecimal revenue, BigDecimal cost, BigDecimal profit) {
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

    public static class CapacityDistribution {
        private String capacity;
        private long count;

        public CapacityDistribution() {}
        public CapacityDistribution(String capacity, long count) {
            this.capacity = capacity;
            this.count = count;
        }

        public String getCapacity() { return capacity; }
        public void setCapacity(String capacity) { this.capacity = capacity; }
        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }
}
