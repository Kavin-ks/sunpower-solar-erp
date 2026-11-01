-- =========================================================================
-- SUNPOWER SOLUTIONS: SOLAR INSTALLATION MANAGEMENT SYSTEM
-- Relational Database Schema (MySQL 8)
-- =========================================================================

CREATE DATABASE IF NOT EXISTS solar_db;
USE solar_db;

-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_username (username)
) ENGINE=InnoDB;

-- User Roles Junction
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Customers
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    pincode VARCHAR(20),
    customer_type VARCHAR(30) NOT NULL DEFAULT 'RESIDENTIAL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_phone (phone),
    INDEX idx_customer_name (full_name)
) ENGINE=InnoDB;

-- 4. Technicians (Crew of 15)
CREATE TABLE IF NOT EXISTS technicians (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    skills VARCHAR(255),
    hourly_rate DECIMAL(10,2) DEFAULT 250.00,
    available BOOLEAN DEFAULT TRUE,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
) ENGINE=InnoDB;

-- 6. Products
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category_id BIGINT NOT NULL,
    description TEXT,
    unit VARCHAR(20) DEFAULT 'pcs',
    purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    current_stock INT NOT NULL DEFAULT 0,
    minimum_stock_level INT NOT NULL DEFAULT 5,
    serialized BOOLEAN DEFAULT FALSE,
    default_warranty_months INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prod_cat FOREIGN KEY (category_id) REFERENCES product_categories(id),
    INDEX idx_prod_code (product_code)
) ENGINE=InnoDB;

-- 7. Solar Packages (Configurable Templates 1kW to 5kW)
CREATE TABLE IF NOT EXISTS solar_packages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    system_type VARCHAR(30) NOT NULL,
    capacity_kw DECIMAL(4,2) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. Package BOM (Bill of Materials)
CREATE TABLE IF NOT EXISTS package_boms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    package_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    role_in_package VARCHAR(100),
    CONSTRAINT fk_bom_pkg FOREIGN KEY (package_id) REFERENCES solar_packages(id) ON DELETE CASCADE,
    CONSTRAINT fk_bom_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- 9. Enquiries
CREATE TABLE IF NOT EXISTS enquiries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    enquiry_number VARCHAR(30) UNIQUE,
    customer_id BIGINT NOT NULL,
    requested_capacity_kw DECIMAL(4,2) NOT NULL,
    system_type VARCHAR(30) NOT NULL,
    subsidy_required BOOLEAN DEFAULT FALSE,
    monthly_electricity_bill DECIMAL(10,2),
    shadow_free_area_sq_ft DECIMAL(8,2) NULL,
    grid_suitable BOOLEAN DEFAULT TRUE,
    source VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    status VARCHAR(30) NOT NULL DEFAULT 'NEW',
    assigned_to_user_id BIGINT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_enq_cust FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_enq_user FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 10. Enquiry Activities
CREATE TABLE IF NOT EXISTS enquiry_activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    enquiry_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    notes TEXT,
    performed_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ea_enq FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Site Surveys
CREATE TABLE IF NOT EXISTS site_surveys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    survey_number VARCHAR(30) UNIQUE,
    customer_id BIGINT NOT NULL,
    enquiry_id BIGINT,
    technician_id BIGINT,
    scheduled_date DATE,
    roof_direction VARCHAR(50),
    roof_tilt VARCHAR(30),
    available_roof_area_sq_ft DECIMAL(8,2),
    cable_distance_meters DECIMAL(6,2),
    shading_assessment VARCHAR(100),
    grid_suitability VARCHAR(100),
    survey_notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    approved_by VARCHAR(100),
    approval_date DATETIME,
    approval_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ss_cust FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_ss_enq FOREIGN KEY (enquiry_id) REFERENCES enquiries(id),
    CONSTRAINT fk_ss_tech FOREIGN KEY (technician_id) REFERENCES technicians(id)
) ENGINE=InnoDB;

