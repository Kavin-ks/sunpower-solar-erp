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
}
