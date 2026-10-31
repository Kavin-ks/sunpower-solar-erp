package com.sunpower.repository;

import com.sunpower.entity.ServiceActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceActivityRepository extends JpaRepository<ServiceActivity, Long> {
    List<ServiceActivity> findByServiceTicketIdOrderByCreatedAtDesc(Long serviceTicketId);
}
