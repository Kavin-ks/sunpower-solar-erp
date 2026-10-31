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
    private EnquiryRepository enquiryRepository;

    @Autowired
    private EnquiryActivityRepository enquiryActivityRepository;

    @Autowired
    private SiteSurveyRepository siteSurveyRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private QuotationItemRepository quotationItemRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private DispatchRepository dispatchRepository;

    @Autowired
    private DispatchItemRepository dispatchItemRepository;

    @Autowired
    private WarrantyRepository warrantyRepository;

    @Autowired
    private InstallationRepository installationRepository;

    @Autowired
    private InstallationTechnicianRepository installationTechnicianRepository;

    @Autowired
    private ServiceTicketRepository serviceTicketRepository;

    @Autowired
    private ServiceActivityRepository serviceActivityRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private SubsidyApplicationRepository subsidyApplicationRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (roleRepository.count() > 0) {
            ensureAllSolarPackagesExist();
            ensurePickingDispatchExists();
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
        List<Technician> technicians = new ArrayList<>();
        for (String[] t : techData) {
            technicians.add(technicianRepository.save(new Technician(t[0], t[1], t[2], t[3])));
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
                180, 20, false, 240); // 20 years warranty (240 months)

        Product pInv3k = createProduct("INV-OG-3KW-GROWATT", "Growatt 3 kW Single Phase On-Grid Inverter", catInverters,
                "Dual MPPT, IP65 protection, Wi-Fi smart monitoring", "unit", new BigDecimal("26000.00"), new BigDecimal("34500.00"),
                25, 4, true, 24); // 2 years warranty (24 months), serialized

        Product pInv5k = createProduct("INV-OG-5KW-GROWATT", "Growatt 5 kW Three Phase On-Grid Inverter", catInverters,
                "Dual MPPT 3-Phase, integrated DC disconnect switch", "unit", new BigDecimal("38000.00"), new BigDecimal("49500.00"),
                20, 3, true, 24); // 2 years warranty, serialized

        Product pInv3kOff = createProduct("INV-OFF-3KW-HYBRID", "3 kW Off-Grid Hybrid Solar Inverter", catInverters,
                "Pure sine wave hybrid inverter with built-in solar charger", "unit", new BigDecimal("32000.00"), new BigDecimal("42000.00"),
                15, 3, true, 24); // 2 years, serialized

        Product pInv5kOff = createProduct("INV-OFF-5KW-HYBRID", "5 kW Off-Grid Hybrid Solar Inverter", catInverters,
                "High surge capacity hybrid inverter for independent power", "unit", new BigDecimal("46000.00"), new BigDecimal("59000.00"),
                12, 2, true, 24); // 2 years, serialized

        Product pBattery = createProduct("BAT-LITH-5KWH", "Solar Lithium LiFePO4 Battery 5 kWh 48V", catBatteries,
                "6000+ cycle life, smart BMS integrated storage bank", "unit", new BigDecimal("75000.00"), new BigDecimal("98000.00"),
                18, 2, true, 24); // 2 years warranty, serialized

        Product pController = createProduct("CC-MPPT-60A", "Smart MPPT Charge Controller 60A", catControllers,
                "Advanced tracking efficiency 99.5%, LCD display", "unit", new BigDecimal("8500.00"), new BigDecimal("12000.00"),
                30, 5, true, 24); // 2 years, serialized

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
        // On-Grid 1kW to 5kW
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

        SolarPackage pkg3kOn = createPackageWithBOM("3 kW On-Grid Solar System", SystemType.ON_GRID, new BigDecimal("3.00"),
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

        SolarPackage pkg5kOn = createPackageWithBOM("5 kW On-Grid Solar System", SystemType.ON_GRID, new BigDecimal("5.00"),
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

        // Off-Grid 3kW and 5kW with Battery Storage
        SolarPackage pkg3kOff = createPackageWithBOM("3 kW Off-Grid Solar System", SystemType.OFF_GRID, new BigDecimal("3.00"),
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

        // 7. Initial Serial Numbers in Stock
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

        // 8. Demo Customers & Complete Workflow Samples
        // Sample Customer A: Rajesh Kumar (Residential) - Ready for Quotation
        Customer custA = new Customer();
        custA.setFullName("Rajesh Kumar");
        custA.setPhone("9841234567");
        custA.setEmail("rajesh.kumar@gmail.com");
        custA.setAddress("42, Avinashi Road, Peelamedu");
        custA.setCity("Coimbatore");
        custA.setPincode("641004");
        custA.setCustomerType(CustomerType.RESIDENTIAL);
        custA = customerRepository.save(custA);

        Enquiry enqA = new Enquiry();
        enqA.setCustomer(custA);
        enqA.setEnquiryNumber("ENQ-00001");
        enqA.setRequestedCapacityKw(new BigDecimal("3.00"));
        enqA.setSystemType(SystemType.ON_GRID);
        enqA.setSubsidyRequired(true);
        enqA.setMonthlyElectricityBill(new BigDecimal("4200.00"));
        enqA.setSource(EnquirySource.WEBSITE);
        enqA.setStatus(EnquiryStatus.SURVEY_APPROVED);
        enqA.setAssignedTo(userRepository.findByUsername("sales").orElse(null));
        enqA.setNotes("Customer interested in PM Surya Ghar subsidy scheme. Flat concrete rooftop.");
        enqA = enquiryRepository.save(enqA);

        SiteSurvey survA = new SiteSurvey();
        survA.setSurveyNumber("SRV-00001");
        survA.setCustomer(custA);
        survA.setEnquiry(enqA);
        survA.setTechnician(technicians.get(0));
        survA.setScheduledDate(LocalDate.now().minusDays(2));
        survA.setRoofDirection("South");
        survA.setRoofTilt("15 degrees");
        survA.setAvailableRoofAreaSqFt(new BigDecimal("380.00"));
        survA.setCableDistanceMeters(new BigDecimal("22.50"));
        survA.setShadingAssessment("100% Shadow-free throughout daylight hours");
        survA.setGridSuitability("Single Phase 230V Suitable, Grid transformer is within 80m");
        survA.setSurveyNotes("Rooftop structure is solid RCC slab. Ideal orientation towards South.");
        survA.setStatus(SurveyStatus.APPROVED);
        survA.setApprovedBy("Karthik Raja");
        survA.setApprovalDate(LocalDate.now().minusDays(1).atStartOfDay());
        survA.setApprovalNotes("Approved for 3 kW On-Grid installation. Recommended dual MPPT inverter.");
        siteSurveyRepository.save(survA);

        // Sample Customer B: Apex Garments Manufacturing (Small Factory) - Order Confirmed & Dispatched & Installed
        Customer custB = new Customer();
        custB.setFullName("Apex Garments Manufacturing Ltd");
        custB.setPhone("9894123456");
        custB.setEmail("procurement@apexgarments.com");
        custB.setAddress("Plot 18, SIDCO Industrial Estate");
        custB.setCity("Tiruppur");
        custB.setPincode("641603");
        custB.setCustomerType(CustomerType.SMALL_FACTORY);
        custB = customerRepository.save(custB);

        SiteSurvey survB = new SiteSurvey();
        survB.setSurveyNumber("SRV-00002");
        survB.setCustomer(custB);
        survB.setTechnician(technicians.get(1));
        survB.setScheduledDate(LocalDate.now().minusDays(15));
        survB.setRoofDirection("South-East");
        survB.setRoofTilt("20 degrees");
        survB.setAvailableRoofAreaSqFt(new BigDecimal("750.00"));
        survB.setCableDistanceMeters(new BigDecimal("45.00"));
        survB.setShadingAssessment("Clear industrial roof shed with high daylight exposure");
        survB.setGridSuitability("3-Phase 415V Industrial connection verified");
        survB.setStatus(SurveyStatus.APPROVED);
        survB.setApprovedBy("Ganesh Moorthy");
        survB.setApprovalDate(LocalDate.now().minusDays(14).atStartOfDay());
        survB.setApprovalNotes("Approved for 5 kW industrial On-Grid system");
        survB = siteSurveyRepository.save(survB);

        Quotation quoteB = new Quotation();
        quoteB.setQuotationNumber("QT-00001");
        quoteB.setCustomer(custB);
        quoteB.setSiteSurvey(survB);
        quoteB.setSolarPackage(pkg5kOn);
        quoteB.setSystemType(SystemType.ON_GRID);
        quoteB.setCapacityKw(new BigDecimal("5.00"));
        quoteB.setSubtotal(new BigDecimal("260000.00"));
        quoteB.setTaxAmount(new BigDecimal("13000.00"));
        quoteB.setInstallationFee(new BigDecimal("22000.00"));
        quoteB.setTotalAmount(new BigDecimal("295000.00"));
        quoteB.setQuotationDate(LocalDate.now().minusDays(13));
        quoteB.setValidityDate(LocalDate.now().plusDays(17));
        quoteB.setStatus(QuotationStatus.ACCEPTED);
        quoteB.setNotes("Industrial package with 5 kW Three Phase Inverter");
        quoteB = quotationRepository.save(quoteB);

        // Add quotation items
        QuotationItem qi1 = new QuotationItem(quoteB, pPanel, 10, pPanel.getSellingPrice());
        QuotationItem qi2 = new QuotationItem(quoteB, pInv5k, 1, pInv5k.getSellingPrice());
        QuotationItem qi3 = new QuotationItem(quoteB, pController, 1, pController.getSellingPrice());
        QuotationItem qi4 = new QuotationItem(quoteB, pWiringBox, 2, pWiringBox.getSellingPrice());
        QuotationItem qi5 = new QuotationItem(quoteB, pCable, 100, pCable.getSellingPrice());
        QuotationItem qi6 = new QuotationItem(quoteB, pStands, 5, pStands.getSellingPrice());
        QuotationItem qi7 = new QuotationItem(quoteB, pEarthing, 2, pEarthing.getSellingPrice());
        quotationItemRepository.saveAll(Arrays.asList(qi1, qi2, qi3, qi4, qi5, qi6, qi7));

        SalesOrder orderB = new SalesOrder();
        orderB.setOrderNumber("ORD-00001");
        orderB.setCustomer(custB);
        orderB.setQuotation(quoteB);
        orderB.setSolarPackage(pkg5kOn);
        orderB.setSystemType(SystemType.ON_GRID);
        orderB.setCapacityKw(new BigDecimal("5.00"));
        orderB.setTotalAmount(new BigDecimal("295000.00"));
        orderB.setAdvanceRequired(new BigDecimal("59000.00"));
        orderB.setTotalPaid(new BigDecimal("295000.00")); // Paid in full
        orderB.setRemainingBalance(BigDecimal.ZERO);
        orderB.setOrderDate(LocalDate.now().minusDays(10));
        orderB.setStatus(OrderStatus.COMPLETED);
        orderB = salesOrderRepository.save(orderB);

        OrderItem oi1 = new OrderItem(orderB, pPanel, 10, pPanel.getSellingPrice());
        OrderItem oi2 = new OrderItem(orderB, pInv5k, 1, pInv5k.getSellingPrice());
        OrderItem oi3 = new OrderItem(orderB, pController, 1, pController.getSellingPrice());
        orderItemRepository.saveAll(Arrays.asList(oi1, oi2, oi3));

        // Advance payment + balance payment
        Payment payB1 = new Payment();
        payB1.setPaymentNumber("PAY-00001");
        payB1.setSalesOrder(orderB);
        payB1.setCustomer(custB);
        payB1.setAmount(new BigDecimal("100000.00"));
        payB1.setPaymentDate(LocalDate.now().minusDays(10));
        payB1.setMethod(PaymentMethod.BANK_TRANSFER);
        payB1.setType(PaymentType.ADVANCE);
        payB1.setReferenceNumber("NEFT-SBIN2026-90412");
        payB1.setStatus(PaymentStatus.SUCCESS);
        payB1.setNotes("Advance 34% transfer received");
        paymentRepository.save(payB1);

        Payment payB2 = new Payment();
        payB2.setPaymentNumber("PAY-00002");
        payB2.setSalesOrder(orderB);
        payB2.setCustomer(custB);
        payB2.setAmount(new BigDecimal("195000.00"));
        payB2.setPaymentDate(LocalDate.now().minusDays(5));
        payB2.setMethod(PaymentMethod.BANK_TRANSFER);
        payB2.setType(PaymentType.FULL);
        payB2.setReferenceNumber("RTGS-HDFC2026-44129");
        payB2.setStatus(PaymentStatus.SUCCESS);
        payB2.setNotes("Final balance settlement before handover");
        paymentRepository.save(payB2);

        // Serial number assignment & dispatch for orderB
        SerialNumber snInv5k = registerSerial("INV-GW-5K-INSTALLED-9901", pInv5k, "PO-2026-03", "Factory Site");
        snInv5k.setStatus(SerialNumberStatus.INSTALLED);
        snInv5k.setSalesOrder(orderB);
        snInv5k.setCustomer(custB);
        snInv5k.setDispatchDate(LocalDate.now().minusDays(6));
        snInv5k.setDeliveryDate(LocalDate.now().minusDays(5));
        serialNumberRepository.save(snInv5k);

        SerialNumber snCC = registerSerial("CC-MPPT-60A-INSTALLED-8801", pController, "PO-2026-06", "Factory Site");
        snCC.setStatus(SerialNumberStatus.INSTALLED);
        snCC.setSalesOrder(orderB);
        snCC.setCustomer(custB);
        snCC.setDispatchDate(LocalDate.now().minusDays(6));
        snCC.setDeliveryDate(LocalDate.now().minusDays(5));
        serialNumberRepository.save(snCC);

        Dispatch dispB = new Dispatch();
        dispB.setDispatchNumber("DSP-00001");
        dispB.setSalesOrder(orderB);
        dispB.setCustomer(custB);
        dispB.setStatus(DispatchStatus.DELIVERED);
        dispB.setDispatchDate(LocalDate.now().minusDays(6));
        dispB.setDeliveryDate(LocalDate.now().minusDays(5));
        dispB.setVehicleNumber("TN-38-BZ-4109");
        dispB.setDriverName("V. Murugan");
        dispB.setDriverPhone("9842199881");
        dispB = dispatchRepository.save(dispB);

        DispatchItem di1 = new DispatchItem(dispB, pInv5k, 1, snInv5k);
        DispatchItem di2 = new DispatchItem(dispB, pController, 1, snCC);
        DispatchItem di3 = new DispatchItem(dispB, pPanel, 10, null);
        dispatchItemRepository.saveAll(Arrays.asList(di1, di2, di3));

        // Warranties activated for orderB
        Warranty w1 = new Warranty();
        w1.setWarrantyNumber("WR-00001");
        w1.setSerialNumber(snInv5k);
        w1.setCustomer(custB);
        w1.setSalesOrder(orderB);
        w1.setProduct(pInv5k);
        w1.setDeliveryDate(LocalDate.now().minusDays(5));
        w1.setWarrantyStartDate(LocalDate.now().minusDays(5));
        w1.setWarrantyEndDate(LocalDate.now().minusDays(5).plusYears(2)); // 2 years
        w1.setDurationMonths(24);
        w1.setStatus(WarrantyStatus.ACTIVE);
        w1.setTermsAndConditions("2-year comprehensive manufacturer inverter warranty");
        warrantyRepository.save(w1);

        Warranty w2 = new Warranty();
        w2.setWarrantyNumber("WR-00002");
        w2.setCustomer(custB);
        w2.setSalesOrder(orderB);
        w2.setProduct(pPanel);
        w2.setDeliveryDate(LocalDate.now().minusDays(5));
        w2.setWarrantyStartDate(LocalDate.now().minusDays(5));
        w2.setWarrantyEndDate(LocalDate.now().minusDays(5).plusYears(20)); // 20 years
        w2.setDurationMonths(240);
        w2.setStatus(WarrantyStatus.ACTIVE);
        w2.setTermsAndConditions("20-year linear power output performance warranty");
        warrantyRepository.save(w2);

        // Installation record for orderB
        Installation instB = new Installation();
        instB.setInstallationNumber("INS-00001");
        instB.setSalesOrder(orderB);
        instB.setCustomer(custB);
        instB.setScheduledDate(LocalDate.now().minusDays(4));
        instB.setActualStartTime(LocalDate.now().minusDays(4).atTime(9, 0));
        instB.setActualFinishTime(LocalDate.now().minusDays(4).atTime(17, 30));
        instB.setInstalledCapacityKw(new BigDecimal("5.00"));
        instB.setPanelMountingConfirmed(true);
        instB.setWiringConfirmed(true);
        instB.setEarthingConfirmed(true);
        instB.setTestingPassed(true);
        instB.setTestingNotes("Peak noon generation measured 4.92 kW. Three-phase grid balance confirmed within 1.5% tolerance.");
        instB.setCustomerSigneeName("S. Natarajan (Plant Manager)");
        instB.setCustomerAcceptanceNote("Installation completed cleanly, generation confirmed on inverter digital display.");
        instB.setCustomerSignedAt(LocalDate.now().minusDays(4).atTime(17, 45));
        instB.setStatus(InstallationStatus.COMPLETED);
        instB = installationRepository.save(instB);

        InstallationTechnician it1 = new InstallationTechnician(instB, technicians.get(0), "Lead Electrician");
        it1.setHoursWorked(new BigDecimal("8.50"));
        it1.setPayoutAmount(new BigDecimal("2500.00"));
        InstallationTechnician it2 = new InstallationTechnician(instB, technicians.get(2), "Mounting Specialist");
        it2.setHoursWorked(new BigDecimal("8.50"));
        it2.setPayoutAmount(new BigDecimal("2100.00"));
        installationTechnicianRepository.saveAll(Arrays.asList(it1, it2));

        // Invoice for orderB
        Invoice invB = new Invoice();
        invB.setInvoiceNumber("INV-00001");
        invB.setSalesOrder(orderB);
        invB.setCustomer(custB);
        invB.setInvoiceDate(LocalDate.now().minusDays(10));
        invB.setDueDate(LocalDate.now().plusDays(5));
        invB.setSubtotal(new BigDecimal("282000.00")); // Hardware 260k + Installation 22k
        invB.setTaxAmount(new BigDecimal("13000.00"));
        invB.setTotalAmount(new BigDecimal("295000.00")); // Reconciled: 282k + 13k = 295k
        invB.setPaidAmount(new BigDecimal("295000.00"));
        invB.setBalanceAmount(BigDecimal.ZERO);
        invB.setStatus("PAID");
        invoiceRepository.save(invB);

        // Job Expenses for orderB
        Expense expB1 = new Expense();
        expB1.setExpenseNumber("EXP-00001");
        expB1.setCategory(ExpenseCategory.TECHNICIAN_PAYOUT);
        expB1.setSalesOrder(orderB);
        expB1.setAmount(new BigDecimal("4600.00"));
        expB1.setExpenseDate(LocalDate.now().minusDays(4));
        expB1.setTitle("Installation Crew Labour Payout");
        expB1.setDescription("Payout to Karthik and Selvakumar for job INS-00001");
        expB1.setPaidTo("Crew Lead");
        expB1.setPaymentMethod("Bank Transfer");
        expenseRepository.save(expB1);

        Expense expB2 = new Expense();
        expB2.setExpenseNumber("EXP-00002");
        expB2.setCategory(ExpenseCategory.TRANSPORT);
        expB2.setSalesOrder(orderB);
        expB2.setAmount(new BigDecimal("3500.00"));
        expB2.setExpenseDate(LocalDate.now().minusDays(6));
        expB2.setTitle("Logistics & Truck Freight to Tiruppur");
        expB2.setDescription("Transport of 10 panels and 5kW inverter to site");
        expB2.setPaidTo("FastFreight Logistics");
        expB2.setPaymentMethod("UPI");
        expenseRepository.save(expB2);

        // Sample Customer C: Breakdown / After-Sales Service Scenario (Meenakshi Sundaram)
        // Fault Code E04, Inverter Error, Covered by Valid Warranty!
        Customer custC = new Customer();
        custC.setFullName("Meenakshi Sundaram");
        custC.setPhone("9842556677");
        custC.setEmail("meenakshi.s@gmail.com");
        custC.setAddress("12, West Masi Street");
        custC.setCity("Madurai");
        custC.setPincode("625001");
        custC.setCustomerType(CustomerType.RESIDENTIAL);
        custC = customerRepository.save(custC);

        SerialNumber snBreakdown = registerSerial("INV-GW-3K-FAULTY-007", pInv3k, "PO-2025-08", "Customer Rooftop");
        snBreakdown.setStatus(SerialNumberStatus.INSTALLED);
        snBreakdown.setCustomer(custC);
        snBreakdown.setDispatchDate(LocalDate.now().minusMonths(6));
        snBreakdown.setDeliveryDate(LocalDate.now().minusMonths(6));
        serialNumberRepository.save(snBreakdown);

        Warranty wBreakdown = new Warranty();
        wBreakdown.setWarrantyNumber("WR-00003");
        wBreakdown.setSerialNumber(snBreakdown);
        wBreakdown.setCustomer(custC);
        wBreakdown.setSalesOrder(orderB); // Linked reference
        wBreakdown.setProduct(pInv3k);
        wBreakdown.setDeliveryDate(LocalDate.now().minusMonths(6));
        wBreakdown.setWarrantyStartDate(LocalDate.now().minusMonths(6));
        wBreakdown.setWarrantyEndDate(LocalDate.now().plusMonths(18)); // Valid for 18 more months!
        wBreakdown.setDurationMonths(24);
        wBreakdown.setStatus(WarrantyStatus.ACTIVE);
        wBreakdown.setTermsAndConditions("2-year manufacturer comprehensive warranty");
        wBreakdown = warrantyRepository.save(wBreakdown);

        ServiceTicket ticketBreakdown = new ServiceTicket();
        ticketBreakdown.setTicketNumber("TCK-00001");
        ticketBreakdown.setCustomer(custC);
        ticketBreakdown.setSerialNumber(snBreakdown);
        ticketBreakdown.setWarranty(wBreakdown);
        ticketBreakdown.setComplaintDescription("Customer reports inverter LCD display showing Error Code E04 and zero power generation since morning.");
        ticketBreakdown.setFaultCode("ERR-E04");
        ticketBreakdown.setReportedDate(LocalDate.now());
        ticketBreakdown.setAssignedTechnician(technicians.get(9)); // Muthukumar (Troubleshooting expert)
        ticketBreakdown.setStatus(TicketStatus.OPEN);
        ticketBreakdown.setUnderWarranty(true);
        ticketBreakdown.setLaborCharges(BigDecimal.ZERO);
        ticketBreakdown.setPartsCharges(BigDecimal.ZERO);
        ticketBreakdown.setTotalCustomerCharges(BigDecimal.ZERO);
        ticketBreakdown = serviceTicketRepository.save(ticketBreakdown);

        ServiceActivity sAct = new ServiceActivity(
                ticketBreakdown,
                "TICKET_OPENED",
                "Service ticket opened for Inverter E04 fault code. Verified active 2-year warranty (Expires " + wBreakdown.getWarrantyEndDate() + "). Covered 100% free of charge.",
                "Priya Nair (Support)"
        );
        serviceActivityRepository.save(sAct);
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

        Product pPanel = getOrCreateProduct("PANEL-MONO-540W", "Mono PERC Half-Cut 540W Solar Panel", catPanels, "Tier-1 540W Monocrystalline Module", "pcs", new BigDecimal("10500.00"), new BigDecimal("13200.00"), 180, 20, false, 240);
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
}
