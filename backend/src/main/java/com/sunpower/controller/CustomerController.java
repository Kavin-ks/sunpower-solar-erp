package com.sunpower.controller;

import com.sunpower.dto.CustomerDTO;
import com.sunpower.entity.Customer;
import com.sunpower.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SALES', 'ADMIN', 'SUPPORT', 'FINANCE', 'TECHNICIAN', 'WAREHOUSE')")
    public ResponseEntity<List<Customer>> getAllCustomers(@RequestParam(required = false) String search) {
        if (search != null && !search.trim().isEmpty()) {
            return ResponseEntity.ok(customerService.searchCustomers(search));
        }
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SALES', 'ADMIN', 'SUPPORT', 'FINANCE', 'TECHNICIAN', 'WAREHOUSE')")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SALES', 'ADMIN', 'DIRECTOR')")
    public ResponseEntity<Customer> createCustomer(@Valid @RequestBody CustomerDTO dto) {
        Customer customer = customerService.createCustomer(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(customer);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SALES', 'ADMIN', 'DIRECTOR')")
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @Valid @RequestBody CustomerDTO dto) {
        Customer customer = customerService.updateCustomer(id, dto);
        return ResponseEntity.ok(customer);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SALES', 'ADMIN', 'DIRECTOR')")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }
}
