package com.sunpower.repository;

import com.sunpower.entity.TechnicianPayment;
import com.sunpower.entity.enums.Enums.TechnicianPayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface TechnicianPaymentRepository extends JpaRepository<TechnicianPayment, Long> {
    List<TechnicianPayment> findByTechnicianId(Long technicianId);
    List<TechnicianPayment> findByInstallationId(Long installationId);
    List<TechnicianPayment> findAllByOrderByPaymentDateDesc();
    List<TechnicianPayment> findByTechnicianIdOrderByPaymentDateDesc(Long technicianId);
    List<TechnicianPayment> findByStatus(TechnicianPayoutStatus status);
    boolean existsByReferenceNumber(String referenceNumber);
    boolean existsByInstallationIdAndTechnicianId(Long installationId, Long technicianId);

    @Query("SELECT SUM(tp.amountPaid) FROM TechnicianPayment tp")
    BigDecimal sumTotalPayoutsDisbursed();

    @Query("SELECT SUM(tp.remainingAmount) FROM TechnicianPayment tp WHERE tp.status != 'PAID'")
    BigDecimal sumPendingPayouts();
}
