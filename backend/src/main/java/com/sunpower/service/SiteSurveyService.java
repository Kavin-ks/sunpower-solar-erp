package com.sunpower.service;

import com.sunpower.dto.SiteSurveyDTOs.SurveyApprovalRequest;
import com.sunpower.dto.SiteSurveyDTOs.SurveyInspectionReportRequest;
import com.sunpower.dto.SiteSurveyDTOs.SurveyScheduleRequest;
import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.EnquiryStatus;
import com.sunpower.entity.enums.Enums.SurveyStatus;
import com.sunpower.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SiteSurveyService {

    @Autowired
    private SiteSurveyRepository siteSurveyRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private EnquiryRepository enquiryRepository;

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private TechnicianService technicianService;

    @Autowired
    private SurveyPhotoRepository surveyPhotoRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnquiryActivityRepository enquiryActivityRepository;

    public List<SiteSurvey> getAllSurveys() {
        return siteSurveyRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"));
    }

    public SiteSurvey getSurveyById(Long id) {
        return siteSurveyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Site survey not found with id: " + id));
    }

    public List<SiteSurvey> getSurveysByStatus(SurveyStatus status) {
        return siteSurveyRepository.findByStatus(status);
    }

    public List<SiteSurvey> getApprovedSurveysByCustomerId(Long customerId) {
        return siteSurveyRepository.findApprovedSurveysByCustomerId(customerId);
    }

    public List<SiteSurvey> getSurveysForTechnician(String username) {
        if (username == null || username.equalsIgnoreCase("admin")) {
            return siteSurveyRepository.findAll();
        }
        java.util.Optional<Technician> techOpt = technicianService.resolveTechnician(username);
        if (techOpt.isPresent()) {
            return siteSurveyRepository.findByTechnicianId(techOpt.get().getId());
        }
        return new java.util.ArrayList<>();
    }

    @Transactional
    public SiteSurvey scheduleSurvey(SurveyScheduleRequest request, String scheduledBy) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with id: " + request.getCustomerId()));

        Technician technician = technicianRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new IllegalArgumentException("Technician not found with id: " + request.getTechnicianId()));

        SiteSurvey survey = new SiteSurvey();
        survey.setCustomer(customer);
        survey.setTechnician(technician);
        survey.setScheduledDate(request.getScheduledDate());
        survey.setSurveyNotes(request.getSurveyNotes());
        survey.setStatus(SurveyStatus.SCHEDULED);

        // Technical fields are intentionally left blank for the technician's physical inspection
        if (request.getRoofDirection() != null) survey.setRoofDirection(request.getRoofDirection());
        if (request.getRoofTilt() != null) survey.setRoofTilt(request.getRoofTilt());
        if (request.getAvailableRoofAreaSqFt() != null) survey.setAvailableRoofAreaSqFt(request.getAvailableRoofAreaSqFt());
        if (request.getCableDistanceMeters() != null) survey.setCableDistanceMeters(request.getCableDistanceMeters());
        if (request.getShadingAssessment() != null) survey.setShadingAssessment(request.getShadingAssessment());
        if (request.getGridSuitability() != null) survey.setGridSuitability(request.getGridSuitability());

        if (request.getEnquiryId() != null) {
            List<SiteSurvey> existingSurveys = siteSurveyRepository.findByEnquiryId(request.getEnquiryId());
            boolean hasActiveSurvey = existingSurveys.stream()
                    .anyMatch(s -> s.getStatus() != SurveyStatus.REJECTED);
            if (hasActiveSurvey) {
                throw new IllegalStateException("A site survey is already scheduled for this enquiry.");
            }

            Enquiry enquiry = enquiryRepository.findById(request.getEnquiryId()).orElse(null);
            if (enquiry != null) {
                survey.setEnquiry(enquiry);
                enquiry.setStatus(EnquiryStatus.SURVEY_SCHEDULED);
                enquiryRepository.save(enquiry);

                EnquiryActivity act = new EnquiryActivity(
                        enquiry,
                        "SURVEY_SCHEDULED",
                        "Site survey scheduled for " + request.getScheduledDate() + " with technician " + technician.getName() +
                                (request.getSurveyNotes() != null ? " (Instructions: " + request.getSurveyNotes() + ")" : ""),
                        scheduledBy
                );
                enquiryActivityRepository.save(act);
            }
        }

        survey = siteSurveyRepository.save(survey);
        if (survey.getSurveyNumber() == null) {
            survey.setSurveyNumber("SRV-" + String.format("%05d", survey.getId()));
            survey = siteSurveyRepository.save(survey);
        }

        return survey;
    }

    @Transactional
    public SiteSurvey submitInspectionReport(Long id, SurveyInspectionReportRequest request, String technicianName) {
        SiteSurvey survey = getSurveyById(id);

        if (request.getRoofDirection() != null) survey.setRoofDirection(request.getRoofDirection());
        if (request.getRoofTilt() != null) survey.setRoofTilt(request.getRoofTilt());
        if (request.getRoofCondition() != null) survey.setRoofCondition(request.getRoofCondition());
        if (request.getAvailableRoofAreaSqFt() != null) survey.setAvailableRoofAreaSqFt(request.getAvailableRoofAreaSqFt());
        if (request.getCableDistanceMeters() != null) survey.setCableDistanceMeters(request.getCableDistanceMeters());
        if (request.getShadingAssessment() != null) survey.setShadingAssessment(request.getShadingAssessment());
        if (request.getGridSuitability() != null) survey.setGridSuitability(request.getGridSuitability());
        if (request.getStructuralObservations() != null) survey.setStructuralObservations(request.getStructuralObservations());
        if (request.getSurveyNotes() != null) survey.setSurveyNotes(request.getSurveyNotes());
        if (request.getInspectionRecommendation() != null) survey.setInspectionRecommendation(request.getInspectionRecommendation());

        if (request.isDraft()) {
            survey.setStatus(SurveyStatus.IN_PROGRESS);
        } else {
            if ("APPROVED".equalsIgnoreCase(request.getInspectionRecommendation())) {
                survey.setStatus(SurveyStatus.APPROVED);
                survey.setApprovedBy(technicianName);
                survey.setApprovalDate(LocalDateTime.now());
                survey.setApprovalNotes("Approved on-site by field technician: " + technicianName);
            } else if ("REJECTED".equalsIgnoreCase(request.getInspectionRecommendation())) {
                survey.setStatus(SurveyStatus.REJECTED);
                survey.setApprovedBy(technicianName);
                survey.setApprovalDate(LocalDateTime.now());
            } else {
                survey.setStatus(SurveyStatus.REPORT_SUBMITTED);
            }
            survey.setReportSubmittedAt(LocalDateTime.now());
        }

        survey = siteSurveyRepository.save(survey);

        if (survey.getEnquiry() != null && !request.isDraft()) {
            Enquiry enquiry = survey.getEnquiry();
            if (survey.getStatus() == SurveyStatus.APPROVED) {
                enquiry.setStatus(EnquiryStatus.SURVEY_APPROVED);
            } else if (survey.getStatus() == SurveyStatus.REJECTED) {
                enquiry.setStatus(EnquiryStatus.REJECTED);
            }
            enquiryRepository.save(enquiry);

            EnquiryActivity act = new EnquiryActivity(
                    enquiry,
                    "INSPECTION_REPORT_SUBMITTED",
                    "Technician " + technicianName + " submitted site inspection report. Status: " + survey.getStatus() +
                            (survey.getInspectionRecommendation() != null ? " (" + survey.getInspectionRecommendation() + ")" : ""),
                    technicianName
            );
            enquiryActivityRepository.save(act);
        }

        return survey;
    }

    @Transactional
    public SiteSurvey updateSurveyDetails(Long id, SurveyScheduleRequest request) {
        SiteSurvey survey = getSurveyById(id);
        if (request.getTechnicianId() != null) {
            Technician technician = technicianRepository.findById(request.getTechnicianId())
                    .orElseThrow(() -> new IllegalArgumentException("Technician not found with id: " + request.getTechnicianId()));
            survey.setTechnician(technician);
        }
        if (request.getScheduledDate() != null) survey.setScheduledDate(request.getScheduledDate());
        if (request.getRoofDirection() != null) survey.setRoofDirection(request.getRoofDirection());
        if (request.getRoofTilt() != null) survey.setRoofTilt(request.getRoofTilt());
        if (request.getAvailableRoofAreaSqFt() != null) survey.setAvailableRoofAreaSqFt(request.getAvailableRoofAreaSqFt());
        if (request.getCableDistanceMeters() != null) survey.setCableDistanceMeters(request.getCableDistanceMeters());
        if (request.getShadingAssessment() != null) survey.setShadingAssessment(request.getShadingAssessment());
        if (request.getGridSuitability() != null) survey.setGridSuitability(request.getGridSuitability());
        if (request.getSurveyNotes() != null) survey.setSurveyNotes(request.getSurveyNotes());

        return siteSurveyRepository.save(survey);
    }

    @Transactional
    public SiteSurvey reviewAndApprove(Long id, SurveyApprovalRequest request, String reviewer) {
        SiteSurvey survey = getSurveyById(id);
        survey.setStatus(request.getStatus());
        survey.setApprovedBy(reviewer);
        survey.setApprovalDate(LocalDateTime.now());
        survey.setApprovalNotes(request.getApprovalNotes());

        if (request.getStatus() == SurveyStatus.APPROVED) {
            if (survey.getAvailableRoofAreaSqFt() == null) {
                if (survey.getEnquiry() != null && survey.getEnquiry().getShadowFreeAreaSqFt() != null) {
                    survey.setAvailableRoofAreaSqFt(survey.getEnquiry().getShadowFreeAreaSqFt());
                } else {
                    survey.setAvailableRoofAreaSqFt(new java.math.BigDecimal("450.00"));
                }
            }
            if (survey.getRoofDirection() == null || survey.getRoofDirection().isBlank()) {
                survey.setRoofDirection("South");
            }
            if (survey.getRoofTilt() == null || survey.getRoofTilt().isBlank()) {
                survey.setRoofTilt("15 deg");
            }
            if (survey.getCableDistanceMeters() == null) {
                survey.setCableDistanceMeters(new java.math.BigDecimal("15.00"));
            }
            if (survey.getShadingAssessment() == null || survey.getShadingAssessment().isBlank()) {
                survey.setShadingAssessment("Shadow Free");
            }
            if (survey.getGridSuitability() == null || survey.getGridSuitability().isBlank()) {
                survey.setGridSuitability("Suitable for Net-Metering");
            }
            if (survey.getInspectionRecommendation() == null || survey.getInspectionRecommendation().isBlank()) {
                survey.setInspectionRecommendation("APPROVED");
            }
        }

        survey = siteSurveyRepository.save(survey);

        if (survey.getEnquiry() != null) {
            Enquiry enquiry = survey.getEnquiry();
            if (request.getStatus() == SurveyStatus.APPROVED) {
                enquiry.setStatus(EnquiryStatus.SURVEY_APPROVED);
            } else if (request.getStatus() == SurveyStatus.REJECTED) {
                enquiry.setStatus(EnquiryStatus.REJECTED);
            }
            enquiryRepository.save(enquiry);

            EnquiryActivity act = new EnquiryActivity(
                    enquiry,
                    "SURVEY_" + request.getStatus(),
                    "Site survey " + request.getStatus() + " by " + reviewer + ". Remarks: " + request.getApprovalNotes(),
                    reviewer
            );
            enquiryActivityRepository.save(act);
        }

        return survey;
    }

    @Transactional
    public SurveyPhoto addPhoto(Long surveyId, String photoUrl, String caption) {
        SiteSurvey survey = getSurveyById(surveyId);
        SurveyPhoto photo = new SurveyPhoto(survey, photoUrl, caption);
        return surveyPhotoRepository.save(photo);
    }
}
