package com.sunpower.service;

import com.sunpower.dto.EnquiryDTOs.EnquiryCreateRequest;
import com.sunpower.dto.EnquiryDTOs.EnquiryStatusUpdateRequest;
import com.sunpower.entity.Customer;
import com.sunpower.entity.Enquiry;
import com.sunpower.entity.EnquiryActivity;
import com.sunpower.entity.User;
import com.sunpower.entity.enums.Enums.EnquiryStatus;
import com.sunpower.repository.CustomerRepository;
import com.sunpower.repository.EnquiryActivityRepository;
import com.sunpower.repository.EnquiryRepository;
import com.sunpower.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EnquiryService {

    @Autowired
    private EnquiryRepository enquiryRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnquiryActivityRepository activityRepository;

    public List<Enquiry> getAllEnquiries() {
        return enquiryRepository.findAll();
    }

    public Enquiry getEnquiryById(Long id) {
        return enquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enquiry not found with id: " + id));
    }

    public List<Enquiry> searchEnquiries(String query) {
        return searchEnquiries(query, null);
    }

    public List<Enquiry> searchEnquiries(String query, EnquiryStatus status) {
        String trimmedQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        if (trimmedQuery == null && status == null) {
            return enquiryRepository.findAll();
        }
        return enquiryRepository.searchEnquiriesWithStatus(trimmedQuery, status);
    }

    public List<Enquiry> getEnquiriesByStatus(EnquiryStatus status) {
        return enquiryRepository.findByStatus(status);
    }

    @Transactional
    public Enquiry createEnquiry(EnquiryCreateRequest request, String createdBy) {
        Customer customer;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found with id: " + request.getCustomerId()));
        } else {
            // Check if customer with phone already exists, else create new
            List<Customer> existing = customerRepository.findByFullNameContainingIgnoreCaseOrPhoneContainingOrEmailContainingIgnoreCase(
                    request.getCustomerName(), request.getCustomerPhone(), request.getCustomerEmail());
            if (!existing.isEmpty()) {
                customer = existing.get(0);
            } else {
                customer = new Customer();
                customer.setFullName(request.getCustomerName());
                customer.setPhone(request.getCustomerPhone());
                customer.setEmail(request.getCustomerEmail());
                customer.setAddress(request.getCustomerAddress());
                customer.setCustomerType(request.getCustomerType());
                customer = customerRepository.save(customer);
            }
        }

        Enquiry enquiry = new Enquiry();
        enquiry.setCustomer(customer);
        enquiry.setRequestedCapacityKw(request.getRequestedCapacityKw());
        enquiry.setSystemType(request.getSystemType());
        enquiry.setSubsidyRequired(request.isSubsidyRequired());
        enquiry.setMonthlyElectricityBill(request.getMonthlyElectricityBill());
        if (request.getShadowFreeAreaSqFt() != null) {
            enquiry.setShadowFreeAreaSqFt(request.getShadowFreeAreaSqFt());
        }
        if (request.getGridSuitable() != null) {
            enquiry.setGridSuitable(request.getGridSuitable());
        }
        enquiry.setSource(request.getSource());
        enquiry.setStatus(EnquiryStatus.NEW);
        enquiry.setNotes(request.getNotes());

        if (request.getAssignedToUserId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedToUserId()).orElse(null);
            enquiry.setAssignedTo(assignedUser);
        }

        enquiry = enquiryRepository.save(enquiry);
        if (enquiry.getEnquiryNumber() == null) {
            enquiry.setEnquiryNumber("ENQ-" + String.format("%05d", enquiry.getId()));
            enquiry = enquiryRepository.save(enquiry);
        }

        // Add initial activity log
        EnquiryActivity activity = new EnquiryActivity(
                enquiry,
                "ENQUIRY_CREATED",
                "Enquiry received for " + enquiry.getRequestedCapacityKw() + " kW " + enquiry.getSystemType() + " system via " + enquiry.getSource(),
                createdBy != null ? createdBy : "System"
        );
        activityRepository.save(activity);

        return enquiry;
    }

    @Transactional
    public Enquiry updateStatus(Long id, EnquiryStatusUpdateRequest request, String updatedBy) {
        Enquiry enquiry = getEnquiryById(id);
        EnquiryStatus oldStatus = enquiry.getStatus();
        enquiry.setStatus(request.getStatus());

        if (request.getMonthlyElectricityBill() != null) {
            enquiry.setMonthlyElectricityBill(request.getMonthlyElectricityBill());
        }
        if (request.getShadowFreeAreaSqFt() != null) {
            enquiry.setShadowFreeAreaSqFt(request.getShadowFreeAreaSqFt());
        }
        if (request.getGridSuitable() != null) {
            enquiry.setGridSuitable(request.getGridSuitable());
        }

        enquiry = enquiryRepository.save(enquiry);

        EnquiryActivity activity = new EnquiryActivity(
                enquiry,
                "STATUS_CHANGE",
                "Status changed from " + oldStatus + " to " + request.getStatus() +
                        (request.getActionNote() != null ? ". Note: " + request.getActionNote() : ""),
                updatedBy != null ? updatedBy : "System"
        );
        activityRepository.save(activity);

        return enquiry;
    }

    @Transactional
    public Enquiry assignToSales(Long id, Long userId, String assignedBy) {
        Enquiry enquiry = getEnquiryById(id);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        enquiry.setAssignedTo(user);
        enquiry = enquiryRepository.save(enquiry);

        EnquiryActivity activity = new EnquiryActivity(
                enquiry,
                "SALES_ASSIGNED",
                "Enquiry assigned to sales representative: " + user.getFullName(),
                assignedBy != null ? assignedBy : "System"
        );
        activityRepository.save(activity);

        return enquiry;
    }

    @Transactional
    public EnquiryActivity addActivity(Long id, String action, String notes, String performedBy) {
        Enquiry enquiry = getEnquiryById(id);
        EnquiryActivity activity = new EnquiryActivity(enquiry, action, notes, performedBy);
        return activityRepository.save(activity);
    }

    public static String normalizePhone(String rawPhone) {
        if (rawPhone == null) return "";
        String digits = rawPhone.replaceAll("[^0-9]", "");
        if (digits.length() == 12 && digits.startsWith("91")) {
            digits = digits.substring(2);
        } else if (digits.length() == 11 && digits.startsWith("0")) {
            digits = digits.substring(1);
        }
        return digits.trim();
    }

    public static String normalizeEmail(String rawEmail) {
        if (rawEmail == null || rawEmail.trim().isEmpty()) return null;
        return rawEmail.trim().toLowerCase();
    }

    @Transactional
    public Enquiry createPublicEnquiry(com.sunpower.dto.EnquiryDTOs.PublicEnquiryRequest request) {
        String normalizedPhone = normalizePhone(request.getPhone());
        if (normalizedPhone.length() < 10) {
            throw new IllegalArgumentException("Please provide a valid 10-digit mobile phone number");
        }
        String normalizedEmail = normalizeEmail(request.getEmail());

        // Validate capacity (1kW to 5kW)
        if (request.getRequestedCapacityKw() == null ||
                request.getRequestedCapacityKw().compareTo(new java.math.BigDecimal("1.00")) < 0 ||
                request.getRequestedCapacityKw().compareTo(new java.math.BigDecimal("5.00")) > 0) {
            throw new IllegalArgumentException("System capacity must be between 1 kW and 5 kW");
        }

        // 1. Intelligent customer matching: Find existing customer by normalized phone or email
        Customer customer = customerRepository.findByPhone(normalizedPhone)
                .or(() -> customerRepository.findByPhone(request.getPhone().trim()))
                .or(() -> normalizedEmail != null ? customerRepository.findByEmail(normalizedEmail) : java.util.Optional.empty())
                .orElse(null);

        if (customer != null) {
            // Update customer address details if they were previously missing
            boolean updated = false;
            if ((customer.getAddress() == null || customer.getAddress().trim().isEmpty()) && request.getAddress() != null) {
                customer.setAddress(request.getAddress().trim());
                updated = true;
            }
            if ((customer.getCity() == null || customer.getCity().trim().isEmpty()) && request.getCity() != null) {
                customer.setCity(request.getCity().trim());
                updated = true;
            }
            if ((customer.getState() == null || customer.getState().trim().isEmpty()) && request.getState() != null) {
                customer.setState(request.getState().trim());
                updated = true;
            }
            if ((customer.getPincode() == null || customer.getPincode().trim().isEmpty()) && request.getPincode() != null) {
                customer.setPincode(request.getPincode().trim());
                updated = true;
            }
            if ((customer.getEmail() == null || customer.getEmail().trim().isEmpty()) && normalizedEmail != null) {
                customer.setEmail(normalizedEmail);
                updated = true;
            }
            if (updated) {
                customer = customerRepository.save(customer);
            }

            // 2. Duplicate submission prevention: check if customer recently submitted the exact same enquiry in last 60 seconds
            List<Enquiry> existingRecent = enquiryRepository.findByCustomerOrderByCreatedAtDesc(customer);
            if (!existingRecent.isEmpty()) {
                Enquiry lastEnquiry = existingRecent.get(0);
                if (lastEnquiry.getCreatedAt() != null &&
                        lastEnquiry.getCreatedAt().isAfter(java.time.LocalDateTime.now().minusSeconds(60)) &&
                        lastEnquiry.getRequestedCapacityKw().compareTo(request.getRequestedCapacityKw()) == 0 &&
                        lastEnquiry.getSystemType() == request.getSystemType()) {
                    // Safe idempotent return of existing enquiry
                    return lastEnquiry;
                }
            }
        } else {
            // Create new customer record
            customer = new Customer();
            customer.setFullName(request.getFullName().trim());
            customer.setPhone(normalizedPhone);
            customer.setEmail(normalizedEmail);
            customer.setAddress(request.getAddress() != null ? request.getAddress().trim() : "Site Address Pending");
            customer.setCity(request.getCity() != null ? request.getCity().trim() : "Chennai");
            customer.setState(request.getState() != null ? request.getState().trim() : "Tamil Nadu");
            customer.setPincode(request.getPincode() != null ? request.getPincode().trim() : "600001");
            customer.setCustomerType(request.getCustomerType() != null ? request.getCustomerType() : com.sunpower.entity.enums.Enums.CustomerType.RESIDENTIAL);
            customer = customerRepository.save(customer);
        }

        // 3. Create new Enquiry record
        Enquiry enquiry = new Enquiry();
        enquiry.setCustomer(customer);
        enquiry.setRequestedCapacityKw(request.getRequestedCapacityKw());
        enquiry.setSystemType(request.getSystemType() != null ? request.getSystemType() : com.sunpower.entity.enums.Enums.SystemType.ON_GRID);
        enquiry.setSubsidyRequired(request.isSubsidyRequired());
        enquiry.setMonthlyElectricityBill(request.getMonthlyElectricityBill());
        enquiry.setSource(request.getSource() != null ? request.getSource() : com.sunpower.entity.enums.Enums.EnquirySource.CUSTOMER_PORTAL);
        enquiry.setStatus(EnquiryStatus.NEW);
        enquiry.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        // Tele-qualification & basic rooftop feasibility fields
        if (request.getShadowFreeAreaSqFt() != null) {
            enquiry.setShadowFreeAreaSqFt(request.getShadowFreeAreaSqFt());
        }
        if (request.getGridSuitable() != null) {
            enquiry.setGridSuitable(request.getGridSuitable());
        }

        enquiry = enquiryRepository.save(enquiry);
        if (enquiry.getEnquiryNumber() == null) {
            enquiry.setEnquiryNumber("ENQ-" + String.format("%05d", enquiry.getId()));
            enquiry = enquiryRepository.save(enquiry);
        }

        // 4. Audit activity log
        EnquiryActivity activity = new EnquiryActivity(
                enquiry,
                "CUSTOMER_PORTAL_SUBMISSION",
                "New solar enquiry submitted via Customer Portal for " + enquiry.getRequestedCapacityKw() + " kW " + enquiry.getSystemType() + " rooftop installation.",
                "Customer Portal"
        );
        activityRepository.save(activity);

        return enquiry;
    }
}
