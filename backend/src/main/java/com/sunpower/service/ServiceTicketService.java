package com.sunpower.service;

import com.sunpower.dto.ServiceTicketDTOs.CustomerConfirmationRequest;
import com.sunpower.dto.ServiceTicketDTOs.ServicePartRequest;
import com.sunpower.dto.ServiceTicketDTOs.TicketCreateRequest;
import com.sunpower.dto.ServiceTicketDTOs.TicketResolveRequest;
import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.ExpenseCategory;
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

        // Calculate warranty coverage
        boolean underWarranty = false;
        if (warranty != null && warranty.getStatus() == WarrantyStatus.ACTIVE) {
            LocalDate today = LocalDate.now();
            if (warranty.getWarrantyEndDate() != null && !today.isAfter(warranty.getWarrantyEndDate())) {
                underWarranty = true;
            }
        }
        ticket.setUnderWarranty(underWarranty);
        if (underWarranty) {
            ticket.setTotalCustomerCharges(BigDecimal.ZERO);
        }

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
                "Service complaint logged. Fault code: " + (ticket.getFaultCode() != null ? ticket.getFaultCode() : "N/A") +
                        ". Warranty status: " + (underWarranty ? "UNDER VALID WARRANTY (Zero charges)" : "OUT OF WARRANTY / EXPIRED"),
                createdBy != null ? createdBy : "Support Team"
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
        List<ServicePart> parts = new ArrayList<>();

        if (request.getReplacedParts() != null && !request.getReplacedParts().isEmpty()) {
            for (ServicePartRequest partReq : request.getReplacedParts()) {
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

        ticket.setParts(parts);
        ticket.setPartsCharges(underWarranty ? BigDecimal.ZERO : partsTotal);
        BigDecimal totalCharges = underWarranty ? BigDecimal.ZERO : laborCharges.add(partsTotal);
        ticket.setTotalCustomerCharges(totalCharges);

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
}
