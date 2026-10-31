package com.sunpower.repository;

import com.sunpower.entity.TechnicianPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TechnicianPaymentRepository extends JpaRepository<TechnicianPayment, Long> {
    List<TechnicianPayment> findByTechnicianId(Long technicianId);
    List<TechnicianPayment> findByInstallationId(Long installationId);
}
