# start.ps1 - local backend launcher
# Use a JWT secret with at least 32 bytes (256 bits) or the app will fail on startup.

$env:JWT_SECRET = "this-is-a-minimum-32-byte-long-secret-key-for-hs256!"
$env:DB_URL = "jdbc:postgresql://localhost:5434/community_dev"
$env:DB_USERNAME = "community_dev"
$env:DB_PASSWORD = "community_dev_pass"
$env:MINIO_ENDPOINT = "http://localhost:9000"
$env:MINIO_ACCESS_KEY = "minioadmin"
$env:MINIO_SECRET_KEY = "minioadmin"

Set-Location -LiteralPath "$PSScriptRoot\backend"
./mvnw spring-boot:run
