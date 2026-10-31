package com.sunpower.repository;

import com.sunpower.entity.PackageBOM;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PackageBOMRepository extends JpaRepository<PackageBOM, Long> {
    List<PackageBOM> findBySolarPackageId(Long packageId);
}
