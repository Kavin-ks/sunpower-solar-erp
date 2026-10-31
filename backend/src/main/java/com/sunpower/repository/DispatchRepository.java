package com.sunpower.repository;

import com.sunpower.entity.Dispatch;
import com.sunpower.entity.enums.Enums.DispatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DispatchRepository extends JpaRepository<Dispatch, Long> {
    Optional<Dispatch> findByDispatchNumber(String dispatchNumber);
    List<Dispatch> findBySalesOrderId(Long salesOrderId);
    List<Dispatch> findByStatus(DispatchStatus status);
}
