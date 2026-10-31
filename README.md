# SunPower Solutions – Solar Installation Management System (ERP)

A production-grade, full-stack Enterprise Resource Planning (ERP) and operations management system designed for growing rooftop solar EPC (Engineering, Procurement, and Construction) companies. Built to manage 40+ concurrent rooftop installations per month with strict real-world business constraints, zero disconnected CRUDs, and automated cross-departmental lifecycle enforcement.

---

## ☀️ System Overview & Core Business Flows

The platform serves as the digital operational backbone of **SunPower Solutions**, eliminating spreadsheet chaos, unauthorized quoting, inventory leakage, warranty disputes, and untracked project costs across 10 interconnected operational stages:

```
[Customer Enquiry] 
       │
       ▼
[Site Survey Assessment] ──(Approval Gate: Roof Area, Shading, Tilt, Grid)──┐
                                                                            │
       ┌────────────────────────────────────────────────────────────────────┘
       ▼
[Dynamic BOM & Quotation] ──(Discount Approval Gate: >10% Requires Director)
       │
       ▼
[Order Confirmation] ──(Advance Payment Gate: ≥30% Required to Proceed)
       │
       ▼
[Inventory Allocation] ──(Stock Hard-Reservation: In-Stock vs Reserved Tracking)
       │
       ▼
[Dispatch & Picking List] ──(Mandatory Barcode/Serial Scanning for Inverters/Batteries)
       │
       ▼
[Delivery Confirmation] ──(Automatic Warranty Activation: 20-Yr Panels / 2-Yr Inverters)
       │
       ▼
[Installation & Crew Dispatch] ──(15-Technician Skill Matching & Mobile Sign-Off)
       │
       ▼
[Testing & Commissioning] ──(Digital Customer Handover & Net-Meter Inspection)
       │
       ├──► [After-Sales Service Desk] ──(Serial Lookup: Free In-Warranty vs Paid Repair)
       │
       └──► [Job Profitability Ledger] ──(Realized Margin: Revenue − Hardware − Labor − Expenses)
```

---

## 🚀 Running the Application

### Prerequisites
- **Java 17+** (JDK 17 or higher)
- **Maven 3.8+**
- **Node.js 18+** & **npm**
- **MySQL 8.0+** running on `localhost:3306` with database `solar_db`

### 1. Database Setup
```bash
# Connect to MySQL and create the database (if not already created)
mysql -u root -e "CREATE DATABASE IF NOT EXISTS solar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. Backend Server (Spring Boot)
The backend automatically runs schema migrations and seeds default personas, product catalogues, solar packages with BOMs, 15 skilled technicians, and 3 realistic active scenarios.
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```
*Backend runs on:* `http://localhost:8080`

### 3. Frontend Application (Vite + React 19 + TypeScript + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on:* `http://localhost:5173` (with built-in API proxy to port 8080)

---

## 👥 Persona Test Accounts & Quick Switcher

For seamless evaluation, default accounts with password **`password123`** are pre-configured. The top navigation bar in the UI features an evaluator toolbar with a **1-click Role Switcher**:

| Persona Role | Username | Password | Operational Access & Authority |
|---|---|---|---|
| **Managing Director** | `director` | `password123` | Full access, executive P&L dashboard, discount approvals (>10%), financial exports |
| **Sales Consultant** | `sales` | `password123` | Lead capture, site survey requests, package selection, quotation builder |
| **Warehouse Manager** | `warehouse` | `password123` | Hardware catalogue, stock receipts, serial barcode scanning, dispatch staging |
| **Lead Field Engineer** | `technician` | `password123` | Rooftop survey evaluations, installation checklists, commissioning sign-off |
| **Customer Support Lead** | `support` | `password123` | Breakdown desk, error code logging (e.g. E04), warranty validation, customer sign-off |
| **Finance Controller** | `finance` | `password123` | Payment collection, GST invoices, direct job expense logging, PM Surya Ghar subsidies |
| **System Administrator** | `admin` | `password123` | System configuration, audit logs, user provisioning |

---

## 🛠️ Technology Stack

### Backend
- **Framework:** Spring Boot 3.4.3
- **Language:** Java 17
- **Security:** Spring Security 6 with stateless JWT authentication & BCrypt password hashing
- **Persistence:** Spring Data JPA / Hibernate 6 with MySQL 8 dialect
- **Validation:** Jakarta Bean Validation (Hibernate Validator)
- **File Handling:** Multipart upload with sanitized local storage and public URL mapping (`/uploads/**`)

