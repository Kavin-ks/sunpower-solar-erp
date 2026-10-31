package com.sunpower.repository;

import com.sunpower.entity.Installation;
import com.sunpower.entity.enums.Enums.InstallationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstallationRepository extends JpaRepository<Installation, Long> {
    Optional<Installation> findByInstallationNumber(String installationNumber);
    Optional<Installation> findBySalesOrderId(Long salesOrderId);
    List<Installation> findByCustomerId(Long customerId);
    List<Installation> findByStatus(InstallationStatus status);
    long countByStatus(InstallationStatus status);
}
