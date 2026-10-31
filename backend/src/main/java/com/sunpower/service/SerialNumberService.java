package com.sunpower.service;

import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.SerialNumberStatus;
import com.sunpower.repository.ProductRepository;
import com.sunpower.repository.SerialNumberHistoryRepository;
import com.sunpower.repository.SerialNumberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class SerialNumberService {

    @Autowired
    private SerialNumberRepository serialNumberRepository;

    @Autowired
    private SerialNumberHistoryRepository historyRepository;

    @Autowired
    private ProductRepository productRepository;

    public List<SerialNumber> getAllSerialNumbers() {
        return serialNumberRepository.findAll();
    }

    public SerialNumber getById(Long id) {
        return serialNumberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Serial number not found with id: " + id));
    }

    public Optional<SerialNumber> findBySerialCode(String code) {
        return serialNumberRepository.findBySerialCode(code);
    }

    public List<SerialNumber> getAvailableSerialsForProduct(Long productId) {
        return serialNumberRepository.findByProductIdAndStatus(productId, SerialNumberStatus.IN_STOCK);
    }

    public List<SerialNumber> searchSerialNumbers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return serialNumberRepository.findAll();
        }
        return serialNumberRepository.searchSerialNumbers(query.trim());
    }

    public List<SerialNumber> getSerialsByOrderId(Long salesOrderId) {
        return serialNumberRepository.findBySalesOrderId(salesOrderId);
    }

    @Transactional
    public SerialNumber registerSerialNumber(Long productId, String serialCode, String purchaseReference, String location, String recordedBy) {
        if (serialNumberRepository.findBySerialCode(serialCode).isPresent()) {
            throw new IllegalArgumentException("Serial code already exists: " + serialCode);
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + productId));

        SerialNumber sn = new SerialNumber(serialCode, product, purchaseReference, location);
        sn = serialNumberRepository.save(sn);

        SerialNumberHistory history = new SerialNumberHistory(
                sn,
                SerialNumberStatus.IN_STOCK,
                "Initial intake of serialized component into warehouse",
                location,
                recordedBy != null ? recordedBy : "Warehouse Officer"
        );
        historyRepository.save(history);

        return sn;
    }
}
