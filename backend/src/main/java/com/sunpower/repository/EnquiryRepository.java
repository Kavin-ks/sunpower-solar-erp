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
           "OR e.customer.phone LIKE CONCAT('%', :query, '%') " +
           "OR LOWER(e.customer.email) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY e.id DESC")
    List<Enquiry> searchEnquiries(@Param("query") String query);

    @Query("SELECT e FROM Enquiry e WHERE " +
           "(:status IS NULL OR e.status = :status) AND " +
           "(:query IS NULL OR :query = '' OR " +
           "LOWER(e.enquiryNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.customer.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "e.customer.phone LIKE CONCAT('%', :query, '%') OR " +
           "LOWER(e.customer.email) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY e.id DESC")
    List<Enquiry> searchEnquiriesWithStatus(@Param("query") String query, @Param("status") EnquiryStatus status);

    long countByStatus(EnquiryStatus status);
}
