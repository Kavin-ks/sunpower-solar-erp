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
        if (query == null || query.trim().isEmpty()) {
            return enquiryRepository.findAll();
        }
        return enquiryRepository.searchEnquiries(query.trim());
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
}
