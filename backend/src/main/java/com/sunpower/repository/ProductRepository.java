package com.sunpower.repository;

import com.sunpower.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByProductCode(String productCode);
    List<Product> findByActiveTrue();
    List<Product> findBySerializedTrue();

    @Query("SELECT p FROM Product p WHERE p.currentStock <= p.minimumStockLevel AND p.active = true")
    List<Product> findLowStockProducts();
}
