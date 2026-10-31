package com.sunpower.controller;

import com.sunpower.dto.ProductDTO;
import com.sunpower.entity.Product;
import com.sunpower.entity.ProductCategory;
import com.sunpower.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(
            @RequestParam(required = false) Boolean serialized,
            @RequestParam(required = false) Boolean lowStock) {
        if (Boolean.TRUE.equals(lowStock)) {
            return ResponseEntity.ok(productService.getLowStockProducts());
        }
        if (Boolean.TRUE.equals(serialized)) {
            return ResponseEntity.ok(productService.getSerializedProducts());
        }
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<ProductCategory>> getAllCategories() {
        return ResponseEntity.ok(productService.getAllCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody ProductDTO dto) {
        Product product = productService.createProduct(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductDTO dto) {
        Product product = productService.updateProduct(id, dto);
        return ResponseEntity.ok(product);
    }
}
