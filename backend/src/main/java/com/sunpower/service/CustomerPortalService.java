package com.sunpower.service;

import com.sunpower.dto.PaymentDTOs.PaymentRecordRequest;
import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.*;
import com.sunpower.repository.*;
import com.sunpower.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CustomerPortalService {

    @Autowired private CustomerRepository customerRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private EnquiryRepository enquiryRepository;
    @Autowired private SiteSurveyRepository siteSurveyRepository;
    @Autowired private QuotationRepository quotationRepository;
    @Autowired private SalesOrderRepository salesOrderRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private DispatchRepository dispatchRepository;
    @Autowired private InstallationRepository installationRepository;
    @Autowired private WarrantyRepository warrantyRepository;
    @Autowired private ServiceTicketRepository serviceTicketRepository;
    @Autowired private ServiceActivityRepository serviceActivityRepository;
    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private SubsidyApplicationRepository subsidyApplicationRepository;
    @Autowired private SerialNumberRepository serialNumberRepository;

    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private PaymentService paymentService;
    @Autowired private OrderService orderService;
    @Autowired private QuotationService quotationService;

    // ─────────────────────────────────────────────────────────────
    // INNER DTOs
    // ─────────────────────────────────────────────────────────────

    public static class CustomerRegisterRequest {
        public String fullName;
        public String phone;
        public String email;
        public String password;
        public String address;
        public String city;
        public String pincode;
    }

    public static class CustomerLoginRequest {
        public String usernameOrEmailOrPhone;
        public String password;
    }

    public static class CustomerAuthResponse {
        public String token;
        public String type = "Bearer";
        public Long userId;
        public String username;
        public String fullName;
        public String email;
        public String phone;
        public Long customerId;
        public List<String> roles;

        public CustomerAuthResponse(String token, User user, Customer customer, List<String> roles) {
            this.token = token;
            this.userId = user.getId();
            this.username = user.getUsername();
            this.fullName = user.getFullName();
            this.email = user.getEmail();
            this.phone = user.getPhone();
            this.customerId = customer != null ? customer.getId() : null;
            this.roles = roles;
        }
    }

    public static class PortalDataResponse {
        public Customer customer;
        public List<Enquiry> enquiries = new ArrayList<>();
        public List<SiteSurvey> surveys = new ArrayList<>();
        public List<Quotation> quotations = new ArrayList<>();
        public List<SalesOrder> orders = new ArrayList<>();
        public List<Dispatch> dispatches = new ArrayList<>();
        public List<Installation> installations = new ArrayList<>();
        public List<Warranty> warranties = new ArrayList<>();
        public List<Payment> payments = new ArrayList<>();
        public List<Invoice> invoices = new ArrayList<>();
        public List<SubsidyApplication> subsidies = new ArrayList<>();
        public List<ServiceTicket> serviceTickets = new ArrayList<>();
    }

    public static class CustomerPayRequest {
        public Long salesOrderId;
        public BigDecimal amount;
        public PaymentMethod method = PaymentMethod.UPI;
        public PaymentType type = PaymentType.ADVANCE;
        public String referenceNumber;
        public String notes;
    }

    public static class CustomerSignOffRequest {
        public String customerSigneeName;
        public String customerAcceptanceNote;
        public String customerSignatureUrl;
    }

    public static class CustomerTicketRequest {
        public Long serialNumberId;
        public String serialCode;
        public Long installationId;
        public String complaintDescription;
        public String faultCode;
    }

    public static class CustomerTicketConfirmRequest {
        public String confirmationNotes;
    }

    public static class QuotationAcceptRequest {
        // no body needed, but keep for future use
    }

    // ─────────────────────────────────────────────────────────────
    // AUTH: REGISTER
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public CustomerAuthResponse registerCustomer(CustomerRegisterRequest req) {
        String phone = req.phone != null ? req.phone.trim() : "";
        String email = req.email != null ? req.email.trim().toLowerCase() : null;

        // Build username from phone (unique, simple)
        String username = "cust_" + phone;
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("An account with this phone number already exists. Please log in instead.");
        }

        // Ensure ROLE_CUSTOMER exists
        Role customerRole = roleRepository.findByName(RoleName.ROLE_CUSTOMER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_CUSTOMER)));

        User user = new User(username, passwordEncoder.encode(req.password), req.fullName, email, phone);
        user.setRoles(Collections.singleton(customerRole));
        user = userRepository.save(user);

        // Smart customer linking: check if a Customer row already exists by phone or email
        Customer customer = resolveOrCreateCustomer(user, req.address, req.city, req.pincode);

        // Authenticate to generate JWT
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, req.password));
        String token = jwtTokenProvider.generateToken(auth);

        List<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).collect(Collectors.toList());

        return new CustomerAuthResponse(token, user, customer, roles);
    }

    // ─────────────────────────────────────────────────────────────
    // AUTH: LOGIN
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public CustomerAuthResponse loginCustomer(CustomerLoginRequest req) {
        String raw = req.usernameOrEmailOrPhone != null ? req.usernameOrEmailOrPhone.trim() : "";

        // Resolve username: could be username, phone, or email
        String username = raw;

        // Check if it looks like a phone number (digits only, 10 chars)
        if (raw.matches("\\d{10,}")) {
            // Look up by phone
            Optional<User> byPhone = userRepository.findByPhone(raw);
            if (byPhone.isPresent()) {
                username = byPhone.get().getUsername();
            } else {
                // Try customer table phone → user_id
                Optional<Customer> cByPhone = customerRepository.findFirstByPhoneOrderByIdDesc(raw);
                if (cByPhone.isPresent() && cByPhone.get().getUserId() != null) {
                    Optional<User> u = userRepository.findById(cByPhone.get().getUserId());
                    if (u.isPresent()) username = u.get().getUsername();
                }
            }
        } else if (raw.contains("@")) {
            // Resolve by email
            Optional<User> byEmail = userRepository.findByEmail(raw);
            if (byEmail.isPresent()) {
                username = byEmail.get().getUsername();
            }
        }

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, req.password));
        String token = jwtTokenProvider.generateToken(auth);

        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Smart link: ensure this user has a Customer record
        Customer customer = resolveOrCreateCustomer(user, null, null, null);

        List<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).collect(Collectors.toList());

        return new CustomerAuthResponse(token, user, customer, roles);
    }

    // ─────────────────────────────────────────────────────────────
    // SMART CUSTOMER RESOLVER
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public Customer resolveOrCreateCustomer(User user, String address, String city, String pincode) {
        // 1. First try: direct user_id link
        Optional<Customer> byUserId = customerRepository.findByUserId(user.getId());
        if (byUserId.isPresent()) {
            return byUserId.get();
        }

        // 2. Try matching by phone
        if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
            Optional<Customer> byPhone = customerRepository.findFirstByPhoneOrderByIdDesc(user.getPhone().trim());
            if (byPhone.isPresent()) {
                Customer c = byPhone.get();
                if (c.getUserId() == null) {
                    c.setUserId(user.getId());
                    return customerRepository.save(c);
                }
            }
        }

        // 3. Try matching by email
        if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
            Optional<Customer> byEmail = customerRepository.findFirstByEmailIgnoreCaseOrderByIdDesc(user.getEmail().trim());
            if (byEmail.isPresent()) {
                Customer c = byEmail.get();
                if (c.getUserId() == null) {
                    c.setUserId(user.getId());
                    return customerRepository.save(c);
                }
            }
        }

        // 4. Auto-create a new Customer from User details
        Customer newCustomer = new Customer();
        newCustomer.setFullName(user.getFullName());
        newCustomer.setPhone(user.getPhone() != null ? user.getPhone() : "0000000000");
        newCustomer.setEmail(user.getEmail());
        newCustomer.setAddress(address);
        newCustomer.setCity(city != null ? city : "Chennai");
        newCustomer.setPincode(pincode != null ? pincode : "600001");
        newCustomer.setCustomerType(CustomerType.RESIDENTIAL);
        newCustomer.setUserId(user.getId());
        return customerRepository.save(newCustomer);
    }

    // ─────────────────────────────────────────────────────────────
    // RESOLVE CUSTOMER FROM AUTHENTICATED USER
    // ─────────────────────────────────────────────────────────────

    public Customer getCustomerByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("No customer profile linked to this account."));
    }

    // ─────────────────────────────────────────────────────────────
    // GET PORTAL DATA (everything in one call)
    // ─────────────────────────────────────────────────────────────

    public PortalDataResponse getPortalData(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));

        PortalDataResponse resp = new PortalDataResponse();
        resp.customer = customer;
        resp.enquiries = enquiryRepository.findByCustomerId(customerId);
        resp.surveys = siteSurveyRepository.findByCustomerId(customerId);
        resp.quotations = quotationRepository.findByCustomerId(customerId);
        resp.orders = salesOrderRepository.findByCustomerId(customerId);
        resp.payments = paymentRepository.findByCustomerId(customerId);
        resp.installations = installationRepository.findByCustomerId(customerId);
        resp.warranties = warrantyRepository.findByCustomerId(customerId);
        resp.serviceTickets = serviceTicketRepository.findByCustomerId(customerId);
        resp.invoices = invoiceRepository.findByCustomerId(customerId);
        resp.subsidies = subsidyApplicationRepository.findByCustomerId(customerId);

        // Dispatches: fetch for each order
        for (SalesOrder order : resp.orders) {
            resp.dispatches.addAll(dispatchRepository.findBySalesOrderId(order.getId()));
        }

        return resp;
    }

    // ─────────────────────────────────────────────────────────────
    // ACCEPT QUOTATION
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public SalesOrder acceptQuotation(Long quotationId, Long customerId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new IllegalArgumentException("Quotation not found: " + quotationId));

        // Verify this quotation belongs to this customer
        if (!quotation.getCustomer().getId().equals(customerId)) {
            throw new SecurityException("This quotation does not belong to your account.");
        }

        // Mark quotation ACCEPTED
        quotation.setStatus(QuotationStatus.ACCEPTED);
        quotationRepository.save(quotation);

        // Auto-convert to SalesOrder if not already converted
        Optional<SalesOrder> existing = salesOrderRepository.findByQuotationId(quotationId);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Build convert request inline
        com.sunpower.dto.OrderDTOs.OrderConvertRequest convertReq = new com.sunpower.dto.OrderDTOs.OrderConvertRequest();
        convertReq.setQuotationId(quotationId);
        convertReq.setAdvancePercentage(BigDecimal.valueOf(30.00));

        return orderService.convertQuotationToOrder(convertReq, "Customer Portal");
    }

    // ─────────────────────────────────────────────────────────────
    // RECORD CUSTOMER PAYMENT
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public Payment recordCustomerPayment(Long orderId, CustomerPayRequest req, Long customerId) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new SecurityException("This order does not belong to your account.");
        }

        PaymentRecordRequest payReq = new PaymentRecordRequest();
        payReq.setSalesOrderId(orderId);
        payReq.setAmount(req.amount);
        payReq.setMethod(req.method);
        payReq.setType(req.type);
        payReq.setReferenceNumber(req.referenceNumber);
        payReq.setNotes(req.notes != null ? req.notes : "Customer self-service payment via portal");
        payReq.setPaymentDate(LocalDate.now());

        return paymentService.recordPayment(payReq);
    }

    // ─────────────────────────────────────────────────────────────
    // CUSTOMER INSTALLATION SIGN-OFF
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public Installation signOffInstallation(Long installationId, CustomerSignOffRequest req, Long customerId) {
        Installation installation = installationRepository.findById(installationId)
                .orElseThrow(() -> new IllegalArgumentException("Installation not found: " + installationId));

        if (!installation.getCustomer().getId().equals(customerId)) {
            throw new SecurityException("This installation does not belong to your account.");
        }

        installation.setCustomerSigneeName(req.customerSigneeName);
        installation.setCustomerAcceptanceNote(req.customerAcceptanceNote);
        if (req.customerSignatureUrl != null) {
            installation.setCustomerSignatureUrl(req.customerSignatureUrl);
        }
        installation.setCustomerSignedAt(LocalDateTime.now());
        installation.setStatus(InstallationStatus.COMPLETED);

        return installationRepository.save(installation);
    }

    // ─────────────────────────────────────────────────────────────
    // RAISE SERVICE TICKET
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public ServiceTicket raiseServiceTicket(CustomerTicketRequest req, Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));

        SerialNumber serialNumber = null;
        Warranty warranty = null;

        if (req.serialNumberId != null) {
            serialNumber = serialNumberRepository.findById(req.serialNumberId).orElse(null);
        } else if (req.serialCode != null && !req.serialCode.trim().isEmpty()) {
            serialNumber = serialNumberRepository.findBySerialCode(req.serialCode.trim()).orElse(null);
        }

        if (serialNumber != null) {
            Optional<Warranty> wOpt = warrantyRepository.findBySerialNumberId(serialNumber.getId());
            warranty = wOpt.orElse(null);
        }

        boolean underWarranty = false;
        if (warranty != null && warranty.getStatus() == WarrantyStatus.ACTIVE) {
            LocalDate today = LocalDate.now();
            if (warranty.getWarrantyEndDate() != null && !today.isAfter(warranty.getWarrantyEndDate())) {
                underWarranty = true;
            }
        }

        ServiceTicket ticket = new ServiceTicket();
        ticket.setCustomer(customer);
        ticket.setSerialNumber(serialNumber);
        ticket.setWarranty(warranty);
        ticket.setComplaintDescription(req.complaintDescription);
        ticket.setFaultCode(req.faultCode);
        ticket.setReportedDate(LocalDate.now());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setUnderWarranty(underWarranty);
        if (underWarranty) ticket.setTotalCustomerCharges(BigDecimal.ZERO);

        if (req.installationId != null) {
            installationRepository.findById(req.installationId)
                    .ifPresent(ticket::setInstallation);
        }

        ticket = serviceTicketRepository.save(ticket);
        if (ticket.getTicketNumber() == null) {
            ticket.setTicketNumber("TCK-" + String.format("%05d", ticket.getId()));
            ticket = serviceTicketRepository.save(ticket);
        }

        ServiceActivity act = new ServiceActivity(
                ticket,
                "CUSTOMER_TICKET_OPENED",
                "Customer raised service complaint via portal. Fault: " +
                        (req.faultCode != null ? req.faultCode : "N/A") +
                        ". Warranty: " + (underWarranty ? "ACTIVE (Zero charges)" : "NOT COVERED"),
                "Customer Portal"
        );
        serviceActivityRepository.save(act);

        return ticket;
    }

    // ─────────────────────────────────────────────────────────────
    // CUSTOMER CONFIRM TICKET CLOSE
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public ServiceTicket confirmTicketClose(Long ticketId, CustomerTicketConfirmRequest req, Long customerId) {
        ServiceTicket ticket = serviceTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Service ticket not found: " + ticketId));

        if (!ticket.getCustomer().getId().equals(customerId)) {
            throw new SecurityException("This ticket does not belong to your account.");
        }

        ticket.setCustomerConfirmed(true);
        ticket.setCustomerConfirmedAt(LocalDateTime.now());
        ticket.setCustomerConfirmationNotes(req.confirmationNotes);
        ticket.setStatus(TicketStatus.CLOSED);
        ticket = serviceTicketRepository.save(ticket);

        ServiceActivity act = new ServiceActivity(
                ticket,
                "CUSTOMER_CONFIRMED_CLOSE",
                "Customer confirmed resolution via portal. Notes: " + req.confirmationNotes,
                "Customer Portal"
        );
        serviceActivityRepository.save(act);

        return ticket;
    }
}
