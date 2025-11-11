@echo off
echo ========================================
echo SD Bandara Trading - Stop System
echo ========================================
echo.
echo Stopping all Node.js processes...
echo.

taskkill /F /IM node.exe 2>nul

if %errorlevel% equ 0 (
    echo System stopped successfully!
) else (
    echo No running system found.
)

echo.
pause
