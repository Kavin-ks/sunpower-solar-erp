package com.sunpower.repository;

import com.sunpower.entity.Enquiry;
import com.sunpower.entity.enums.Enums.EnquiryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnquiryRepository extends JpaRepository<Enquiry, Long> {
    List<Enquiry> findByStatus(EnquiryStatus status);
    List<Enquiry> findByCustomerId(Long customerId);
    List<Enquiry> findByCustomerOrderByCreatedAtDesc(com.sunpower.entity.Customer customer);

    @Query("SELECT e FROM Enquiry e WHERE LOWER(e.enquiryNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(e.customer.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR e.customer.phone LIKE CONCAT('%', :query, '%')")
    List<Enquiry> searchEnquiries(@Param("query") String query);

    long countByStatus(EnquiryStatus status);
}
