package com.sunpower.repository;

import com.sunpower.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    Optional<Purchase> findByPurchaseNumber(String purchaseNumber);
    List<Purchase> findAllByOrderByPurchaseDateDesc();
    List<Purchase> findBySupplierName(String supplierName);
    List<Purchase> findByPaymentStatus(String paymentStatus);

    @Query("SELECT COALESCE(SUM(p.remainingBalance), 0) FROM Purchase p WHERE p.status != 'CANCELLED'")
    BigDecimal sumOutstandingSupplierBalance();

    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Purchase p WHERE p.status != 'CANCELLED'")
    BigDecimal sumTotalPurchases();
}
