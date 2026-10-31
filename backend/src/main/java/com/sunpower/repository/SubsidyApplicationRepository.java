package com.sunpower.repository;

import com.sunpower.entity.SubsidyApplication;
import com.sunpower.entity.enums.Enums.SubsidyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubsidyApplicationRepository extends JpaRepository<SubsidyApplication, Long> {
    Optional<SubsidyApplication> findByApplicationNumber(String applicationNumber);
    List<SubsidyApplication> findByCustomerId(Long customerId);
    Optional<SubsidyApplication> findBySalesOrderId(Long salesOrderId);
    List<SubsidyApplication> findByStatus(SubsidyStatus status);
    List<SubsidyApplication> findAllByOrderByCreatedAtDesc();

    @Query("SELECT SUM(s.amountReceived) FROM SubsidyApplication s")
    BigDecimal sumTotalSubsidiesReceived();

    @Query("SELECT SUM(s.pendingSubsidyAmount) FROM SubsidyApplication s WHERE s.status IN ('APPROVED', 'PARTIALLY_RECEIVED')")
    BigDecimal sumPendingSubsidyReceipts();
}
