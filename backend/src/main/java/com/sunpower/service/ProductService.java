package com.sunpower.service;

import com.sunpower.dto.ProductDTO;
import com.sunpower.entity.InventoryStock;
import com.sunpower.entity.Product;
import com.sunpower.entity.ProductCategory;
import com.sunpower.repository.InventoryStockRepository;
import com.sunpower.repository.ProductCategoryRepository;
import com.sunpower.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductCategoryRepository categoryRepository;

    @Autowired
    private InventoryStockRepository stockRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getActiveProducts() {
        return productRepository.findByActiveTrue();
    }

    public List<Product> getSerializedProducts() {
        return productRepository.findBySerializedTrue();
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
    }

    public List<ProductCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Transactional
    public Product createProduct(ProductDTO dto) {
        ProductCategory category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + dto.getCategoryId()));

        Product product = new Product();
        product.setProductCode(dto.getProductCode());
        product.setName(dto.getName());
        product.setCategory(category);
        product.setDescription(dto.getDescription());
        product.setUnit(dto.getUnit());
        product.setPurchasePrice(dto.getPurchasePrice());
        product.setSellingPrice(dto.getSellingPrice());
        product.setCurrentStock(dto.getCurrentStock() != null ? dto.getCurrentStock() : 0);
        product.setMinimumStockLevel(dto.getMinimumStockLevel() != null ? dto.getMinimumStockLevel() : 5);
        product.setSerialized(dto.isSerialized());
        product.setDefaultWarrantyMonths(dto.getDefaultWarrantyMonths() != null ? dto.getDefaultWarrantyMonths() : 0);
        product.setActive(dto.isActive());

        product = productRepository.save(product);

        // Ensure inventory stock record exists
        if (stockRepository.findByProductId(product.getId()).isEmpty()) {
            InventoryStock stock = new InventoryStock(product, product.getCurrentStock(), 0, "Main Warehouse");
            stockRepository.save(stock);
        }

        return product;
    }

    @Transactional
    public Product updateProduct(Long id, ProductDTO dto) {
        Product product = getProductById(id);
        if (dto.getCategoryId() != null) {
            ProductCategory category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + dto.getCategoryId()));
            product.setCategory(category);
        }
        product.setProductCode(dto.getProductCode());
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setUnit(dto.getUnit());
        product.setPurchasePrice(dto.getPurchasePrice());
        product.setSellingPrice(dto.getSellingPrice());
        product.setMinimumStockLevel(dto.getMinimumStockLevel());
        product.setSerialized(dto.isSerialized());
        product.setDefaultWarrantyMonths(dto.getDefaultWarrantyMonths());
        product.setActive(dto.isActive());

        return productRepository.save(product);
    }
}
