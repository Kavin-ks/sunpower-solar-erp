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
import java.time.LocalDate;
import java.time.LocalDateTime;
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

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private SiteSurveyRepository siteSurveyRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private DispatchRepository dispatchRepository;

    @Autowired
    private DispatchItemRepository dispatchItemRepository;

    @Autowired
    private InstallationRepository installationRepository;

    @Autowired
    private WarrantyRepository warrantyRepository;

    @Autowired
    private WarrantyService warrantyService;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private SubsidyApplicationRepository subsidyApplicationRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private TechnicianPaymentRepository technicianPaymentRepository;

    @Autowired
    private EnquiryRepository enquiryRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (roleRepository.count() > 0) {
            ensureAllSolarPackagesExist();
            ensurePickingDispatchExists();
            ensurePanelSerializationAndStockSerials();
            ensureDemoHistoricalDataExists();
            ensureDispatchedOrdersHaveSerialNumbers();
            ensureTechnicianNamingNormalized();
            ensureDemoEnquiriesExist();
            return; // Already initialized roles/users
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
        createUser("technician", "Karthik Raja", "tech@sunpower.com", "9876543213", roles.get(RoleName.ROLE_TECHNICIAN));
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
                180, 20, true, 240);

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

        // Execute all master ensuring blocks for full 10-package catalog, panel serialization, and demo history
        ensureAllSolarPackagesExist();
        ensurePickingDispatchExists();
        ensurePanelSerializationAndStockSerials();
        ensureDemoHistoricalDataExists();
        ensureDemoEnquiriesExist();
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
        Optional<SerialNumber> existing = serialNumberRepository.findBySerialCode(code);
        if (existing.isPresent()) {
            return existing.get();
        }
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

    @Transactional
    public void ensureAllSolarPackagesExist() {
        ProductCategory catPanels = categoryRepository.findByName("Solar Panels").orElseGet(() -> categoryRepository.save(new ProductCategory("Solar Panels", "High-efficiency monocrystalline solar panels")));
        ProductCategory catInverters = categoryRepository.findByName("Inverters").orElseGet(() -> categoryRepository.save(new ProductCategory("Inverters", "On-grid and off-grid grid-tie and hybrid solar inverters")));
        ProductCategory catBatteries = categoryRepository.findByName("Batteries").orElseGet(() -> categoryRepository.save(new ProductCategory("Batteries", "Deep-cycle solar lithium-ion and tubular batteries")));
        ProductCategory catControllers = categoryRepository.findByName("Charge Controllers").orElseGet(() -> categoryRepository.save(new ProductCategory("Charge Controllers", "MPPT high-efficiency solar charge controllers")));
        ProductCategory catWiring = categoryRepository.findByName("Wiring & Balance of System").orElseGet(() -> categoryRepository.save(new ProductCategory("Wiring & Balance of System", "DC cables, AC distribution boxes, connectors")));
        ProductCategory catStands = categoryRepository.findByName("Mounting Structures").orElseGet(() -> categoryRepository.save(new ProductCategory("Mounting Structures", "Hot-dip galvanized rooftop mounting stands")));
        ProductCategory catEarthing = categoryRepository.findByName("Safety Earthing").orElseGet(() -> categoryRepository.save(new ProductCategory("Safety Earthing", "Chemical earthing electrodes, lightning arrestor kits")));
        ProductCategory catServices = categoryRepository.findByName("Installation Services").orElseGet(() -> categoryRepository.save(new ProductCategory("Installation Services", "Professional on-site fitting, wiring, and testing")));

        Product pPanel = getOrCreateProduct("PANEL-MONO-540W", "Mono PERC Half-Cut 540W Solar Panel", catPanels, "Tier-1 540W Monocrystalline Module", "pcs", new BigDecimal("10500.00"), new BigDecimal("13200.00"), 180, 20, true, 240);
        Product pInv1kOn = getOrCreateProduct("INV-OG-1KW-GROWATT", "Growatt 1 kW Single Phase On-Grid Inverter", catInverters, "Single MPPT, IP65 protection, Wi-Fi smart monitoring", "unit", new BigDecimal("18000.00"), new BigDecimal("24000.00"), 20, 4, true, 24);
        Product pInv1kOff = getOrCreateProduct("INV-OFF-1KW-HYBRID", "1 kW Off-Grid Hybrid Solar Inverter", catInverters, "Pure sine wave hybrid inverter with built-in solar charger", "unit", new BigDecimal("22000.00"), new BigDecimal("29000.00"), 15, 3, true, 24);
        Product pInv2kOn = getOrCreateProduct("INV-OG-2KW-GROWATT", "Growatt 2 kW Single Phase On-Grid Inverter", catInverters, "Single MPPT, compact high-efficiency on-grid inverter", "unit", new BigDecimal("22000.00"), new BigDecimal("29500.00"), 20, 4, true, 24);
        Product pInv2kOff = getOrCreateProduct("INV-OFF-2KW-HYBRID", "2 kW Off-Grid Hybrid Solar Inverter", catInverters, "Pure sine wave hybrid inverter with solar battery charging", "unit", new BigDecimal("27000.00"), new BigDecimal("35500.00"), 15, 3, true, 24);
        Product pInv3k = getOrCreateProduct("INV-OG-3KW-GROWATT", "Growatt 3 kW Single Phase On-Grid Inverter", catInverters, "Dual MPPT, IP65 protection, Wi-Fi smart monitoring", "unit", new BigDecimal("26000.00"), new BigDecimal("34500.00"), 25, 4, true, 24);
        Product pInv3kOff = getOrCreateProduct("INV-OFF-3KW-HYBRID", "3 kW Off-Grid Hybrid Solar Inverter", catInverters, "Pure sine wave hybrid inverter with built-in solar charger", "unit", new BigDecimal("32000.00"), new BigDecimal("42000.00"), 15, 3, true, 24);
        Product pInv4kOn = getOrCreateProduct("INV-OG-4KW-GROWATT", "Growatt 4 kW Single Phase On-Grid Inverter", catInverters, "Dual MPPT, IP65 protection, high-yield on-grid inverter", "unit", new BigDecimal("32000.00"), new BigDecimal("42000.00"), 20, 4, true, 24);
        Product pInv4kOff = getOrCreateProduct("INV-OFF-4KW-HYBRID", "4 kW Off-Grid Hybrid Solar Inverter", catInverters, "High surge capacity hybrid inverter for residential backup", "unit", new BigDecimal("39000.00"), new BigDecimal("51000.00"), 15, 3, true, 24);
        Product pInv5k = getOrCreateProduct("INV-OG-5KW-GROWATT", "Growatt 5 kW Three Phase On-Grid Inverter", catInverters, "Dual MPPT 3-Phase, integrated DC disconnect switch", "unit", new BigDecimal("38000.00"), new BigDecimal("49500.00"), 20, 3, true, 24);
        Product pInv5kOff = getOrCreateProduct("INV-OFF-5KW-HYBRID", "5 kW Off-Grid Hybrid Solar Inverter", catInverters, "High surge capacity hybrid inverter for independent power", "unit", new BigDecimal("46000.00"), new BigDecimal("59000.00"), 12, 2, true, 24);

        Product pBattery = getOrCreateProduct("BAT-LITH-5KWH", "Solar Lithium LiFePO4 Battery 5 kWh 48V", catBatteries, "6000+ cycle life, smart BMS integrated storage bank", "unit", new BigDecimal("75000.00"), new BigDecimal("98000.00"), 18, 2, true, 24);
        Product pController = getOrCreateProduct("CC-MPPT-60A", "Smart MPPT Charge Controller 60A", catControllers, "Advanced tracking efficiency 99.5%, LCD display", "unit", new BigDecimal("8500.00"), new BigDecimal("12000.00"), 30, 5, true, 24);
        Product pWiringBox = getOrCreateProduct("BOS-ACDC-BOX", "Solar AC/DC Distribution Box with SPD & MCB", catWiring, "Type-II Surge Protection Device and DC fuses integrated", "set", new BigDecimal("3500.00"), new BigDecimal("5200.00"), 45, 10, false, 12);
        Product pCable = getOrCreateProduct("CAB-DC-4SQMM", "Finolex 4 sq.mm UV-Protected Solar DC Cable", catWiring, "Tinned copper, cross-linked polyolefin insulation", "meter", new BigDecimal("38.00"), new BigDecimal("55.00"), 1500, 200, false, 60);
        Product pConnectors = getOrCreateProduct("CON-MC4-PAIR", "Heavy-Duty IP68 MC4 Connectors", catWiring, "Flame retardant PPO connectors with locking clip", "pair", new BigDecimal("90.00"), new BigDecimal("150.00"), 300, 50, false, 12);
        Product pStands = getOrCreateProduct("STR-HDG-MOD", "Hot-Dip Galvanized Rooftop Structure Set", catStands, "Corrosion resistant for wind speeds up to 150 km/h", "set", new BigDecimal("4500.00"), new BigDecimal("6800.00"), 60, 10, false, 120);
        Product pEarthing = getOrCreateProduct("EARTH-CHEM-KIT", "Chemical Earthing Kit with Copper Rod & Compound", catEarthing, "Maintenance-free earthing electrode with 25kg compound", "set", new BigDecimal("3200.00"), new BigDecimal("4800.00"), 50, 8, false, 60);
        Product pInstallService = getOrCreateProduct("SRV-INSTALL-FEE", "Professional Rooftop Installation & Commissioning", catServices, "Mounting, cabling, conduit routing, testing & grid sync", "service", new BigDecimal("8000.00"), new BigDecimal("15000.00"), 999, 10, false, 12);

        // 1. 1 kW On-Grid
        ensurePackageWithBOM("1 kW On-Grid Solar System", SystemType.ON_GRID, new BigDecimal("1.00"),
                "Ideal for compact homes with monthly bill ₹1,000 - ₹2,000", new BigDecimal("65000.00"),
                Arrays.asList(
                        new BOMItemDef(pPanel, 2, "Solar Panel Set"),
                        new BOMItemDef(pInv1kOn, 1, "On-Grid Inverter"),
                        new BOMItemDef(pWiringBox, 1, "Safety Distribution Box"),
                        new BOMItemDef(pController, 1, "Battery Charge Controller"),
                        new BOMItemDef(pCable, 30, "DC Solar Cable"),
                        new BOMItemDef(pConnectors, 2, "MC4 Connectors"),
                        new BOMItemDef(pStands, 1, "Galvanized Metal Stands"),
                        new BOMItemDef(pEarthing, 1, "Safety Earthing Kit"),
                        new BOMItemDef(pInstallService, 1, "Installation & Testing Service")
                ));

        // 2. 1 kW Off-Grid
        ensurePackageWithBOM("1 kW Off-Grid Solar System", SystemType.OFF_GRID, new BigDecimal("1.00"),
                "Off-grid rooftop system with 5 kWh battery storage for power backup", new BigDecimal("175000.00"),
                Arrays.asList(
                        new BOMItemDef(pPanel, 2, "Solar Panel Set"),
                        new BOMItemDef(pInv1kOff, 1, "Hybrid Off-Grid Inverter"),
                        new BOMItemDef(pBattery, 1, "Lithium Energy Storage Battery"),
                        new BOMItemDef(pController, 1, "Battery Charge Controller"),
                        new BOMItemDef(pWiringBox, 1, "Wiring Boxes"),
                        new BOMItemDef(pCable, 30, "DC Wires"),
                        new BOMItemDef(pConnectors, 2, "Connectors"),
                        new BOMItemDef(pStands, 1, "Metal Stands"),
                        new BOMItemDef(pEarthing, 1, "Safety Earthing"),
                        new BOMItemDef(pInstallService, 1, "Installation & Testing")
                ));

        // 3. 2 kW On-Grid
        ensurePackageWithBOM("2 kW On-Grid Solar System", SystemType.ON_GRID, new BigDecimal("2.00"),
                "Ideal for 2-3 BHK homes with monthly electricity bill ₹2,000 - ₹3,000", new BigDecimal("125000.00"),
                Arrays.asList(
                        new BOMItemDef(pPanel, 4, "Solar Panel Set"),
                        new BOMItemDef(pInv2kOn, 1, "On-Grid Inverter"),
                        new BOMItemDef(pWiringBox, 1, "Safety Distribution Box"),
                        new BOMItemDef(pController, 1, "Battery Charge Controller"),
                        new BOMItemDef(pCable, 45, "DC Solar Cable"),
                        new BOMItemDef(pConnectors, 3, "MC4 Connectors"),
                        new BOMItemDef(pStands, 2, "Galvanized Metal Stands"),
                        new BOMItemDef(pEarthing, 1, "Safety Earthing Kit"),
                        new BOMItemDef(pInstallService, 1, "Installation & Testing Service")
                ));

        // 4. 2 kW Off-Grid
        ensurePackageWithBOM("2 kW Off-Grid Solar System", SystemType.OFF_GRID, new BigDecimal("2.00"),
                "Independent power supply with 5 kWh Lithium storage backup", new BigDecimal("235000.00"),
                Arrays.asList(
                        new BOMItemDef(pPanel, 4, "Solar Panel Set"),
                        new BOMItemDef(pInv2kOff, 1, "Hybrid Off-Grid Inverter"),
                        new BOMItemDef(pBattery, 1, "Lithium Energy Storage Battery"),
                        new BOMItemDef(pController, 1, "Battery Charge Controller"),
                        new BOMItemDef(pWiringBox, 1, "Wiring Boxes"),
                        new BOMItemDef(pCable, 45, "DC Wires"),
                        new BOMItemDef(pConnectors, 3, "Connectors"),
                        new BOMItemDef(pStands, 2, "Metal Stands"),
                        new BOMItemDef(pEarthing, 1, "Safety Earthing"),
                        new BOMItemDef(pInstallService, 1, "Installation & Testing")
                ));

        // 5. 3 kW On-Grid
        ensurePackageWithBOM("3 kW On-Grid Solar System", SystemType.ON_GRID, new BigDecimal("3.00"),
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

        // 6. 3 kW Off-Grid
        ensurePackageWithBOM("3 kW Off-Grid Solar System", SystemType.OFF_GRID, new BigDecimal("3.00"),
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

        // 7. 4 kW On-Grid
        ensurePackageWithBOM("4 kW On-Grid Solar System", SystemType.ON_GRID, new BigDecimal("4.00"),
                "High efficiency grid-tied rooftop system for 3-5 BHK large homes", new BigDecimal("240000.00"),
                Arrays.asList(
                        new BOMItemDef(pPanel, 8, "Solar Panel Set"),
                        new BOMItemDef(pInv4kOn, 1, "On-Grid Inverter"),
                        new BOMItemDef(pWiringBox, 2, "Safety Distribution Box"),
                        new BOMItemDef(pController, 1, "Battery Charge Controller"),
                        new BOMItemDef(pCable, 80, "DC Solar Cable"),
                        new BOMItemDef(pConnectors, 5, "MC4 Connectors"),
                        new BOMItemDef(pStands, 4, "Galvanized Metal Stands"),
                        new BOMItemDef(pEarthing, 2, "Safety Earthing Kit"),
                        new BOMItemDef(pInstallService, 1, "Installation & Testing Service")
                ));

        // 8. 4 kW Off-Grid
        ensurePackageWithBOM("4 kW Off-Grid Solar System", SystemType.OFF_GRID, new BigDecimal("4.00"),
                "Comprehensive off-grid solution with 10 kWh battery storage for total energy autonomy", new BigDecimal("375000.00"),
                Arrays.asList(
                        new BOMItemDef(pPanel, 8, "Solar Panel Set"),
                        new BOMItemDef(pInv4kOff, 1, "Hybrid Off-Grid Inverter"),
                        new BOMItemDef(pBattery, 2, "Dual Energy Storage Batteries"),
                        new BOMItemDef(pController, 1, "Battery Charge Controller"),
                        new BOMItemDef(pWiringBox, 2, "Wiring Boxes"),
                        new BOMItemDef(pCable, 80, "DC Wires"),
                        new BOMItemDef(pConnectors, 5, "Connectors"),
                        new BOMItemDef(pStands, 4, "Metal Stands"),
                        new BOMItemDef(pEarthing, 2, "Safety Earthing"),
                        new BOMItemDef(pInstallService, 1, "Installation & Testing")
                ));

        // 9. 5 kW On-Grid
        ensurePackageWithBOM("5 kW On-Grid Solar System", SystemType.ON_GRID, new BigDecimal("5.00"),
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

        // 10. 5 kW Off-Grid
        ensurePackageWithBOM("5 kW Off-Grid Solar System", SystemType.OFF_GRID, new BigDecimal("5.00"),
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
    }

    private Product getOrCreateProduct(String code, String name, ProductCategory cat, String desc, String unit,
                                       BigDecimal buy, BigDecimal sell, int stock, int minStock, boolean serialized, int warrantyMonths) {
        return productRepository.findByProductCode(code).orElseGet(() ->
                createProduct(code, name, cat, desc, unit, buy, sell, stock, minStock, serialized, warrantyMonths));
    }

    private void ensurePackageWithBOM(String name, SystemType type, BigDecimal capacity, String desc, BigDecimal basePrice, List<BOMItemDef> bomItems) {
        if (packageRepository.findBySystemTypeAndCapacityKw(type, capacity).isEmpty()) {
            createPackageWithBOM(name, type, capacity, desc, basePrice, bomItems);
        }
    }

    private void ensurePickingDispatchExists() {
        if (dispatchRepository.findByDispatchNumber("DSP-00002").isPresent()) {
            return;
        }

        Customer cust = customerRepository.findByPhone("9894123456").orElse(null);
        if (cust == null && customerRepository.count() > 0) {
            cust = customerRepository.findAll().get(0);
        }
        if (cust == null) return;

        Optional<SolarPackage> pkgOpt = packageRepository.findBySystemTypeAndCapacityKw(SystemType.ON_GRID, new BigDecimal("3.00"));
        if (pkgOpt.isEmpty()) return;
        SolarPackage pkg = pkgOpt.get();

        Product pInv = productRepository.findByProductCode("INV-OG-3KW-GROWATT").orElse(null);
        Product pPanel = productRepository.findByProductCode("PANEL-MONO-540W").orElse(null);
        if (pInv == null || pPanel == null) return;

        String ordNum = "ORD-2026-0002";
        SalesOrder order = salesOrderRepository.findByOrderNumber(ordNum).orElse(null);
        if (order == null) {
            SiteSurvey surv = siteSurveyRepository.findAll().isEmpty() ? null : siteSurveyRepository.findAll().get(0);
            if (surv == null) {
                surv = new SiteSurvey();
                surv.setSurveyNumber("SRV-2026-0003");
                surv.setCustomer(cust);
                if (!technicianRepository.findAll().isEmpty()) {
                    surv.setTechnician(technicianRepository.findAll().get(0));
                }
                surv.setScheduledDate(LocalDate.now());
                surv.setStatus(SurveyStatus.APPROVED);
                surv = siteSurveyRepository.save(surv);
            }

            Quotation quote = new Quotation();
            quote.setQuotationNumber("QT-2026-0002");
            quote.setCustomer(cust);
            quote.setSiteSurvey(surv);
            quote.setSolarPackage(pkg);
            quote.setSystemType(SystemType.ON_GRID);
            quote.setCapacityKw(new BigDecimal("3.00"));
            quote.setSubtotal(new BigDecimal("185000.00"));
            quote.setTaxAmount(new BigDecimal("9250.00"));
            quote.setInstallationFee(new BigDecimal("15000.00"));
            quote.setTotalAmount(new BigDecimal("209250.00"));
            quote.setQuotationDate(LocalDate.now());
            quote.setValidityDate(LocalDate.now().plusDays(30));
            quote.setStatus(QuotationStatus.ACCEPTED);
            quote = quotationRepository.save(quote);

            order = new SalesOrder();
            order.setOrderNumber(ordNum);
            order.setCustomer(cust);
            order.setQuotation(quote);
            order.setSolarPackage(pkg);
            order.setSystemType(SystemType.ON_GRID);
            order.setCapacityKw(new BigDecimal("3.00"));
            order.setTotalAmount(new BigDecimal("209250.00"));
            order.setAdvanceRequired(new BigDecimal("70000.00"));
            order.setTotalPaid(new BigDecimal("70000.00"));
            order.setRemainingBalance(new BigDecimal("139250.00"));
            order.setOrderDate(LocalDate.now());
            order.setStatus(OrderStatus.CONFIRMED);
            order = salesOrderRepository.save(order);

            OrderItem oi1 = new OrderItem(order, pInv, 1, pInv.getSellingPrice());
            OrderItem oi2 = new OrderItem(order, pPanel, 6, pPanel.getSellingPrice());
            orderItemRepository.saveAll(Arrays.asList(oi1, oi2));

            // Advance payment
            Payment pay = new Payment();
            pay.setPaymentNumber("PAY-2026-0003");
            pay.setSalesOrder(order);
            pay.setCustomer(cust);
            pay.setAmount(new BigDecimal("70000.00"));
            pay.setPaymentDate(LocalDate.now());
            pay.setMethod(PaymentMethod.BANK_TRANSFER);
            pay.setType(PaymentType.ADVANCE);
            pay.setReferenceNumber("NEFT-ADV-2026");
            pay.setStatus(PaymentStatus.SUCCESS);
            pay.setNotes("35% Advance payment verified for warehouse dispatch release");
            paymentRepository.save(pay);
        }

        // Active picking dispatch
        Dispatch disp = new Dispatch();
        disp.setDispatchNumber("DSP-00002");
        disp.setSalesOrder(order);
        disp.setCustomer(cust);
        disp.setStatus(DispatchStatus.PICKING);
        disp.setVehicleNumber("TN-38-AX-5521");
        disp.setDriverName("S. Muthu");
        disp.setDriverPhone("9842100998");
        disp.setDispatchNotes("Warehouse picking in progress. High-value inverter must be scanned before release.");
        disp = dispatchRepository.save(disp);

        DispatchItem di1 = new DispatchItem(disp, pInv, 1, null); // Needs Serial Number Scan!
        DispatchItem di2 = new DispatchItem(disp, pPanel, 6, null); // Non-serialized panels
        dispatchItemRepository.saveAll(Arrays.asList(di1, di2));
    }

    @Transactional
    public void ensurePanelSerializationAndStockSerials() {
        Product pPanel = productRepository.findByProductCode("PANEL-MONO-540W").orElse(null);
        if (pPanel != null) {
            boolean updated = false;
            if (!pPanel.isSerialized()) {
                pPanel.setSerialized(true);
                updated = true;
            }
            if (pPanel.getDefaultWarrantyMonths() == null || pPanel.getDefaultWarrantyMonths() != 240) {
                pPanel.setDefaultWarrantyMonths(240);
                updated = true;
            }
            if (updated) {
                productRepository.save(pPanel);
            }

            // Seed 25 IN_STOCK panel serial numbers: PNL-2026-4401 to PNL-2026-4425
            for (int i = 1; i <= 25; i++) {
                String code = String.format("PNL-2026-44%02d", i);
                registerSerial(code, pPanel, "PO-2026-PNL", "Panel Yard - Rack A");
            }
        }
    }

    @Transactional
    public void ensureDemoHistoricalDataExists() {
        Product pInv3k = productRepository.findByProductCode("INV-OG-3KW-GROWATT")
                .orElseGet(() -> productRepository.findAll().stream().filter(p -> p.getProductCode().contains("INV")).findFirst().orElse(null));
        Product pInvOff5k = productRepository.findByProductCode("INV-OG-5KW-GROWATT")
                .orElseGet(() -> productRepository.findAll().stream().filter(p -> p.getProductCode().contains("INV")).findFirst().orElse(null));
        Product pBattery = productRepository.findByProductCode("BAT-LITH-5K-LUMINOUS")
                .orElseGet(() -> productRepository.findAll().stream().filter(p -> p.getProductCode().contains("BAT")).findFirst().orElse(null));
        Product pPanel = productRepository.findByProductCode("PANEL-MONO-540W")
                .orElseGet(() -> productRepository.findAll().stream().filter(p -> p.getProductCode().contains("PANEL")).findFirst().orElse(null));
        Product pController = productRepository.findByProductCode("CC-MPPT-60A-SMART")
                .orElseGet(() -> productRepository.findAll().stream().filter(p -> p.getProductCode().contains("CC") || p.getProductCode().contains("MPPT")).findFirst().orElse(null));

        SolarPackage pkg3kOn = packageRepository.findBySystemTypeAndCapacityKw(SystemType.ON_GRID, new BigDecimal("3.00")).orElse(null);
        SolarPackage pkg5kOff = packageRepository.findBySystemTypeAndCapacityKw(SystemType.OFF_GRID, new BigDecimal("5.00")).orElse(null);

        // =========================================================================
        // DEMO PROJECT A: Profitable System (18 Months Old) - In-Warranty Demo
        // =========================================================================
        if (salesOrderRepository.findByOrderNumber("SO-DEMO-18M").isEmpty()) {
            Customer custA = customerRepository.findByPhone("9840112233").orElseGet(() -> {
                Customer c = new Customer();
                c.setFullName("Vikram Nair");
                c.setPhone("9840112233");
                c.setEmail("vikram.nair@example.com");
                c.setAddress("42, Avinashi Road, Peelamedu");
                c.setCity("Coimbatore");
                c.setState("Tamil Nadu");
                c.setPincode("641004");
                c.setCustomerType(CustomerType.RESIDENTIAL);
                return customerRepository.save(c);
            });

            SiteSurvey survA = new SiteSurvey();
            survA.setSurveyNumber("SRV-DEMO-18M");
            survA.setCustomer(custA);
            if (!technicianRepository.findAll().isEmpty()) {
                survA.setTechnician(technicianRepository.findAll().get(0));
            }
            survA.setScheduledDate(LocalDate.now().minusMonths(18));
            survA.setRoofDirection("South");
            survA.setRoofTilt("15 deg");
            survA.setAvailableRoofAreaSqFt(new BigDecimal("650.00"));
            survA.setCableDistanceMeters(new BigDecimal("12.00"));
            survA.setShadingAssessment("Shadow Free");
            survA.setStatus(SurveyStatus.APPROVED);
            survA = siteSurveyRepository.save(survA);

            Quotation quoA = new Quotation();
            quoA.setQuotationNumber("QUO-DEMO-18M");
            quoA.setCustomer(custA);
            quoA.setSiteSurvey(survA);
            quoA.setSolarPackage(pkg3kOn);
            quoA.setSystemType(SystemType.ON_GRID);
            quoA.setCapacityKw(new BigDecimal("3.00"));
            quoA.setSubtotal(new BigDecimal("171353.25"));
            quoA.setTaxAmount(new BigDecimal("23646.75"));
            quoA.setInstallationFee(new BigDecimal("15000.00"));
            quoA.setTotalAmount(new BigDecimal("195000.00"));
            quoA.setQuotationDate(LocalDate.now().minusMonths(18));
            quoA.setValidityDate(LocalDate.now().minusMonths(17));
            quoA.setStatus(QuotationStatus.ACCEPTED);
            quoA = quotationRepository.save(quoA);

            SalesOrder orderA = new SalesOrder();
            orderA.setOrderNumber("SO-DEMO-18M");
            orderA.setCustomer(custA);
            orderA.setQuotation(quoA);
            orderA.setSolarPackage(pkg3kOn);
            orderA.setSystemType(SystemType.ON_GRID);
            orderA.setCapacityKw(new BigDecimal("3.00"));
            orderA.setTotalAmount(new BigDecimal("195000.00"));
            orderA.setAdvanceRequired(new BigDecimal("70000.00"));
            orderA.setTotalPaid(new BigDecimal("195000.00"));
            orderA.setRemainingBalance(BigDecimal.ZERO);
            orderA.setOrderDate(LocalDate.now().minusMonths(18));
            orderA.setStatus(OrderStatus.COMPLETED);
            orderA = salesOrderRepository.save(orderA);

            if (pInv3k != null && pPanel != null) {
                OrderItem oi1 = new OrderItem(orderA, pInv3k, 1, pInv3k.getSellingPrice());
                OrderItem oi2 = new OrderItem(orderA, pPanel, 6, pPanel.getSellingPrice());
                orderItemRepository.saveAll(Arrays.asList(oi1, oi2));
            }

            Payment payA1 = new Payment();
            payA1.setPaymentNumber("PAY-DEMO-18M-1");
            payA1.setSalesOrder(orderA);
            payA1.setCustomer(custA);
            payA1.setAmount(new BigDecimal("70000.00"));
            payA1.setPaymentDate(LocalDate.now().minusMonths(18));
            payA1.setMethod(PaymentMethod.BANK_TRANSFER);
            payA1.setType(PaymentType.ADVANCE);
            payA1.setReferenceNumber("NEFT-DEMO-18M-ADV");
            payA1.setStatus(PaymentStatus.SUCCESS);
            payA1.setNotes("35% Advance payment received");
            paymentRepository.save(payA1);

            Payment payA2 = new Payment();
            payA2.setPaymentNumber("PAY-DEMO-18M-2");
            payA2.setSalesOrder(orderA);
            payA2.setCustomer(custA);
            payA2.setAmount(new BigDecimal("125000.00"));
            payA2.setPaymentDate(LocalDate.now().minusMonths(18));
            payA2.setMethod(PaymentMethod.BANK_TRANSFER);
            payA2.setType(PaymentType.FULL);
            payA2.setReferenceNumber("NEFT-DEMO-18M-BAL");
            payA2.setStatus(PaymentStatus.SUCCESS);
            payA2.setNotes("Final project balance cleared on handover");
            paymentRepository.save(payA2);

            Installation instA = new Installation();
            instA.setInstallationNumber("INS-DEMO-18M");
            instA.setSalesOrder(orderA);
            instA.setCustomer(custA);
            instA.setScheduledDate(LocalDate.now().minusMonths(18));
            instA.setActualStartTime(LocalDateTime.now().minusMonths(18).withHour(9).withMinute(0));
            instA.setActualFinishTime(LocalDateTime.now().minusMonths(18).withHour(17).withMinute(0));
            instA.setInstalledCapacityKw(new BigDecimal("3.00"));
            instA.setPanelMountingConfirmed(true);
            instA.setWiringConfirmed(true);
            instA.setEarthingConfirmed(true);
            instA.setTestingPassed(true);
            instA.setTestingNotes("Generating 3.1 kW peak at noon, grid synchronization verified");
            instA.setCustomerSigneeName("Vikram Nair");
            instA.setCustomerAcceptanceNote("Installation completed cleanly and power generation verified.");
            instA.setCustomerSignatureUrl("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='50'><path d='M10 30 Q 30 10 60 25 T 120 20' stroke='black' fill='transparent'/></svg>");
            instA.setCustomerSignedAt(LocalDateTime.now().minusMonths(18).withHour(17).withMinute(30));
            instA.setStatus(InstallationStatus.COMPLETED);
            installationRepository.save(instA);

            // Job Expenses: Labor Payout + Transport
            Expense expTechA = new Expense();
            expTechA.setExpenseNumber("EXP-DEMO-18M-01");
            expTechA.setCategory(ExpenseCategory.TECHNICIAN_PAYOUT);
            expTechA.setSalesOrder(orderA);
            expTechA.setAmount(new BigDecimal("4800.00"));
            expTechA.setExpenseDate(LocalDate.now().minusMonths(18));
            expTechA.setTitle("Technician Payout - Karthik Raja");
            expTechA.setDescription("Commissioning payout for 3 kW On-Grid installation");
            expTechA.setPaidTo("Karthik Raja");
            expTechA.setPaymentMethod("Bank Transfer");
            expenseRepository.save(expTechA);

            Expense expTransA = new Expense();
            expTransA.setExpenseNumber("EXP-DEMO-18M-02");
            expTransA.setCategory(ExpenseCategory.TRANSPORT);
            expTransA.setSalesOrder(orderA);
            expTransA.setAmount(new BigDecimal("2500.00"));
            expTransA.setExpenseDate(LocalDate.now().minusMonths(18));
            expTransA.setTitle("Transport & Logistics Delivery");
            expTransA.setDescription("Hardware delivery to Coimbatore site");
            expTransA.setPaidTo("FastTrack Logistics");
            expTransA.setPaymentMethod("Bank Transfer");
            expenseRepository.save(expTransA);

            // Warranties for Project A: Inverter (24m -> +6m active left), Panel (240m -> +222m active)
            if (pInv3k != null) {
                SerialNumber snInvA = registerSerial("INV-2025-1801", pInv3k, "PO-HIST-18M", "Site Installed - Peelamedu");
                snInvA.setStatus(SerialNumberStatus.INSTALLED);
                snInvA.setCustomer(custA);
                snInvA.setSalesOrder(orderA);
                snInvA.setWarrantyStartDate(LocalDate.now().minusMonths(18));
                snInvA.setWarrantyExpiryDate(LocalDate.now().minusMonths(18).plusMonths(24));
                serialNumberRepository.save(snInvA);

                if (warrantyRepository.findBySerialNumberSerialCode("INV-2025-1801").isEmpty()) {
                    Warranty warInvA = new Warranty();
                    warInvA.setWarrantyNumber("WAR-DEMO-18M-INV");
                    warInvA.setSerialNumber(snInvA);
                    warInvA.setCustomer(custA);
                    warInvA.setSalesOrder(orderA);
                    warInvA.setProduct(pInv3k);
                    warInvA.setDurationMonths(24);
                    warInvA.setDeliveryDate(LocalDate.now().minusMonths(18));
                    warInvA.setWarrantyStartDate(LocalDate.now().minusMonths(18));
                    warInvA.setWarrantyEndDate(LocalDate.now().minusMonths(18).plusMonths(24));
                    warInvA.setStatus(WarrantyStatus.ACTIVE);
                    warInvA.setTermsAndConditions("2-Year Comprehensive OEM Inverter Warranty with on-site replacement");
                    warrantyRepository.save(warInvA);
                }
            }

            if (pPanel != null) {
                SerialNumber snPnlA = registerSerial("PNL-2025-1801", pPanel, "PO-HIST-18M", "Site Installed - Peelamedu");
                snPnlA.setStatus(SerialNumberStatus.INSTALLED);
                snPnlA.setCustomer(custA);
                snPnlA.setSalesOrder(orderA);
                snPnlA.setWarrantyStartDate(LocalDate.now().minusMonths(18));
                snPnlA.setWarrantyExpiryDate(LocalDate.now().minusMonths(18).plusMonths(240));
                serialNumberRepository.save(snPnlA);

                if (warrantyRepository.findBySerialNumberSerialCode("PNL-2025-1801").isEmpty()) {
                    Warranty warPnlA = new Warranty();
                    warPnlA.setWarrantyNumber("WAR-DEMO-18M-PNL");
                    warPnlA.setSerialNumber(snPnlA);
                    warPnlA.setCustomer(custA);
                    warPnlA.setSalesOrder(orderA);
                    warPnlA.setProduct(pPanel);
                    warPnlA.setDurationMonths(240);
                    warPnlA.setDeliveryDate(LocalDate.now().minusMonths(18));
                    warPnlA.setWarrantyStartDate(LocalDate.now().minusMonths(18));
                    warPnlA.setWarrantyEndDate(LocalDate.now().minusMonths(18).plusMonths(240));
                    warPnlA.setStatus(WarrantyStatus.ACTIVE);
                    warPnlA.setTermsAndConditions("20-Year Linear Power Output and Degradation Performance Warranty");
                    warrantyRepository.save(warPnlA);
                }
            }
        }

        // =========================================================================
        // DEMO PROJECT B: Flagged / Negative Margin Red Project (Recent - 3 Days Ago)
        // =========================================================================
        if (salesOrderRepository.findByOrderNumber("SO-DEMO-LOSS").isEmpty()) {
            Customer custB = customerRepository.findByPhone("9894055667").orElseGet(() -> {
                Customer c = new Customer();
                c.setFullName("Apex Textiles Factory");
                c.setPhone("9894055667");
                c.setEmail("contact@apextextiles.in");
                c.setAddress("188/2, Industrial Estate, Mangalam Road");
                c.setCity("Tirupur");
                c.setState("Tamil Nadu");
                c.setPincode("641687");
                c.setCustomerType(CustomerType.SMALL_FACTORY);
                return customerRepository.save(c);
            });

            SiteSurvey survB = new SiteSurvey();
            survB.setSurveyNumber("SRV-DEMO-LOSS");
            survB.setCustomer(custB);
            if (technicianRepository.findAll().size() > 1) {
                survB.setTechnician(technicianRepository.findAll().get(1));
            } else if (!technicianRepository.findAll().isEmpty()) {
                survB.setTechnician(technicianRepository.findAll().get(0));
            }
            survB.setScheduledDate(LocalDate.now().minusDays(5));
            survB.setRoofDirection("South-East");
            survB.setRoofTilt("10 deg");
            survB.setAvailableRoofAreaSqFt(new BigDecimal("1200.00"));
            survB.setCableDistanceMeters(new BigDecimal("25.00"));
            survB.setShadingAssessment("Partial Shade");
            survB.setStatus(SurveyStatus.APPROVED);
            survB = siteSurveyRepository.save(survB);

            Quotation quoB = new Quotation();
            quoB.setQuotationNumber("QUO-DEMO-LOSS");
            quoB.setCustomer(custB);
            quoB.setSiteSurvey(survB);
            quoB.setSolarPackage(pkg5kOff);
            quoB.setSystemType(SystemType.OFF_GRID);
            quoB.setCapacityKw(new BigDecimal("5.00"));
            quoB.setSubtotal(new BigDecimal("298812.00"));
            quoB.setTaxAmount(new BigDecimal("41188.00"));
            quoB.setInstallationFee(new BigDecimal("20000.00"));
            quoB.setTotalAmount(new BigDecimal("340000.00"));
            quoB.setQuotationDate(LocalDate.now().minusDays(4));
            quoB.setValidityDate(LocalDate.now().plusDays(26));
            quoB.setStatus(QuotationStatus.ACCEPTED);
            quoB = quotationRepository.save(quoB);

            SalesOrder orderB = new SalesOrder();
            orderB.setOrderNumber("SO-DEMO-LOSS");
            orderB.setCustomer(custB);
            orderB.setQuotation(quoB);
            orderB.setSolarPackage(pkg5kOff);
            orderB.setSystemType(SystemType.OFF_GRID);
            orderB.setCapacityKw(new BigDecimal("5.00"));
            orderB.setTotalAmount(new BigDecimal("340000.00"));
            orderB.setAdvanceRequired(new BigDecimal("120000.00"));
            orderB.setTotalPaid(new BigDecimal("340000.00"));
            orderB.setRemainingBalance(BigDecimal.ZERO);
            orderB.setOrderDate(LocalDate.now().minusDays(3));
            orderB.setStatus(OrderStatus.COMPLETED);
            orderB = salesOrderRepository.save(orderB);

            List<OrderItem> itemsB = new ArrayList<>();
            if (pInvOff5k != null) itemsB.add(new OrderItem(orderB, pInvOff5k, 1, pInvOff5k.getSellingPrice()));
            if (pBattery != null) itemsB.add(new OrderItem(orderB, pBattery, 2, pBattery.getSellingPrice()));
            if (pPanel != null) itemsB.add(new OrderItem(orderB, pPanel, 10, pPanel.getSellingPrice()));
            if (pController != null) itemsB.add(new OrderItem(orderB, pController, 1, pController.getSellingPrice()));
            orderItemRepository.saveAll(itemsB);

            Payment payB = new Payment();
            payB.setPaymentNumber("PAY-DEMO-LOSS-1");
            payB.setSalesOrder(orderB);
            payB.setCustomer(custB);
            payB.setAmount(new BigDecimal("340000.00"));
            payB.setPaymentDate(LocalDate.now().minusDays(3));
            payB.setMethod(PaymentMethod.BANK_TRANSFER);
            payB.setType(PaymentType.FULL);
            payB.setReferenceNumber("NEFT-DEMO-LOSS-FULL");
            payB.setStatus(PaymentStatus.SUCCESS);
            payB.setNotes("Contract price cleared in full");
            paymentRepository.save(payB);

            Installation instB = new Installation();
            instB.setInstallationNumber("INS-DEMO-LOSS");
            instB.setSalesOrder(orderB);
            instB.setCustomer(custB);
            instB.setScheduledDate(LocalDate.now().minusDays(3));
            instB.setActualStartTime(LocalDateTime.now().minusDays(3).withHour(8).withMinute(0));
            instB.setActualFinishTime(LocalDateTime.now().minusDays(2).withHour(20).withMinute(0));
            instB.setInstalledCapacityKw(new BigDecimal("5.00"));
            instB.setPanelMountingConfirmed(true);
            instB.setWiringConfirmed(true);
            instB.setEarthingConfirmed(true);
            instB.setTestingPassed(true);
            instB.setTestingNotes("Reinforced tin shed commissioned. 4.9 kW generation recorded.");
            instB.setCustomerSigneeName("R. Sundaram (Factory Plant Head)");
            instB.setCustomerAcceptanceNote("Plant commissioned after emergency roof reinforcement and underground cable trenching.");
            instB.setCustomerSignatureUrl("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='50'><path d='M10 20 Q 50 40 90 10 T 140 30' stroke='black' fill='transparent'/></svg>");
            instB.setCustomerSignedAt(LocalDateTime.now().minusDays(2).withHour(20).withMinute(30));
            instB.setStatus(InstallationStatus.COMPLETED);
            installationRepository.save(instB);

            // Big Overtime Labor & Unexpected Project Expenses (Loss Maker)
            Expense expTechB = new Expense();
            expTechB.setExpenseNumber("EXP-DEMO-LOSS-01");
            expTechB.setCategory(ExpenseCategory.TECHNICIAN_PAYOUT);
            expTechB.setSalesOrder(orderB);
            expTechB.setAmount(new BigDecimal("28800.00"));
            expTechB.setExpenseDate(LocalDate.now().minusDays(2));
            expTechB.setTitle("Technician Overtime Payout - 48 Crew Hours");
            expTechB.setDescription("Overtime payouts for 3 technicians across 48 cumulative hours due to structural delays");
            expTechB.setPaidTo("Overtime Installation Crew");
            expTechB.setPaymentMethod("Bank Transfer");
            expenseRepository.save(expTechB);

            Expense expCraneB = new Expense();
            expCraneB.setExpenseNumber("EXP-DEMO-LOSS-02");
            expCraneB.setCategory(ExpenseCategory.OTHER);
            expCraneB.setSalesOrder(orderB);
            expCraneB.setAmount(new BigDecimal("68000.00"));
            expCraneB.setExpenseDate(LocalDate.now().minusDays(2));
            expCraneB.setTitle("Emergency Crane & Structural Roof Reinforcement");
            expCraneB.setDescription("Crane rental and steel girder bracing for factory tin shed roof integrity");
            expCraneB.setPaidTo("Heavy Lift Cranes Ltd");
            expCraneB.setPaymentMethod("Bank Transfer");
            expenseRepository.save(expCraneB);

            Expense expCableB = new Expense();
            expCableB.setExpenseNumber("EXP-DEMO-LOSS-03");
            expCableB.setCategory(ExpenseCategory.OTHER);
            expCableB.setSalesOrder(orderB);
            expCableB.setAmount(new BigDecimal("35000.00"));
            expCableB.setExpenseDate(LocalDate.now().minusDays(2));
            expCableB.setTitle("High-voltage Cable Rerouting & Custom Junctions");
            expCableB.setDescription("Underground trenching and custom distribution panels for safety compliance");
            expCableB.setPaidTo("Apex Industrial Electricals");
            expCableB.setPaymentMethod("Bank Transfer");
            expenseRepository.save(expCableB);
        }

        // =========================================================================
        // DEMO PROJECT C: Mixed Warranty System (30 Months Old) - Expired Inverter Demo
        // =========================================================================
        if (salesOrderRepository.findByOrderNumber("SO-DEMO-30M").isEmpty()) {
            Customer custC = customerRepository.findByPhone("9789012345").orElseGet(() -> {
                Customer c = new Customer();
                c.setFullName("Meera Krishnan");
                c.setPhone("9789012345");
                c.setEmail("meera.k@example.com");
                c.setAddress("74, Fairlands Main Road");
                c.setCity("Salem");
                c.setState("Tamil Nadu");
                c.setPincode("636016");
                c.setCustomerType(CustomerType.RESIDENTIAL);
                return customerRepository.save(c);
            });

            SiteSurvey survC = new SiteSurvey();
            survC.setSurveyNumber("SRV-DEMO-30M");
            survC.setCustomer(custC);
            if (technicianRepository.findAll().size() > 2) {
                survC.setTechnician(technicianRepository.findAll().get(2));
            } else if (!technicianRepository.findAll().isEmpty()) {
                survC.setTechnician(technicianRepository.findAll().get(0));
            }
            survC.setScheduledDate(LocalDate.now().minusMonths(30));
            survC.setRoofDirection("South");
            survC.setRoofTilt("15 deg");
            survC.setAvailableRoofAreaSqFt(new BigDecimal("500.00"));
            survC.setCableDistanceMeters(new BigDecimal("10.00"));
            survC.setShadingAssessment("Shadow Free");
            survC.setStatus(SurveyStatus.APPROVED);
            survC = siteSurveyRepository.save(survC);

            Quotation quoC = new Quotation();
            quoC.setQuotationNumber("QUO-DEMO-30M");
            quoC.setCustomer(custC);
            quoC.setSiteSurvey(survC);
            quoC.setSolarPackage(pkg3kOn);
            quoC.setSystemType(SystemType.ON_GRID);
            quoC.setCapacityKw(new BigDecimal("3.00"));
            quoC.setSubtotal(new BigDecimal("162565.90"));
            quoC.setTaxAmount(new BigDecimal("22434.10"));
            quoC.setInstallationFee(new BigDecimal("15000.00"));
            quoC.setTotalAmount(new BigDecimal("185000.00"));
            quoC.setQuotationDate(LocalDate.now().minusMonths(30));
            quoC.setValidityDate(LocalDate.now().minusMonths(29));
            quoC.setStatus(QuotationStatus.ACCEPTED);
            quoC = quotationRepository.save(quoC);

            SalesOrder orderC = new SalesOrder();
            orderC.setOrderNumber("SO-DEMO-30M");
            orderC.setCustomer(custC);
            orderC.setQuotation(quoC);
            orderC.setSolarPackage(pkg3kOn);
            orderC.setSystemType(SystemType.ON_GRID);
            orderC.setCapacityKw(new BigDecimal("3.00"));
            orderC.setTotalAmount(new BigDecimal("185000.00"));
            orderC.setAdvanceRequired(new BigDecimal("65000.00"));
            orderC.setTotalPaid(new BigDecimal("185000.00"));
            orderC.setRemainingBalance(BigDecimal.ZERO);
            orderC.setOrderDate(LocalDate.now().minusMonths(30));
            orderC.setStatus(OrderStatus.COMPLETED);
            orderC = salesOrderRepository.save(orderC);

            if (pInv3k != null && pPanel != null) {
                OrderItem oi1 = new OrderItem(orderC, pInv3k, 1, pInv3k.getSellingPrice());
                OrderItem oi2 = new OrderItem(orderC, pPanel, 6, pPanel.getSellingPrice());
                orderItemRepository.saveAll(Arrays.asList(oi1, oi2));
            }

            Payment payC = new Payment();
            payC.setPaymentNumber("PAY-DEMO-30M-1");
            payC.setSalesOrder(orderC);
            payC.setCustomer(custC);
            payC.setAmount(new BigDecimal("185000.00"));
            payC.setPaymentDate(LocalDate.now().minusMonths(30));
            payC.setMethod(PaymentMethod.BANK_TRANSFER);
            payC.setType(PaymentType.FULL);
            payC.setReferenceNumber("NEFT-DEMO-30M");
            payC.setStatus(PaymentStatus.SUCCESS);
            payC.setNotes("Full payment received");
            paymentRepository.save(payC);

            Installation instC = new Installation();
            instC.setInstallationNumber("INS-DEMO-30M");
            instC.setSalesOrder(orderC);
            instC.setCustomer(custC);
            instC.setScheduledDate(LocalDate.now().minusMonths(30));
            instC.setActualStartTime(LocalDateTime.now().minusMonths(30).withHour(9).withMinute(0));
            instC.setActualFinishTime(LocalDateTime.now().minusMonths(30).withHour(16).withMinute(30));
            instC.setInstalledCapacityKw(new BigDecimal("3.00"));
            instC.setPanelMountingConfirmed(true);
            instC.setWiringConfirmed(true);
            instC.setEarthingConfirmed(true);
            instC.setTestingPassed(true);
            instC.setTestingNotes("Commissioning completed. Net metering synced with Salem DISCOM.");
            instC.setCustomerSigneeName("Meera Krishnan");
            instC.setCustomerAcceptanceNote("System commissioned on schedule.");
            instC.setCustomerSignatureUrl("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='50'><path d='M10 25 Q 40 5 80 35 T 130 15' stroke='black' fill='transparent'/></svg>");
            instC.setCustomerSignedAt(LocalDateTime.now().minusMonths(30).withHour(17).withMinute(0));
            instC.setStatus(InstallationStatus.COMPLETED);
            installationRepository.save(instC);

            // DUAL WARRANTY TIME MACHINE:
            // Inverter: 24-month warranty started 30m ago -> EXPIRED 6 months ago!
            // Panels: 240-month warranty started 30m ago -> ACTIVE with 210 months remaining!
            if (pInv3k != null) {
                SerialNumber snInvC = registerSerial("INV-2023-9901", pInv3k, "PO-HIST-30M", "Site Installed - Salem");
                snInvC.setStatus(SerialNumberStatus.INSTALLED);
                snInvC.setCustomer(custC);
                snInvC.setSalesOrder(orderC);
                snInvC.setWarrantyStartDate(LocalDate.now().minusMonths(30));
                snInvC.setWarrantyExpiryDate(LocalDate.now().minusMonths(30).plusMonths(24));
                serialNumberRepository.save(snInvC);

                Warranty warInvC = warrantyRepository.findBySerialNumberSerialCode("INV-2023-9901")
                        .orElseGet(Warranty::new);
                warInvC.setWarrantyNumber("WAR-DEMO-30M-INV");
                warInvC.setSerialNumber(snInvC);
                warInvC.setCustomer(custC);
                warInvC.setSalesOrder(orderC);
                warInvC.setProduct(pInv3k);
                warInvC.setDurationMonths(24);
                warInvC.setDeliveryDate(LocalDate.now().minusMonths(30));
                warInvC.setWarrantyStartDate(LocalDate.now().minusMonths(30));
                warInvC.setWarrantyEndDate(LocalDate.now().minusMonths(30).plusMonths(24));
                warInvC.setStatus(WarrantyStatus.EXPIRED);
                warInvC.setTermsAndConditions("2-Year Comprehensive Inverter Warranty (EXPIRED)");
                warrantyRepository.save(warInvC);
            }

            if (pPanel != null) {
                SerialNumber snPnlC = registerSerial("PNL-2023-9901", pPanel, "PO-HIST-30M", "Site Installed - Salem");
                snPnlC.setStatus(SerialNumberStatus.INSTALLED);
                snPnlC.setCustomer(custC);
                snPnlC.setSalesOrder(orderC);
                snPnlC.setWarrantyStartDate(LocalDate.now().minusMonths(30));
                snPnlC.setWarrantyExpiryDate(LocalDate.now().minusMonths(30).plusMonths(240));
                serialNumberRepository.save(snPnlC);

                if (warrantyRepository.findBySerialNumberSerialCode("PNL-2023-9901").isEmpty()) {
                    Warranty warPnlC = new Warranty();
                    warPnlC.setWarrantyNumber("WAR-DEMO-30M-PNL");
                    warPnlC.setSerialNumber(snPnlC);
                    warPnlC.setCustomer(custC);
                    warPnlC.setSalesOrder(orderC);
                    warPnlC.setProduct(pPanel);
                    warPnlC.setDurationMonths(240);
                    warPnlC.setDeliveryDate(LocalDate.now().minusMonths(30));
                    warPnlC.setWarrantyStartDate(LocalDate.now().minusMonths(30));
                    warPnlC.setWarrantyEndDate(LocalDate.now().minusMonths(30).plusMonths(240));
                    warPnlC.setStatus(WarrantyStatus.ACTIVE);
                    warPnlC.setTermsAndConditions("20-Year Linear Power Output Performance Warranty (STILL ACTIVE)");
                    warrantyRepository.save(warPnlC);
                }
            }
        }
    }

    private void ensureDemoEnquiriesExist() {
        Customer custAnand = customerRepository.findByPhone("9840199881").orElseGet(() -> {
            Customer c = new Customer();
            c.setFullName("Anand Sundaram");
            c.setPhone("9840199881");
            c.setEmail("anand.sundaram@example.com");
            c.setAddress("42, Avinashi Road, Peelamedu");
            c.setCity("Coimbatore");
            c.setState("Tamil Nadu");
            c.setPincode("641004");
            c.setCustomerType(CustomerType.RESIDENTIAL);
            return customerRepository.save(c);
        });

        if (enquiryRepository.findByCustomerId(custAnand.getId()).isEmpty()) {
            Enquiry enq = new Enquiry();
            enq.setEnquiryNumber("ENQ-00100");
            enq.setCustomer(custAnand);
            enq.setRequestedCapacityKw(new BigDecimal("3.00"));
            enq.setSystemType(SystemType.ON_GRID);
            enq.setSubsidyRequired(true);
            enq.setMonthlyElectricityBill(new BigDecimal("3800.00"));
            enq.setShadowFreeAreaSqFt(new BigDecimal("400.00"));
            enq.setGridSuitable(true);
            enq.setSource(EnquirySource.PHONE);
            enq.setStatus(EnquiryStatus.QUALIFIED);
            enq.setNotes("Pre-qualified phone lead: 3 kW on-grid solar system with shadow-free south roof and PM Surya Ghar subsidy.");
            enquiryRepository.save(enq);
        }

        Customer custBalaji = customerRepository.findByPhone("9840112250").orElseGet(() -> {
            Customer c = new Customer();
            c.setFullName("Balaji Subramanian");
            c.setPhone("9840112250");
            c.setEmail("balaji.sub@example.com");
            c.setAddress("14, Gandhi Nagar, Adyar");
            c.setCity("Chennai");
            c.setState("Tamil Nadu");
            c.setPincode("600020");
            c.setCustomerType(CustomerType.RESIDENTIAL);
            return customerRepository.save(c);
        });

        if (enquiryRepository.findByCustomerId(custBalaji.getId()).isEmpty()) {
            Enquiry enq2 = new Enquiry();
            enq2.setEnquiryNumber("ENQ-00101");
            enq2.setCustomer(custBalaji);
            enq2.setRequestedCapacityKw(new BigDecimal("5.00"));
            enq2.setSystemType(SystemType.ON_GRID);
            enq2.setSubsidyRequired(true);
            enq2.setMonthlyElectricityBill(new BigDecimal("5200.00"));
            enq2.setShadowFreeAreaSqFt(new BigDecimal("600.00"));
            enq2.setGridSuitable(true);
            enq2.setSource(EnquirySource.WHATSAPP);
            enq2.setStatus(EnquiryStatus.NEW);
            enq2.setNotes("WhatsApp inquiry: Interested in 5 kW system for duplex villa.");
            enquiryRepository.save(enq2);
        }

        Customer custKavitha = customerRepository.findByPhone("9840122334").orElseGet(() -> {
            Customer c = new Customer();
            c.setFullName("Kavitha Rajan");
            c.setPhone("9840122334");
            c.setEmail("kavitha.rajan@example.com");
            c.setAddress("18, 2nd Main Road, Anna Nagar");
            c.setCity("Chennai");
            c.setState("Tamil Nadu");
            c.setPincode("600040");
            c.setCustomerType(CustomerType.RESIDENTIAL);
            return customerRepository.save(c);
        });

        if (enquiryRepository.findByCustomerId(custKavitha.getId()).isEmpty()) {
            Enquiry enq3 = new Enquiry();
            enq3.setEnquiryNumber("ENQ-00102");
            enq3.setCustomer(custKavitha);
            enq3.setRequestedCapacityKw(new BigDecimal("4.00"));
            enq3.setSystemType(SystemType.ON_GRID);
            enq3.setSubsidyRequired(true);
            enq3.setMonthlyElectricityBill(new BigDecimal("4500.00"));
            enq3.setShadowFreeAreaSqFt(new BigDecimal("450.00"));
            enq3.setGridSuitable(true);
            enq3.setSource(EnquirySource.CUSTOMER_PORTAL);
            enq3.setStatus(EnquiryStatus.SURVEY_SCHEDULED);
            enq3.setNotes("Website portal inquiry: 4 kW rooftop solar requested. Site appointment scheduled.");
            enq3 = enquiryRepository.save(enq3);

            if (siteSurveyRepository.findByCustomerId(custKavitha.getId()).isEmpty()) {
                SiteSurvey survSched = new SiteSurvey();
                survSched.setSurveyNumber("SRV-DEMO-SCHED");
                survSched.setCustomer(custKavitha);
                survSched.setEnquiry(enq3);
                if (!technicianRepository.findAll().isEmpty()) {
                    survSched.setTechnician(technicianRepository.findAll().get(0));
                }
                survSched.setScheduledDate(LocalDate.now().plusDays(1));
                survSched.setStatus(SurveyStatus.SCHEDULED);
                survSched.setSurveyNotes("Customer requested afternoon appointment. Verify shadow from water tank.");
                siteSurveyRepository.save(survSched);
            }
        }
    }

    @Transactional
    public void ensureDispatchedOrdersHaveSerialNumbers() {
        List<Dispatch> dispatches = dispatchRepository.findAll();
        for (Dispatch disp : dispatches) {
            if (disp.getStatus() == DispatchStatus.DISPATCHED || disp.getStatus() == DispatchStatus.DELIVERED) {
                List<DispatchItem> currentItems = new ArrayList<>(disp.getItems());
                for (DispatchItem item : currentItems) {
                    Product product = item.getProduct();
                    if (product.isSerialized() && item.getSerialNumber() == null) {
                        int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                        if (qty == 1) {
                            String code = String.format("%s-%s-%02d", product.getProductCode(), disp.getDispatchNumber(), item.getId());
                            SerialNumber sn = registerSerialForDispatchedOrder(code, product, disp.getSalesOrder(), disp.getCustomer(), disp.getStatus());
                            item.setSerialNumber(sn);
                            dispatchItemRepository.save(item);
                            warrantyService.activateWarranty(disp.getCustomer(), disp.getSalesOrder(), product, sn, disp.getDispatchDate() != null ? disp.getDispatchDate() : LocalDate.now());
                        } else {
                            // Split multi-quantity serialized item into individual units of qty 1
                            dispatchItemRepository.delete(item);
                            disp.getItems().remove(item);
                            for (int i = 1; i <= qty; i++) {
                                String code = String.format("%s-%s-%02d", product.getProductCode(), disp.getDispatchNumber(), i);
                                SerialNumber sn = registerSerialForDispatchedOrder(code, product, disp.getSalesOrder(), disp.getCustomer(), disp.getStatus());
                                DispatchItem singleItem = new DispatchItem(disp, product, 1, sn);
                                dispatchItemRepository.save(singleItem);
                                disp.getItems().add(singleItem);
                                warrantyService.activateWarranty(disp.getCustomer(), disp.getSalesOrder(), product, sn, disp.getDispatchDate() != null ? disp.getDispatchDate() : LocalDate.now());
                            }
                        }
                    }
                }
            }
        }
    }

    private SerialNumber registerSerialForDispatchedOrder(String code, Product product, SalesOrder order, Customer customer, DispatchStatus status) {
        Optional<SerialNumber> existing = serialNumberRepository.findBySerialCode(code);
        if (existing.isPresent()) {
            return existing.get();
        }
        SerialNumber sn = new SerialNumber(code, product, "DISPATCH-" + (order != null ? order.getOrderNumber() : "ORDER"), "Assigned - " + (customer != null ? customer.getFullName() : "Customer"));
        sn.setStatus(status == DispatchStatus.DELIVERED ? SerialNumberStatus.ALLOCATED : SerialNumberStatus.ALLOCATED);
        sn.setSalesOrder(order);
        sn.setCustomer(customer);
        sn.setDeliveryDate(LocalDate.now());
        sn = serialNumberRepository.save(sn);

        SerialNumberHistory history = new SerialNumberHistory(
                sn,
                SerialNumberStatus.ALLOCATED,
                "Allocated & dispatched for order " + (order != null ? order.getOrderNumber() : ""),
                customer != null ? customer.getAddress() : "Customer Site",
                "Warehouse Manager"
        );
        serialNumberHistoryRepository.save(history);
        return sn;
    }

    private void ensureTechnicianNamingNormalized() {
        userRepository.findByUsername("technician").ifPresent(user -> {
            if (user.getFullName() != null && user.getFullName().contains("Field Lead")) {
                user.setFullName("Karthik Raja");
                userRepository.save(user);
            }
        });

        technicianPaymentRepository.findAll().forEach(tp -> {
            boolean modified = false;
            if (tp.getStatus() == null) {
                tp.setStatus(com.sunpower.entity.enums.Enums.TechnicianPayoutStatus.PAID);
                modified = true;
            }
            if (tp.getAmountPaid() == null || tp.getAmountPaid().compareTo(java.math.BigDecimal.ZERO) == 0) {
                tp.setAmountPaid(tp.getAmount() != null ? tp.getAmount() : java.math.BigDecimal.ZERO);
                modified = true;
            }
            if (tp.getCalculatedAmount() == null) {
                tp.setCalculatedAmount(tp.getAmount() != null ? tp.getAmount() : java.math.BigDecimal.ZERO);
                modified = true;
            }
            if (modified) {
                technicianPaymentRepository.save(tp);
            }
        });

        // Normalize demo warranties for sub-second warranty lookup scenarios
        serialNumberRepository.findBySerialCode("INV-2023-9901").ifPresent(sn -> {
            sn.setWarrantyStartDate(LocalDate.now().minusMonths(30));
            sn.setWarrantyExpiryDate(LocalDate.now().minusMonths(6));
            serialNumberRepository.save(sn);
            warrantyRepository.findBySerialNumberSerialCode("INV-2023-9901").ifPresent(w -> {
                w.setDeliveryDate(LocalDate.now().minusMonths(30));
                w.setWarrantyStartDate(LocalDate.now().minusMonths(30));
                w.setWarrantyEndDate(LocalDate.now().minusMonths(6));
                w.setStatus(WarrantyStatus.EXPIRED);
                warrantyRepository.save(w);
            });
        });

        serialNumberRepository.findBySerialCode("INV-2025-1801").ifPresent(sn -> {
            sn.setWarrantyStartDate(LocalDate.now().minusMonths(18));
            sn.setWarrantyExpiryDate(LocalDate.now().plusMonths(6));
            serialNumberRepository.save(sn);
            warrantyRepository.findBySerialNumberSerialCode("INV-2025-1801").ifPresent(w -> {
                w.setDeliveryDate(LocalDate.now().minusMonths(18));
                w.setWarrantyStartDate(LocalDate.now().minusMonths(18));
                w.setWarrantyEndDate(LocalDate.now().plusMonths(6));
                w.setStatus(WarrantyStatus.ACTIVE);
                warrantyRepository.save(w);
            });
        });
    }
}
