$env:DB_USERNAME="community_user"
$env:DB_PASSWORD="community_pass"
$env:DB_URL="jdbc:postgresql://localhost:5434/community_db"
$env:JWT_SECRET="change-me-at-least-32-chars-long!"
$env:ENCRYPTION_SECRET="change-me-at-least-32-chars-long!"

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "cmd.exe"
$psi.Arguments = "/c mvnw.cmd spring-boot:run"
$psi.WorkingDirectory = "C:\Users\singh\OneDrive\Desktop\community\backend"
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true

$env.GetEnumerator() | ForEach-Object {
    try { $psi.EnvironmentVariables[$_.Key] = $_.Value } catch {}
}

$p = [System.Diagnostics.Process]::Start($psi)
Write-Output $p.Id
$p.WaitForExit()
