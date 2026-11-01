package com.sunpower.repository;

import com.sunpower.entity.ServiceTicket;
import com.sunpower.entity.enums.Enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceTicketRepository extends JpaRepository<ServiceTicket, Long> {
    Optional<ServiceTicket> findByTicketNumber(String ticketNumber);
    List<ServiceTicket> findByCustomerId(Long customerId);
    List<ServiceTicket> findByStatus(TicketStatus status);
    List<ServiceTicket> findByAssignedTechnicianId(Long technicianId);
    List<ServiceTicket> findByInstallationSalesOrderId(Long salesOrderId);
    List<ServiceTicket> findByWarrantySalesOrderId(Long salesOrderId);
    long countByStatus(TicketStatus status);
    long countByCustomerIdAndStatusNot(Long customerId, TicketStatus status);

    @Query("SELECT t FROM ServiceTicket t WHERE LOWER(t.ticketNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(t.customer.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR t.customer.phone LIKE CONCAT('%', :query, '%') " +
           "OR (t.serialNumber IS NOT NULL AND LOWER(t.serialNumber.serialCode) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<ServiceTicket> searchTickets(@Param("query") String query);
}
