package com.sunpower.dto;

import com.sunpower.entity.enums.Enums.PaymentMethod;
import com.sunpower.entity.enums.Enums.PaymentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PaymentDTOs {

    public static class PaymentRecordRequest {
        @NotNull(message = "Sales Order ID is required")
        private Long salesOrderId;

        private Long invoiceId;

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
        public Long getInvoiceId() { return invoiceId; }
        public void setInvoiceId(Long invoiceId) { this.invoiceId = invoiceId; }
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

    public static class PaymentReceiptDTO {
        private String receiptNumber;
        private String paymentNumber;
        private String customerName;
        private String customerPhone;
        private String customerEmail;
        private String orderNumber;
        private String invoiceNumber;
        private BigDecimal amountPaid;
        private LocalDate paymentDate;
        private PaymentMethod paymentMethod;
        private PaymentType paymentType;
        private String referenceNumber;
        private BigDecimal orderTotalAmount;
        private BigDecimal totalPaidToDate;
        private BigDecimal remainingBalance;
        private String companyName = "SunPower Solutions Pvt. Ltd.";
        private String companyGstin = "33AABCS1429B1Z0";
        private String companyAddress = "124 Solar Technology Park, Guindy, Chennai - 600032";
        private LocalDateTime issuedAt = LocalDateTime.now();

        public PaymentReceiptDTO() {}

        public String getReceiptNumber() { return receiptNumber; }
        public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }
        public String getPaymentNumber() { return paymentNumber; }
        public void setPaymentNumber(String paymentNumber) { this.paymentNumber = paymentNumber; }
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }
        public String getCustomerPhone() { return customerPhone; }
        public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
        public String getCustomerEmail() { return customerEmail; }
        public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
        public String getOrderNumber() { return orderNumber; }
        public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
        public String getInvoiceNumber() { return invoiceNumber; }
        public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
        public BigDecimal getAmountPaid() { return amountPaid; }
        public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }
        public LocalDate getPaymentDate() { return paymentDate; }
        public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
        public PaymentMethod getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
        public PaymentType getPaymentType() { return paymentType; }
        public void setPaymentType(PaymentType paymentType) { this.paymentType = paymentType; }
        public String getReferenceNumber() { return referenceNumber; }
        public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
        public BigDecimal getOrderTotalAmount() { return orderTotalAmount; }
        public void setOrderTotalAmount(BigDecimal orderTotalAmount) { this.orderTotalAmount = orderTotalAmount; }
        public BigDecimal getTotalPaidToDate() { return totalPaidToDate; }
        public void setTotalPaidToDate(BigDecimal totalPaidToDate) { this.totalPaidToDate = totalPaidToDate; }
        public BigDecimal getRemainingBalance() { return remainingBalance; }
        public void setRemainingBalance(BigDecimal remainingBalance) { this.remainingBalance = remainingBalance; }
        public String getCompanyName() { return companyName; }
        public String getCompanyGstin() { return companyGstin; }
        public String getCompanyAddress() { return companyAddress; }
        public LocalDateTime getIssuedAt() { return issuedAt; }
    }
}
