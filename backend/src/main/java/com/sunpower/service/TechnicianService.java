package com.sunpower.service;

import com.sunpower.entity.Role;
import com.sunpower.entity.Technician;
import com.sunpower.entity.User;
import com.sunpower.repository.RoleRepository;
import com.sunpower.repository.TechnicianRepository;
import com.sunpower.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class TechnicianService {

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

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
        if (technician.getUser() == null && technician.getName() != null) {
            String sanitized = technician.getName().toLowerCase().replaceAll("[^a-z0-9]", "");
            String baseUsername = "tech." + (sanitized.length() > 8 ? sanitized.substring(0, 8) : sanitized);
            String username = baseUsername;
            int suffix = 1;
            while (userRepository.existsByUsername(username)) {
                username = baseUsername + suffix;
                suffix++;
            }

            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode("password123"));
            user.setFullName(technician.getName());
            user.setEmail(technician.getEmail() != null ? technician.getEmail() : username + "@sunpower.com");
            user.setPhone(technician.getPhone());
            user.setActive(true);

            Optional<Role> techRole = roleRepository.findByName(com.sunpower.entity.enums.Enums.RoleName.ROLE_TECHNICIAN);
            if (techRole.isPresent()) {
                Set<Role> roles = new HashSet<>();
                roles.add(techRole.get());
                user.setRoles(roles);
            }
            user = userRepository.save(user);
            technician.setUser(user);
        }
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
        if (tech.getUser() != null) {
            tech.getUser().setActive(updated.isActive());
            tech.getUser().setFullName(updated.getName());
            if (updated.getPhone() != null) tech.getUser().setPhone(updated.getPhone());
            if (updated.getEmail() != null) tech.getUser().setEmail(updated.getEmail());
            userRepository.save(tech.getUser());
        }
        return technicianRepository.save(tech);
    }

    @Transactional
    public void deleteTechnician(Long id) {
        Technician tech = getTechnicianById(id);
        tech.setActive(false);
        tech.setAvailable(false);
        if (tech.getUser() != null) {
            tech.getUser().setActive(false);
            userRepository.save(tech.getUser());
        }
        technicianRepository.save(tech);
    }
}
