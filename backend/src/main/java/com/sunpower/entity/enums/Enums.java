package com.sunpower.entity.enums;

public class Enums {
    public enum RoleName {
        ROLE_ADMIN,
        ROLE_SALES,
        ROLE_WAREHOUSE,
        ROLE_TECHNICIAN,
        ROLE_SUPPORT,
        ROLE_FINANCE,
        ROLE_DIRECTOR,
        ROLE_CUSTOMER
    }

    public enum CustomerType {
        RESIDENTIAL,
        SMALL_FACTORY
    }

    public enum SystemType {
        ON_GRID,
        OFF_GRID
    }

    public enum EnquirySource {
        CUSTOMER_PORTAL,
        WEBSITE,
        WHATSAPP,
        PHONE,
        MANUAL
    }

    public enum EnquiryStatus {
        NEW,
        CONTACTED,
        QUALIFIED,
        SURVEY_SCHEDULED,
        SURVEY_APPROVED,
        QUOTED,
        CONVERTED,
        REJECTED
    }

    public enum SurveyStatus {
        PENDING,
        SCHEDULED,
        IN_PROGRESS,
        REPORT_SUBMITTED,
        APPROVED,
        REJECTED,
        REVISIT_REQUIRED
    }

    public enum QuotationStatus {
        DRAFT,
        SENT,
        ACCEPTED,
        REJECTED,
        EXPIRED
    }

    public enum OrderStatus {
        PENDING_PAYMENT,
        CONFIRMED,
        DISPATCHED,
        IN_INSTALLATION,
        INSTALLED,
        COMPLETED,
        CANCELLED
    }

    public enum PaymentMethod {
        BANK_TRANSFER,
        UPI,
        CHEQUE,
        CASH,
        CARD
    }

    public enum PaymentType {
        ADVANCE,
        PROGRESS,
        FULL,
        ADJUSTMENT
    }

    public enum PaymentStatus {
        SUCCESS,
        PENDING,
        FAILED,
        REVERSED
    }

    public enum StockMovementType {
        PURCHASE_IN,
        DISPATCH_OUT,
        ADJUSTMENT,
        RETURN
    }

    public enum SerialNumberStatus {
        IN_STOCK,
        RESERVED,
        ALLOCATED,
        PICKED,
        DISPATCHED,
        SITE_RECEIVED,
        INSTALLED,
        DEFECTIVE,
        REPLACED
    }

    public enum DispatchStatus {
        PENDING,
        PICKING,
        READY_FOR_DISPATCH,
        DISPATCHED,
        DELIVERED
    }

    public enum InstallationStatus {
        SCHEDULED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }

    public enum WarrantyStatus {
        NOT_STARTED,
        ACTIVE,
        EXPIRED,
        VOIDED
    }

    public enum TicketStatus {
        OPEN,
        ASSIGNED,
        IN_PROGRESS,
        WAITING_FOR_PARTS,
        RESOLVED,
        CUSTOMER_CONFIRMED,
        CLOSED
    }

    public enum SubsidyStatus {
        NOT_STARTED,
        DOCUMENTS_PENDING,
        SUBMITTED,
        UNDER_VERIFICATION,
        APPROVED,
        REJECTED,
        PARTIALLY_RECEIVED,
        AMOUNT_RECEIVED
    }

    public enum ExpenseCategory {
        PRODUCT_PURCHASE,
        INSTALLATION,
        TECHNICIAN_PAYOUT,
        SERVICE_REPAIR,
        TRANSPORT,
        OTHER
    }

    public enum TechnicianPayoutStatus {
        PENDING,
        PARTIALLY_PAID,
        PAID
    }

    public enum ProfitabilityStatus {
        PROFITABLE,
        LOW_MARGIN,
        LOSS_MAKING
    }
}
