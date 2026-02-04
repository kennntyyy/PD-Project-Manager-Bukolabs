#!/bin/bash
echo "Exporting database..."
cd /c/laragon/bin/mysql/mysql-8.4.3-winx64/bin
./mysqldump.exe -u root project_management > "/c/Users/Admin/Documents/PD-Project-Manager-Bukolabs/database_backup.sql"
if [ $? -eq 0 ]; then
    echo "Database exported successfully to database_backup.sql"
else
    echo "Error exporting database. Please check if MySQL is running."
fi
