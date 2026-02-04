@echo off
REM Check if Laragon MySQL directory exists
setlocal enabledelayedexpansion

echo Exporting database...
echo.

REM Try to find MySQL bin directory
set "MYSQL_BIN="

REM Check common Laragon MySQL paths
if exist "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqldump.exe" (
    set "MYSQL_BIN=C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin"
) else if exist "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqldump.exe" (
    set "MYSQL_BIN=C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin"
) else if exist "C:\laragon\bin\mysql\mysql-8.0.28-winx64\bin\mysqldump.exe" (
    set "MYSQL_BIN=C:\laragon\bin\mysql\mysql-8.0.28-winx64\bin"
) else if exist "C:\laragon\bin\mysql\mysql-5.7.33-winx64\bin\mysqldump.exe" (
    set "MYSQL_BIN=C:\laragon\bin\mysql\mysql-5.7.33-winx64\bin"
) else (
    echo Error: MySQL not found in Laragon directory
    echo Please check:
    echo 1. Laragon is installed at C:\laragon
    echo 2. MySQL is installed in Laragon
    pause
    exit /b 1
)

echo Found MySQL at: !MYSQL_BIN!
echo.

REM Run mysqldump
"!MYSQL_BIN!\mysqldump.exe" -u root project_management > "%CD%\database_backup.sql"

if %errorlevel% equ 0 (
    echo.
    echo Success! Database exported to: %CD%\database_backup.sql
) else (
    echo.
    echo Error: Failed to export database
    echo Please check:
    echo 1. Laragon MySQL is running
    echo 2. Database "pd_project_manager" exists
)
echo.
pause
