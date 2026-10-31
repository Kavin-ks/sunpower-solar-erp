package com.sunpower.service;

import com.sunpower.entity.InventoryStock;
import com.sunpower.entity.Product;
import com.sunpower.entity.StockMovement;
import com.sunpower.entity.enums.Enums.StockMovementType;
import com.sunpower.repository.InventoryStockRepository;
import com.sunpower.repository.ProductRepository;
import com.sunpower.repository.StockMovementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private InventoryStockRepository stockRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockMovementRepository movementRepository;

    public List<InventoryStock> getAllStock() {
        return stockRepository.findAll();
    }

    public InventoryStock getStockByProductId(Long productId) {
        return stockRepository.findByProductId(productId)
                .orElseThrow(() -> new IllegalArgumentException("Inventory stock not found for product id: " + productId));
    }

    public List<StockMovement> getRecentMovements() {
        return movementRepository.findTop50ByOrderByCreatedAtDesc();
    }

    public List<StockMovement> getMovementsByProductId(Long productId) {
        return movementRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    @Transactional
    public InventoryStock adjustStock(Long productId, int quantityDelta, String reason, String performedBy) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + productId));

        InventoryStock stock = stockRepository.findByProductId(productId)
                .orElseGet(() -> new InventoryStock(product, 0, 0, "Main Warehouse"));

        int newAvailable = stock.getAvailableQuantity() + quantityDelta;
        if (newAvailable < 0) {
            throw new IllegalArgumentException("Negative inventory error: Stock cannot be reduced below 0. Available: " +
                    stock.getAvailableQuantity() + ", attempted reduction: " + Math.abs(quantityDelta));
        }

        stock.setAvailableQuantity(newAvailable);
        stockRepository.save(stock);

        product.setCurrentStock(newAvailable + stock.getReservedQuantity());
        productRepository.save(product);

        StockMovement movement = new StockMovement(
                product,
                quantityDelta >= 0 ? StockMovementType.PURCHASE_IN : StockMovementType.ADJUSTMENT,
                quantityDelta,
                "ADJ-" + System.currentTimeMillis() % 100000,
                reason,
                performedBy
        );
        movementRepository.save(movement);

        return stock;
    }
}
