@echo off
setlocal

rem Usage: create_database.bat [user] [password] [host] [port]
set "DB_USER=%1"
if "%DB_USER%"=="" set "DB_USER=root"
set "DB_PASS=%2"
set "DB_HOST=%3"
if "%DB_HOST%"=="" set "DB_HOST=localhost"
set "DB_PORT=%4"
if "%DB_PORT%"=="" set "DB_PORT=3306"

if "%DB_PASS%"=="" (
  mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% < "%~dp0create_database.sql"
) else (
  mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% < "%~dp0create_database.sql"
)

if %ERRORLEVEL% EQU 0 (
  echo Database created (or already existed): project_management
) else (
  echo Failed to create database. Check MySQL is running and `mysql` is in PATH.
)
