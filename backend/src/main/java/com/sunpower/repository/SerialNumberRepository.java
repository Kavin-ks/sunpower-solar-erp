package com.sunpower.repository;

import com.sunpower.entity.SerialNumber;
import com.sunpower.entity.enums.Enums.SerialNumberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SerialNumberRepository extends JpaRepository<SerialNumber, Long> {
    Optional<SerialNumber> findBySerialCode(String serialCode);
    List<SerialNumber> findByProductIdAndStatus(Long productId, SerialNumberStatus status);
    List<SerialNumber> findBySalesOrderId(Long salesOrderId);
    List<SerialNumber> findByCustomerId(Long customerId);

    @Query("SELECT s FROM SerialNumber s WHERE LOWER(s.serialCode) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR (s.customer IS NOT NULL AND LOWER(s.customer.fullName) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "OR (s.customer IS NOT NULL AND s.customer.phone LIKE CONCAT('%', :query, '%'))")
    List<SerialNumber> searchSerialNumbers(@Param("query") String query);
}
