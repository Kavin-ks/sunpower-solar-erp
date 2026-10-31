package com.sunpower.service;

import com.sunpower.dto.InstallationDTOs.AssignedTechnicianRequest;
import com.sunpower.dto.InstallationDTOs.CompleteInstallationRequest;
import com.sunpower.dto.InstallationDTOs.ScheduleInstallationRequest;
import com.sunpower.dto.InstallationDTOs.TechnicianHoursRequest;
import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.ExpenseCategory;
import com.sunpower.entity.enums.Enums.InstallationStatus;
import com.sunpower.entity.enums.Enums.OrderStatus;
import com.sunpower.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class InstallationService {

    @Autowired
    private InstallationRepository installationRepository;

    @Autowired
    private InstallationTechnicianRepository installationTechnicianRepository;

    @Autowired
    private InstallationPhotoRepository installationPhotoRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private TechnicianPaymentRepository technicianPaymentRepository;

    @Autowired
    private SerialNumberRepository serialNumberRepository;

    @Autowired
    private SerialNumberHistoryRepository serialNumberHistoryRepository;

    @Autowired
    private WarrantyService warrantyService;

    public List<Installation> getAllInstallations() {
        return installationRepository.findAll();
    }

    public Installation getInstallationById(Long id) {
        return installationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Installation record not found with id: " + id));
    }

    public List<Installation> getInstallationsByStatus(InstallationStatus status) {
        return installationRepository.findByStatus(status);
    }

    @Transactional
    public SerialNumber verifyDispatchedProduct(Long installationId, String barcode, String technicianName) {
        Installation installation = getInstallationById(installationId);
        if (barcode == null || barcode.trim().isEmpty()) {
            throw new IllegalArgumentException("Scanned barcode cannot be empty");
        }
        String cleanBarcode = barcode.trim();
        SerialNumber sn = serialNumberRepository.findBySerialCode(cleanBarcode)
                .orElseThrow(() -> new IllegalArgumentException("Validation Error: Scanned barcode/serial '" + cleanBarcode + "' not recognized in system registry"));

        if (sn.getSalesOrder() == null || !sn.getSalesOrder().getId().equals(installation.getSalesOrder().getId())) {
            throw new IllegalStateException("Security / Validation Rejection: Product " + cleanBarcode +
                    " does NOT belong to Order " + installation.getSalesOrder().getOrderNumber() +
                    " (Belongs to: " + (sn.getSalesOrder() != null ? sn.getSalesOrder().getOrderNumber() : "Unassigned") + "). Rejected!");
        }

        sn.setStatus(com.sunpower.entity.enums.Enums.SerialNumberStatus.SITE_RECEIVED);
        sn.setSiteReceivedAt(LocalDateTime.now());
        sn.setInstallationId(installation.getId());
        sn = serialNumberRepository.save(sn);

        SerialNumberHistory history = new SerialNumberHistory(
                sn,
                com.sunpower.entity.enums.Enums.SerialNumberStatus.SITE_RECEIVED,
                "Physical barcode scanned and site-verified at customer rooftop by technician " + technicianName,
                installation.getCustomer().getAddress(),
                technicianName
        );
        serialNumberHistoryRepository.save(history);

        return sn;
    }

    @Transactional
    public Installation startInstallation(Long installationId, String technicianName) {
        Installation installation = getInstallationById(installationId);
        if (installation.getActualStartTime() == null) {
            installation.setActualStartTime(LocalDateTime.now());
        }
        installation.setStatus(InstallationStatus.IN_PROGRESS);
        installation = installationRepository.save(installation);

        SalesOrder order = installation.getSalesOrder();
        order.setStatus(OrderStatus.IN_INSTALLATION);
        salesOrderRepository.save(order);

        List<SerialNumber> serials = serialNumberRepository.findBySalesOrderId(order.getId());
        for (SerialNumber sn : serials) {
            if (sn.getInstallationStartedAt() == null) {
                sn.setInstallationStartedAt(LocalDateTime.now());
                sn.setInstallationId(installation.getId());
                serialNumberRepository.save(sn);

                SerialNumberHistory history = new SerialNumberHistory(
                        sn,
                        sn.getStatus(),
                        "Rooftop physical installation commenced by technician " + technicianName,
                        installation.getCustomer().getAddress(),
                        technicianName
                );
                serialNumberHistoryRepository.save(history);
            }
        }

        return installation;
    }

    @Transactional
    public Installation scheduleInstallation(ScheduleInstallationRequest request) {
        SalesOrder order = salesOrderRepository.findById(request.getSalesOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Sales order not found with id: " + request.getSalesOrderId()));

        // Check if an installation already exists for this order
        Installation installation = installationRepository.findBySalesOrderId(order.getId())
                .orElse(new Installation());

        installation.setSalesOrder(order);
        installation.setCustomer(order.getCustomer());
        installation.setScheduledDate(request.getScheduledDate());
        installation.setStatus(InstallationStatus.SCHEDULED);
        installation.setWorkNotes(request.getWorkNotes());

        installation = installationRepository.save(installation);
        if (installation.getInstallationNumber() == null) {
            installation.setInstallationNumber("INS-" + String.format("%05d", installation.getId()));
            installation = installationRepository.save(installation);
        }

        // Clear and reassign crew technicians
        if (!installation.getAssignedTechnicians().isEmpty()) {
            installationTechnicianRepository.deleteAll(installation.getAssignedTechnicians());
            installation.getAssignedTechnicians().clear();
        }

        List<InstallationTechnician> crew = new ArrayList<>();
        for (AssignedTechnicianRequest techReq : request.getTechnicians()) {
            Technician tech = technicianRepository.findById(techReq.getTechnicianId())
                    .orElseThrow(() -> new IllegalArgumentException("Technician not found with id: " + techReq.getTechnicianId()));
            InstallationTechnician it = new InstallationTechnician(installation, tech, techReq.getRoleInCrew());
            crew.add(it);
        }

        installationTechnicianRepository.saveAll(crew);
        installation.setAssignedTechnicians(crew);

        order.setStatus(OrderStatus.IN_INSTALLATION);
        salesOrderRepository.save(order);

        return installation;
    }

    @Transactional
    public Installation completeInstallation(Long installationId, CompleteInstallationRequest request, String completedBy) {
        Installation installation = getInstallationById(installationId);

        LocalDateTime finishTime = request.getActualFinishTime() != null ? request.getActualFinishTime() : LocalDateTime.now();
        if (installation.getActualStartTime() == null) {
            installation.setActualStartTime(request.getActualStartTime() != null ? request.getActualStartTime() : finishTime.minusHours(5));
        }
        installation.setActualFinishTime(finishTime);
        installation.setInstalledCapacityKw(request.getInstalledCapacityKw());
        installation.setPanelMountingConfirmed(request.isPanelMountingConfirmed());
        installation.setWiringConfirmed(request.isWiringConfirmed());
        installation.setEarthingConfirmed(request.isEarthingConfirmed());
        installation.setTestingPassed(request.isTestingPassed());
        installation.setTestingNotes(request.getTestingNotes());
        installation.setCustomerSigneeName(request.getCustomerSigneeName());
        if (request.getCustomerSignatureUrl() != null) {
            installation.setCustomerSignatureUrl(request.getCustomerSignatureUrl());
        }
        installation.setCustomerAcceptanceNote(request.getCustomerAcceptanceNote());
        installation.setCustomerSignedAt(LocalDateTime.now());
        installation.setStatus(InstallationStatus.COMPLETED);
        if (request.getWorkNotes() != null) {
            installation.setWorkNotes(request.getWorkNotes());
        }

        // Record technician hours and payouts
        if (request.getTechnicianHours() != null && !request.getTechnicianHours().isEmpty()) {
            for (TechnicianHoursRequest hoursReq : request.getTechnicianHours()) {
                for (InstallationTechnician it : installation.getAssignedTechnicians()) {
                    if (it.getTechnician().getId().equals(hoursReq.getTechnicianId())) {
                        it.setHoursWorked(hoursReq.getHoursWorked());
                        BigDecimal rate = it.getTechnician().getHourlyRate() != null ?
                                it.getTechnician().getHourlyRate() : BigDecimal.valueOf(250.00);
                        BigDecimal payout = hoursReq.getPayoutAmount() != null ?
                                hoursReq.getPayoutAmount() : hoursReq.getHoursWorked().multiply(rate);
                        it.setPayoutAmount(payout);
                        installationTechnicianRepository.save(it);

                        // Record technician payment record
                        TechnicianPayment tp = new TechnicianPayment();
                        tp.setTechnician(it.getTechnician());
                        tp.setInstallation(installation);
                        tp.setAmount(payout);
                        tp.setPaymentDate(LocalDate.now());
                        tp.setHoursCounted(hoursReq.getHoursWorked());
                        tp.setPaymentMethod("Bank Transfer");
                        tp.setNotes("Installation labour payout for Job " + installation.getInstallationNumber());
                        technicianPaymentRepository.save(tp);

                        // Record job expense for profitability tracking
                        Expense exp = new Expense();
                        exp.setCategory(ExpenseCategory.TECHNICIAN_PAYOUT);
                        exp.setSalesOrder(installation.getSalesOrder());
                        exp.setAmount(payout);
                        exp.setExpenseDate(LocalDate.now());
                        exp.setTitle("Technician Payout - " + it.getTechnician().getName());
                        exp.setDescription("Installation labour for order " + installation.getSalesOrder().getOrderNumber());
                        exp.setPaidTo(it.getTechnician().getName());
                        expenseRepository.save(exp);
                    }
                }
            }
        }

        installation = installationRepository.save(installation);

        SalesOrder order = installation.getSalesOrder();
        
        // Update all individual serialized products to INSTALLED and activate warranties on completion date
        List<SerialNumber> serials = serialNumberRepository.findBySalesOrderId(order.getId());
        for (SerialNumber sn : serials) {
            sn.setStatus(com.sunpower.entity.enums.Enums.SerialNumberStatus.INSTALLED);
            sn.setInstallationCompletedAt(finishTime);
            sn.setInstallationId(installation.getId());
            serialNumberRepository.save(sn);

            SerialNumberHistory history = new SerialNumberHistory(
                    sn,
                    com.sunpower.entity.enums.Enums.SerialNumberStatus.INSTALLED,
                    "Fully installed, tested, and commissioned on rooftop. Customer signee: " + request.getCustomerSigneeName(),
                    installation.getCustomer().getAddress(),
                    completedBy
            );
            serialNumberHistoryRepository.save(history);

            // Warranty activates strictly on completion date!
            warrantyService.activateWarranty(installation.getCustomer(), order, sn.getProduct(), sn, finishTime.toLocalDate(), installation.getId());
        }

        // Also activate warranties for non-serialized components like solar panels
        if (order.getItems() != null) {
            for (OrderItem oi : order.getItems()) {
                if (oi.getProduct().getCategory() != null && oi.getProduct().getCategory().getName().toUpperCase().contains("PANEL")) {
                    warrantyService.activateWarranty(installation.getCustomer(), order, oi.getProduct(), null, finishTime.toLocalDate(), installation.getId());
                }
            }
        }

        order.setStatus(OrderStatus.INSTALLED);
        if (order.getRemainingBalance().compareTo(BigDecimal.ZERO) == 0) {
            order.setStatus(OrderStatus.COMPLETED);
        }
        salesOrderRepository.save(order);

        return installation;
    }

    @Transactional
    public InstallationPhoto addInstallationPhoto(Long installationId, String photoUrl, String stage, String caption) {
        Installation installation = getInstallationById(installationId);
        InstallationPhoto photo = new InstallationPhoto(installation, photoUrl, stage, caption);
        return installationPhotoRepository.save(photo);
    }
}
