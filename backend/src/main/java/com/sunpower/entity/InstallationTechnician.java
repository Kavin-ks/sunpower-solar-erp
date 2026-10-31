package com.sunpower.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "installation_technicians")
public class InstallationTechnician {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "installation_id", nullable = false)
    @JsonIgnore
    private Installation installation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "technician_id", nullable = false)
    private Technician technician;

    @Column(length = 100)
    private String roleInCrew; // "Lead Electrician", "Mounting Specialist", "Testing Engineer"

    @Column(precision = 5, scale = 2)
    private BigDecimal hoursWorked = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal payoutAmount = BigDecimal.ZERO;

    public InstallationTechnician() {}

    public InstallationTechnician(Installation installation, Technician technician, String roleInCrew) {
        this.installation = installation;
        this.technician = technician;
        this.roleInCrew = roleInCrew;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Installation getInstallation() { return installation; }
    public void setInstallation(Installation installation) { this.installation = installation; }
    public Technician getTechnician() { return technician; }
    public void setTechnician(Technician technician) { this.technician = technician; }
    public String getRoleInCrew() { return roleInCrew; }
    public void setRoleInCrew(String roleInCrew) { this.roleInCrew = roleInCrew; }
    public BigDecimal getHoursWorked() { return hoursWorked; }
    public void setHoursWorked(BigDecimal hoursWorked) { this.hoursWorked = hoursWorked; }
    public BigDecimal getPayoutAmount() { return payoutAmount; }
    public void setPayoutAmount(BigDecimal payoutAmount) { this.payoutAmount = payoutAmount; }
}
