package com.sunpower.repository;

import com.sunpower.entity.InstallationPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InstallationPhotoRepository extends JpaRepository<InstallationPhoto, Long> {
    List<InstallationPhoto> findByInstallationId(Long installationId);
}
