package com.sunpower.dto;

import com.sunpower.entity.enums.Enums.OrderStatus;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class OrderDTOs {

    public static class OrderConvertRequest {
        @NotNull(message = "Quotation ID is required")
        private Long quotationId;

        private BigDecimal advancePercentage = BigDecimal.valueOf(20.00); // 20% advance required default
        private BigDecimal advanceRequiredAmount;

        public OrderConvertRequest() {}

        public Long getQuotationId() { return quotationId; }
        public void setQuotationId(Long quotationId) { this.quotationId = quotationId; }
        public BigDecimal getAdvancePercentage() { return advancePercentage; }
        public void setAdvancePercentage(BigDecimal advancePercentage) { this.advancePercentage = advancePercentage; }
        public BigDecimal getAdvanceRequiredAmount() { return advanceRequiredAmount; }
        public void setAdvanceRequiredAmount(BigDecimal advanceRequiredAmount) { this.advanceRequiredAmount = advanceRequiredAmount; }
    }

    public static class OrderStatusUpdateRequest {
        @NotNull(message = "Order status is required")
        private OrderStatus status;

        public OrderStatusUpdateRequest() {}

        public OrderStatus getStatus() { return status; }
        public void setStatus(OrderStatus status) { this.status = status; }
    }
}
