package com.sunpower.repository;

import com.sunpower.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findBySalesOrderId(Long salesOrderId);
    List<Payment> findByCustomerId(Long customerId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.salesOrder.id = :orderId AND p.status = 'SUCCESS'")
    BigDecimal sumPaymentsByOrderId(Long orderId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'SUCCESS'")
    BigDecimal sumTotalPayments();
}
