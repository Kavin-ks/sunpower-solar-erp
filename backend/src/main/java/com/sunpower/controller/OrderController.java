package com.sunpower.controller;

import com.sunpower.dto.OrderDTOs.OrderConvertRequest;
import com.sunpower.dto.OrderDTOs.OrderStatusUpdateRequest;
import com.sunpower.entity.SalesOrder;
import com.sunpower.entity.enums.Enums.OrderStatus;
import com.sunpower.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping
    public ResponseEntity<List<SalesOrder>> getAllOrders(@RequestParam(required = false) OrderStatus status) {
        if (status != null) {
            return ResponseEntity.ok(orderService.getOrdersByStatus(status));
        }
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalesOrder> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PostMapping("/convert")
    public ResponseEntity<SalesOrder> convertQuotationToOrder(
            @Valid @RequestBody OrderConvertRequest request,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "Sales Lead";
        SalesOrder order = orderService.convertQuotationToOrder(request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<SalesOrder> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        SalesOrder order = orderService.updateOrderStatus(id, request);
        return ResponseEntity.ok(order);
    }
}
