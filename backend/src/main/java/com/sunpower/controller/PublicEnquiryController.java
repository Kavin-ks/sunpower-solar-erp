package com.sunpower.controller;

import com.sunpower.dto.EnquiryDTOs.PublicEnquiryRequest;
import com.sunpower.dto.EnquiryDTOs.PublicEnquiryResponseDTO;
import com.sunpower.entity.Enquiry;
import com.sunpower.service.EnquiryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@RestController
@RequestMapping({"/api/public/v1/enquiries", "/api/enquiries/public"})
public class PublicEnquiryController {

    @Autowired
    private EnquiryService enquiryService;

    // In-memory sliding window rate limiter: max 15 requests per minute per IP
    private static final int MAX_REQUESTS_PER_MINUTE = 15;
    private static final long WINDOW_MS = 60_000L;
    private final ConcurrentHashMap<String, ConcurrentLinkedDeque<Long>> requestCounts = new ConcurrentHashMap<>();

    private boolean isRateLimited(String clientIp) {
        long now = System.currentTimeMillis();
        ConcurrentLinkedDeque<Long> timestamps = requestCounts.computeIfAbsent(clientIp, k -> new ConcurrentLinkedDeque<>());
        while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MS) {
            timestamps.pollFirst();
        }
        if (timestamps.size() >= MAX_REQUESTS_PER_MINUTE) {
            return true;
        }
        timestamps.addLast(now);
        return false;
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isEmpty()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    @PostMapping
    public ResponseEntity<?> submitPublicEnquiry(
            @Valid @RequestBody PublicEnquiryRequest request,
            HttpServletRequest servletRequest) {

        String clientIp = getClientIp(servletRequest);
        if (isRateLimited(clientIp)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                    new PublicEnquiryResponseDTO(
                            false,
                            null,
                            "Too many requests from this IP address. Please wait a moment before submitting again.",
                            LocalDateTime.now()
                    )
            );
        }

        try {
            Enquiry enquiry = enquiryService.createPublicEnquiry(request);
            String message = String.format(
                    "Thank you %s! Your solar rooftop enquiry (%s) has been registered. Our SunPower Sales team will review your %s kW %s requirements and contact you shortly.",
                    enquiry.getCustomer().getFullName(),
                    enquiry.getEnquiryNumber(),
                    enquiry.getRequestedCapacityKw(),
                    enquiry.getSystemType() == com.sunpower.entity.enums.Enums.SystemType.ON_GRID ? "On-Grid" : "Off-Grid"
            );

            PublicEnquiryResponseDTO response = new PublicEnquiryResponseDTO(
                    true,
                    enquiry.getEnquiryNumber(),
                    message,
                    enquiry.getCreatedAt() != null ? enquiry.getCreatedAt() : LocalDateTime.now()
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    new PublicEnquiryResponseDTO(false, null, e.getMessage(), LocalDateTime.now())
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new PublicEnquiryResponseDTO(false, null, "An internal error occurred while processing your enquiry. Please try again.", LocalDateTime.now())
            );
        }
    }
}
