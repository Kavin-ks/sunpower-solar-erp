package com.sunpower.repository;

import com.sunpower.entity.SolarPackage;
import com.sunpower.entity.enums.Enums.SystemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SolarPackageRepository extends JpaRepository<SolarPackage, Long> {
    List<SolarPackage> findByActiveTrue();
    Optional<SolarPackage> findBySystemTypeAndCapacityKw(SystemType systemType, BigDecimal capacityKw);
}
