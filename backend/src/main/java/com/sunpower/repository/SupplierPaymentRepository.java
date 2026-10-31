package com.sunpower.repository;

import com.sunpower.entity.SupplierPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierPaymentRepository extends JpaRepository<SupplierPayment, Long> {
    @Query("SELECT sp FROM SupplierPayment sp WHERE sp.purchase.id = :purchaseId ORDER BY sp.paymentDate DESC")
    List<SupplierPayment> findByPurchaseIdOrderByPaymentDateDesc(@Param("purchaseId") Long purchaseId);
    List<SupplierPayment> findBySupplierNameOrderByPaymentDateDesc(String supplierName);
    Optional<SupplierPayment> findByPaymentNumber(String paymentNumber);
    boolean existsByReferenceNumber(String referenceNumber);
    boolean existsByReferenceNumberAndStatus(String referenceNumber, String status);

    @Query("SELECT COALESCE(SUM(sp.amount), 0) FROM SupplierPayment sp WHERE sp.status = 'SUCCESS'")
    BigDecimal sumTotalSupplierPayments();
}
