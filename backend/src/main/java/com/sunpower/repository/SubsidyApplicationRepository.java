package com.sunpower.repository;

import com.sunpower.entity.SubsidyApplication;
import com.sunpower.entity.enums.Enums.SubsidyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubsidyApplicationRepository extends JpaRepository<SubsidyApplication, Long> {
    Optional<SubsidyApplication> findByApplicationNumber(String applicationNumber);
    List<SubsidyApplication> findByCustomerId(Long customerId);
    Optional<SubsidyApplication> findBySalesOrderId(Long salesOrderId);
    List<SubsidyApplication> findByStatus(SubsidyStatus status);
}
