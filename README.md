# Odoo Solar — Enterprise Solar EPC & Customer Web Platform

An end-to-end, production-grade Solar EPC (Engineering, Procurement, and Construction) platform comprising:
1. **`odoo-solar/`** — High-performance customer web application built with Next.js, featuring standardized 1kW to 5kW solar packages, on-grid & off-grid architecture guides, dynamic Google Apps Script enquiry dispatching, and embedded ERP access.
2. **`backend/`** — Robust Spring Boot 3 & MySQL 8 ERP backend powering 36 normalized relational entities, role-based access control, barcode scanning, automated BOM costing, and PM Surya Ghar subsidy tracking.
3. **`frontend/`** — High-speed Vite + React 19 + TypeScript + Tailwind CSS ERP operational dashboard.

---

## ⚡ Quick Start

### 1. Customer Web Application (`odoo-solar`)
```bash
cd odoo-solar
npm install
npm run dev
```
*Customer Web App runs on:* `http://localhost:3000`

### 2. ERP Backend Server (Spring Boot)
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```
*Backend runs on:* `http://localhost:8080`

### 3. ERP Frontend Application (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
*ERP Dashboard runs on:* `http://localhost:5173`

---

## 📂 Repository Structure

```
Odoo-Solar/
├── odoo-solar/              # Customer-Facing Next.js Web App
│   ├── src/                 # Certified 1kW-5kW Packages, On/Off-Grid Pages
│   ├── google-apps-script/  # Dynamic Google Apps Script Email Dispatcher
│   └── .env                 # Email TO & CC Configuration
├── backend/                 # Spring Boot ERP REST API & Services
│   └── src/main/java/com/sunpower/
└── frontend/                # Vite + React 19 ERP Operational Dashboard
    └── src/
```

---

## 👥 Persona Test Accounts & Quick Switcher

| Persona Role | Username | Password | Operational Access & Authority |
|---|---|---|---|
| **Managing Director** | `director` | `password123` | Full access, executive P&L dashboard, discount approvals (>10%), financial exports |
| **Sales Consultant** | `sales` | `password123` | Lead capture, site survey requests, package selection, quotation builder |
| **Warehouse Manager** | `warehouse` | `password123` | Hardware catalogue, stock receipts, serial barcode scanning, dispatch staging |
| **Lead Field Engineer** | `technician` | `password123` | Rooftop survey evaluations, installation checklists, commissioning sign-off |
| **Customer Support Lead** | `support` | `password123` | Breakdown desk, error code logging, warranty validation, customer sign-off |
| **Finance Controller** | `finance` | `password123` | Payment collection, GST invoices, direct job expense logging, PM Surya Ghar subsidies |
| **System Administrator** | `admin` | `password123` | System configuration, audit logs, user provisioning |

---

## 🚀 Verified Workable Deployment

All 3 components have been verified and confirmed functional:
- **Customer Portal**: Next.js on `http://localhost:3000`
- **Staff ERP Dashboard**: Vite + Vue 3 on `http://localhost:5173`
- **REST API & Services**: Spring Boot 3 on `http://localhost:8080`

---

## 📄 License
Proprietary software developed for **Odoo Solar System**. All rights reserved.
