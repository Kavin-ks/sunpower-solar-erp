package com.sunpower.service;

import com.sunpower.dto.ServiceTicketDTOs.CustomerConfirmationRequest;
import com.sunpower.dto.ServiceTicketDTOs.ServicePartRequest;
import com.sunpower.dto.ServiceTicketDTOs.TicketCreateRequest;
import com.sunpower.dto.ServiceTicketDTOs.TicketResolveRequest;
import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.ExpenseCategory;
import com.sunpower.entity.enums.Enums.SerialNumberStatus;
import com.sunpower.entity.enums.Enums.TicketStatus;
import com.sunpower.entity.enums.Enums.WarrantyStatus;
import com.sunpower.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ServiceTicketService {

    @Autowired
    private ServiceTicketRepository serviceTicketRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SerialNumberRepository serialNumberRepository;

    @Autowired
    private WarrantyRepository warrantyRepository;

    @Autowired
    private WarrantyService warrantyService;

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ServiceActivityRepository serviceActivityRepository;

    @Autowired
    private ServicePartRepository servicePartRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    public List<ServiceTicket> getAllTickets() {
        return serviceTicketRepository.findAll();
    }

    public ServiceTicket getTicketById(Long id) {
        return serviceTicketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Service ticket not found with id: " + id));
    }

    public List<ServiceTicket> searchTickets(String query) {
        if (query == null || query.trim().isEmpty()) {
            return serviceTicketRepository.findAll();
        }
        return serviceTicketRepository.searchTickets(query.trim());
    }

    public List<ServiceTicket> getTicketsByStatus(TicketStatus status) {
        return serviceTicketRepository.findByStatus(status);
    }

    @Transactional
    public ServiceTicket createTicket(TicketCreateRequest request, String createdBy) {
        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId()).orElse(null);
        }

        SerialNumber serialNumber = null;
        Warranty warranty = null;

        if (request.getSerialNumberId() != null) {
            serialNumber = serialNumberRepository.findById(request.getSerialNumberId()).orElse(null);
        } else if (request.getSerialCode() != null && !request.getSerialCode().trim().isEmpty()) {
            serialNumber = serialNumberRepository.findBySerialCode(request.getSerialCode().trim()).orElse(null);
        }

        if (serialNumber != null) {
            if (customer == null && serialNumber.getCustomer() != null) {
                customer = serialNumber.getCustomer();
            }
            Optional<Warranty> wOpt = warrantyRepository.findBySerialNumberId(serialNumber.getId());
            if (wOpt.isPresent()) {
                warranty = wOpt.get();
            }
        }

        if (customer == null) {
            if (request.getCustomerPhone() != null && !request.getCustomerPhone().trim().isEmpty()) {
                List<Customer> matching = customerRepository.findByFullNameContainingIgnoreCaseOrPhoneContainingOrEmailContainingIgnoreCase(
                        request.getCustomerName(), request.getCustomerPhone(), null);
                if (!matching.isEmpty()) {
                    customer = matching.get(0);
                }
            }
        }

        if (customer == null) {
            throw new IllegalArgumentException("Customer identification required: Provide valid customer ID, phone, or serial number.");
        }

        ServiceTicket ticket = new ServiceTicket();
        ticket.setCustomer(customer);
        ticket.setSerialNumber(serialNumber);
        ticket.setWarranty(warranty);
        ticket.setComplaintDescription(request.getComplaintDescription());
        ticket.setFaultCode(request.getFaultCode());
        ticket.setReportedDate(LocalDate.now());
        ticket.setStatus(TicketStatus.OPEN);

        // Authoritative warranty calculation
        String code = serialNumber != null ? serialNumber.getSerialCode() : request.getSerialCode();
        com.sunpower.dto.ServiceTicketDTOs.WarrantyDecisionDTO decision = warrantyService.evaluateWarranty(code, customer.getId(), request.getFaultCode());
        ticket.setWarrantyCoverageStatus(decision.getWarrantyCoverageStatus());
        ticket.setChargeStatusText(decision.getChargeStatusText());
        boolean underWarranty = decision.isWarrantyActive() && decision.isFaultCovered();
        ticket.setUnderWarranty(underWarranty);
        ticket.setTotalCustomerCharges(decision.getEstimatedCustomerCharge() != null ? decision.getEstimatedCustomerCharge() : BigDecimal.ZERO);
        ticket.setSubmissionSource("OFFICER_ASSISTED");
        ticket.setReportedBy(createdBy != null ? createdBy : "Support Officer");

        if (request.getAssignedTechnicianId() != null) {
            Technician tech = technicianRepository.findById(request.getAssignedTechnicianId()).orElse(null);
            if (tech != null) {
                ticket.setAssignedTechnician(tech);
                ticket.setStatus(TicketStatus.ASSIGNED);
            }
        }

        ticket = serviceTicketRepository.save(ticket);
        if (ticket.getTicketNumber() == null) {
            ticket.setTicketNumber("TCK-" + String.format("%05d", ticket.getId()));
            ticket = serviceTicketRepository.save(ticket);
        }

        ServiceActivity act = new ServiceActivity(
                ticket,
                "TICKET_OPENED",
                "Service complaint recorded by " + (createdBy != null ? createdBy : "Support Officer") +
                        ". Fault: " + (ticket.getFaultCode() != null ? ticket.getFaultCode() : "N/A") +
                        ". Warranty decision: " + decision.getChargeStatusText() + ". Rationale: " + decision.getDecisionRationale(),
                createdBy != null ? createdBy : "Support Team"
        );
        serviceActivityRepository.save(act);

        return ticket;
    }

    @Transactional
    public ServiceTicket createPublicComplaint(com.sunpower.dto.ServiceTicketDTOs.PublicComplaintRequest request) {
        String phone = request.getCustomerPhone() != null ? request.getCustomerPhone().trim() : "";
        if (phone.isEmpty()) {
            throw new IllegalArgumentException("Customer contact phone is required");
        }

        String serialCode = request.getSerialCode() != null ? request.getSerialCode().trim() : "";
        if (serialCode.isEmpty()) {
            throw new IllegalArgumentException("Equipment serial number is required");
        }

        // Look up serial number in database
        SerialNumber serialNumber = serialNumberRepository.findBySerialCode(serialCode)
                .orElseThrow(() -> new IllegalArgumentException("Serial number '" + serialCode + "' is not recognized in SunPower installed equipment records."));

        // Match or associate customer
        Customer customer = serialNumber.getCustomer();
        if (customer == null) {
            List<Customer> matching = customerRepository.findByFullNameContainingIgnoreCaseOrPhoneContainingOrEmailContainingIgnoreCase(
                    request.getCustomerName(), phone, request.getCustomerEmail());
            if (!matching.isEmpty()) {
                customer = matching.get(0);
            } else {
                customer = new Customer();
                customer.setFullName(request.getCustomerName() != null ? request.getCustomerName() : "Valued Customer");
                customer.setPhone(phone);
                customer.setEmail(request.getCustomerEmail());
                customer = customerRepository.save(customer);
            }
            serialNumber.setCustomer(customer);
            serialNumberRepository.save(serialNumber);
        }

        // Authoritative warranty evaluation
        com.sunpower.dto.ServiceTicketDTOs.WarrantyDecisionDTO decision = warrantyService.evaluateWarranty(serialCode, customer.getId(), request.getFaultCategory());

        Optional<Warranty> wOpt = warrantyRepository.findBySerialNumberId(serialNumber.getId());
        Warranty warranty = wOpt.orElse(null);

        ServiceTicket ticket = new ServiceTicket();
        ticket.setCustomer(customer);
        ticket.setSerialNumber(serialNumber);
        ticket.setWarranty(warranty);
        ticket.setComplaintDescription(request.getComplaintDescription());
        ticket.setFaultCode(request.getFaultCategory() != null ? request.getFaultCategory() : "General Fault");
        ticket.setComplaintPhotoUrl(request.getComplaintPhotoUrl());
        ticket.setSubmissionSource("CUSTOMER_PORTAL");
        ticket.setReportedBy(request.getCustomerName() != null ? request.getCustomerName() : customer.getFullName());
        ticket.setReportedDate(LocalDate.now());
        ticket.setStatus(TicketStatus.OPEN);

        ticket.setWarrantyCoverageStatus(decision.getWarrantyCoverageStatus());
        ticket.setChargeStatusText(decision.getChargeStatusText());
        boolean underWarranty = decision.isWarrantyActive() && decision.isFaultCovered();
        ticket.setUnderWarranty(underWarranty);
        ticket.setTotalCustomerCharges(decision.getEstimatedCustomerCharge() != null ? decision.getEstimatedCustomerCharge() : BigDecimal.ZERO);

        ticket = serviceTicketRepository.save(ticket);
        if (ticket.getTicketNumber() == null) {
            ticket.setTicketNumber("TCK-" + String.format("%05d", ticket.getId()));
            ticket = serviceTicketRepository.save(ticket);
        }

        ServiceActivity act = new ServiceActivity(
                ticket,
                "CUSTOMER_COMPLAINT_SUBMITTED",
                "Customer submitted complaint via online portal. Category: " + ticket.getFaultCode() +
                        ". Warranty Decision: " + decision.getChargeStatusText() + ". Rationale: " + decision.getDecisionRationale(),
                customer.getFullName()
        );
        serviceActivityRepository.save(act);

        return ticket;
    }

    public ServiceTicket getTicketForCustomer(String ticketNumber, String phone) {
        ServiceTicket ticket = serviceTicketRepository.findByTicketNumber(ticketNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found with reference: " + ticketNumber));
        if (phone != null && !phone.trim().isEmpty() && ticket.getCustomer() != null) {
            String cleanCustPhone = ticket.getCustomer().getPhone() != null ? ticket.getCustomer().getPhone().replaceAll("[^0-9]", "") : "";
            String cleanReqPhone = phone.replaceAll("[^0-9]", "");
            if (!cleanCustPhone.isEmpty() && !cleanReqPhone.isEmpty() &&
                !cleanCustPhone.endsWith(cleanReqPhone) && !cleanReqPhone.endsWith(cleanCustPhone)) {
                throw new IllegalArgumentException("Customer contact verification failed for ticket " + ticketNumber);
            }
        }
        return ticket;
    }

    public List<ServiceTicket> getTicketsForTechnician(String username) {
        if (username == null || username.equalsIgnoreCase("admin") || username.equalsIgnoreCase("technician")) {
            return serviceTicketRepository.findAll();
        }
        Optional<Technician> techOpt = technicianRepository.findByUserUsername(username);
        if (techOpt.isEmpty()) {
            techOpt = technicianRepository.findByNameContainingIgnoreCase(username);
        }
        if (techOpt.isPresent()) {
            return serviceTicketRepository.findByAssignedTechnicianId(techOpt.get().getId());
        }
        return new ArrayList<>();
    }

    @Transactional
    public ServiceTicket startTechnicianWork(Long ticketId, String technicianName) {
        ServiceTicket ticket = getTicketById(ticketId);

        // Security validation: Technician cannot start another technician's job
        if (technicianName != null && !technicianName.equalsIgnoreCase("admin") && !technicianName.equalsIgnoreCase("technician")) {
            Optional<Technician> callerTech = technicianRepository.findByUserUsername(technicianName);
            if (callerTech.isPresent() && ticket.getAssignedTechnician() != null) {
                if (!ticket.getAssignedTechnician().getId().equals(callerTech.get().getId())) {
                    throw new org.springframework.security.access.AccessDeniedException(
                            "Access Denied: Ticket is assigned to " + ticket.getAssignedTechnician().getName() + ". You are not authorized to start another technician's ticket."
                    );
                }
            }
        }

        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket = serviceTicketRepository.save(ticket);

        ServiceActivity act = new ServiceActivity(
                ticket,
                "WORK_STARTED",
                "Technician " + (technicianName != null ? technicianName : "Lead") + " arrived on-site and initiated diagnostic & repair work.",
                technicianName != null ? technicianName : "Field Technician"
        );
        serviceActivityRepository.save(act);
        return ticket;
    }

    @Transactional
    public ServiceTicket completeTechnicianWork(Long ticketId, com.sunpower.dto.ServiceTicketDTOs.TechnicianJobCompleteRequest request, String completedBy) {
        ServiceTicket ticket = getTicketById(ticketId);

        // Security validation: Technician cannot complete another technician's job
        if (completedBy != null && !completedBy.equalsIgnoreCase("admin") && !completedBy.equalsIgnoreCase("technician")) {
            Optional<Technician> callerTech = technicianRepository.findByUserUsername(completedBy);
            if (callerTech.isPresent() && ticket.getAssignedTechnician() != null) {
                if (!ticket.getAssignedTechnician().getId().equals(callerTech.get().getId())) {
                    throw new org.springframework.security.access.AccessDeniedException(
                            "Access Denied: Ticket is assigned to " + ticket.getAssignedTechnician().getName() + ". You are not authorized to complete another technician's ticket."
                    );
                }
            }
        }

        ticket.setDiagnosisNotes(request.getDiagnosisNotes());
        ticket.setResolutionNotes(request.getResolutionNotes());
        ticket.setTestingResults(request.getTestingResults());
        ticket.setBeforePhotoUrl(request.getBeforePhotoUrl());
        ticket.setAfterPhotoUrl(request.getAfterPhotoUrl());
        if (request.getAfterPhotoUrl() != null) {
            ticket.setRepairPhotoUrl(request.getAfterPhotoUrl());
        }
        ticket.setTechnicianCompletedAt(LocalDateTime.now());
        ticket.setStatus(TicketStatus.RESOLVED);

        boolean underWarranty = ticket.isUnderWarranty();
        BigDecimal laborCharges = underWarranty ? BigDecimal.ZERO : (request.getLaborCharges() != null ? request.getLaborCharges() : BigDecimal.ZERO);
        ticket.setLaborCharges(laborCharges);

        BigDecimal partsTotal = BigDecimal.ZERO;
        List<ServicePart> parts = new ArrayList<>();

        if (request.getReplacedParts() != null && !request.getReplacedParts().isEmpty()) {
            for (com.sunpower.dto.ServiceTicketDTOs.ServicePartRequest partReq : request.getReplacedParts()) {
                Product product = productRepository.findById(partReq.getProductId())
                        .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + partReq.getProductId()));
                BigDecimal unitPrice = partReq.getUnitPrice() != null ? partReq.getUnitPrice() : product.getSellingPrice();

                ServicePart sp = new ServicePart(ticket, product, partReq.getQuantity(), unitPrice, underWarranty);
                parts.add(sp);
                partsTotal = partsTotal.add(sp.getFinalCharge());

                // Record company repair expense
                Expense exp = new Expense();
                exp.setCategory(ExpenseCategory.SERVICE_REPAIR);
                exp.setServiceTicket(ticket);
                exp.setAmount(product.getPurchasePrice().multiply(BigDecimal.valueOf(partReq.getQuantity())));
                exp.setExpenseDate(LocalDate.now());
                exp.setTitle("Replacement Part Cost - " + product.getName());
                exp.setDescription("Service repair replacement for ticket " + ticket.getTicketNumber());
                exp.setPaidTo("Warehouse Inventory");
                expenseRepository.save(exp);
            }
            servicePartRepository.saveAll(parts);
        }

        if (ticket.getParts() != null) {
            ticket.getParts().clear();
            ticket.getParts().addAll(parts);
        } else {
            ticket.setParts(parts);
        }
        ticket.setPartsCharges(underWarranty ? BigDecimal.ZERO : partsTotal);
        BigDecimal totalCharges = underWarranty ? BigDecimal.ZERO : laborCharges.add(partsTotal);
        ticket.setTotalCustomerCharges(totalCharges);

        // If out-of-warranty and chargeable, create invoice
        if (!underWarranty && totalCharges.compareTo(BigDecimal.ZERO) > 0) {
            Optional<Invoice> existingInv = invoiceRepository.findByServiceTicketId(ticket.getId());
            if (existingInv.isEmpty()) {
                Invoice invoice = new Invoice();
                invoice.setServiceTicket(ticket);
                invoice.setCustomer(ticket.getCustomer());
                invoice.setInvoiceDate(LocalDate.now());
                invoice.setDueDate(LocalDate.now().plusDays(15));
                invoice.setSubtotal(totalCharges);
                invoice.setTaxAmount(BigDecimal.ZERO);
                invoice.setTotalAmount(totalCharges);
                invoice.setPaidAmount(BigDecimal.ZERO);
                invoice.setBalanceAmount(totalCharges);
                invoice.setStatus("ISSUED");
                invoice.setNotes("Out-of-warranty service repair charges for ticket " + ticket.getTicketNumber());
                invoice = invoiceRepository.save(invoice);
                if (invoice.getInvoiceNumber() == null) {
                    invoice.setInvoiceNumber("INV-SRV-" + String.format("%05d", invoice.getId()));
                    invoiceRepository.save(invoice);
                }
            }
        }

        ticket = serviceTicketRepository.save(ticket);

        ServiceActivity act = new ServiceActivity(
                ticket,
                "TECHNICIAN_WORK_COMPLETED",
                "Technician submitted repair completion. Diagnosis: " + request.getDiagnosisNotes() +
                        ". Testing: " + (request.getTestingResults() != null ? request.getTestingResults() : "Generation verified") +
                        ". Total customer charge: ₹" + ticket.getTotalCustomerCharges() +
                        (underWarranty ? " (Covered 100% by Warranty)" : " (Chargeable)"),
                completedBy != null ? completedBy : "Technician"
        );
        serviceActivityRepository.save(act);

        return ticket;
    }

    @Transactional
    public ServiceTicket assignTechnician(Long ticketId, Long technicianId, String assignedBy) {
        ServiceTicket ticket = getTicketById(ticketId);
        Technician tech = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new IllegalArgumentException("Technician not found with id: " + technicianId));

        ticket.setAssignedTechnician(tech);
        ticket.setStatus(TicketStatus.ASSIGNED);
        ticket = serviceTicketRepository.save(ticket);

        ServiceActivity act = new ServiceActivity(
                ticket,
                "TECHNICIAN_ASSIGNED",
                "Assigned to service technician: " + tech.getName(),
                assignedBy
        );
        serviceActivityRepository.save(act);

        return ticket;
    }

    @Transactional
    public ServiceTicket resolveTicket(Long ticketId, TicketResolveRequest request, String resolvedBy) {
        ServiceTicket ticket = getTicketById(ticketId);

        ticket.setDiagnosisNotes(request.getDiagnosisNotes());
        ticket.setResolutionNotes(request.getResolutionNotes());
        ticket.setStatus(TicketStatus.RESOLVED);

        boolean underWarranty = ticket.isUnderWarranty();
        BigDecimal laborCharges = underWarranty ? BigDecimal.ZERO : (request.getLaborCharges() != null ? request.getLaborCharges() : BigDecimal.ZERO);
        ticket.setLaborCharges(laborCharges);

        BigDecimal partsTotal = BigDecimal.ZERO;
        if (ticket.getParts() == null) {
            ticket.setParts(new ArrayList<>());
        } else {
            ticket.getParts().clear();
        }

        if (request.getReplacedParts() != null && !request.getReplacedParts().isEmpty()) {
            for (ServicePartRequest partReq : request.getReplacedParts()) {
                Product product = productRepository.findById(partReq.getProductId())
                        .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + partReq.getProductId()));
                BigDecimal unitPrice = partReq.getUnitPrice() != null ? partReq.getUnitPrice() : product.getSellingPrice();

                ServicePart sp = new ServicePart(ticket, product, partReq.getQuantity(), unitPrice, underWarranty);
                ticket.getParts().add(sp);
                partsTotal = partsTotal.add(sp.getFinalCharge());

                // Record company repair expense
                Expense exp = new Expense();
                exp.setCategory(ExpenseCategory.SERVICE_REPAIR);
                exp.setServiceTicket(ticket);
                exp.setAmount(product.getPurchasePrice().multiply(BigDecimal.valueOf(partReq.getQuantity())));
                exp.setExpenseDate(LocalDate.now());
                exp.setTitle("Replacement Part Cost - " + product.getName());
                exp.setDescription("Service repair replacement for ticket " + ticket.getTicketNumber());
                exp.setPaidTo("Warehouse Inventory");
                expenseRepository.save(exp);
            }
        }

        ticket.setPartsCharges(underWarranty ? BigDecimal.ZERO : partsTotal);
        BigDecimal totalCharges = underWarranty ? BigDecimal.ZERO : laborCharges.add(partsTotal);
        ticket.setTotalCustomerCharges(totalCharges);

        // EDGE CASE 2 (Blueprint): Replacement Serial Number Swap During Warranty Repair
        if (request.getReplacementSerialCode() != null && !request.getReplacementSerialCode().trim().isEmpty()) {
            if (ticket.getSerialNumber() != null) {
                SerialNumber oldSerial = ticket.getSerialNumber();
                oldSerial.setStatus(SerialNumberStatus.DEFECTIVE);
                serialNumberRepository.save(oldSerial);
            }
            Optional<SerialNumber> repOpt = serialNumberRepository.findBySerialCode(request.getReplacementSerialCode().trim());
            if (repOpt.isPresent()) {
                SerialNumber newSerial = repOpt.get();
                newSerial.setStatus(SerialNumberStatus.INSTALLED);
                newSerial.setCustomer(ticket.getCustomer());
                if (ticket.getInstallation() != null) {
                    newSerial.setInstallationId(ticket.getInstallation().getId());
                }
                serialNumberRepository.save(newSerial);
                ticket.setSerialNumber(newSerial);
            }
        }

        // If out-of-warranty and chargeable, create invoice linked to service_ticket_id
        if (!underWarranty && totalCharges.compareTo(BigDecimal.ZERO) > 0) {
            Optional<Invoice> existingInv = invoiceRepository.findByServiceTicketId(ticket.getId());
            if (existingInv.isEmpty()) {
                Invoice invoice = new Invoice();
                invoice.setServiceTicket(ticket);
                invoice.setCustomer(ticket.getCustomer());
                invoice.setInvoiceDate(LocalDate.now());
                invoice.setDueDate(LocalDate.now().plusDays(15));
                invoice.setSubtotal(totalCharges);
                invoice.setTaxAmount(BigDecimal.ZERO);
                invoice.setTotalAmount(totalCharges);
                invoice.setPaidAmount(BigDecimal.ZERO);
                invoice.setBalanceAmount(totalCharges);
                invoice.setStatus("ISSUED");
                invoice.setNotes("Out-of-warranty service repair charges for ticket " + ticket.getTicketNumber());
                invoice = invoiceRepository.save(invoice);
                if (invoice.getInvoiceNumber() == null) {
                    invoice.setInvoiceNumber("INV-SRV-" + String.format("%05d", invoice.getId()));
                    invoiceRepository.save(invoice);
                }
            }
        }

        ticket = serviceTicketRepository.save(ticket);

        ServiceActivity act = new ServiceActivity(
                ticket,
                "TICKET_RESOLVED",
                "Technician resolved ticket. Diagnosis: " + request.getDiagnosisNotes() +
                        ". Total customer charge: ₹" + ticket.getTotalCustomerCharges() +
                        (underWarranty ? " (Covered 100% by Warranty)" : " (Chargeable)"),
                resolvedBy
        );
        serviceActivityRepository.save(act);

        return ticket;
    }

    @Transactional
    public ServiceTicket confirmAndClose(Long ticketId, CustomerConfirmationRequest request, String confirmedBy) {
        ServiceTicket ticket = getTicketById(ticketId);

        // Business rule: Can only confirm after RESOLVED!
        if (ticket.getStatus() != TicketStatus.RESOLVED) {
            throw new IllegalStateException("Ticket must be in RESOLVED status before customer confirmation. Current status: " + ticket.getStatus());
        }

        ticket.setCustomerConfirmed(true);
        ticket.setCustomerConfirmedAt(LocalDateTime.now());
        ticket.setCustomerConfirmationNotes(request.getConfirmationNotes());
        ticket.setStatus(TicketStatus.CLOSED);

        ticket = serviceTicketRepository.save(ticket);

        ServiceActivity act = new ServiceActivity(
                ticket,
                "CUSTOMER_CONFIRMED_AND_CLOSED",
                "Customer confirmed solar installation is operating normally. Remarks: " + request.getConfirmationNotes(),
                confirmedBy != null ? confirmedBy : "Customer Support"
        );
        serviceActivityRepository.save(act);

        return ticket;
    }

    @Transactional
    public ServiceTicket reopenTicket(Long ticketId, String reason, String reopenedBy) {
        ServiceTicket ticket = getTicketById(ticketId);
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setCustomerConfirmed(false);
        ticket = serviceTicketRepository.save(ticket);

        ServiceActivity act = new ServiceActivity(
                ticket,
                "TICKET_REOPENED",
                "Customer reported unresolved issue. Ticket reopened for further repair work: " + (reason != null ? reason : "Issue persisting"),
                reopenedBy != null ? reopenedBy : "Customer Support"
        );
        serviceActivityRepository.save(act);
        return ticket;
    }
}
