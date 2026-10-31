package com.sunpower.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    public static class AdminDashboardDTO extends DashboardSummaryDTO {
        private long totalCustomers;
        private double leadConversionRate;
        private long totalDispatchedProducts;
        private long totalInstalledProducts;
        private long activeWarranties;
        private List<TechnicianWorkloadDTO> technicianWorkloads;

        public AdminDashboardDTO() {}

        public long getTotalCustomers() { return totalCustomers; }
        public void setTotalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; }
        public double getLeadConversionRate() { return leadConversionRate; }
        public void setLeadConversionRate(double leadConversionRate) { this.leadConversionRate = leadConversionRate; }
        public long getTotalDispatchedProducts() { return totalDispatchedProducts; }
        public void setTotalDispatchedProducts(long totalDispatchedProducts) { this.totalDispatchedProducts = totalDispatchedProducts; }
        public long getTotalInstalledProducts() { return totalInstalledProducts; }
        public void setTotalInstalledProducts(long totalInstalledProducts) { this.totalInstalledProducts = totalInstalledProducts; }
        public long getActiveWarranties() { return activeWarranties; }
        public void setActiveWarranties(long activeWarranties) { this.activeWarranties = activeWarranties; }
        public List<TechnicianWorkloadDTO> getTechnicianWorkloads() { return technicianWorkloads; }
        public void setTechnicianWorkloads(List<TechnicianWorkloadDTO> technicianWorkloads) { this.technicianWorkloads = technicianWorkloads; }
    }

    public static class TechnicianWorkloadDTO {
        private String name;
        private String phone;
        private String specialization;
        private long activeJobs;
        private long completedJobs;

        public TechnicianWorkloadDTO() {}
        public TechnicianWorkloadDTO(String name, String phone, String specialization, long activeJobs, long completedJobs) {
            this.name = name;
            this.phone = phone;
            this.specialization = specialization;
            this.activeJobs = activeJobs;
            this.completedJobs = completedJobs;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        public long getActiveJobs() { return activeJobs; }
        public void setActiveJobs(long activeJobs) { this.activeJobs = activeJobs; }
        public long getCompletedJobs() { return completedJobs; }
        public void setCompletedJobs(long completedJobs) { this.completedJobs = completedJobs; }
    }

    public static class SalesDashboardDTO {
        private long totalEnquiries;
        private long newEnquiries;
        private long contactedEnquiries;
        private long qualifiedEnquiries;
        private long rejectedEnquiries;
        private double leadConversionRate;
        private long pendingSurveys;
        private long surveysAwaitingReview;
        private long approvedSurveys;
        private long pendingQuotations;
        private long acceptedQuotations;
        private BigDecimal pipelineValue = BigDecimal.ZERO;
        private long confirmedOrders;
        private long ordersAwaitingAdvance;
        private List<CapacityDistribution> capacityDistribution;
        private List<com.sunpower.entity.Enquiry> recentEnquiries;
        private List<com.sunpower.entity.SiteSurvey> surveysNeedingReview;

        public SalesDashboardDTO() {}

        public long getTotalEnquiries() { return totalEnquiries; }
        public void setTotalEnquiries(long totalEnquiries) { this.totalEnquiries = totalEnquiries; }
        public long getNewEnquiries() { return newEnquiries; }
        public void setNewEnquiries(long newEnquiries) { this.newEnquiries = newEnquiries; }
        public long getContactedEnquiries() { return contactedEnquiries; }
        public void setContactedEnquiries(long contactedEnquiries) { this.contactedEnquiries = contactedEnquiries; }
        public long getQualifiedEnquiries() { return qualifiedEnquiries; }
        public void setQualifiedEnquiries(long qualifiedEnquiries) { this.qualifiedEnquiries = qualifiedEnquiries; }
        public long getRejectedEnquiries() { return rejectedEnquiries; }
        public void setRejectedEnquiries(long rejectedEnquiries) { this.rejectedEnquiries = rejectedEnquiries; }
        public double getLeadConversionRate() { return leadConversionRate; }
        public void setLeadConversionRate(double leadConversionRate) { this.leadConversionRate = leadConversionRate; }
        public long getPendingSurveys() { return pendingSurveys; }
        public void setPendingSurveys(long pendingSurveys) { this.pendingSurveys = pendingSurveys; }
        public long getSurveysAwaitingReview() { return surveysAwaitingReview; }
        public void setSurveysAwaitingReview(long surveysAwaitingReview) { this.surveysAwaitingReview = surveysAwaitingReview; }
        public long getApprovedSurveys() { return approvedSurveys; }
        public void setApprovedSurveys(long approvedSurveys) { this.approvedSurveys = approvedSurveys; }
        public long getPendingQuotations() { return pendingQuotations; }
        public void setPendingQuotations(long pendingQuotations) { this.pendingQuotations = pendingQuotations; }
        public long getAcceptedQuotations() { return acceptedQuotations; }
        public void setAcceptedQuotations(long acceptedQuotations) { this.acceptedQuotations = acceptedQuotations; }
        public BigDecimal getPipelineValue() { return pipelineValue; }
        public void setPipelineValue(BigDecimal pipelineValue) { this.pipelineValue = pipelineValue; }
        public long getConfirmedOrders() { return confirmedOrders; }
        public void setConfirmedOrders(long confirmedOrders) { this.confirmedOrders = confirmedOrders; }
        public long getOrdersAwaitingAdvance() { return ordersAwaitingAdvance; }
        public void setOrdersAwaitingAdvance(long ordersAwaitingAdvance) { this.ordersAwaitingAdvance = ordersAwaitingAdvance; }
        public List<CapacityDistribution> getCapacityDistribution() { return capacityDistribution; }
        public void setCapacityDistribution(List<CapacityDistribution> capacityDistribution) { this.capacityDistribution = capacityDistribution; }
        public List<com.sunpower.entity.Enquiry> getRecentEnquiries() { return recentEnquiries; }
        public void setRecentEnquiries(List<com.sunpower.entity.Enquiry> recentEnquiries) { this.recentEnquiries = recentEnquiries; }
        public List<com.sunpower.entity.SiteSurvey> getSurveysNeedingReview() { return surveysNeedingReview; }
        public void setSurveysNeedingReview(List<com.sunpower.entity.SiteSurvey> surveysNeedingReview) { this.surveysNeedingReview = surveysNeedingReview; }
    }

    public static class WarehouseDashboardDTO {
        private BigDecimal totalStockValue = BigDecimal.ZERO;
        private long totalStockUnits;
        private long reservedStockUnits;
        private long availableStockUnits;
        private long lowStockCount;
        private long ordersAwaitingPicking;
        private long dispatchedToday;
        private long totalDispatches;
        private List<com.sunpower.entity.InventoryStock> lowStockAlerts;
        private List<com.sunpower.entity.SalesOrder> pendingPickingOrders;
        private List<CategoryStockDTO> categoryBreakdown;

        public WarehouseDashboardDTO() {}

        public BigDecimal getTotalStockValue() { return totalStockValue; }
        public void setTotalStockValue(BigDecimal totalStockValue) { this.totalStockValue = totalStockValue; }
        public long getTotalStockUnits() { return totalStockUnits; }
        public void setTotalStockUnits(long totalStockUnits) { this.totalStockUnits = totalStockUnits; }
        public long getReservedStockUnits() { return reservedStockUnits; }
        public void setReservedStockUnits(long reservedStockUnits) { this.reservedStockUnits = reservedStockUnits; }
        public long getAvailableStockUnits() { return availableStockUnits; }
        public void setAvailableStockUnits(long availableStockUnits) { this.availableStockUnits = availableStockUnits; }
        public long getLowStockCount() { return lowStockCount; }
        public void setLowStockCount(long lowStockCount) { this.lowStockCount = lowStockCount; }
        public long getOrdersAwaitingPicking() { return ordersAwaitingPicking; }
        public void setOrdersAwaitingPicking(long ordersAwaitingPicking) { this.ordersAwaitingPicking = ordersAwaitingPicking; }
        public long getDispatchedToday() { return dispatchedToday; }
        public void setDispatchedToday(long dispatchedToday) { this.dispatchedToday = dispatchedToday; }
        public long getTotalDispatches() { return totalDispatches; }
        public void setTotalDispatches(long totalDispatches) { this.totalDispatches = totalDispatches; }
        public List<com.sunpower.entity.InventoryStock> getLowStockAlerts() { return lowStockAlerts; }
        public void setLowStockAlerts(List<com.sunpower.entity.InventoryStock> lowStockAlerts) { this.lowStockAlerts = lowStockAlerts; }
        public List<com.sunpower.entity.SalesOrder> getPendingPickingOrders() { return pendingPickingOrders; }
        public void setPendingPickingOrders(List<com.sunpower.entity.SalesOrder> pendingPickingOrders) { this.pendingPickingOrders = pendingPickingOrders; }
        public List<CategoryStockDTO> getCategoryBreakdown() { return categoryBreakdown; }
        public void setCategoryBreakdown(List<CategoryStockDTO> categoryBreakdown) { this.categoryBreakdown = categoryBreakdown; }
    }

    public static class CategoryStockDTO {
        private String category;
        private long units;
        private BigDecimal value = BigDecimal.ZERO;

        public CategoryStockDTO() {}
        public CategoryStockDTO(String category, long units, BigDecimal value) {
            this.category = category;
            this.units = units;
            this.value = value;
        }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public long getUnits() { return units; }
        public void setUnits(long units) { this.units = units; }
        public BigDecimal getValue() { return value; }
        public void setValue(BigDecimal value) { this.value = value; }
    }

    public static class TechnicianDashboardDTO {
        private String technicianName;
        private String phone;
        private String specialization;
        @JsonProperty("isLead")
        private boolean isLead;
        private long activeTechniciansCount;
        private long availableTechniciansCount;
        private long assignedSurveysCount;
        private long pendingSurveysCount;
        private long completedSurveysCount;
        private long assignedInstallationsCount;
        private long inProgressInstallationsCount;
        private long completedInstallationsCount;
        private long assignedServiceVisitsCount;
        private long pendingJobsCount;
        private long inProgressJobsCount;
        private long pendingServiceVisitsCount;
        private long overdueAssignmentsCount;
        private List<com.sunpower.entity.SiteSurvey> upcomingSurveys;
        private List<com.sunpower.entity.Installation> activeInstallations;
        private List<com.sunpower.entity.ServiceTicket> assignedServiceTickets;
        private List<TechnicianWorkloadDTO> teamWorkloads;

        public TechnicianDashboardDTO() {}

        public String getTechnicianName() { return technicianName; }
        public void setTechnicianName(String technicianName) { this.technicianName = technicianName; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        @JsonProperty("isLead")
        public boolean isLead() { return isLead; }
        public boolean getIsLead() { return isLead; }
        public void setLead(boolean lead) { isLead = lead; }
        public long getActiveTechniciansCount() { return activeTechniciansCount; }
        public void setActiveTechniciansCount(long activeTechniciansCount) { this.activeTechniciansCount = activeTechniciansCount; }
        public long getAvailableTechniciansCount() { return availableTechniciansCount; }
        public void setAvailableTechniciansCount(long availableTechniciansCount) { this.availableTechniciansCount = availableTechniciansCount; }
        public long getAssignedSurveysCount() { return assignedSurveysCount; }
        public void setAssignedSurveysCount(long assignedSurveysCount) { this.assignedSurveysCount = assignedSurveysCount; }
        public long getPendingSurveysCount() { return pendingSurveysCount; }
        public void setPendingSurveysCount(long pendingSurveysCount) { this.pendingSurveysCount = pendingSurveysCount; }
        public long getCompletedSurveysCount() { return completedSurveysCount; }
        public void setCompletedSurveysCount(long completedSurveysCount) { this.completedSurveysCount = completedSurveysCount; }
        public long getAssignedInstallationsCount() { return assignedInstallationsCount; }
        public void setAssignedInstallationsCount(long assignedInstallationsCount) { this.assignedInstallationsCount = assignedInstallationsCount; }
        public long getInProgressInstallationsCount() { return inProgressInstallationsCount; }
        public void setInProgressInstallationsCount(long inProgressInstallationsCount) { this.inProgressInstallationsCount = inProgressInstallationsCount; }
        public long getCompletedInstallationsCount() { return completedInstallationsCount; }
        public void setCompletedInstallationsCount(long completedInstallationsCount) { this.completedInstallationsCount = completedInstallationsCount; }
        public long getAssignedServiceVisitsCount() { return assignedServiceVisitsCount; }
        public void setAssignedServiceVisitsCount(long assignedServiceVisitsCount) { this.assignedServiceVisitsCount = assignedServiceVisitsCount; }
        public long getPendingJobsCount() { return pendingJobsCount; }
        public void setPendingJobsCount(long pendingJobsCount) { this.pendingJobsCount = pendingJobsCount; }
        public long getInProgressJobsCount() { return inProgressJobsCount; }
        public void setInProgressJobsCount(long inProgressJobsCount) { this.inProgressJobsCount = inProgressJobsCount; }
        public long getPendingServiceVisitsCount() { return pendingServiceVisitsCount; }
        public void setPendingServiceVisitsCount(long pendingServiceVisitsCount) { this.pendingServiceVisitsCount = pendingServiceVisitsCount; }
        public long getOverdueAssignmentsCount() { return overdueAssignmentsCount; }
        public void setOverdueAssignmentsCount(long overdueAssignmentsCount) { this.overdueAssignmentsCount = overdueAssignmentsCount; }
        public List<com.sunpower.entity.SiteSurvey> getUpcomingSurveys() { return upcomingSurveys; }
        public void setUpcomingSurveys(List<com.sunpower.entity.SiteSurvey> upcomingSurveys) { this.upcomingSurveys = upcomingSurveys; }
        public List<com.sunpower.entity.Installation> getActiveInstallations() { return activeInstallations; }
        public void setActiveInstallations(List<com.sunpower.entity.Installation> activeInstallations) { this.activeInstallations = activeInstallations; }
        public List<com.sunpower.entity.ServiceTicket> getAssignedServiceTickets() { return assignedServiceTickets; }
        public void setAssignedServiceTickets(List<com.sunpower.entity.ServiceTicket> assignedServiceTickets) { this.assignedServiceTickets = assignedServiceTickets; }
        public List<TechnicianWorkloadDTO> getTeamWorkloads() { return teamWorkloads; }
        public void setTeamWorkloads(List<TechnicianWorkloadDTO> teamWorkloads) { this.teamWorkloads = teamWorkloads; }
    }

    public static class SupportDashboardDTO {
        private long openTickets;
        private long assignedTickets;
        private long inProgressTickets;
        private long waitingForPartsTickets;
        private long resolvedTickets;
        private long closedTickets;
        private long criticalTicketsCount;
        private long activeWarrantiesCount;
        private Double avgResolutionDays;
        private String avgResolutionTurnaroundText;
        private List<com.sunpower.entity.ServiceTicket> urgentTickets;
        private List<FaultBreakdownDTO> faultBreakdown;

        public SupportDashboardDTO() {}

        public long getOpenTickets() { return openTickets; }
        public void setOpenTickets(long openTickets) { this.openTickets = openTickets; }
        public long getAssignedTickets() { return assignedTickets; }
        public void setAssignedTickets(long assignedTickets) { this.assignedTickets = assignedTickets; }
        public long getInProgressTickets() { return inProgressTickets; }
        public void setInProgressTickets(long inProgressTickets) { this.inProgressTickets = inProgressTickets; }
        public long getWaitingForPartsTickets() { return waitingForPartsTickets; }
        public void setWaitingForPartsTickets(long waitingForPartsTickets) { this.waitingForPartsTickets = waitingForPartsTickets; }
        public long getResolvedTickets() { return resolvedTickets; }
        public void setResolvedTickets(long resolvedTickets) { this.resolvedTickets = resolvedTickets; }
        public long getClosedTickets() { return closedTickets; }
        public void setClosedTickets(long closedTickets) { this.closedTickets = closedTickets; }
        public long getCriticalTicketsCount() { return criticalTicketsCount; }
        public void setCriticalTicketsCount(long criticalTicketsCount) { this.criticalTicketsCount = criticalTicketsCount; }
        public long getActiveWarrantiesCount() { return activeWarrantiesCount; }
        public void setActiveWarrantiesCount(long activeWarrantiesCount) { this.activeWarrantiesCount = activeWarrantiesCount; }
        public Double getAvgResolutionDays() { return avgResolutionDays; }
        public void setAvgResolutionDays(Double avgResolutionDays) { this.avgResolutionDays = avgResolutionDays; }
        public String getAvgResolutionTurnaroundText() { return avgResolutionTurnaroundText; }
        public void setAvgResolutionTurnaroundText(String avgResolutionTurnaroundText) { this.avgResolutionTurnaroundText = avgResolutionTurnaroundText; }
        public List<com.sunpower.entity.ServiceTicket> getUrgentTickets() { return urgentTickets; }
        public void setUrgentTickets(List<com.sunpower.entity.ServiceTicket> urgentTickets) { this.urgentTickets = urgentTickets; }
        public List<FaultBreakdownDTO> getFaultBreakdown() { return faultBreakdown; }
        public void setFaultBreakdown(List<FaultBreakdownDTO> faultBreakdown) { this.faultBreakdown = faultBreakdown; }
    }

    public static class FaultBreakdownDTO {
        private String faultType;
        private long count;

        public FaultBreakdownDTO() {}
        public FaultBreakdownDTO(String faultType, long count) {
            this.faultType = faultType;
            this.count = count;
        }

        public String getFaultType() { return faultType; }
        public void setFaultType(String faultType) { this.faultType = faultType; }
        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    public static class FinanceDashboardDTO {
        private BigDecimal totalInvoiced = BigDecimal.ZERO;
        private BigDecimal totalPaymentsReceived = BigDecimal.ZERO;
        private BigDecimal outstandingReceivables = BigDecimal.ZERO;
        private BigDecimal hardwareCost = BigDecimal.ZERO;
        private BigDecimal technicianCost = BigDecimal.ZERO;
        private BigDecimal directExpenses = BigDecimal.ZERO;
        private BigDecimal totalProjectCost = BigDecimal.ZERO;
        private BigDecimal netOperatingProfit = BigDecimal.ZERO;
        private double grossMarginPercentage;
        private long ordersPendingAdvanceCount;
        private long unpaidInvoicesCount;
        private List<FinanceDTOs.JobProfitabilityDTO> recentJobProfitability;
        private List<MonthlyRevenueTrend> revenueTrends;
        private long subsidyAppliedCount;
        private long subsidyApprovedCount;
        private BigDecimal subsidyApprovedAmount = BigDecimal.ZERO;

        public FinanceDashboardDTO() {}

        public BigDecimal getTotalInvoiced() { return totalInvoiced; }
        public void setTotalInvoiced(BigDecimal totalInvoiced) { this.totalInvoiced = totalInvoiced; }
        public BigDecimal getTotalPaymentsReceived() { return totalPaymentsReceived; }
        public void setTotalPaymentsReceived(BigDecimal totalPaymentsReceived) { this.totalPaymentsReceived = totalPaymentsReceived; }
        public BigDecimal getOutstandingReceivables() { return outstandingReceivables; }
        public void setOutstandingReceivables(BigDecimal outstandingReceivables) { this.outstandingReceivables = outstandingReceivables; }
        public BigDecimal getHardwareCost() { return hardwareCost; }
        public void setHardwareCost(BigDecimal hardwareCost) { this.hardwareCost = hardwareCost; }
        public BigDecimal getTechnicianCost() { return technicianCost; }
        public void setTechnicianCost(BigDecimal technicianCost) { this.technicianCost = technicianCost; }
        public BigDecimal getDirectExpenses() { return directExpenses; }
        public void setDirectExpenses(BigDecimal directExpenses) { this.directExpenses = directExpenses; }
        public BigDecimal getTotalProjectCost() { return totalProjectCost; }
        public void setTotalProjectCost(BigDecimal totalProjectCost) { this.totalProjectCost = totalProjectCost; }
        public BigDecimal getNetOperatingProfit() { return netOperatingProfit; }
        public void setNetOperatingProfit(BigDecimal netOperatingProfit) { this.netOperatingProfit = netOperatingProfit; }
        public double getGrossMarginPercentage() { return grossMarginPercentage; }
        public void setGrossMarginPercentage(double grossMarginPercentage) { this.grossMarginPercentage = grossMarginPercentage; }
        public long getOrdersPendingAdvanceCount() { return ordersPendingAdvanceCount; }
        public void setOrdersPendingAdvanceCount(long ordersPendingAdvanceCount) { this.ordersPendingAdvanceCount = ordersPendingAdvanceCount; }
        public long getUnpaidInvoicesCount() { return unpaidInvoicesCount; }
        public void setUnpaidInvoicesCount(long unpaidInvoicesCount) { this.unpaidInvoicesCount = unpaidInvoicesCount; }
        public List<FinanceDTOs.JobProfitabilityDTO> getRecentJobProfitability() { return recentJobProfitability; }
        public void setRecentJobProfitability(List<FinanceDTOs.JobProfitabilityDTO> recentJobProfitability) { this.recentJobProfitability = recentJobProfitability; }
        public List<MonthlyRevenueTrend> getRevenueTrends() { return revenueTrends; }
        public void setRevenueTrends(List<MonthlyRevenueTrend> revenueTrends) { this.revenueTrends = revenueTrends; }
        public long getSubsidyAppliedCount() { return subsidyAppliedCount; }
        public void setSubsidyAppliedCount(long subsidyAppliedCount) { this.subsidyAppliedCount = subsidyAppliedCount; }
        public long getSubsidyApprovedCount() { return subsidyApprovedCount; }
        public void setSubsidyApprovedCount(long subsidyApprovedCount) { this.subsidyApprovedCount = subsidyApprovedCount; }
        public BigDecimal getSubsidyApprovedAmount() { return subsidyApprovedAmount; }
        public void setSubsidyApprovedAmount(BigDecimal subsidyApprovedAmount) { this.subsidyApprovedAmount = subsidyApprovedAmount; }
    }
}
