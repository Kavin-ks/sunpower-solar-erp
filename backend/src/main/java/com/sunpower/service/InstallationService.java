package com.sunpower.service;

import com.sunpower.dto.InstallationDTOs.AssignedTechnicianRequest;
import com.sunpower.dto.InstallationDTOs.CompleteInstallationRequest;
import com.sunpower.dto.InstallationDTOs.ScheduleInstallationRequest;
import com.sunpower.dto.InstallationDTOs.TechnicianHoursRequest;
import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.DispatchStatus;
import com.sunpower.entity.enums.Enums.ExpenseCategory;
import com.sunpower.entity.enums.Enums.InstallationStatus;
import com.sunpower.entity.enums.Enums.OrderStatus;
import com.sunpower.entity.enums.Enums.SerialNumberStatus;
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
    private DispatchRepository dispatchRepository;

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private TechnicianService technicianService;

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

    @Transactional(readOnly = true)
    public List<Installation> getInstallationsForTechnician(String username) {
        if (username == null || username.equalsIgnoreCase("admin")) {
            return installationRepository.findAll();
        }
        java.util.Optional<Technician> techOpt = technicianService.resolveTechnician(username);
        if (techOpt.isPresent()) {
            List<Long> instIds = installationTechnicianRepository.findByTechnicianId(techOpt.get().getId()).stream()
                    .map(it -> it.getInstallation().getId())
                    .distinct()
                    .collect(java.util.stream.Collectors.toList());
            if (instIds.isEmpty()) {
                return new java.util.ArrayList<>();
            }
            return installationRepository.findAllById(instIds);
        }
        return new java.util.ArrayList<>();
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
    public Installation confirmSiteReceived(Long installationId, com.sunpower.dto.InstallationDTOs.SiteReceivedRequest req, String actor) {
        Installation installation = getInstallationById(installationId);
        installation.setStatus(InstallationStatus.SITE_RECEIVED);
        if (req != null && req.getNotes() != null && !req.getNotes().trim().isEmpty()) {
            installation.setWorkNotes((installation.getWorkNotes() != null ? installation.getWorkNotes() + "\n" : "") + "Site arrival notes: " + req.getNotes().trim());
        }
        installation = installationRepository.save(installation);

        if (req != null && req.getArrivalPhotoUrl() != null && !req.getArrivalPhotoUrl().trim().isEmpty()) {
            InstallationPhoto photo = new InstallationPhoto(installation, req.getArrivalPhotoUrl().trim(), "Arrival", "Technician team arrived on customer site");
            installationPhotoRepository.save(photo);
        }

        SalesOrder order = installation.getSalesOrder();
        List<SerialNumber> serials = serialNumberRepository.findBySalesOrderId(order.getId());
        for (SerialNumber sn : serials) {
            sn.setStatus(com.sunpower.entity.enums.Enums.SerialNumberStatus.SITE_RECEIVED);
            if (sn.getSiteReceivedAt() == null) {
                sn.setSiteReceivedAt(LocalDateTime.now());
            }
            sn.setInstallationId(installation.getId());
            serialNumberRepository.save(sn);

            SerialNumberHistory history = new SerialNumberHistory(
                    sn,
                    com.sunpower.entity.enums.Enums.SerialNumberStatus.SITE_RECEIVED,
                    "Technician team arrived at site. Equipment verified at customer location (" + installation.getCustomer().getAddress() + ")",
                    installation.getCustomer().getAddress(),
                    actor
            );
            serialNumberHistoryRepository.save(history);
        }

        return installation;
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
        List<AssignedTechnicianRequest> techList = request.getTechnicians();
        if (techList == null || techList.isEmpty()) {
            throw new IllegalArgumentException("At least one technician must be assigned to the installation crew.");
        }
        for (int i = 0; i < techList.size(); i++) {
            AssignedTechnicianRequest techReq = techList.get(i);
            Technician tech = technicianRepository.findById(techReq.getTechnicianId())
                    .orElseThrow(() -> new IllegalArgumentException("Technician not found with id: " + techReq.getTechnicianId()));
            boolean isLead = Boolean.TRUE.equals(techReq.getIsTeamLead()) || (i == 0 && techList.stream().noneMatch(t -> Boolean.TRUE.equals(t.getIsTeamLead())));
            InstallationTechnician it = new InstallationTechnician(installation, tech,
                    techReq.getRoleInCrew() != null ? techReq.getRoleInCrew() : (isLead ? "Team Lead / Electrician" : "Installer"),
                    isLead);
            crew.add(it);
        }

        installation.setAssignedTechnicians(crew);
        installation = installationRepository.save(installation);

        order.setStatus(OrderStatus.IN_INSTALLATION);
        salesOrderRepository.save(order);

        return installation;
    }

    @Transactional
    public Installation completeInstallation(Long installationId, CompleteInstallationRequest request, String completedBy) {
        Installation installation = getInstallationById(installationId);

        // Required physical and testing verification guards
        if (!request.isPanelMountingConfirmed() || !request.isWiringConfirmed() || !request.isEarthingConfirmed()) {
            throw new IllegalStateException("Validation Error: Cannot complete installation without physical checks confirmed (Panel Mounting, Wiring, Earthing must all be checked).");
        }
        if (!request.isTestingPassed()) {
            throw new IllegalStateException("Validation Error: Cannot complete installation without testing passed.");
        }
        if (request.getTestingNotes() == null || request.getTestingNotes().trim().isEmpty()) {
            throw new IllegalStateException("Validation Error: Cannot complete installation without electrical test results (Voc, Isc, inverter grid sync readings).");
        }
        if (request.getCustomerSigneeName() == null || request.getCustomerSigneeName().trim().isEmpty()) {
            throw new IllegalStateException("Validation Error: Customer signee name is mandatory for signoff.");
        }
        if (request.getCustomerSignatureUrl() == null || request.getCustomerSignatureUrl().trim().isEmpty()) {
            throw new IllegalStateException("Validation Error: Customer digital signature is mandatory for commissioning signoff and warranty activation submission.");
        }

        // Check for completed rooftop photo evidence
        boolean hasCompletedPhoto = false;
        if (request.getCompletionPhotoUrl() != null && !request.getCompletionPhotoUrl().trim().isEmpty()) {
            hasCompletedPhoto = true;
            InstallationPhoto photo = new InstallationPhoto(installation, request.getCompletionPhotoUrl().trim(), "Completed Rooftop", "Final commissioned solar installation on rooftop");
            installationPhotoRepository.save(photo);
        } else if (installation.getPhotos() != null) {
            for (InstallationPhoto p : installation.getPhotos()) {
                if (p.getStage() != null && (p.getStage().equalsIgnoreCase("Full Rooftop") || p.getStage().equalsIgnoreCase("Completed Rooftop") || p.getStage().equalsIgnoreCase("Completed"))) {
                    hasCompletedPhoto = true;
                    break;
                }
            }
        }
        if (!hasCompletedPhoto) {
            throw new IllegalStateException("Validation Error: Cannot complete installation without photo evidence of the completed rooftop solar setup.");
        }

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
        installation.setCustomerSignatureUrl(request.getCustomerSignatureUrl());
        if (request.getCompletionReportPdfUrl() != null && !request.getCompletionReportPdfUrl().trim().isEmpty()) {
            installation.setCompletionReportPdfUrl(request.getCompletionReportPdfUrl());
        } else {
            installation.setCompletionReportPdfUrl("/reports/commissioning-ins-" + installation.getId() + ".pdf");
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
                        tp.setCalculatedAmount(payout);
                        tp.setAmountPaid(payout);
                        tp.setStatus(com.sunpower.entity.enums.Enums.TechnicianPayoutStatus.PAID);
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
        
        // Record technician lead submission on serial numbers history (submitted for warehouse manager warranty activation)
        List<SerialNumber> serials = serialNumberRepository.findBySalesOrderId(order.getId());
        for (SerialNumber sn : serials) {
            sn.setInstallationCompletedAt(finishTime);
            sn.setInstallationId(installation.getId());
            serialNumberRepository.save(sn);

            SerialNumberHistory history = new SerialNumberHistory(
                    sn,
                    sn.getStatus(),
                    "Installation completed on site by Technician Team Lead (" + completedBy + "). Dossier (rooftop photos, timeframe, commissioning report PDF, and customer digital signature) submitted to Warehouse Manager for warranty activation.",
                    installation.getCustomer().getAddress(),
                    completedBy
            );
            serialNumberHistoryRepository.save(history);
        }

        return installation;
    }

    @Transactional
    public Installation activateWarranty(Long installationId, String actor) {
        Installation installation = getInstallationById(installationId);
        if (installation.getStatus() != InstallationStatus.COMPLETED) {
            throw new IllegalStateException("Warranty cannot be activated: Installation status is " + installation.getStatus() + ". It must be COMPLETED by technician lead first.");
        }
        if (installation.getCustomerSignatureUrl() == null || installation.getCustomerSignatureUrl().trim().isEmpty()) {
            throw new IllegalStateException("Warranty cannot be activated: Customer digital signature is missing from technician dossier.");
        }

        SalesOrder order = installation.getSalesOrder();
        LocalDate installationDate = installation.getActualFinishTime() != null ?
                installation.getActualFinishTime().toLocalDate() : LocalDate.now();

        // 1. Update all serial numbers to INSTALLED and activate warranty
        List<SerialNumber> serials = serialNumberRepository.findBySalesOrderId(order.getId());
        for (SerialNumber sn : serials) {
            sn.setStatus(SerialNumberStatus.INSTALLED);
            sn.setInstallationCompletedAt(installation.getActualFinishTime());
            sn.setInstallationId(installation.getId());
            serialNumberRepository.save(sn);

            SerialNumberHistory history = new SerialNumberHistory(
                    sn,
                    SerialNumberStatus.INSTALLED,
                    "Warranty officially activated by Warehouse Manager (" + actor + "). Equipment status changed to INSTALLED upon review of technician lead dossier (photos, timeframe, commissioning report PDF, and customer digital signature).",
                    installation.getCustomer().getAddress(),
                    actor
            );
            serialNumberHistoryRepository.save(history);

            warrantyService.activateWarranty(installation.getCustomer(), order, sn.getProduct(), sn, installationDate, installation.getId(), installationDate);
        }

        // 2. Also activate non-serialized components like solar panels
        if (order.getItems() != null) {
            for (OrderItem oi : order.getItems()) {
                if (oi.getProduct().getCategory() != null && oi.getProduct().getCategory().getName().toUpperCase().contains("PANEL")) {
                    warrantyService.activateWarranty(installation.getCustomer(), order, oi.getProduct(), null, installationDate, installation.getId(), installationDate);
                }
            }
        }

        // 3. Update Dispatches to INSTALLED
        List<Dispatch> dispatches = dispatchRepository.findBySalesOrderId(order.getId());
        for (Dispatch d : dispatches) {
            d.setStatus(DispatchStatus.INSTALLED);
            dispatchRepository.save(d);
        }

        // 4. Mark installation warrantyActivated = true
        installation.setWarrantyActivated(true);
        installation.setWarrantyActivatedAt(LocalDateTime.now());
        installation.setWarrantyActivatedBy(actor);
        installation = installationRepository.save(installation);

        // 5. Update sales order status
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
