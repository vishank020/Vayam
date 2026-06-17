param([string]$JarPath)

$base = "http://localhost:8080/api"
$ct = "application/json"
$wd = Split-Path $JarPath -Parent

# Start server using cmd /c start /b (completely detached, no child process tracking)
$envVars = "set DB_USERNAME=community_user & set DB_PASSWORD=community_pass & set DB_URL=jdbc:postgresql://localhost:5434/community_db & set JWT_SECRET=change-me-at-least-32-chars-long! & set ENCRYPTION_SECRET=change-me-at-least-32-chars-long! & start /b java -jar `"$JarPath`""
Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c", $envVars -WorkingDirectory $wd
Write-Host "Server starting..."

# Wait for ready
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest -Uri "$base/auth/me" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 401) { $ready = $true; break }
    } catch {}
}
if (-not $ready) { Write-Host "Server not ready after 60s"; exit 1 }
Write-Host "Server READY"

$s = Get-Random -Maximum 99999
$u1 = "s${s}a"; $u2 = "s${s}b"
$pw = "Pass1234!"

function body($o) { return ($o | ConvertTo-Json -Compress) }

try {
    Write-Host "1. Register user1"
    $r1 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -ContentType $ct -Body (body @{username=$u1; email="${u1}@t.com"; password=$pw})
    Write-Host "   user1: $($r1.username) id=$($r1.userId)"

    Write-Host "2. Register user2"
    $r2 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -ContentType $ct -Body (body @{username=$u2; email="${u2}@t.com"; password=$pw})
    $uid2 = $r2.userId
    Write-Host "   user2: $($r2.username) id=$uid2"

    Write-Host "3. Login user1"
    $l1 = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType $ct -Body (body @{username=$u1; password=$pw}) -SessionVariable s1
    Write-Host "   OK"

    Write-Host "4. Create post"
    $p = Invoke-RestMethod -Uri "$base/posts" -Method Post -ContentType $ct -Body (body @{title="Smoke"; content="Test"}) -WebSession $s1
    $pid = $p.id
    Write-Host "   post id=$pid"

    Write-Host "5. Post comment"
    $c = Invoke-RestMethod -Uri "$base/posts/$pid/comments" -Method Post -ContentType $ct -Body (body @{content="Hello"}) -WebSession $s1
    if (-not $c.id) { throw "No comment id" }
    Write-Host "   comment id=$($c.id) authorId=$($c.authorId)"

    Write-Host "6. Get comments"
    $cCount = (Invoke-RestMethod -Uri "$base/posts/$pid/comments" -WebSession $s1).totalElements
    if ($cCount -lt 1) { throw "No comments returned" }
    Write-Host "   count=$cCount [OK]"

    Write-Host "7. Login user2"
    $l2 = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType $ct -Body (body @{username=$u2; password=$pw}) -SessionVariable s2
    Write-Host "   OK"

    Write-Host "8. user1 follows user2"
    Invoke-RestMethod -Uri "$base/users/$uid2/follow" -Method Post -WebSession $s1
    Write-Host "   [OK]"

    Write-Host "9. Follow counts"
    $fc = Invoke-RestMethod -Uri "$base/users/$uid2/follow-counts"
    if ($fc.followersCount -ne 1) { throw "followers=$($fc.followersCount)" }
    Write-Host "   followers=$($fc.followersCount) [OK]"

    Write-Host "10. user2 notifications"
    $ns = Invoke-RestMethod -Uri "$base/notifications" -WebSession $s2
    if ($ns.totalElements -lt 1) { throw "No notifications" }
    Write-Host "   total=$($ns.totalElements) first=$($ns.content[0].type) [OK]"

    Write-Host "11. Unread count"
    $ur = Invoke-RestMethod -Uri "$base/notifications/unread-count" -WebSession $s2
    if ($ur.count -lt 1) { throw "Unread=$($ur.count)" }
    Write-Host "   count=$($ur.count) [OK]"

    Write-Host "12. Mark all read"
    Invoke-RestMethod -Uri "$base/notifications/read-all" -Method Put -WebSession $s2
    $ur2 = Invoke-RestMethod -Uri "$base/notifications/unread-count" -WebSession $s2
    if ($ur2.count -ne 0) { throw "Unread after mark-all=$($ur2.count)" }
    Write-Host "   unread=$($ur2.count) [OK]"

    Write-Host "13. Mark one read"
    $ns2 = Invoke-RestMethod -Uri "$base/notifications" -WebSession $s2
    if ($ns2.totalElements -gt 0) {
        Invoke-RestMethod -Uri "$base/notifications/$($ns2.content[0].id)/read" -Method Put -WebSession $s2
        Write-Host "   [OK]"
    }

    Write-Host "14. Unfollow"
    Invoke-RestMethod -Uri "$base/users/$uid2/follow" -Method Delete -WebSession $s1
    Write-Host "   [OK]"

    Write-Host "15. isFollowing"
    $isf = Invoke-RestMethod -Uri "$base/users/$uid2/is-following" -WebSession $s1
    if ($isf.isFollowing -ne $false) { throw "isFollowing=$($isf.isFollowing)" }
    Write-Host "   isFollowing=$($isf.isFollowing) [OK]"

    Write-Host "16. Re-follow"
    Invoke-RestMethod -Uri "$base/users/$uid2/follow" -Method Post -WebSession $s1
    Write-Host "   [OK]"

    Write-Host "17. Followers list"
    $flw = Invoke-RestMethod -Uri "$base/users/$uid2/followers"
    if ($flw.totalElements -ne 1) { throw "Followers=$($flw.totalElements)" }
    Write-Host "   count=$($flw.totalElements) [OK]"

    Write-Host "18. Following list"
    $flg = Invoke-RestMethod -Uri "$base/users/$($l1.userId)/following" -WebSession $s1
    if ($flg.totalElements -ne 1) { throw "Following=$($flg.totalElements)" }
    Write-Host "   count=$($flg.totalElements) [OK]"

    Write-Host ""
    Write-Host "*** ALL 18 PHASE 4 SMOKE TESTS PASSED ***"
} catch {
    Write-Host ""
    Write-Host "FAILED: $_"
    exit 1
}

# Kill the server
netstat -ano | Select-String ":8080" | ForEach-Object { ($_ -split '\s+')[-1] } | Where-Object { $_ -ne "" } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
exit 0
