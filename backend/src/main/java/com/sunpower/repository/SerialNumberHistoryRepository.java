package com.sunpower.repository;

import com.sunpower.entity.SerialNumberHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SerialNumberHistoryRepository extends JpaRepository<SerialNumberHistory, Long> {
    List<SerialNumberHistory> findBySerialNumberIdOrderByCreatedAtDesc(Long serialNumberId);
}
