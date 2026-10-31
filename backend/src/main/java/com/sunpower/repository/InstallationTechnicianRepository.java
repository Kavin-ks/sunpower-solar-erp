package com.sunpower.repository;

import com.sunpower.entity.InstallationTechnician;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InstallationTechnicianRepository extends JpaRepository<InstallationTechnician, Long> {
    List<InstallationTechnician> findByInstallationId(Long installationId);
    List<InstallationTechnician> findByTechnicianId(Long technicianId);
}
