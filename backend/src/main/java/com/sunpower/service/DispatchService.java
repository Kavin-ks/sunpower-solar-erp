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
import java.time.LocalDateTime;
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
    private InstallationRepository installationRepository;

    @Autowired
    private InstallationTechnicianRepository installationTechnicianRepository;

    @Autowired
    private TechnicianRepository technicianRepository;

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

        String code = request.getSerialCode() != null ? request.getSerialCode().trim() : "";
        if (code.isEmpty()) {
            throw new IllegalArgumentException("Scanned barcode or serial code cannot be empty");
        }

        java.util.Optional<SerialNumber> serialOpt = serialNumberRepository.findBySerialCode(code);
        SerialNumber serial;

        if (serialOpt.isEmpty()) {
            // Auto-generate new serial number record based on scanned barcode
            serial = new SerialNumber();
            serial.setProduct(item.getProduct());
            serial.setSerialCode(code);
            serial.setStatus(SerialNumberStatus.ALLOCATED);
            serial.setSalesOrder(item.getDispatch().getSalesOrder());
            serial.setCustomer(item.getDispatch().getCustomer());
            serial.setWarehouseLocation("Outbound Bay - Assigned for Installation");
            serial.setPurchaseReference("BC-SCAN-" + LocalDate.now().getYear());
            serial = serialNumberRepository.save(serial);

            // Record history
            SerialNumberHistory history = new SerialNumberHistory(
                    serial,
                    SerialNumberStatus.ALLOCATED,
                    "Auto-generated from scanned barcode (" + code + "). Product '" + item.getProduct().getName() +
                            "' verified and outbound for rooftop installation under Order " +
                            item.getDispatch().getSalesOrder().getOrderNumber() + " (Customer: " +
                            item.getDispatch().getCustomer().getFullName() + ")",
                    item.getDispatch().getCustomer().getFullName(),
                    assignedBy != null ? assignedBy : "Warehouse Barcode Scanner"
            );
            serialNumberHistoryRepository.save(history);
        } else {
            serial = serialOpt.get();

            // If already assigned to this item, return early
            if (item.getSerialNumber() != null && item.getSerialNumber().getId().equals(serial.getId())) {
                return item.getDispatch();
            }

            // Validate serial belongs to the required product
            if (!serial.getProduct().getId().equals(item.getProduct().getId())) {
                throw new IllegalArgumentException("Validation Error: Scanned serial " + code +
                        " belongs to product '" + serial.getProduct().getName() + "', but picking item requires '" + item.getProduct().getName() + "'");
            }

            // Validate status
            if (serial.getStatus() != SerialNumberStatus.IN_STOCK && serial.getStatus() != SerialNumberStatus.ALLOCATED) {
                throw new IllegalArgumentException("Validation Error: Serial number " + code +
                        " is currently in status '" + serial.getStatus() + "'. Only IN_STOCK units can be allocated for installation.");
            }

            serial.setStatus(SerialNumberStatus.ALLOCATED);
            serial.setSalesOrder(item.getDispatch().getSalesOrder());
            serial.setCustomer(item.getDispatch().getCustomer());
            serial.setWarehouseLocation("Outbound Bay - Assigned for Installation");
            serial = serialNumberRepository.save(serial);

            // Record history
            SerialNumberHistory history = new SerialNumberHistory(
                    serial,
                    SerialNumberStatus.ALLOCATED,
                    "Scanned & verified in warehouse. Product '" + item.getProduct().getName() +
                            "' allocated for rooftop installation under Order " +
                            item.getDispatch().getSalesOrder().getOrderNumber() + " (Customer: " +
                            item.getDispatch().getCustomer().getFullName() + ")",
                    item.getDispatch().getCustomer().getFullName(),
                    assignedBy != null ? assignedBy : "Warehouse Barcode Scanner"
            );
            serialNumberHistoryRepository.save(history);
        }

        // Assign serial number to dispatch item
        item.setSerialNumber(serial);
        dispatchItemRepository.save(item);

        Dispatch dispatch = item.getDispatch();
        boolean allAssigned = true;
        for (DispatchItem di : dispatch.getItems()) {
            if (di.getProduct().isSerialized() && di.getSerialNumber() == null) {
                allAssigned = false;
                break;
            }
        }
        if (allAssigned && dispatch.getStatus() == DispatchStatus.PICKING) {
            dispatch.setStatus(DispatchStatus.READY_FOR_DISPATCH);
            dispatch = dispatchRepository.save(dispatch);
        }

        return dispatch;
    }

    @Transactional
    public Dispatch scanBarcodeForDispatch(Long dispatchId, String barcode, Long dispatchItemId, String scannedBy) {
        if (barcode == null || barcode.trim().isEmpty()) {
            throw new IllegalArgumentException("Scanned barcode or QR code cannot be empty");
        }
        String cleanBarcode = barcode.trim();
        Dispatch dispatch = getDispatchById(dispatchId);

        DispatchItem targetItem = null;
        if (dispatchItemId != null) {
            targetItem = dispatchItemRepository.findById(dispatchItemId)
                    .orElseThrow(() -> new IllegalArgumentException("Dispatch item not found with id: " + dispatchItemId));
        } else {
            // Find first unassigned serialized item in this dispatch
            for (DispatchItem item : dispatch.getItems()) {
                if (item.getProduct().isSerialized() && item.getSerialNumber() == null) {
                    targetItem = item;
                    break;
                }
            }
            if (targetItem == null) {
                throw new IllegalStateException("All serialized products in this dispatch already have assigned serial numbers!");
            }
        }

        AssignSerialNumberRequest assignRequest = new AssignSerialNumberRequest();
        assignRequest.setDispatchItemId(targetItem.getId());
        assignRequest.setSerialCode(cleanBarcode);

        return assignSerialNumber(assignRequest, scannedBy);
    }

    @Transactional
    public Dispatch confirmDispatch(Long dispatchId, String confirmedBy) {
        return confirmDispatch(dispatchId, null, confirmedBy);
    }

    @Transactional
    public Dispatch confirmDispatch(Long dispatchId, com.sunpower.dto.DispatchDTOs.ConfirmDispatchRequest request, String confirmedBy) {
        Dispatch dispatch = getDispatchById(dispatchId);

        // Verify all serialized items have serial numbers assigned
        for (DispatchItem item : dispatch.getItems()) {
            if (item.getProduct().isSerialized() && item.getSerialNumber() == null) {
                throw new IllegalStateException("Dispatch cannot be confirmed: Serial number missing for product '" +
                        item.getProduct().getName() + "'. Every serialized item must be scanned/assigned.");
            }
        }

        if (request != null) {
            if (request.getVehicleNumber() != null && !request.getVehicleNumber().trim().isEmpty()) {
                dispatch.setVehicleNumber(request.getVehicleNumber().trim());
            }
            if (request.getDriverName() != null && !request.getDriverName().trim().isEmpty()) {
                dispatch.setDriverName(request.getDriverName().trim());
            }
            if (request.getDriverPhone() != null && !request.getDriverPhone().trim().isEmpty()) {
                dispatch.setDriverPhone(request.getDriverPhone().trim());
            }
            if (request.getDispatchDateTime() != null) {
                dispatch.setDispatchDate(request.getDispatchDateTime().toLocalDate());
            }
            if (request.getDispatchNotes() != null && !request.getDispatchNotes().trim().isEmpty()) {
                dispatch.setDispatchNotes(request.getDispatchNotes().trim());
            }
        }

        dispatch.setStatus(DispatchStatus.DISPATCHED);
        if (dispatch.getDispatchDate() == null) {
            dispatch.setDispatchDate(LocalDate.now());
        }

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
                sn.setDispatchDate(dispatch.getDispatchDate());
                sn.setDispatchAt(LocalDateTime.now());
                sn.setDispatchId(dispatch.getId());
                serialNumberRepository.save(sn);

                SerialNumberHistory history = new SerialNumberHistory(
                        sn,
                        SerialNumberStatus.DISPATCHED,
                        "Dispatched in vehicle " + (dispatch.getVehicleNumber() != null ? dispatch.getVehicleNumber() : "N/A") + " with manifest for Order " + dispatch.getSalesOrder().getOrderNumber(),
                        dispatch.getCustomer().getFullName(),
                        confirmedBy
                );
                serialNumberHistoryRepository.save(history);
            }
        }

        SalesOrder order = dispatch.getSalesOrder();
        order.setStatus(OrderStatus.DISPATCHED);
        salesOrderRepository.save(order);

        // Auto-assign or schedule installation with technician team & lead if provided
        if (request != null && (request.getTeamLeadId() != null || (request.getAssignedTechnicianIds() != null && !request.getAssignedTechnicianIds().isEmpty()))) {
            assignTechnicianCrew(order, request);
        }

        return dispatchRepository.save(dispatch);
    }

    private void assignTechnicianCrew(SalesOrder order, com.sunpower.dto.DispatchDTOs.ConfirmDispatchRequest request) {
        Installation installation = installationRepository.findBySalesOrderId(order.getId())
                .orElse(new Installation());

        installation.setSalesOrder(order);
        installation.setCustomer(order.getCustomer());
        installation.setScheduledDate(request.getDispatchDateTime() != null ? request.getDispatchDateTime().toLocalDate() : LocalDate.now());
        installation.setStatus(com.sunpower.entity.enums.Enums.InstallationStatus.SCHEDULED);
        if (installation.getWorkNotes() == null || installation.getWorkNotes().isEmpty()) {
            installation.setWorkNotes("Technician crew assigned at dispatch. Vehicle: " + request.getVehicleNumber());
        }

        installation = installationRepository.save(installation);
        if (installation.getInstallationNumber() == null) {
            installation.setInstallationNumber("INS-" + String.format("%05d", installation.getId()));
            installation = installationRepository.save(installation);
        }

        final Installation targetInstallation = installation;

        List<InstallationTechnician> crew = new ArrayList<>();
        Long leadId = request.getTeamLeadId();
        List<Long> memberIds = request.getAssignedTechnicianIds() != null ? new ArrayList<>(request.getAssignedTechnicianIds()) : new ArrayList<>();

        if (leadId != null) {
            technicianRepository.findById(leadId).ifPresent(leadTech -> {
                InstallationTechnician itLead = new InstallationTechnician(targetInstallation, leadTech, "Team Lead / Electrician", true);
                crew.add(itLead);
            });
            memberIds.remove(leadId);
        }

        for (Long mId : memberIds) {
            technicianRepository.findById(mId).ifPresent(tech -> {
                InstallationTechnician it = new InstallationTechnician(targetInstallation, tech, "Installer / Technician", false);
                crew.add(it);
            });
        }

        if (!crew.isEmpty()) {
            targetInstallation.setAssignedTechnicians(crew);
            installationRepository.save(targetInstallation);
        }
    }

    @Transactional
    public Dispatch confirmDelivery(Long dispatchId, ConfirmDeliveryRequest request, String confirmedBy) {
        Dispatch dispatch = getDispatchById(dispatchId);

        // Verify all serialized items have serial numbers assigned before confirming delivery
        for (DispatchItem item : dispatch.getItems()) {
            if (item.getProduct().isSerialized() && item.getSerialNumber() == null) {
                throw new IllegalStateException("Delivery cannot be confirmed: Serial number missing for product '" +
                        item.getProduct().getName() + "'. Every serialized item must be scanned and assigned.");
            }
        }

        LocalDate deliveryDate = request.getDeliveryDate() != null ? request.getDeliveryDate() : LocalDate.now();

        dispatch.setStatus(DispatchStatus.DELIVERED);
        dispatch.setDeliveryDate(deliveryDate);
        if (request.getNotes() != null) {
            dispatch.setDispatchNotes((dispatch.getDispatchNotes() != null ? dispatch.getDispatchNotes() + "\n" : "") + "Delivery notes: " + request.getNotes());
        }

        dispatch = dispatchRepository.save(dispatch);

        // Update serial numbers delivery status and automatically start warranty clock
        for (DispatchItem item : dispatch.getItems()) {
            Product product = item.getProduct();
            SerialNumber sn = item.getSerialNumber();
            if (sn != null) {
                sn.setDeliveryDate(deliveryDate);
                serialNumberRepository.save(sn);

                SerialNumberHistory history = new SerialNumberHistory(
                        sn,
                        sn.getStatus(),
                        "Delivered to customer site. Warranty clock automatically initiated.",
                        dispatch.getCustomer().getAddress(),
                        confirmedBy
                );
                serialNumberHistoryRepository.save(history);

                // Auto-warranty clock initiation on delivery
                warrantyService.activateWarranty(dispatch.getCustomer(), dispatch.getSalesOrder(), product, sn, deliveryDate);
            } else if (product != null && product.getCategory() != null && product.getCategory().getName().toUpperCase().contains("PANEL")) {
                warrantyService.activateWarranty(dispatch.getCustomer(), dispatch.getSalesOrder(), product, null, deliveryDate);
            }
        }

        return dispatch;
    }
}
