package com.sunpower.service;

import com.sunpower.dto.QuotationDTOs.QuotationCreateRequest;
import com.sunpower.dto.QuotationDTOs.QuotationCustomItemRequest;
import com.sunpower.dto.QuotationDTOs.QuotationStatusUpdateRequest;
import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.EnquiryStatus;
import com.sunpower.entity.enums.Enums.QuotationStatus;
import com.sunpower.entity.enums.Enums.SurveyStatus;
import com.sunpower.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class QuotationService {

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private QuotationItemRepository quotationItemRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SiteSurveyRepository siteSurveyRepository;

    @Autowired
    private SolarPackageRepository solarPackageRepository;

    @Autowired
    private PackageBOMRepository packageBOMRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private EnquiryRepository enquiryRepository;

    @Autowired
    private EnquiryActivityRepository enquiryActivityRepository;

    public List<Quotation> getAllQuotations() {
        return quotationRepository.findAll();
    }

    public Quotation getQuotationById(Long id) {
        return quotationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Quotation not found with id: " + id));
    }

    public List<Quotation> getQuotationsByCustomerId(Long customerId) {
        return quotationRepository.findByCustomerId(customerId);
    }

    @Transactional
    public Quotation createQuotation(QuotationCreateRequest request, String createdBy) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with id: " + request.getCustomerId()));

        SiteSurvey survey = siteSurveyRepository.findById(request.getSiteSurveyId())
                .orElseThrow(() -> new IllegalArgumentException("Site survey not found with id: " + request.getSiteSurveyId()));

        // CRITICAL BUSINESS RULE: Verify Site Survey is APPROVED!
        if (survey.getStatus() != SurveyStatus.APPROVED) {
            throw new IllegalStateException("Site survey must be approved before generating a quotation. Current status: " + survey.getStatus());
        }

        SolarPackage solarPackage = solarPackageRepository.findById(request.getSolarPackageId())
                .orElseThrow(() -> new IllegalArgumentException("Solar package not found with id: " + request.getSolarPackageId()));

        Quotation quotation = new Quotation();
        quotation.setCustomer(customer);
        quotation.setSiteSurvey(survey);
        quotation.setSolarPackage(solarPackage);
        quotation.setSystemType(solarPackage.getSystemType());
        quotation.setCapacityKw(solarPackage.getCapacityKw());
        quotation.setQuotationDate(LocalDate.now());
        quotation.setValidityDate(LocalDate.now().plusDays(30));
        quotation.setStatus(QuotationStatus.DRAFT);
        quotation.setNotes(request.getNotes());

        BigDecimal installationFee = request.getInstallationFee() != null ?
                request.getInstallationFee() : BigDecimal.valueOf(15000.00); // Standard installation fee default
        quotation.setInstallationFee(installationFee);

        quotation = quotationRepository.save(quotation);
        if (quotation.getQuotationNumber() == null) {
            quotation.setQuotationNumber("QT-" + String.format("%05d", quotation.getId()));
            quotation = quotationRepository.save(quotation);
        }

        List<QuotationItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        if (request.getCustomItems() != null && !request.getCustomItems().isEmpty()) {
            for (QuotationCustomItemRequest customItem : request.getCustomItems()) {
                Product product = productRepository.findById(customItem.getProductId())
                        .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + customItem.getProductId()));
                BigDecimal unitPrice = customItem.getUnitPrice() != null ? customItem.getUnitPrice() : product.getSellingPrice();
                QuotationItem item = new QuotationItem(quotation, product, customItem.getQuantity(), unitPrice);
                subtotal = subtotal.add(item.getTotalPrice());
                items.add(item);
            }
        } else {
            // Automatically populate from Package BOM
            List<PackageBOM> bomList = packageBOMRepository.findBySolarPackageId(solarPackage.getId());
            QuotationItem cableItem = null;
            for (PackageBOM bom : bomList) {
                QuotationItem item = new QuotationItem(quotation, bom.getProduct(), bom.getQuantity(), bom.getProduct().getSellingPrice());
                subtotal = subtotal.add(item.getTotalPrice());
                items.add(item);
                if ((bom.getProduct().getProductCode() != null && bom.getProduct().getProductCode().toUpperCase().contains("CAB")) ||
                    (bom.getProduct().getName() != null && bom.getProduct().getName().toLowerCase().contains("cable"))) {
                    cableItem = item;
                }
            }

            // EDGE CASE 1 (Blueprint): Survey Cable Distance Auto-Adjusting the BOM
            // If technician logged > 15m during survey (e.g. 28m), auto-append extra DC wire to quotation
            if (survey.getCableDistanceMeters() != null && survey.getCableDistanceMeters().compareTo(BigDecimal.valueOf(15)) > 0) {
                int extraMeters = survey.getCableDistanceMeters().subtract(BigDecimal.valueOf(15)).intValue();
                if (cableItem != null) {
                    cableItem.setQuantity(cableItem.getQuantity() + extraMeters);
                    cableItem.setTotalPrice(cableItem.getUnitPrice().multiply(BigDecimal.valueOf(cableItem.getQuantity())));
                    subtotal = subtotal.add(cableItem.getUnitPrice().multiply(BigDecimal.valueOf(extraMeters)));
                }
            }
        }

        quotationItemRepository.saveAll(items);
        quotation.setItems(items);

        quotation.setSubtotal(subtotal);
        BigDecimal taxRate = request.getTaxRatePercent() != null ? request.getTaxRatePercent() : BigDecimal.valueOf(5.00);
        BigDecimal taxAmount = subtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        quotation.setTaxAmount(taxAmount);
        quotation.setTotalAmount(subtotal.add(taxAmount).add(installationFee));

        quotation = quotationRepository.save(quotation);

        if (survey.getEnquiry() != null) {
            Enquiry enquiry = survey.getEnquiry();
            enquiry.setStatus(EnquiryStatus.QUOTED);
            enquiryRepository.save(enquiry);

            EnquiryActivity act = new EnquiryActivity(
                    enquiry,
                    "QUOTATION_GENERATED",
                    "Quotation " + quotation.getQuotationNumber() + " generated for amount ₹" + quotation.getTotalAmount(),
                    createdBy
            );
            enquiryActivityRepository.save(act);
        }

        return quotation;
    }

    @Transactional
    public Quotation updateStatus(Long id, QuotationStatusUpdateRequest request, String updatedBy) {
        Quotation quotation = getQuotationById(id);
        quotation.setStatus(request.getStatus());
        quotation = quotationRepository.save(quotation);

        if (request.getStatus() == QuotationStatus.ACCEPTED && quotation.getSiteSurvey().getEnquiry() != null) {
            Enquiry enquiry = quotation.getSiteSurvey().getEnquiry();
            enquiry.setStatus(EnquiryStatus.CONVERTED);
            enquiryRepository.save(enquiry);

            EnquiryActivity act = new EnquiryActivity(
                    enquiry,
                    "QUOTATION_ACCEPTED",
                    "Customer accepted quotation " + quotation.getQuotationNumber(),
                    updatedBy
            );
            enquiryActivityRepository.save(act);
        }

        return quotation;
    }
}
