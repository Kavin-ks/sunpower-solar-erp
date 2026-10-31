#!/usr/bin/env bash
set -e

echo "========================================================"
echo "  SunPower Solar ERP - Universal Application Launcher"
echo "========================================================"
echo ""

# 1. Check if Docker is running
if docker info >/dev/null 2>&1; then
    echo "[INFO] Docker daemon detected and running!"
    echo "[INFO] Starting all 4 containers via Docker Compose..."
    docker compose up --build
    exit 0
fi

echo "[NOTICE] Docker is not running. Switching to Native Multi-Service Mode..."
echo ""

# 2. Check Database availability on port 3306
if nc -z localhost 3306 2>/dev/null || (echo >/dev/tcp/localhost/3306) 2>/dev/null; then
    echo "[OK] Local MySQL service detected on port 3306."
else
    echo "[INFO] No local MySQL detected on port 3306."
    echo "[INFO] Enabling zero-configuration embedded in-memory database..."
    export DB_URL="jdbc:h2:mem:solar_db;DB_CLOSE_DELAY=-1;MODE=MySQL;DATABASE_TO_LOWER=TRUE"
    export SPRING_DATASOURCE_DRIVER_CLASS_NAME="org.h2.Driver"
    export SPRING_SQL_INIT_MODE="never"
    export DB_USERNAME="sa"
    export DB_PASSWORD=""
    export SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT="org.hibernate.dialect.H2Dialect"
fi

# 3. Launch Backend
echo "[1/3] Starting Spring Boot Backend API on port 8080..."
(cd backend && ./mvnw spring-boot:run) &
BACKEND_PID=$!

# 4. Launch Staff Frontend
echo "[2/3] Starting React + Vite Staff ERP on port 5173..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# 5. Launch Customer Portal
echo "[3/3] Starting Odoo-Solar Customer Portal on port 3000..."
(cd odoo-solar && npm run dev) &
ODOO_PID=$!

echo ""
echo "========================================================"
echo "  All 3 services running in background!"
echo "  - Customer Portal: http://localhost:3000"
echo "  - Staff Dashboard: http://localhost:5173"
echo "  - REST API Docs:   http://localhost:8080"
echo "========================================================"
echo "Press Ctrl+C to stop all services."

trap "kill $BACKEND_PID $FRONTEND_PID $ODOO_PID 2>/dev/null || true" EXIT
wait
