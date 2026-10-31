package com.sunpower.repository;

import com.sunpower.entity.Payment;
import com.sunpower.entity.enums.Enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT p FROM Payment p WHERE p.salesOrder.id = :salesOrderId")
    List<Payment> findBySalesOrderId(@Param("salesOrderId") Long salesOrderId);

    @Query("SELECT p FROM Payment p WHERE p.salesOrder.id = :salesOrderId ORDER BY p.paymentDate DESC")
    List<Payment> findBySalesOrderIdOrderByPaymentDateDesc(@Param("salesOrderId") Long salesOrderId);

    @Query("SELECT p FROM Payment p WHERE p.customer.id = :customerId")
    List<Payment> findByCustomerId(@Param("customerId") Long customerId);

    List<Payment> findAllByOrderByPaymentDateDesc();
    List<Payment> findByStatus(PaymentStatus status);

    boolean existsByReferenceNumberAndStatus(String referenceNumber, PaymentStatus status);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.salesOrder.id = :orderId AND p.status = 'SUCCESS'")
    BigDecimal sumPaymentsByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'SUCCESS'")
    BigDecimal sumTotalPayments();
}
