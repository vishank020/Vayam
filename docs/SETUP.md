# Setup Guide

## Prerequisites

- JDK 17+ (runtime Java 21)
- Node.js 20+ and npm
- Docker (recommended for PostgreSQL + MinIO)
- Maven wrapper (included in `backend/`)

---

## Infrastructure (Docker Compose — Recommended)

```bash
# Start PostgreSQL 16 + MinIO (S3-compatible storage)
docker compose up -d

# Verify both are healthy
docker compose ps

# MinIO Console: http://localhost:9001 (login: minioadmin / minioadmin)
```

> **PostgreSQL** runs on port `5434` (to avoid conflict with native PostgreSQL on port `5432`).  
> **MinIO** runs on ports `9000` (S3 API) and `9001` (web console).

### Stop everything

```bash
docker compose down
# Add -v to also delete volumes (wipes DB + uploads):
docker compose down -v
```

---

## Backend

Start the backend application by configuring the environment variables and running the Maven wrapper.

### Windows (PowerShell)
```powershell
cd backend
$env:DB_USERNAME="community_user"
$env:DB_PASSWORD="community_pass"
$env:DB_URL="jdbc:postgresql://localhost:5434/community_db"
$env:JWT_SECRET="change-me-at-least-32-chars-long!"
$env:ENCRYPTION_SECRET="change-me-at-least-32-chars-long!"
$env:GIPHY_API_KEY="" # Optional GIPHY API key
.\mvnw.cmd spring-boot:run
```

### Linux / macOS / Git Bash
```bash
cd backend
export DB_USERNAME="community_user"
export DB_PASSWORD="community_pass"
export DB_URL="jdbc:postgresql://localhost:5434/community_db"
export JWT_SECRET="change-me-at-least-32-chars-long!"
export ENCRYPTION_SECRET="change-me-at-least-32-chars-long!"
export GIPHY_API_KEY=""
./mvnw spring-boot:run
```

The API starts on `http://localhost:8080`. Flyway migrations run automatically on startup.

### Build JAR
```bash
# Windows
mvnw.cmd package
# Linux/macOS
./mvnw package
```

### Run as background process (Windows PowerShell)
```powershell
Start-Process -FilePath "java" -ArgumentList "-jar target\community-backend-0.0.1-SNAPSHOT.jar" -WindowStyle Hidden
```

---

## Frontend

Start the Angular client application.

```bash
cd frontend
npm install   # First time only to download dependencies
npm run start # Starts 'ng serve' development server
```

Opens at `http://localhost:4200`.

### Run as background process (Windows PowerShell)
```powershell
Start-Process -FilePath "powershell" -ArgumentList "-NoLogo -NoProfile -NonInteractive -Command npm run start" -WindowStyle Hidden
```

---

## Verify Everything Works

```bash
# 1. Register a user
curl.exe -X POST http://localhost:8080/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"Password123\"}"

# 2. Login
curl.exe -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"password\":\"Password123\"}"

# 3. Check auth state
curl.exe http://localhost:8080/api/auth/me

# 4. Open browser → http://localhost:4200
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_URL` | `jdbc:postgresql://localhost:5434/community_db` | PostgreSQL JDBC URL |
| `DB_USERNAME` | `community_user` | DB user |
| `DB_PASSWORD` | `community_pass` | DB password |
| `JWT_SECRET` | (required) | 256-bit+ secret for JWT signing |
| `ENCRYPTION_SECRET` | (required) | Secret for pgp_sym_encrypt at-rest encryption |
| `SPRING_PROFILES_ACTIVE` | (default) | Set to `dev` for debug SQL logging |
| `MINIO_ENDPOINT` | `http://localhost:9000` | MinIO S3 API endpoint |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | `minioadmin` | MinIO secret key |
| `MINIO_BUCKET` | `community` | Default storage bucket |

The `application.yml` has sensible defaults for local development. Override any value via environment variables for production.
