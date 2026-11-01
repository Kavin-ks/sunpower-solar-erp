package com.sunpower.service;

import com.sunpower.entity.Technician;
import com.sunpower.repository.TechnicianRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TechnicianService {

    @Autowired
    private TechnicianRepository technicianRepository;

    public List<Technician> getAllTechnicians() {
        return technicianRepository.findAll();
    }

    public List<Technician> getActiveTechnicians() {
        return technicianRepository.findByActiveTrue();
    }

    public List<Technician> getAvailableTechnicians() {
        return technicianRepository.findByAvailableTrueAndActiveTrue();
    }

    public Technician getTechnicianById(Long id) {
        return technicianRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Technician not found with id: " + id));
    }

    @Transactional
    public Technician createTechnician(Technician technician) {
        return technicianRepository.save(technician);
    }

    @Transactional
    public Technician updateTechnician(Long id, Technician updated) {
        Technician tech = getTechnicianById(id);
        tech.setName(updated.getName());
        tech.setPhone(updated.getPhone());
        tech.setEmail(updated.getEmail());
        tech.setSkills(updated.getSkills());
        if (updated.getHourlyRate() != null) {
            tech.setHourlyRate(updated.getHourlyRate());
        }
        tech.setAvailable(updated.isAvailable());
        tech.setActive(updated.isActive());
        return technicianRepository.save(tech);
    }

    public java.util.Optional<Technician> resolveTechnician(String username) {
        if (username == null || username.trim().isEmpty()) {
            return java.util.Optional.empty();
        }
        String u = username.trim();
        // 1. Direct findByUserUsername
        java.util.Optional<Technician> tech = technicianRepository.findByUserUsername(u);
        if (tech.isPresent()) {
            return tech;
        }
        // 2. Exact known demo aliases
        if (u.equalsIgnoreCase("technician") || u.equalsIgnoreCase("karthik")) {
            tech = technicianRepository.findByNameContainingIgnoreCase("Karthik");
            if (tech.isPresent()) return tech;
        }
        if (u.equalsIgnoreCase("tech.ganesh") || u.equalsIgnoreCase("ganesh")) {
            tech = technicianRepository.findByNameContainingIgnoreCase("Ganesh");
            if (tech.isPresent()) return tech;
        }
        if (u.equalsIgnoreCase("tech.selva") || u.equalsIgnoreCase("selva") || u.equalsIgnoreCase("selvakumar")) {
            tech = technicianRepository.findByNameContainingIgnoreCase("Selvakumar");
            if (tech.isPresent()) return tech;
        }
        // 3. Strip prefixes like "tech." or "technician."
        String cleanName = u.replaceFirst("(?i)^tech\\.", "").replaceFirst("(?i)^technician\\.", "");
        tech = technicianRepository.findByNameContainingIgnoreCase(cleanName);
        if (tech.isPresent()) {
            return tech;
        }
        return technicianRepository.findByNameContainingIgnoreCase(u);
    }
}
