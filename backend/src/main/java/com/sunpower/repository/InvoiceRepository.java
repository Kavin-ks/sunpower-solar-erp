package com.sunpower.repository;

import com.sunpower.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByCustomerId(Long customerId);
    Optional<Invoice> findBySalesOrderId(Long salesOrderId);
    boolean existsBySalesOrderIdAndStatusNot(Long salesOrderId, String status);
    Optional<Invoice> findByServiceTicketId(Long serviceTicketId);
    List<Invoice> findAllByOrderByInvoiceDateDesc();
    List<Invoice> findByStatus(String status);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.dueDate < :today AND i.balanceAmount > 0 AND i.status != 'CANCELLED'")
    long countOverdueInvoices(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(i.balanceAmount), 0) FROM Invoice i WHERE i.dueDate < :today AND i.balanceAmount > 0 AND i.status != 'CANCELLED'")
    BigDecimal sumOverdueAmount(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(i.taxAmount), 0) FROM Invoice i WHERE i.status != 'CANCELLED'")
    BigDecimal sumTotalOutputTax();

    @Query("SELECT COALESCE(SUM(i.cgstAmount), 0) FROM Invoice i WHERE i.status != 'CANCELLED'")
    BigDecimal sumTotalCgst();

    @Query("SELECT COALESCE(SUM(i.sgstAmount), 0) FROM Invoice i WHERE i.status != 'CANCELLED'")
    BigDecimal sumTotalSgst();

    @Query("SELECT COALESCE(SUM(i.igstAmount), 0) FROM Invoice i WHERE i.status != 'CANCELLED'")
    BigDecimal sumTotalIgst();
}
