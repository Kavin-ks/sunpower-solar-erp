package com.sunpower.service;

import com.sunpower.dto.SolarPackageDTOs.PackageBOMItemDTO;
import com.sunpower.dto.SolarPackageDTOs.SolarPackageDetailDTO;
import com.sunpower.entity.PackageBOM;
import com.sunpower.entity.SolarPackage;
import com.sunpower.entity.enums.Enums.SystemType;
import com.sunpower.repository.PackageBOMRepository;
import com.sunpower.repository.SolarPackageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SolarPackageService {

    @Autowired
    private SolarPackageRepository solarPackageRepository;

    @Autowired
    private PackageBOMRepository packageBOMRepository;

    public List<SolarPackage> getAllPackages() {
        return solarPackageRepository.findAll();
    }

    public List<SolarPackage> getActivePackages() {
        return solarPackageRepository.findByActiveTrue();
    }

    public SolarPackage getPackageById(Long id) {
        return solarPackageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Solar package not found with id: " + id));
    }

    public SolarPackageDetailDTO getPackageDetails(Long id) {
        SolarPackage pkg = getPackageById(id);
        return mapToDetailDTO(pkg);
    }

    public SolarPackageDetailDTO findPackageByTypeAndCapacity(SystemType systemType, BigDecimal capacityKw) {
        SolarPackage pkg = solarPackageRepository.findBySystemTypeAndCapacityKw(systemType, capacityKw)
                .orElseThrow(() -> new IllegalArgumentException("Package not found for " + systemType + " with capacity " + capacityKw + " kW"));
        return mapToDetailDTO(pkg);
    }

    private SolarPackageDetailDTO mapToDetailDTO(SolarPackage pkg) {
        SolarPackageDetailDTO dto = new SolarPackageDetailDTO();
        dto.setId(pkg.getId());
        dto.setName(pkg.getName());
        dto.setSystemType(pkg.getSystemType());
        dto.setCapacityKw(pkg.getCapacityKw());
        dto.setDescription(pkg.getDescription());
        dto.setBasePrice(pkg.getBasePrice());
        dto.setActive(pkg.isActive());

        List<PackageBOM> boms = packageBOMRepository.findBySolarPackageId(pkg.getId());
        List<PackageBOMItemDTO> itemDTOs = boms.stream().map(bom -> {
            PackageBOMItemDTO item = new PackageBOMItemDTO();
            item.setId(bom.getId());
            item.setProductId(bom.getProduct().getId());
            item.setProductCode(bom.getProduct().getProductCode());
            item.setProductName(bom.getProduct().getName());
            item.setUnit(bom.getProduct().getUnit());
            item.setQuantity(bom.getQuantity());
            item.setUnitPrice(bom.getProduct().getSellingPrice());
            item.setRoleInPackage(bom.getRoleInPackage());
            return item;
        }).collect(Collectors.toList());

        dto.setBomItems(itemDTOs);
        return dto;
    }
}