### Frontend
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS v4 with custom Solar EPC design tokens (Emerald / Solar Amber / Slate)
- **Routing:** React Router v7 with protected routes and role-aware navigation
- **Charts:** Recharts (Monthly Revenue vs Cost vs Profit, System Capacity Distribution)
- **Icons:** Lucide React
- **API Client:** Axios with JWT request interceptor and automatic 401 redirection

### Database
- **Engine:** MySQL 8
- **Tables:** 36 normalized relational tables with foreign key constraints, composite indexes, and audit trails.

---

## 🔒 Crucial Business Rules & Architecture Enforcement

1. **Strict Technical Gate for Quotations:**
   A quotation **cannot** be generated or approved for a customer without an **approved Site Survey** (`SiteSurvey.status == APPROVED`). The roof area, orientation, shading assessment, and grid suitability must be verified on site by a technician.

2. **Database-Driven Bill of Materials (BOM):**
   Packages (1 kW – 5 kW On-Grid & Off-Grid) calculate raw hardware costs directly from the relational `package_bom` table linked to live inventory item purchase prices.

3. **Advance Payment Order Lock:**
   A quotation conversion requires a recorded advance payment (default 30% of order value) before an order moves to `CONFIRMED` and reserves inventory.

4. **Serialized Inventory Tracking:**
   Every serialized component (Inverters, Lithium/Tubular Batteries, High-efficiency PV modules) has unique serial tracking in `serial_numbers` and an audit trail in `serial_number_history`. Barcodes must be scanned/verified during picking before a dispatch can be released.

5. **Automatic Warranty Activation on Delivery:**
   When a dispatch is marked `DELIVERED`, the system automatically generates legal warranty certificates in `warranties` with start date = delivery date (20 years for Solar PV Panels, 2 years for Inverters & Batteries).

6. **Warranty-Aware Service Desk:**
   When logging breakdown tickets (`ServiceTicket`), searching by serial number automatically verifies active warranty status:
   - **Under Warranty:** Replacement parts and labor charges are locked to **₹0**.
   - **Out of Warranty:** Parts and labor charges are billed to the customer.
   - **Customer Confirmation Gate:** A service ticket **cannot** be closed until the customer's satisfaction confirmation is logged.

7. **Job-Wise Profitability Ledger:**
   The financial engine tracks real-time profitability per solar installation:
   $$\text{Net Profit} = \text{Revenue Received} - (\text{Hardware BOM Cost} + \text{Technician Labor Payout} + \text{Direct Site Expenses})$$
   Calculates gross profit margin percentage and flags jobs under the company's 25% target margin.

8. **Government Subsidy Pipeline:**
   Tracks **PM Surya Ghar Muft Bijli Yojana** national portal registration numbers, sanction status, and Direct Benefit Transfer (DBT) disbursement milestones.

---

## 📁 Repository Structure

```
Solar/
├── backend/
│   ├── src/main/java/com/sunpower/
│   │   ├── config/          # SecurityConfig, WebConfig, JwtTokenProvider
│   │   ├── controller/      # 19 REST Controllers (Auth, Enquiries, Surveys, Quotes, Orders, etc.)
│   │   ├── dto/             # Request & Response DTOs with validation annotations
│   │   ├── entity/          # 36 JPA Entities with relational mappings
│   │   ├── repository/      # 36 Spring Data JPA Repositories
│   │   └── service/         # Domain Services with transactional business logic & DataInitializationService
│   ├── src/main/resources/
│   │   ├── application.yml  # Database, JWT, JPA, and Upload configuration
│   │   └── schema.sql       # Complete 36-table DDL script
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client with JWT interceptor & URL normalization
│   │   ├── components/      # UI primitives, StatusBadges, Navbar (with role switcher), Sidebar, MainLayout
│   │   ├── context/         # AuthContext & persistent state
│   │   ├── pages/           # 11 Operational Workflow Pages:
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── EnquiriesPage.tsx
│   │   │   ├── SiteSurveysPage.tsx
│   │   │   ├── QuotationsPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── InventoryPage.tsx
│   │   │   ├── DispatchPage.tsx
│   │   │   ├── InstallationsPage.tsx
│   │   │   ├── WarrantyPage.tsx
│   │   │   ├── ServiceTicketsPage.tsx
│   │   │   └── FinancePage.tsx
│   │   ├── types/           # TypeScript domain definitions
│   │   ├── App.tsx          # Router configuration
│   │   ├── index.css        # Tailwind CSS & Print styles
│   │   └── main.tsx
│   ├── vite.config.ts       # Reverse proxy configuration
│   └── package.json
└── README.md
```

---

## 📄 License
Proprietary software developed for **SunPower Solutions**. All rights reserved.
