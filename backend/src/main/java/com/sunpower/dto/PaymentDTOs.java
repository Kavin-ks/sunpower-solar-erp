package com.sunpower.dto;

import com.sunpower.entity.enums.Enums.PaymentMethod;
import com.sunpower.entity.enums.Enums.PaymentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class PaymentDTOs {

    public static class PaymentRecordRequest {
        @NotNull(message = "Sales Order ID is required")
        private Long salesOrderId;

        @NotNull(message = "Payment amount is required")
        @DecimalMin(value = "1.00", message = "Payment amount must be greater than zero")
        private BigDecimal amount;

        private LocalDate paymentDate;

        @NotNull(message = "Payment method is required")
        private PaymentMethod method = PaymentMethod.BANK_TRANSFER;

        @NotNull(message = "Payment type is required")
        private PaymentType type = PaymentType.ADVANCE;

        private String referenceNumber; // Bank UTR, Cheque No, Transaction ID
        private String notes;

        public PaymentRecordRequest() {}

        public Long getSalesOrderId() { return salesOrderId; }
        public void setSalesOrderId(Long salesOrderId) { this.salesOrderId = salesOrderId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public LocalDate getPaymentDate() { return paymentDate; }
        public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
        public PaymentMethod getMethod() { return method; }
        public void setMethod(PaymentMethod method) { this.method = method; }
        public PaymentType getType() { return type; }
        public void setType(PaymentType type) { this.type = type; }
        public String getReferenceNumber() { return referenceNumber; }
        public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class PaymentReversalRequest {
        @NotBlank(message = "Reversal reason is required")
        private String reason;

        public PaymentReversalRequest() {}
        public PaymentReversalRequest(String reason) { this.reason = reason; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}
