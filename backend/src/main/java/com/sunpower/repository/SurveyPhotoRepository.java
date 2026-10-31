package com.sunpower.repository;

import com.sunpower.entity.SurveyPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveyPhotoRepository extends JpaRepository<SurveyPhoto, Long> {
    List<SurveyPhoto> findBySiteSurveyId(Long siteSurveyId);
}
