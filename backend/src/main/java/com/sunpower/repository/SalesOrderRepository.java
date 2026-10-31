package com.sunpower.repository;

import com.sunpower.entity.SalesOrder;
import com.sunpower.entity.enums.Enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    Optional<SalesOrder> findByOrderNumber(String orderNumber);
    List<SalesOrder> findByCustomerId(Long customerId);
    List<SalesOrder> findByStatus(OrderStatus status);
    long countByStatus(OrderStatus status);

    @Query("SELECT SUM(o.totalAmount) FROM SalesOrder o WHERE o.status != 'CANCELLED'")
    BigDecimal getTotalInvoicedAmount();

    @Query("SELECT SUM(o.totalPaid) FROM SalesOrder o WHERE o.status != 'CANCELLED'")
    BigDecimal getTotalCollectedAmount();

    @Query("SELECT SUM(o.remainingBalance) FROM SalesOrder o WHERE o.status != 'CANCELLED'")
    BigDecimal getTotalOutstandingAmount();
}
