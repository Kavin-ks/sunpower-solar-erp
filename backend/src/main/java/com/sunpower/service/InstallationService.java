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

        installation.setActualStartTime(request.getActualStartTime() != null ? request.getActualStartTime() : LocalDateTime.now().minusHours(6));
        installation.setActualFinishTime(request.getActualFinishTime() != null ? request.getActualFinishTime() : LocalDateTime.now());
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
