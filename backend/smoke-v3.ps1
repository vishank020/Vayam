$base = "http://localhost:8080/api"; $ct = "application/json"; $dir = "C:\Users\singh\OneDrive\Desktop\community\backend"
$log = Join-Path $dir "target\boot-smoke.log"

# Start via mvnw.cmd with env vars baked into a cmd /c wrapper
$cmd = @"
set DB_USERNAME=community_user
set DB_PASSWORD=community_pass
set DB_URL=jdbc:postgresql://localhost:5434/community_db
set JWT_SECRET=change-me-at-least-32-chars-long!
set ENCRYPTION_SECRET=change-me-at-least-32-chars-long!
cd /d "$dir"
call mvnw.cmd spring-boot:run > "$log" 2>&1
"@
$bat = Join-Path $dir "target\_run.bat"
$cmd | Out-File -FilePath $bat -Encoding ascii

Write-Host "Starting server via mvnw..."
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $bat
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$psi.WorkingDirectory = $dir
$p = [System.Diagnostics.Process]::Start($psi)
Write-Host "PID=$($p.Id)"

# Wait for server by watching the log
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 2
    if (Test-Path $log) {
        $content = Get-Content $log -Tail 3 -ErrorAction SilentlyContinue
        if ($content -match "Started CommunityApplication") { $ready = $true; break }
    }
}
if (-not $ready) { Write-Host "Server not ready"; try { $p.Kill() } catch {}; exit 1 }
Write-Host "Server READY"
Start-Sleep -Seconds 2

$s = Get-Random -Maximum 99999; $u1 = "s${s}a"; $u2 = "s${s}b"; $pw = "Pass1234!"
function body($o) { return ($o | ConvertTo-Json -Compress) }

# 0. Auth check
try { $ra = Invoke-WebRequest -Uri "$base/auth/me" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop; $sc = $ra.StatusCode } catch { if ($_.Exception.Response) { $sc = [int]$_.Exception.Response.StatusCode } else { throw } }
if ($sc -ne 401) { throw "Expected 401 got $sc" }; Write-Host "0. GET /api/auth/me (no auth) => $sc"

$r1 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -ContentType $ct -Body (body @{username=$u1; email="${u1}@t.com"; password=$pw}); Write-Host "1. Register user1: $($r1.username)"
$r2 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -ContentType $ct -Body (body @{username=$u2; email="${u2}@t.com"; password=$pw}); $uid2=$r2.userId; Write-Host "2. Register user2: $($r2.username)"
$l1 = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType $ct -Body (body @{username=$u1; password=$pw}) -SessionVariable s1; Write-Host "3. Login user1"
$pst = Invoke-RestMethod -Uri "$base/posts" -Method Post -ContentType $ct -Body (body @{title="Smoke"; content="Test"}) -WebSession $s1; $pid=$pst.id; Write-Host "4. Create post: $pid"
$c = Invoke-RestMethod -Uri "$base/posts/$pid/comments" -Method Post -ContentType $ct -Body (body @{content="Hello"}) -WebSession $s1
if (-not $c.id) { throw "No comment id" }; Write-Host "5. Post comment: $($c.id)"
$cs = (Invoke-RestMethod -Uri "$base/posts/$pid/comments" -WebSession $s1).totalElements; Write-Host "6. Get comments: $cs"
$l2 = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType $ct -Body (body @{username=$u2; password=$pw}) -SessionVariable s2; Write-Host "7. Login user2"
Invoke-RestMethod -Uri "$base/users/$uid2/follow" -Method Post -WebSession $s1; Write-Host "8. user1 follows user2"
$fc = Invoke-RestMethod -Uri "$base/users/$uid2/follow-counts"
if ($fc.followersCount -ne 1) { throw "followers=$($fc.followersCount)" }; Write-Host "9. Follow counts: $($fc.followersCount)"
$ns = Invoke-RestMethod -Uri "$base/notifications" -WebSession $s2
if ($ns.totalElements -lt 1) { throw "No notifications" }; Write-Host "10. Notifications: $($ns.totalElements)"
$ur = Invoke-RestMethod -Uri "$base/notifications/unread-count" -WebSession $s2
if ($ur.count -lt 1) { throw "No unread" }; Write-Host "11. Unread count: $($ur.count)"
Invoke-RestMethod -Uri "$base/notifications/read-all" -Method Put -WebSession $s2
$ur2 = Invoke-RestMethod -Uri "$base/notifications/unread-count" -WebSession $s2
if ($ur2.count -ne 0) { throw "Unread after mark-all=$($ur2.count)" }; Write-Host "12. Mark all read: $($ur2.count)"
Invoke-RestMethod -Uri "$base/users/$uid2/follow" -Method Delete -WebSession $s1; Write-Host "13. Unfollow"
$isf = Invoke-RestMethod -Uri "$base/users/$uid2/is-following" -WebSession $s1
if ($isf.isFollowing -ne $false) { throw "isFollowing=$($isf.isFollowing)" }; Write-Host "14. isFollowing: $($isf.isFollowing)"
Invoke-RestMethod -Uri "$base/users/$uid2/follow" -Method Post -WebSession $s1; Write-Host "15. Re-follow"
$flw = Invoke-RestMethod -Uri "$base/users/$uid2/followers"
if ($flw.totalElements -ne 1) { throw "followers=$($flw.totalElements)" }; Write-Host "16. Followers: $($flw.totalElements)"
$flg = Invoke-RestMethod -Uri "$base/users/$($l1.userId)/following" -WebSession $s1
if ($flg.totalElements -ne 1) { throw "following=$($flg.totalElements)" }; Write-Host "17. Following: $($flg.totalElements)"
Write-Host "`n*** ALL 18 PHASE 4 SMOKE TESTS PASSED ***"
try { $p.Kill() } catch {}
