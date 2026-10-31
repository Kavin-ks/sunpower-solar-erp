@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   SunPower Solar ERP - Universal Application Launcher
echo ========================================================
echo.

REM 1. Check if Docker is running
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Docker daemon detected and running!
    echo [INFO] Starting all 4 containers via Docker Compose:
    echo        - MySQL 8.0 (Port 3306)
    echo        - Spring Boot Backend (Port 8080)
    echo        - React/Vite Staff Dashboard (Port 5173)
    echo        - Next.js Odoo-Solar Customer Portal (Port 3000)
    echo.
    docker compose up --build
    exit /b %errorlevel%
)

echo [NOTICE] Docker is not currently running. Switching to Native Multi-Service Mode...
echo.

REM 2. Check Database availability on port 3306
netstat -ano | findstr :3306 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Local MySQL service detected on port 3306.
    set "DB_ENV_FLAG="
) else (
    echo [INFO] No local MySQL detected on port 3306.
    echo [INFO] Enabling zero-configuration embedded in-memory database with automatic schema initialization...
    set "DB_URL=jdbc:h2:mem:solar_db;DB_CLOSE_DELAY=-1;MODE=MySQL;DATABASE_TO_LOWER=TRUE"
    set "SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.h2.Driver"
    set "SPRING_SQL_INIT_MODE=never"
    set "DB_USERNAME=sa"
    set "DB_PASSWORD="
    set "SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT=org.hibernate.dialect.H2Dialect"
)

REM 3. Launch Spring Boot Backend
echo.
echo [1/3] Starting Spring Boot Backend API on port 8080...
start "SunPower Backend (Port 8080)" cmd /k "cd /d %~dp0backend && mvnw.cmd spring-boot:run"

REM 4. Launch Staff ERP Dashboard
echo [2/3] Starting React + Vite Staff ERP on port 5173...
start "SunPower Staff ERP (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

REM 5. Launch Odoo-Solar Customer Portal
echo [3/3] Starting Odoo-Solar Next.js Customer Portal on port 3000...
start "SunPower Customer Portal (Port 3000)" cmd /k "cd /d %~dp0odoo-solar && npm run dev"

echo.
echo ========================================================
echo   All 3 services launched in separate windows!
echo   - Customer Portal: http://localhost:3000
echo   - Staff Dashboard: http://localhost:5173
echo   - REST API Docs:   http://localhost:8080
echo ========================================================
echo.
pause

