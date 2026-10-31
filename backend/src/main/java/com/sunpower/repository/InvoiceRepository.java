package com.sunpower.repository;

import com.sunpower.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByCustomerId(Long customerId);
    Optional<Invoice> findBySalesOrderId(Long salesOrderId);
    Optional<Invoice> findByServiceTicketId(Long serviceTicketId);
}
