package com.sunpower.repository;

import com.sunpower.entity.Warranty;
import com.sunpower.entity.enums.Enums.WarrantyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WarrantyRepository extends JpaRepository<Warranty, Long> {
    Optional<Warranty> findByWarrantyNumber(String warrantyNumber);
    Optional<Warranty> findBySerialNumberId(Long serialNumberId);
    Optional<Warranty> findBySerialNumberSerialCode(String serialCode);
    List<Warranty> findByCustomerId(Long customerId);
    List<Warranty> findBySalesOrderId(Long salesOrderId);
    List<Warranty> findByStatus(WarrantyStatus status);

    @Query("SELECT w FROM Warranty w WHERE w.status = 'ACTIVE' AND w.warrantyEndDate <= :targetDate")
    List<Warranty> findExpiringWarranties(@Param("targetDate") LocalDate targetDate);
}
