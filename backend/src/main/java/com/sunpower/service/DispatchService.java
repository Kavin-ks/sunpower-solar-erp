package com.sunpower.service;

import com.sunpower.dto.DispatchDTOs.AssignSerialNumberRequest;
import com.sunpower.dto.DispatchDTOs.ConfirmDeliveryRequest;
import com.sunpower.dto.DispatchDTOs.DispatchCreateRequest;
import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.DispatchStatus;
import com.sunpower.entity.enums.Enums.OrderStatus;
import com.sunpower.entity.enums.Enums.SerialNumberStatus;
import com.sunpower.entity.enums.Enums.StockMovementType;
import com.sunpower.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class DispatchService {

    @Autowired
    private DispatchRepository dispatchRepository;

    @Autowired
    private DispatchItemRepository dispatchItemRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private SerialNumberRepository serialNumberRepository;

    @Autowired
    private SerialNumberHistoryRepository serialNumberHistoryRepository;

    @Autowired
    private InventoryStockRepository inventoryStockRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private WarrantyService warrantyService;

    public List<Dispatch> getAllDispatches() {
        return dispatchRepository.findAll();
    }

    public Dispatch getDispatchById(Long id) {
        return dispatchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dispatch record not found with id: " + id));
    }

    public List<Dispatch> getDispatchesByOrderId(Long orderId) {
        return dispatchRepository.findBySalesOrderId(orderId);
    }

    @Transactional
    public Dispatch createDispatch(DispatchCreateRequest request, String createdBy) {
        SalesOrder order = salesOrderRepository.findById(request.getSalesOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Sales order not found with id: " + request.getSalesOrderId()));

        // Business rule: Do not allow dispatch until payment condition is satisfied!
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("Business Rule Violation: Dispatch cannot be prepared until the required advance payment is recorded. Order status is " + order.getStatus());
        }

        Dispatch dispatch = new Dispatch();
        dispatch.setSalesOrder(order);
        dispatch.setCustomer(order.getCustomer());
        dispatch.setStatus(DispatchStatus.PICKING);
        dispatch.setVehicleNumber(request.getVehicleNumber());
        dispatch.setDriverName(request.getDriverName());
        dispatch.setDriverPhone(request.getDriverPhone());
        dispatch.setDispatchNotes(request.getDispatchNotes());

        dispatch = dispatchRepository.save(dispatch);
        if (dispatch.getDispatchNumber() == null) {
            dispatch.setDispatchNumber("DSP-" + String.format("%05d", dispatch.getId()));
            dispatch = dispatchRepository.save(dispatch);
        }

        // Generate picking list items from order items
        List<DispatchItem> dispatchItems = new ArrayList<>();
        for (OrderItem orderItem : order.getItems()) {
            Product product = orderItem.getProduct();
            if (product.isSerialized()) {
                // Serialized products require a picking line per individual serialized unit
                for (int i = 0; i < orderItem.getQuantity(); i++) {
                    DispatchItem item = new DispatchItem(dispatch, product, 1, null);
                    dispatchItems.add(item);
                }
            } else {
                // Non-serialized item (panels, wires, stands)
                DispatchItem item = new DispatchItem(dispatch, product, orderItem.getQuantity(), null);
                dispatchItems.add(item);
            }
        }

        dispatchItemRepository.saveAll(dispatchItems);
        dispatch.setItems(dispatchItems);

        return dispatch;
    }

    @Transactional
    public Dispatch assignSerialNumber(AssignSerialNumberRequest request, String assignedBy) {
        DispatchItem item = dispatchItemRepository.findById(request.getDispatchItemId())
                .orElseThrow(() -> new IllegalArgumentException("Dispatch item not found with id: " + request.getDispatchItemId()));

        SerialNumber serial = serialNumberRepository.findBySerialCode(request.getSerialCode())
                .orElseThrow(() -> new IllegalArgumentException("Serial number not found: " + request.getSerialCode()));

        // Validate serial belongs to the required product
        if (!serial.getProduct().getId().equals(item.getProduct().getId())) {
            throw new IllegalArgumentException("Validation Error: Serial number " + request.getSerialCode() +
                    " belongs to product '" + serial.getProduct().getName() + "', but picking item requires '" + item.getProduct().getName() + "'");
        }

        // Validate status is IN_STOCK
        if (serial.getStatus() != SerialNumberStatus.IN_STOCK) {
            throw new IllegalArgumentException("Validation Error: Serial number " + request.getSerialCode() +
                    " is not available in stock (Current status: " + serial.getStatus() + ")");
        }

        // Assign serial number
        item.setSerialNumber(serial);
        dispatchItemRepository.save(item);

        serial.setStatus(SerialNumberStatus.ALLOCATED);
        serial.setSalesOrder(item.getDispatch().getSalesOrder());
        serial.setCustomer(item.getDispatch().getCustomer());
        serialNumberRepository.save(serial);

        // Record history
        SerialNumberHistory history = new SerialNumberHistory(
                serial,
                SerialNumberStatus.ALLOCATED,
                "Allocated to dispatch " + item.getDispatch().getDispatchNumber() + " for order " + item.getDispatch().getSalesOrder().getOrderNumber(),
                item.getDispatch().getCustomer().getFullName(),
                assignedBy != null ? assignedBy : "Warehouse Staff"
        );
        serialNumberHistoryRepository.save(history);

        return item.getDispatch();
    }

    @Transactional
    public Dispatch confirmDispatch(Long dispatchId, String confirmedBy) {
        Dispatch dispatch = getDispatchById(dispatchId);

        // Verify all serialized items have serial numbers assigned
        for (DispatchItem item : dispatch.getItems()) {
            if (item.getProduct().isSerialized() && item.getSerialNumber() == null) {
                throw new IllegalStateException("Dispatch cannot be confirmed: Serial number missing for product '" +
                        item.getProduct().getName() + "'. Every serialized item must be scanned/assigned.");
            }
        }

        dispatch.setStatus(DispatchStatus.DISPATCHED);
        dispatch.setDispatchDate(LocalDate.now());

        // Commit stock deduction
        for (DispatchItem item : dispatch.getItems()) {
            Product product = item.getProduct();
            inventoryStockRepository.findByProductId(product.getId()).ifPresent(stock -> {
                stock.setReservedQuantity(Math.max(0, stock.getReservedQuantity() - item.getQuantity()));
                inventoryStockRepository.save(stock);
            });

            product.setCurrentStock(Math.max(0, product.getCurrentStock() - item.getQuantity()));
            productRepository.save(product);

            StockMovement movement = new StockMovement(
                    product,
                    StockMovementType.DISPATCH_OUT,
                    -item.getQuantity(),
                    dispatch.getDispatchNumber(),
                    "Dispatched to customer " + dispatch.getCustomer().getFullName(),
                    confirmedBy
            );
            stockMovementRepository.save(movement);

            if (item.getSerialNumber() != null) {
                SerialNumber sn = item.getSerialNumber();
                sn.setStatus(SerialNumberStatus.DISPATCHED);
                sn.setDispatchDate(LocalDate.now());
                serialNumberRepository.save(sn);

                SerialNumberHistory history = new SerialNumberHistory(
                        sn,
                        SerialNumberStatus.DISPATCHED,
                        "Dispatched in vehicle " + dispatch.getVehicleNumber(),
                        dispatch.getCustomer().getFullName(),
                        confirmedBy
                );
                serialNumberHistoryRepository.save(history);

                // Auto-warranty clock initiation on dispatch
                warrantyService.activateWarranty(dispatch.getCustomer(), dispatch.getSalesOrder(), product, sn, LocalDate.now());
            } else if (product.getCategory() != null && product.getCategory().getName().toUpperCase().contains("PANEL")) {
                warrantyService.activateWarranty(dispatch.getCustomer(), dispatch.getSalesOrder(), product, null, LocalDate.now());
            }
        }

        SalesOrder order = dispatch.getSalesOrder();
        order.setStatus(OrderStatus.DISPATCHED);
        salesOrderRepository.save(order);

        return dispatchRepository.save(dispatch);
    }

    @Transactional
    public Dispatch confirmDelivery(Long dispatchId, ConfirmDeliveryRequest request, String confirmedBy) {
        Dispatch dispatch = getDispatchById(dispatchId);
        LocalDate deliveryDate = request.getDeliveryDate() != null ? request.getDeliveryDate() : LocalDate.now();

        dispatch.setStatus(DispatchStatus.DELIVERED);
        dispatch.setDeliveryDate(deliveryDate);
        if (request.getNotes() != null) {
            dispatch.setDispatchNotes((dispatch.getDispatchNotes() != null ? dispatch.getDispatchNotes() + "\n" : "") + "Delivery notes: " + request.getNotes());
        }

        dispatch = dispatchRepository.save(dispatch);

        // Update serial numbers and automatically activate warranties!
        for (DispatchItem item : dispatch.getItems()) {
            Product product = item.getProduct();
            SerialNumber sn = item.getSerialNumber();

            if (sn != null) {
                sn.setStatus(SerialNumberStatus.INSTALLED);
                sn.setDeliveryDate(deliveryDate);
                serialNumberRepository.save(sn);

                SerialNumberHistory history = new SerialNumberHistory(
                        sn,
                        SerialNumberStatus.INSTALLED,
                        "Delivered and verified at customer site. Warranty automatically activated.",
                        dispatch.getCustomer().getAddress(),
                        confirmedBy
                );
                serialNumberHistoryRepository.save(history);

                // Automatic warranty activation for serialized items
                warrantyService.activateWarranty(dispatch.getCustomer(), dispatch.getSalesOrder(), product, sn, deliveryDate);
            } else {
                // Also activate warranty for major non-serialized items like Solar Panels (20 years)
                if (product.getCategory().getName().toUpperCase().contains("PANEL")) {
                    warrantyService.activateWarranty(dispatch.getCustomer(), dispatch.getSalesOrder(), product, null, deliveryDate);
                }
            }
        }

        return dispatch;
    }
}
