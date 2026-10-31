package com.sunpower.dto;

import com.sunpower.entity.enums.Enums.ExpenseCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

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
        private BigDecimal orderAmount;
        private BigDecimal revenueReceived;
        private BigDecimal hardwareCost;
        private BigDecimal technicianCost;
        private BigDecimal recordedExpenses;
        private BigDecimal totalCost;
        private BigDecimal netProfit;
        private BigDecimal profitMarginPercentage;
        private BigDecimal outstandingBalance;
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
        public BigDecimal getRevenueReceived() { return revenueReceived; }
        public void setRevenueReceived(BigDecimal revenueReceived) { this.revenueReceived = revenueReceived; }
        public BigDecimal getHardwareCost() { return hardwareCost; }
        public void setHardwareCost(BigDecimal hardwareCost) { this.hardwareCost = hardwareCost; }
        public BigDecimal getTechnicianCost() { return technicianCost; }
        public void setTechnicianCost(BigDecimal technicianCost) { this.technicianCost = technicianCost; }
        public BigDecimal getRecordedExpenses() { return recordedExpenses; }
        public void setRecordedExpenses(BigDecimal recordedExpenses) { this.recordedExpenses = recordedExpenses; }
        public BigDecimal getTotalCost() { return totalCost; }
        public void setTotalCost(BigDecimal totalCost) { this.totalCost = totalCost; }
        public BigDecimal getNetProfit() { return netProfit; }
        public void setNetProfit(BigDecimal netProfit) { this.netProfit = netProfit; }
        public BigDecimal getProfitMarginPercentage() { return profitMarginPercentage; }
        public void setProfitMarginPercentage(BigDecimal profitMarginPercentage) { this.profitMarginPercentage = profitMarginPercentage; }
        public BigDecimal getOutstandingBalance() { return outstandingBalance; }
        public void setOutstandingBalance(BigDecimal outstandingBalance) { this.outstandingBalance = outstandingBalance; }
        public String getSubsidyStatus() { return subsidyStatus; }
        public void setSubsidyStatus(String subsidyStatus) { this.subsidyStatus = subsidyStatus; }
        public long getOpenServiceTicketsCount() { return openServiceTicketsCount; }
        public void setOpenServiceTicketsCount(long openServiceTicketsCount) { this.openServiceTicketsCount = openServiceTicketsCount; }
    }
}
