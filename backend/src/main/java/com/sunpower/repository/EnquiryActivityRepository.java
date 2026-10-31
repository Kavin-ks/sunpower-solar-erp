package com.sunpower.repository;

import com.sunpower.entity.EnquiryActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnquiryActivityRepository extends JpaRepository<EnquiryActivity, Long> {
    List<EnquiryActivity> findByEnquiryIdOrderByCreatedAtDesc(Long enquiryId);
}
