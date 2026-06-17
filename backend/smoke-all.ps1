param([string]$JarPath)

$base = "http://localhost:8080/api"
$ct = "application/json"

# Start server with UseShellExecute=$false, no IO redirect, env vars directly
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "java.exe"
$psi.Arguments = "-jar `"$JarPath`""
$psi.WorkingDirectory = Split-Path $JarPath -Parent
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$psi.RedirectStandardOutput = $false
$psi.RedirectStandardError = $false
$psi.EnvironmentVariables["DB_USERNAME"] = "community_user"
$psi.EnvironmentVariables["DB_PASSWORD"] = "community_pass"
$psi.EnvironmentVariables["DB_URL"] = "jdbc:postgresql://localhost:5434/community_db"
$psi.EnvironmentVariables["JWT_SECRET"] = "change-me-at-least-32-chars-long!"
$psi.EnvironmentVariables["ENCRYPTION_SECRET"] = "change-me-at-least-32-chars-long!"

$server = [System.Diagnostics.Process]::Start($psi)
Write-Host "Server PID: $($server.Id)"

# Wait for ready
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest -Uri "$base/auth/me" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 401) { $ready = $true; break }
    } catch {}
}
if (-not $ready) { Write-Host "Server not ready after 60s"; try { $server.Kill() } catch {}; exit 1 }
Write-Host "Server READY"

$s = Get-Random -Maximum 99999
$u1 = "s${s}a"; $u2 = "s${s}b"
$pw = "Pass1234!"

function body($o) { return ($o | ConvertTo-Json -Compress) }

try {
    Write-Host "1. Register user1"
    $r1 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -ContentType $ct -Body (body @{username=$u1; email="${u1}@t.com"; password=$pw})

    Write-Host "2. Register user2"
    $r2 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -ContentType $ct -Body (body @{username=$u2; email="${u2}@t.com"; password=$pw})
    $uid2 = $r2.userId

    Write-Host "3. Login user1"
    $l1 = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType $ct -Body (body @{username=$u1; password=$pw}) -SessionVariable s1

    Write-Host "4. Create post"
    $p = Invoke-RestMethod -Uri "$base/posts" -Method Post -ContentType $ct -Body (body @{title="Smoke"; content="Test"}) -WebSession $s1
    $pid = $p.id

    Write-Host "5. Post comment"
    $c = Invoke-RestMethod -Uri "$base/posts/$pid/comments" -Method Post -ContentType $ct -Body (body @{content="Hello"}) -WebSession $s1
    if (-not $c.id) { throw "No comment id" }
    Write-Host "   comment id=$($c.id) authorId=$($c.authorId)"

    Write-Host "6. Get comments: $((Invoke-RestMethod -Uri "$base/posts/$pid/comments" -WebSession $s1).totalElements)"

    Write-Host "7. Login user2"
    $l2 = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType $ct -Body (body @{username=$u2; password=$pw}) -SessionVariable s2

    Write-Host "8. user1 follows user2"
    Invoke-RestMethod -Uri "$base/users/$uid2/follow" -Method Post -WebSession $s1

    Write-Host "9. Follow counts: $((Invoke-RestMethod -Uri "$base/users/$uid2/follow-counts").followersCount)"

    Write-Host "10. Notifications for user2"
    $ns = Invoke-RestMethod -Uri "$base/notifications" -WebSession $s2
    if ($ns.totalElements -lt 1) { throw "No notifications" }
    Write-Host "    type=$($ns.content[0].type) msg=$($ns.content[0].message)"

    Write-Host "11. Unread count: $((Invoke-RestMethod -Uri "$base/notifications/unread-count" -WebSession $s2).count)"

    Write-Host "12. Mark all read"
    Invoke-RestMethod -Uri "$base/notifications/read-all" -Method Put -WebSession $s2
    $ur = Invoke-RestMethod -Uri "$base/notifications/unread-count" -WebSession $s2
    if ($ur.count -ne 0) { throw "Unread not 0 after mark-all" }
    Write-Host "    unread=$($ur.count)"

    Write-Host "13. Mark one notification read"
    $ns2 = Invoke-RestMethod -Uri "$base/notifications" -WebSession $s2
    if ($ns2.totalElements -gt 0) { Invoke-RestMethod -Uri "$base/notifications/$($ns2.content[0].id)/read" -Method Put -WebSession $s2 }

    Write-Host "14. Unfollow"
    Invoke-RestMethod -Uri "$base/users/$uid2/follow" -Method Delete -WebSession $s1

    Write-Host "15. isFollowing: $((Invoke-RestMethod -Uri "$base/users/$uid2/is-following" -WebSession $s1).isFollowing)"

    Write-Host "16. Re-follow"
    Invoke-RestMethod -Uri "$base/users/$uid2/follow" -Method Post -WebSession $s1

    Write-Host "17. Followers list: $((Invoke-RestMethod -Uri "$base/users/$uid2/followers").totalElements)"

    Write-Host "18. Following list: $((Invoke-RestMethod -Uri "$base/users/$($l1.userId)/following" -WebSession $s1).totalElements)"

    Write-Host ""
    Write-Host "*** ALL 18 PHASE 4 SMOKE TESTS PASSED ***"
} catch {
    Write-Host "FAILED: $_"
    try { $server.Kill() } catch {}
    exit 1
}

try { $server.Kill() } catch {}
exit 0