-- 12. Survey Photos
CREATE TABLE IF NOT EXISTS survey_photos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    survey_id BIGINT NOT NULL,
    photo_url VARCHAR(255) NOT NULL,
    caption VARCHAR(100),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sp_survey FOREIGN KEY (survey_id) REFERENCES site_surveys(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Quotations
CREATE TABLE IF NOT EXISTS quotations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    quotation_number VARCHAR(30) UNIQUE,
    customer_id BIGINT NOT NULL,
    site_survey_id BIGINT NOT NULL,
    solar_package_id BIGINT,
    system_type VARCHAR(30) NOT NULL,
    capacity_kw DECIMAL(4,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    installation_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    quotation_date DATE,
    validity_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_qt_cust FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_qt_survey FOREIGN KEY (site_survey_id) REFERENCES site_surveys(id),
    CONSTRAINT fk_qt_pkg FOREIGN KEY (solar_package_id) REFERENCES solar_packages(id)
) ENGINE=InnoDB;

-- 14. Quotation Items
CREATE TABLE IF NOT EXISTS quotation_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    quotation_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_qi_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    CONSTRAINT fk_qi_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- 15. Sales Orders
CREATE TABLE IF NOT EXISTS sales_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(30) UNIQUE,
    customer_id BIGINT NOT NULL,
    quotation_id BIGINT NOT NULL,
    solar_package_id BIGINT,
    system_type VARCHAR(30) NOT NULL,
    capacity_kw DECIMAL(4,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    advance_required DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    remaining_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    order_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_so_cust FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_so_qt FOREIGN KEY (quotation_id) REFERENCES quotations(id),
    CONSTRAINT fk_so_pkg FOREIGN KEY (solar_package_id) REFERENCES solar_packages(id)
) ENGINE=InnoDB;

-- 16. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_oi_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- 17. Payments
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_number VARCHAR(30) UNIQUE,
    order_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE,
    method VARCHAR(30) NOT NULL DEFAULT 'BANK_TRANSFER',
    type VARCHAR(30) NOT NULL DEFAULT 'ADVANCE',
    status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    reference_number VARCHAR(100),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES sales_orders(id),
    CONSTRAINT fk_pay_cust FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

-- 18. Inventory Stocks
CREATE TABLE IF NOT EXISTS inventory_stocks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL UNIQUE,
    available_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    warehouse_location VARCHAR(100) DEFAULT 'Main Warehouse',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_is_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- 19. Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    movement_type VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    reference_number VARCHAR(50),
    notes TEXT,
    performed_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sm_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- 20. Serial Numbers
CREATE TABLE IF NOT EXISTS serial_numbers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    serial_code VARCHAR(100) NOT NULL UNIQUE,
    product_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_STOCK',
    warehouse_location VARCHAR(100),
    sales_order_id BIGINT,
    customer_id BIGINT,
    purchase_reference VARCHAR(50),
    dispatch_date DATE,
    delivery_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sn_prod FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_sn_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
    CONSTRAINT fk_sn_cust FOREIGN KEY (customer_id) REFERENCES customers(id),
    INDEX idx_sn_code (serial_code)
) ENGINE=InnoDB;

-- 21. Serial Number History
CREATE TABLE IF NOT EXISTS serial_number_histories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    serial_number_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    event_description VARCHAR(100) NOT NULL,
    location_or_recipient VARCHAR(100),
    recorded_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_snh_serial FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 22. Dispatches
CREATE TABLE IF NOT EXISTS dispatches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dispatch_number VARCHAR(30) UNIQUE,
    sales_order_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    dispatch_date DATE,
    delivery_date DATE,
    vehicle_number VARCHAR(100),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    dispatch_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_disp_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
    CONSTRAINT fk_disp_cust FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

-- 23. Dispatch Items
CREATE TABLE IF NOT EXISTS dispatch_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dispatch_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    serial_number_id BIGINT,
    CONSTRAINT fk_di_disp FOREIGN KEY (dispatch_id) REFERENCES dispatches(id) ON DELETE CASCADE,
    CONSTRAINT fk_di_prod FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_di_sn FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id)
) ENGINE=InnoDB;

-- 24. Warranties
CREATE TABLE IF NOT EXISTS warranties (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    warranty_number VARCHAR(30) UNIQUE,
    serial_number_id BIGINT UNIQUE,
    customer_id BIGINT NOT NULL,
    sales_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    delivery_date DATE,
    warranty_start_date DATE,
    warranty_end_date DATE,
    duration_months INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    terms_and_conditions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_war_sn FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id),
    CONSTRAINT fk_war_cust FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_war_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
    CONSTRAINT fk_war_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- 25. Installations
CREATE TABLE IF NOT EXISTS installations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    installation_number VARCHAR(30) UNIQUE,
    sales_order_id BIGINT NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    scheduled_date DATE,
    actual_start_time DATETIME,
    actual_finish_time DATETIME,
    installed_capacity_kw DECIMAL(4,2),
    panel_mounting_confirmed BOOLEAN DEFAULT FALSE,
    wiring_confirmed BOOLEAN DEFAULT FALSE,
    earthing_confirmed BOOLEAN DEFAULT FALSE,
    testing_passed BOOLEAN DEFAULT FALSE,
    testing_notes VARCHAR(255),
    customer_acceptance_note TEXT,
    customer_signee_name VARCHAR(100),
    customer_signature_url LONGTEXT,
    customer_signed_at DATETIME,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    work_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inst_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
    CONSTRAINT fk_inst_cust FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

-- 26. Installation Technicians (Crew Junction)
CREATE TABLE IF NOT EXISTS installation_technicians (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    installation_id BIGINT NOT NULL,
    technician_id BIGINT NOT NULL,
    role_in_crew VARCHAR(100),
    hours_worked DECIMAL(5,2) DEFAULT 0.00,
    payout_amount DECIMAL(10,2) DEFAULT 0.00,
    CONSTRAINT fk_it_inst FOREIGN KEY (installation_id) REFERENCES installations(id) ON DELETE CASCADE,
    CONSTRAINT fk_it_tech FOREIGN KEY (technician_id) REFERENCES technicians(id)
) ENGINE=InnoDB;

