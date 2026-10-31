package com.sunpower.repository;

import com.sunpower.entity.Quotation;
import com.sunpower.entity.enums.Enums.QuotationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    Optional<Quotation> findByQuotationNumber(String quotationNumber);
    List<Quotation> findByCustomerId(Long customerId);
    List<Quotation> findByStatus(QuotationStatus status);
    long countByStatus(QuotationStatus status);
}
