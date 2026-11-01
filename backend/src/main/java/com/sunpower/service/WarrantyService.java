package com.sunpower.service;

import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.WarrantyStatus;
import com.sunpower.repository.WarrantyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class WarrantyService {

    @Autowired
    private WarrantyRepository warrantyRepository;

    @Autowired
    private com.sunpower.repository.SerialNumberRepository serialNumberRepository;

    public List<Warranty> getAllWarranties() {
        return warrantyRepository.findAll();
    }

    public Warranty getWarrantyById(Long id) {
        return warrantyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Warranty not found with id: " + id));
    }

    public Optional<Warranty> getWarrantyBySerialCode(String serialCode) {
        return warrantyRepository.findBySerialNumberSerialCode(serialCode);
    }

    public List<Warranty> getWarrantiesByCustomerId(Long customerId) {
        return warrantyRepository.findByCustomerId(customerId);
    }

    @Transactional
    public Warranty activateWarranty(Customer customer, SalesOrder order, Product product, SerialNumber serialNumber, LocalDate deliveryOrCompletionDate) {
        return activateWarranty(customer, order, product, serialNumber, deliveryOrCompletionDate, null, null);
    }

    @Transactional
    public Warranty activateWarranty(Customer customer, SalesOrder order, Product product, SerialNumber serialNumber, LocalDate deliveryOrCompletionDate, Long installationId) {
        return activateWarranty(customer, order, product, serialNumber, deliveryOrCompletionDate, installationId, null);
    }

    @Transactional
    public Warranty activateWarranty(Customer customer, SalesOrder order, Product product, SerialNumber serialNumber, LocalDate deliveryOrCompletionDate, Long installationId, LocalDate installationDate) {
        LocalDate startDate = deliveryOrCompletionDate != null ? deliveryOrCompletionDate : LocalDate.now();

        // Prevent duplicate warranty activation for the same serial number
        if (serialNumber != null) {
            Optional<Warranty> existing = warrantyRepository.findBySerialNumberId(serialNumber.getId());
            if (existing.isPresent()) {
                Warranty w = existing.get();
                if (installationId != null) {
                    w.setInstallationId(installationId);
                }
                if (installationDate != null) {
                    w.setInstallationDate(installationDate);
                }
                // Only initialize start/end date if not already set (warranty begins on delivery!)
                if (w.getWarrantyStartDate() == null && deliveryOrCompletionDate != null) {
                    w.setDeliveryDate(deliveryOrCompletionDate);
                    w.setWarrantyStartDate(deliveryOrCompletionDate);
                    int dur = w.getDurationMonths() != null ? w.getDurationMonths() :
                            (product.getDefaultWarrantyMonths() != null ? product.getDefaultWarrantyMonths() : 24);
                    w.setWarrantyEndDate(deliveryOrCompletionDate.plusMonths(dur));
                }
                w.setStatus(WarrantyStatus.ACTIVE);
                return warrantyRepository.save(w);
            }
        }

        // Determine warranty duration
        int durationMonths = product.getDefaultWarrantyMonths() != null && product.getDefaultWarrantyMonths() > 0 ?
                product.getDefaultWarrantyMonths() : 24; // Default 2 years

        // Explicit rule overrides from business requirements:
        // Inverter: 2 years (24 months), Battery: 2 years (24 months), Solar panels: 20 years (240 months)
        String catName = product.getCategory() != null && product.getCategory().getName() != null ?
                product.getCategory().getName().toUpperCase() : "";
        if (catName.contains("PANEL")) {
            durationMonths = 240; // 20 years
        } else if (catName.contains("INVERTER") || catName.contains("BATTERY")) {
            durationMonths = 24; // 2 years
        }

        LocalDate endDate = startDate.plusMonths(durationMonths);

        Warranty warranty = new Warranty();
        warranty.setCustomer(customer);
        warranty.setSalesOrder(order);
        warranty.setProduct(product);
        warranty.setSerialNumber(serialNumber);
        warranty.setInstallationId(installationId);
        warranty.setInstallationDate(installationDate);
        warranty.setDeliveryDate(startDate);
        warranty.setWarrantyStartDate(startDate);
        warranty.setWarrantyEndDate(endDate);
        warranty.setDurationMonths(durationMonths);
        warranty.setStatus(WarrantyStatus.ACTIVE);
        warranty.setTermsAndConditions("Full manufacturer comprehensive warranty covering defects and performance standards.");

        warranty = warrantyRepository.save(warranty);
        if (warranty.getWarrantyNumber() == null) {
            warranty.setWarrantyNumber("WR-" + String.format("%05d", warranty.getId()));
            warranty = warrantyRepository.save(warranty);
        }

        if (serialNumber != null) {
            serialNumber.setWarrantyStartDate(startDate);
            serialNumber.setWarrantyExpiryDate(endDate);
            if (installationId != null) {
                serialNumber.setInstallationId(installationId);
            }
            if (installationDate != null) {
                serialNumber.setInstallationCompletedAt(installationDate.atStartOfDay());
            }
            serialNumberRepository.save(serialNumber);
        }

        return warranty;
    }

    @Transactional
    public void recordInstallationCompletion(SalesOrder order, Long installationId, LocalDate installationDate) {
        if (order == null) return;
        List<Warranty> warranties = warrantyRepository.findBySalesOrderId(order.getId());
        for (Warranty w : warranties) {
            if (installationId != null) {
                w.setInstallationId(installationId);
            }
            if (installationDate != null) {
                w.setInstallationDate(installationDate);
            }
            warrantyRepository.save(w);
        }
    }

    public List<Warranty> searchWarranties(String query) {
        if (query == null || query.trim().isEmpty()) {
            return warrantyRepository.findAll();
        }
        return warrantyRepository.searchWarranties(query.trim());
    }

    public com.sunpower.dto.ServiceTicketDTOs.WarrantyDecisionDTO evaluateWarranty(String serialCode, Long customerId, String faultCategory) {
        com.sunpower.dto.ServiceTicketDTOs.WarrantyDecisionDTO decision = new com.sunpower.dto.ServiceTicketDTOs.WarrantyDecisionDTO();
        decision.setSerialCode(serialCode);

        if (serialCode == null || serialCode.trim().isEmpty()) {
            decision.setWarrantyCoverageStatus("MISSING_SERIAL");
            decision.setChargeStatusText("Pending Serial Verification");
            decision.setDecisionRationale("Serial number not provided. Equipment cannot be verified.");
            decision.setEstimatedCustomerCharge(null);
            return decision;
        }

        Optional<SerialNumber> snOpt = serialNumberRepository.findBySerialCode(serialCode.trim());
        if (snOpt.isEmpty()) {
            decision.setWarrantyCoverageStatus("INVALID_SERIAL");
            decision.setChargeStatusText("Billable (Unrecognized Serial)");
            decision.setDecisionRationale("Serial number " + serialCode + " is not registered in SunPower equipment database.");
            decision.setEstimatedCustomerCharge(new java.math.BigDecimal("750.00"));
            return decision;
        }

        SerialNumber sn = snOpt.get();
        Product product = sn.getProduct();
        decision.setProductName(product != null ? product.getName() : "Unknown Product");
        decision.setProductCategory(product != null && product.getCategory() != null ? product.getCategory().getName() : "General Equipment");

        if (customerId != null && sn.getCustomer() != null && !sn.getCustomer().getId().equals(customerId)) {
            decision.setWarrantyCoverageStatus("CUSTOMER_MISMATCH");
            decision.setChargeStatusText("Serial Does Not Belong to Customer");
            decision.setDecisionRationale("Serial number belongs to a different customer account.");
            decision.setEstimatedCustomerCharge(null);
            return decision;
        }

        Optional<Warranty> wOpt = warrantyRepository.findBySerialNumberId(sn.getId());
        if (wOpt.isEmpty()) {
            decision.setWarrantyCoverageStatus("PENDING_VERIFICATION");
            decision.setChargeStatusText("Pending Warranty Registration");
            decision.setDecisionRationale("No active warranty record created yet for this serial unit.");
            decision.setEstimatedCustomerCharge(null);
            return decision;
        }

        Warranty w = wOpt.get();
        decision.setDeliveryDate(w.getDeliveryDate());
        decision.setWarrantyStartDate(w.getWarrantyStartDate());
        decision.setWarrantyEndDate(w.getWarrantyEndDate());
        decision.setDurationMonths(w.getDurationMonths());

        LocalDate today = LocalDate.now();
        boolean isActive = w.getStatus() == WarrantyStatus.ACTIVE &&
                w.getWarrantyEndDate() != null && !today.isAfter(w.getWarrantyEndDate()) &&
                w.getDeliveryDate() != null;
        decision.setWarrantyActive(isActive);

        boolean isExcluded = false;
        if (faultCategory != null) {
            String lower = faultCategory.toLowerCase();
            if (lower.contains("physical") || lower.contains("broken glass") || lower.contains("water submerge") ||
                lower.contains("tampering") || lower.contains("unauthorized") || lower.contains("lightning without spd")) {
                isExcluded = true;
            }
        }
        decision.setFaultCovered(!isExcluded);

        if (isActive && !isExcluded) {
            decision.setWarrantyCoverageStatus("ACTIVE_COVERED");
            decision.setChargeStatusText("₹0 (Warranty Covered)");
            decision.setEstimatedCustomerCharge(java.math.BigDecimal.ZERO);
            decision.setDecisionRationale("Component is within valid " + (w.getDurationMonths() != null ? (w.getDurationMonths() / 12) : 2) + "-year warranty period. Fault is covered under standard manufacturer terms.");
        } else if (isActive && isExcluded) {
            decision.setWarrantyCoverageStatus("ACTIVE_EXCLUDED");
            decision.setChargeStatusText("Billable (Warranty Excluded Fault)");
            decision.setEstimatedCustomerCharge(new java.math.BigDecimal("750.00"));
            decision.setDecisionRationale("Warranty is active until " + w.getWarrantyEndDate() + ", but the reported fault (" + faultCategory + ") is excluded from manufacturer warranty.");
        } else {
            decision.setWarrantyCoverageStatus("EXPIRED");
            decision.setChargeStatusText("Billable (Out of Warranty)");
            decision.setEstimatedCustomerCharge(new java.math.BigDecimal("750.00"));
            decision.setDecisionRationale("Warranty expired on " + (w.getWarrantyEndDate() != null ? w.getWarrantyEndDate() : "N/A") + ". Parts and labour are billable.");
        }

        return decision;
    }
}
