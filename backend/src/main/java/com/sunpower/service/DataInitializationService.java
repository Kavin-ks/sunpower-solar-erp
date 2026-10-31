package com.sunpower.service;

import com.sunpower.entity.*;
import com.sunpower.entity.enums.Enums.*;
import com.sunpower.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class DataInitializationService implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private ProductCategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryStockRepository stockRepository;

    @Autowired
    private SolarPackageRepository packageRepository;

    @Autowired
    private PackageBOMRepository bomRepository;

    @Autowired
    private SerialNumberRepository serialNumberRepository;

    @Autowired
    private SerialNumberHistoryRepository serialNumberHistoryRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (roleRepository.count() > 0) {
            return; // Already initialized
        }

        // 1. Roles
        Map<RoleName, Role> roles = new HashMap<>();
        for (RoleName rn : RoleName.values()) {
            roles.put(rn, roleRepository.save(new Role(rn)));
        }

        // 2. Users (all default passwords: password123)
        createUser("admin", "Administrator", "admin@sunpower.com", "9876543210", roles.get(RoleName.ROLE_ADMIN));
        createUser("sales", "Suresh Kumar (Sales Lead)", "sales@sunpower.com", "9876543211", roles.get(RoleName.ROLE_SALES));
        createUser("warehouse", "Murugan V (Warehouse)", "warehouse@sunpower.com", "9876543212", roles.get(RoleName.ROLE_WAREHOUSE));
        createUser("technician", "Karthik Raja (Field Lead)", "tech@sunpower.com", "9876543213", roles.get(RoleName.ROLE_TECHNICIAN));
        createUser("support", "Priya Nair (Support)", "support@sunpower.com", "9876543214", roles.get(RoleName.ROLE_SUPPORT));
        createUser("finance", "Ramanathan M (Finance)", "finance@sunpower.com", "9876543215", roles.get(RoleName.ROLE_FINANCE));
        createUser("director", "Venkatesh S (Director)", "director@sunpower.com", "9876543216", roles.get(RoleName.ROLE_DIRECTOR));

        // 3. Crew of 15 Technicians
        String[][] techData = {
                {"Karthik Raja", "9840112233", "karthik.tech@sunpower.com", "Lead Rooftop Installer, System Commissioning"},
                {"Ganesh Moorthy", "9840112234", "ganesh.tech@sunpower.com", "High Voltage Inverter Specialist, AC Wiring"},
                {"Selvakumar R", "9840112235", "selva.tech@sunpower.com", "Mounting Structure & Tin Shed Fabrication"},
                {"Praveen Kumar", "9840112236", "praveen.tech@sunpower.com", "Safety Chemical Earthing & SPD Specialist"},
                {"Dinesh Babu", "9840112237", "dinesh.tech@sunpower.com", "Rooftop Survey & Shadow Analysis Expert"},
                {"Manoj Prabhakar", "9840112238", "manoj.tech@sunpower.com", "Battery Storage & Hybrid Wiring"},
                {"Saravanan V", "9840112239", "saravanan.tech@sunpower.com", "DC Cabling & Conduit Routing"},
                {"Anand Raj", "9840112240", "anand.tech@sunpower.com", "Testing, Power Quality & Net-Metering"},
                {"Vijay Anand", "9840112241", "vijay.tech@sunpower.com", "Civil Rooftop Foundation & RCC Anchoring"},
                {"Muthukumar K", "9840112242", "muthu.tech@sunpower.com", "Troubleshooting & Inverter Error Codes"},
                {"Balamurugan P", "9840112243", "bala.tech@sunpower.com", "Site Feasibility & Drone Roof Mapping"},
                {"Senthil Nathan", "9840112244", "senthil.tech@sunpower.com", "General Mechanical Assembly"},
                {"Hariharan S", "9840112245", "hari.tech@sunpower.com", "Three-Phase Industrial Connection"},
                {"Ravi Chandran", "9840112246", "ravi.tech@sunpower.com", "Lightning Arrestor & Grounding"},
                {"Vigneshwar M", "9840112247", "vignesh.tech@sunpower.com", "Preventive Maintenance & Panel Cleaning"}
        };
        for (String[] t : techData) {
            technicianRepository.save(new Technician(t[0], t[1], t[2], t[3]));
        }

        // 4. Product Categories
        ProductCategory catPanels = categoryRepository.save(new ProductCategory("Solar Panels", "High-efficiency monocrystalline solar panels"));
        ProductCategory catInverters = categoryRepository.save(new ProductCategory("Inverters", "On-grid and off-grid grid-tie and hybrid solar inverters"));
        ProductCategory catBatteries = categoryRepository.save(new ProductCategory("Batteries", "Deep-cycle solar lithium-ion and tubular batteries"));
        ProductCategory catControllers = categoryRepository.save(new ProductCategory("Charge Controllers", "MPPT high-efficiency solar charge controllers"));
        ProductCategory catWiring = categoryRepository.save(new ProductCategory("Wiring & Balance of System", "DC cables, AC distribution boards, junction boxes, MC4 connectors"));
        ProductCategory catStands = categoryRepository.save(new ProductCategory("Mounting Structures", "Hot-dip galvanized rooftop elevated metal mounting stands"));
        ProductCategory catEarthing = categoryRepository.save(new ProductCategory("Safety Earthing", "Chemical earthing electrodes, lightning arrestor kits, copper bonded rods"));
        ProductCategory catServices = categoryRepository.save(new ProductCategory("Installation Services", "Professional on-site fitting, wiring, and testing"));

        // 5. Products
        Product pPanel = createProduct("PANEL-MONO-540W", "Mono PERC Half-Cut 540W Solar Panel", catPanels,
                "Tier-1 540W High Efficiency Monocrystalline Module", "pcs", new BigDecimal("10500.00"), new BigDecimal("13200.00"),
                180, 20, false, 240);

        Product pInv3k = createProduct("INV-OG-3KW-GROWATT", "Growatt 3 kW Single Phase On-Grid Inverter", catInverters,
                "Dual MPPT, IP65 protection, Wi-Fi smart monitoring", "unit", new BigDecimal("26000.00"), new BigDecimal("34500.00"),
                25, 4, true, 24);

        Product pInv5k = createProduct("INV-OG-5KW-GROWATT", "Growatt 5 kW Three Phase On-Grid Inverter", catInverters,
                "Dual MPPT 3-Phase, integrated DC disconnect switch", "unit", new BigDecimal("38000.00"), new BigDecimal("49500.00"),
                20, 3, true, 24);

        Product pInv3kOff = createProduct("INV-OFF-3KW-HYBRID", "3 kW Off-Grid Hybrid Solar Inverter", catInverters,
                "Pure sine wave hybrid inverter with built-in solar charger", "unit", new BigDecimal("32000.00"), new BigDecimal("42000.00"),
                15, 3, true, 24);

        Product pInv5kOff = createProduct("INV-OFF-5KW-HYBRID", "5 kW Off-Grid Hybrid Solar Inverter", catInverters,
                "High surge capacity hybrid inverter for independent power", "unit", new BigDecimal("46000.00"), new BigDecimal("59000.00"),
                12, 2, true, 24);

        Product pBattery = createProduct("BAT-LITH-5KWH", "Solar Lithium LiFePO4 Battery 5 kWh 48V", catBatteries,
                "6000+ cycle life, smart BMS integrated storage bank", "unit", new BigDecimal("75000.00"), new BigDecimal("98000.00"),
                18, 2, true, 24);

        Product pController = createProduct("CC-MPPT-60A", "Smart MPPT Charge Controller 60A", catControllers,
                "Advanced tracking efficiency 99.5%, LCD display", "unit", new BigDecimal("8500.00"), new BigDecimal("12000.00"),
                30, 5, true, 24);

        Product pWiringBox = createProduct("BOS-ACDC-BOX", "Solar AC/DC Distribution Box with SPD & MCB", catWiring,
                "Type-II Surge Protection Device and DC fuses integrated", "set", new BigDecimal("3500.00"), new BigDecimal("5200.00"),
                45, 10, false, 12);

        Product pCable = createProduct("CAB-DC-4SQMM", "Finolex 4 sq.mm UV-Protected Solar DC Cable", catWiring,
                "Tinned copper, cross-linked polyolefin insulation", "meter", new BigDecimal("38.00"), new BigDecimal("55.00"),
                1500, 200, false, 60);

        Product pConnectors = createProduct("CON-MC4-PAIR", "Heavy-Duty IP68 MC4 Connectors", catWiring,
                "Flame retardant PPO connectors with locking clip", "pair", new BigDecimal("90.00"), new BigDecimal("150.00"),
                300, 50, false, 12);

        Product pStands = createProduct("STR-HDG-MOD", "Hot-Dip Galvanized Rooftop Structure Set", catStands,
                "Corrosion resistant for wind speeds up to 150 km/h", "set", new BigDecimal("4500.00"), new BigDecimal("6800.00"),
                60, 10, false, 120);

        Product pEarthing = createProduct("EARTH-CHEM-KIT", "Chemical Earthing Kit with Copper Rod & Compound", catEarthing,
                "Maintenance-free earthing electrode with 25kg compound", "set", new BigDecimal("3200.00"), new BigDecimal("4800.00"),
                50, 8, false, 60);

        Product pInstallService = createProduct("SRV-INSTALL-FEE", "Professional Rooftop Installation & Commissioning", catServices,
                "Mounting, cabling, conduit routing, testing & grid sync", "service", new BigDecimal("8000.00"), new BigDecimal("15000.00"),
                999, 10, false, 12);

        // 6. Predefined Solar Packages from 1 kW to 5 kW for On-Grid and Off-Grid
        createPackageWithBOM("1 kW On-Grid Solar System", SystemType.ON_GRID, new BigDecimal("1.00"),
                "Ideal for compact homes with monthly bill ₹1,000 - ₹2,000", new BigDecimal("65000.00"),
                Arrays.asList(
                        new BOMItemDef(pPanel, 2, "Solar Panel Set"),
                        new BOMItemDef(pInv3k, 1, "On-Grid Inverter"),
                        new BOMItemDef(pWiringBox, 1, "Safety Distribution Box"),
                        new BOMItemDef(pController, 1, "Battery Charge Controller"),
                        new BOMItemDef(pCable, 30, "DC Solar Cable"),
                        new BOMItemDef(pConnectors, 2, "MC4 Connectors"),
                        new BOMItemDef(pStands, 1, "Galvanized Metal Stands"),
                        new BOMItemDef(pEarthing, 1, "Safety Earthing Kit"),
                        new BOMItemDef(pInstallService, 1, "Installation & Testing Service")
                ));

        createPackageWithBOM("3 kW On-Grid Solar System", SystemType.ON_GRID, new BigDecimal("3.00"),
                "Most popular package for 3-4 BHK homes. Offsets 350-400 units monthly electricity bill", new BigDecimal("185000.00"),
                Arrays.asList(
                        new BOMItemDef(pPanel, 6, "Solar Panel Set (Hardware)"),
                        new BOMItemDef(pInv3k, 1, "On-Grid Inverter"),
                        new BOMItemDef(pWiringBox, 1, "Wiring Boxes & SPD"),
                        new BOMItemDef(pController, 1, "Battery Charge Controller"),
                        new BOMItemDef(pCable, 60, "Solar DC Cable"),
                        new BOMItemDef(pConnectors, 4, "MC4 Connectors"),
                        new BOMItemDef(pStands, 3, "Metal Stands Structure"),
                        new BOMItemDef(pEarthing, 1, "Safety Earthing Component"),
                        new BOMItemDef(pInstallService, 1, "Fitting, Testing and Commissioning")
                ));

        createPackageWithBOM("5 kW On-Grid Solar System", SystemType.ON_GRID, new BigDecimal("5.00"),
                "High power rooftop system for large residences, villas and small factories", new BigDecimal("295000.00"),
                Arrays.asList(
                        new BOMItemDef(pPanel, 10, "Solar Panel Set (Hardware)"),
                        new BOMItemDef(pInv5k, 1, "On-Grid Inverter"),
                        new BOMItemDef(pWiringBox, 2, "Wiring Boxes"),
                        new BOMItemDef(pController, 1, "Battery Charge Controller"),
                        new BOMItemDef(pCable, 100, "DC Wires"),
                        new BOMItemDef(pConnectors, 6, "Connectors"),
                        new BOMItemDef(pStands, 5, "Metal Stands"),
                        new BOMItemDef(pEarthing, 2, "Safety Earthing Component"),
                        new BOMItemDef(pInstallService, 1, "Fitting and Commissioning")
                ));

        createPackageWithBOM("3 kW Off-Grid Solar System", SystemType.OFF_GRID, new BigDecimal("3.00"),
                "Complete energy independence with 5 kWh Lithium storage backup for zero blackout areas", new BigDecimal("298000.00"),
                Arrays.asList(
                        new BOMItemDef(pPanel, 6, "Solar Panel Set"),
                        new BOMItemDef(pInv3kOff, 1, "Hybrid Off-Grid Inverter"),
                        new BOMItemDef(pBattery, 1, "Lithium Energy Storage Battery"),
                        new BOMItemDef(pController, 1, "Battery Charge Controller"),
                        new BOMItemDef(pWiringBox, 1, "Wiring Boxes"),
                        new BOMItemDef(pCable, 60, "DC Wires"),
                        new BOMItemDef(pConnectors, 4, "Connectors"),
                        new BOMItemDef(pStands, 3, "Metal Stands"),
                        new BOMItemDef(pEarthing, 1, "Safety Earthing"),
                        new BOMItemDef(pInstallService, 1, "Installation & Testing")
                ));

        createPackageWithBOM("5 kW Off-Grid Solar System", SystemType.OFF_GRID, new BigDecimal("5.00"),
                "Heavy-duty factory and estate solar system with dual 10 kWh battery backup", new BigDecimal("445000.00"),
                Arrays.asList(
                        new BOMItemDef(pPanel, 10, "Solar Panel Set"),
                        new BOMItemDef(pInv5kOff, 1, "Hybrid Off-Grid Inverter"),
                        new BOMItemDef(pBattery, 2, "Dual Energy Storage Batteries"),
                        new BOMItemDef(pController, 1, "Battery Charge Controller"),
                        new BOMItemDef(pWiringBox, 2, "Wiring Boxes"),
                        new BOMItemDef(pCable, 100, "Wires"),
                        new BOMItemDef(pConnectors, 6, "Connectors"),
                        new BOMItemDef(pStands, 5, "Metal Stands"),
                        new BOMItemDef(pEarthing, 2, "Safety Earthing"),
                        new BOMItemDef(pInstallService, 1, "Installation & Testing")
                ));

        // 7. Initial Serial Numbers in Stock (available for real dispatches)
        registerSerial("INV-GW-3K-1001", pInv3k, "PO-2026-01", "Bay A - Shelf 1");
        registerSerial("INV-GW-3K-1002", pInv3k, "PO-2026-01", "Bay A - Shelf 1");
        registerSerial("INV-GW-3K-1003", pInv3k, "PO-2026-02", "Bay A - Shelf 2");
        registerSerial("INV-GW-5K-2001", pInv5k, "PO-2026-03", "Bay B - Shelf 1");
        registerSerial("INV-GW-5K-2002", pInv5k, "PO-2026-03", "Bay B - Shelf 2");
        registerSerial("INV-OFF-3K-8801", pInv3kOff, "PO-2026-04", "Bay C - Shelf 1");
        registerSerial("BAT-LITH-5K-3001", pBattery, "PO-2026-05", "Battery Bay - Slot 1");
        registerSerial("BAT-LITH-5K-3002", pBattery, "PO-2026-05", "Battery Bay - Slot 2");
        registerSerial("CC-MPPT-60A-4001", pController, "PO-2026-06", "Electronics Rack 1");
        registerSerial("CC-MPPT-60A-4002", pController, "PO-2026-06", "Electronics Rack 2");
    }

    private void createUser(String username, String fullName, String email, String phone, Role role) {
        if (!userRepository.existsByUsername(username)) {
            User user = new User(username, passwordEncoder.encode("password123"), fullName, email, phone);
            user.setRoles(Collections.singleton(role));
            userRepository.save(user);
        }
    }

    private Product createProduct(String code, String name, ProductCategory cat, String desc, String unit,
                                  BigDecimal buy, BigDecimal sell, int stock, int minStock, boolean serialized, int warrantyMonths) {
        Product p = new Product();
        p.setProductCode(code);
        p.setName(name);
        p.setCategory(cat);
        p.setDescription(desc);
        p.setUnit(unit);
        p.setPurchasePrice(buy);
        p.setSellingPrice(sell);
        p.setCurrentStock(stock);
        p.setMinimumStockLevel(minStock);
        p.setSerialized(serialized);
        p.setDefaultWarrantyMonths(warrantyMonths);
        p.setActive(true);
        p = productRepository.save(p);

        InventoryStock s = new InventoryStock(p, stock, 0, "Main Warehouse");
        stockRepository.save(s);
        return p;
    }

    private static class BOMItemDef {
        Product product;
        int quantity;
        String role;
        BOMItemDef(Product product, int quantity, String role) {
            this.product = product;
            this.quantity = quantity;
            this.role = role;
        }
    }

    private SolarPackage createPackageWithBOM(String name, SystemType type, BigDecimal capacity, String desc, BigDecimal basePrice, List<BOMItemDef> bomItems) {
        SolarPackage pkg = new SolarPackage();
        pkg.setName(name);
        pkg.setSystemType(type);
        pkg.setCapacityKw(capacity);
        pkg.setDescription(desc);
        pkg.setBasePrice(basePrice);
        pkg.setActive(true);
        pkg = packageRepository.save(pkg);

        List<PackageBOM> boms = new ArrayList<>();
        for (BOMItemDef def : bomItems) {
            PackageBOM b = new PackageBOM(pkg, def.product, def.quantity, def.role);
            boms.add(b);
        }
        bomRepository.saveAll(boms);
        pkg.setBomItems(boms);
        return pkg;
    }

    private SerialNumber registerSerial(String code, Product product, String purchaseRef, String location) {
        SerialNumber sn = new SerialNumber(code, product, purchaseRef, location);
        sn = serialNumberRepository.save(sn);

        SerialNumberHistory history = new SerialNumberHistory(
                sn,
                SerialNumberStatus.IN_STOCK,
                "Intake recorded in warehouse",
                location,
                "Murugan V (Warehouse)"
        );
        serialNumberHistoryRepository.save(history);
        return sn;
    }
}
