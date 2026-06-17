@echo off
cd /d "C:\Users\singh\OneDrive\Desktop\community\backend"
set DB_USERNAME=community_user
set DB_PASSWORD=community_pass
set DB_URL=jdbc:postgresql://localhost:5434/community_db
set JWT_SECRET=change-me-at-least-32-chars-long!
set ENCRYPTION_SECRET=change-me-at-least-32-chars-long!
call mvnw.cmd spring-boot:run
