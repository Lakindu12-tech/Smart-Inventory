@echo off
echo ========================================
echo Database Backup Utility
echo ========================================
echo.

REM Create backup directory if not exists
if not exist "database-backups" mkdir database-backups

REM Get current date and time
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set DATE=%datetime:~0,8%
set TIME=%datetime:~8,6%

REM Create backup filename
set BACKUP_FILE=database-backups\backup_%DATE%_%TIME%.sql

echo Creating backup...
echo Filename: %BACKUP_FILE%
echo.

REM Run mysqldump
mysqldump -u root -plakindu smart_inventory > %BACKUP_FILE%

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Backup completed successfully!
    echo File: %BACKUP_FILE%
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERROR: Backup failed!
    echo Please check MySQL is running and password is correct
    echo ========================================
)

echo.
pause
