@echo off
echo ========================================
echo SD Bandara Trading - Inventory System
echo ========================================
echo.
echo Starting system...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js first from the installation package.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies... This may take a few minutes.
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

REM Build the project if not already built
if not exist ".next" (
    echo Building project for first time... This may take a few minutes.
    call npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Build failed!
        pause
        exit /b 1
    )
)

REM Start the system
echo.
echo ========================================
echo System is starting...
echo Please wait for "Ready on http://localhost:3000"
echo Then open your browser to: http://localhost:3000
echo.
echo To stop the system, close this window or press Ctrl+C
echo ========================================
echo.

call npm start

pause
