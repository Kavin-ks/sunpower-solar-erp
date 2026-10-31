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
    public Warranty activateWarranty(Customer customer, SalesOrder order, Product product, SerialNumber serialNumber, LocalDate deliveryDate) {
        // If warranty already exists for this serial number, update dates
        if (serialNumber != null) {
            Optional<Warranty> existing = warrantyRepository.findBySerialNumberId(serialNumber.getId());
            if (existing.isPresent()) {
                Warranty w = existing.get();
                if (deliveryDate != null) {
                    w.setDeliveryDate(deliveryDate);
                    w.setWarrantyStartDate(deliveryDate);
                    int dur = w.getDurationMonths() != null ? w.getDurationMonths() :
                            (product.getDefaultWarrantyMonths() != null ? product.getDefaultWarrantyMonths() : 24);
                    w.setWarrantyEndDate(deliveryDate.plusMonths(dur));
                    w.setStatus(WarrantyStatus.ACTIVE);
                    return warrantyRepository.save(w);
                }
                return w;
            }
        }

        // Determine warranty duration
        int durationMonths = product.getDefaultWarrantyMonths() != null && product.getDefaultWarrantyMonths() > 0 ?
                product.getDefaultWarrantyMonths() : 24; // Default 2 years

        // Explicit rule overrides from business requirements:
        // Inverter: 2 years (24 months), Battery: 2 years (24 months), Solar panels: 20 years (240 months)
        String catName = product.getCategory().getName().toUpperCase();
        if (catName.contains("PANEL")) {
            durationMonths = 240; // 20 years
        } else if (catName.contains("INVERTER") || catName.contains("BATTERY")) {
            durationMonths = 24; // 2 years
        }

        Warranty warranty = new Warranty();
        warranty.setCustomer(customer);
        warranty.setSalesOrder(order);
        warranty.setProduct(product);
        warranty.setSerialNumber(serialNumber);
        warranty.setDeliveryDate(deliveryDate);
        warranty.setWarrantyStartDate(deliveryDate);
        warranty.setWarrantyEndDate(deliveryDate.plusMonths(durationMonths));
        warranty.setDurationMonths(durationMonths);
        warranty.setStatus(WarrantyStatus.ACTIVE);
        warranty.setTermsAndConditions("Full manufacturer comprehensive warranty covering defects and performance standards.");

        warranty = warrantyRepository.save(warranty);
        if (warranty.getWarrantyNumber() == null) {
            warranty.setWarrantyNumber("WR-" + String.format("%05d", warranty.getId()));
            warranty = warrantyRepository.save(warranty);
        }

        return warranty;
    }
}