-- 27. Installation Photos
CREATE TABLE IF NOT EXISTS installation_photos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    installation_id BIGINT NOT NULL,
    photo_url VARCHAR(255) NOT NULL,
    stage VARCHAR(100),
    caption VARCHAR(255),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ip_inst FOREIGN KEY (installation_id) REFERENCES installations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 28. Service Tickets
CREATE TABLE IF NOT EXISTS service_tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(30) UNIQUE,
    customer_id BIGINT NOT NULL,
    serial_number_id BIGINT,
    installation_id BIGINT,
    warranty_id BIGINT,
    complaint_description TEXT NOT NULL,
    fault_code VARCHAR(50),
    reported_date DATE,
    assigned_technician_id BIGINT,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    under_warranty BOOLEAN DEFAULT TRUE,
    labor_charges DECIMAL(10,2) DEFAULT 0.00,
    parts_charges DECIMAL(10,2) DEFAULT 0.00,
    total_customer_charges DECIMAL(10,2) DEFAULT 0.00,
    diagnosis_notes TEXT,
    resolution_notes TEXT,
    customer_confirmed BOOLEAN DEFAULT FALSE,
    customer_confirmed_at DATETIME,
    customer_confirmation_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_st_cust FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_st_sn FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id),
    CONSTRAINT fk_st_inst FOREIGN KEY (installation_id) REFERENCES installations(id),
    CONSTRAINT fk_st_war FOREIGN KEY (warranty_id) REFERENCES warranties(id),
    CONSTRAINT fk_st_tech FOREIGN KEY (assigned_technician_id) REFERENCES technicians(id)
) ENGINE=InnoDB;

-- 29. Service Activities
CREATE TABLE IF NOT EXISTS service_activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    performed_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sa_ticket FOREIGN KEY (ticket_id) REFERENCES service_tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 30. Service Parts
CREATE TABLE IF NOT EXISTS service_parts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    covered_by_warranty BOOLEAN DEFAULT TRUE,
    final_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_spart_ticket FOREIGN KEY (ticket_id) REFERENCES service_tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_spart_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- 31. Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    expense_number VARCHAR(30) UNIQUE,
    category VARCHAR(30) NOT NULL,
    sales_order_id BIGINT,
    service_ticket_id BIGINT,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    paid_to VARCHAR(100),
    payment_method VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exp_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
    CONSTRAINT fk_exp_ticket FOREIGN KEY (service_ticket_id) REFERENCES service_tickets(id)
) ENGINE=InnoDB;

-- 32. Technician Payments
CREATE TABLE IF NOT EXISTS technician_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_number VARCHAR(30) UNIQUE,
    technician_id BIGINT NOT NULL,
    installation_id BIGINT,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE,
    hours_counted DECIMAL(5,2),
    payment_method VARCHAR(50),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tp_tech FOREIGN KEY (technician_id) REFERENCES technicians(id),
    CONSTRAINT fk_tp_inst FOREIGN KEY (installation_id) REFERENCES installations(id)
) ENGINE=InnoDB;

-- 33. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(30) UNIQUE,
    sales_order_id BIGINT NULL,
    service_ticket_id BIGINT NULL,
    customer_id BIGINT NOT NULL,
    invoice_date DATE,
    due_date DATE,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    balance_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'ISSUED',
    gstin VARCHAR(50) DEFAULT '33AAACS1234F1Z5',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
    CONSTRAINT fk_inv_ticket FOREIGN KEY (service_ticket_id) REFERENCES service_tickets(id),
    CONSTRAINT fk_inv_cust FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

-- 34. Subsidy Applications
CREATE TABLE IF NOT EXISTS subsidy_applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(30) UNIQUE,
    customer_id BIGINT NOT NULL,
    sales_order_id BIGINT NOT NULL,
    national_portal_reg_number VARCHAR(100),
    subsidy_amount_claimed DECIMAL(10,2) DEFAULT 0.00,
    subsidy_amount_approved DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    submission_date DATE,
    approval_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sub_cust FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_sub_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id)
) ENGINE=InnoDB;

-- 35. Purchases
CREATE TABLE IF NOT EXISTS purchases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    purchase_number VARCHAR(30) UNIQUE,
    supplier_name VARCHAR(150) NOT NULL,
    purchase_date DATE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 36. Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    purchase_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_pi_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    CONSTRAINT fk_pi_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- =========================================================================
-- Safe Incremental Schema Additions
-- =========================================================================
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 250.00;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS shadow_free_area_sq_ft DECIMAL(8,2) NULL;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS grid_suitable BOOLEAN DEFAULT TRUE;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS customer_signature_url LONGTEXT NULL;
ALTER TABLE invoices MODIFY COLUMN sales_order_id BIGINT NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS service_ticket_id BIGINT NULL;


-- Customer Portal: Link customers to user accounts (nullable for backward compatibility)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id BIGINT NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state VARCHAR(50) NULL DEFAULT 'Tamil Nadu';
ALTER TABLE customers ADD INDEX IF NOT EXISTS idx_customer_user_id (user_id);

-- Customer Portal: Seed ROLE_CUSTOMER into roles table if not present
INSERT IGNORE INTO roles (name) VALUES ('ROLE_CUSTOMER');
