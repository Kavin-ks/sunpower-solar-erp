package com.sunpower.repository;

import com.sunpower.entity.Technician;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TechnicianRepository extends JpaRepository<Technician, Long> {
    List<Technician> findByActiveTrue();
    List<Technician> findByAvailableTrueAndActiveTrue();
}
