package com.sunpower.repository;

import com.sunpower.entity.SiteSurvey;
import com.sunpower.entity.enums.Enums.SurveyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteSurveyRepository extends JpaRepository<SiteSurvey, Long> {
    List<SiteSurvey> findByStatus(SurveyStatus status);
    List<SiteSurvey> findByCustomerId(Long customerId);
    List<SiteSurvey> findByTechnicianId(Long technicianId);
    List<SiteSurvey> findByEnquiryId(Long enquiryId);

    @Query("SELECT s FROM SiteSurvey s WHERE s.customer.id = :customerId AND s.status = 'APPROVED'")
    List<SiteSurvey> findApprovedSurveysByCustomerId(@Param("customerId") Long customerId);

    long countByStatus(SurveyStatus status);
}
