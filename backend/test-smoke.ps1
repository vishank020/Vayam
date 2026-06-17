param($JarPath)

$base = "http://localhost:8080/api"
$contentType = "application/json"

function Log($msg) { Write-Output "$msg" }

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "java.exe"
$psi.Arguments = "-jar `"$JarPath`""
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true

$psi.EnvironmentVariables["DB_USERNAME"] = "community_user"
$psi.EnvironmentVariables["DB_PASSWORD"] = "community_pass"
$psi.EnvironmentVariables["DB_URL"] = "jdbc:postgresql://localhost:5434/community_db"
$psi.EnvironmentVariables["JWT_SECRET"] = "change-me-at-least-32-chars-long!"
$psi.EnvironmentVariables["ENCRYPTION_SECRET"] = "change-me-at-least-32-chars-long!"

$server = [System.Diagnostics.Process]::Start($psi)
Log "Server PID = $($server.Id)"

# Wait for server to be ready
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/me" -TimeoutSec 2 -SkipCertificateCheck -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 401 -or $r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
}
if (-not $ready) { Log "Server didn't start in time"; $server.Kill(); exit 1 }
Log "Server READY"

# Cleanup on exit
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -SupportEvent -Action { try { $server.Kill() } catch {} } | Out-Null

try {
    # 1. Register user1
    $r1 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -ContentType $contentType -Body '{"username":"smoke5","email":"smoke5@test.com","password":"Pass1234!"}'
    Log "1. user1: $($r1.username) ($($r1.userId))"

    # 2. Register user2
    $r2 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -ContentType $contentType -Body '{"username":"smoke6","email":"smoke6@test.com","password":"Pass1234!"}'
    Log "2. user2: $($r2.username) ($($r2.userId))"
    $user2Id = $r2.userId

    # 3. Login user1
    $login1 = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType $contentType -Body '{"username":"smoke5","password":"Pass1234!"}' -SessionVariable s1
    Log "3. user1 logged in"

    # 4. Create post
    $post = Invoke-RestMethod -Uri "$base/posts" -Method Post -ContentType $contentType -Body '{"title":"Smoke Post","content":"Phase 4 test"}' -WebSession $s1
    $postId = $post.id
    Log "4. Post: $postId"

    # 5. Comment on post
    $comment = Invoke-RestMethod -Uri "$base/posts/$postId/comments" -Method Post -ContentType $contentType -Body '{"content":"A test comment"}' -WebSession $s1
    Log "5. Comment: id=$($comment.id) authorId=$($comment.authorId)"

    # 6. Get comments
    $comments = Invoke-RestMethod -Uri "$base/posts/$postId/comments" -WebSession $s1
    Log "6. Comments: $($comments.totalElements)"

    # 7. Login user2
    $login2 = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType $contentType -Body '{"username":"smoke6","password":"Pass1234!"}' -SessionVariable s2
    Log "7. user2 logged in"

    # 8. Follow
    Invoke-RestMethod -Uri "$base/users/$user2Id/follow" -Method Post -WebSession $s1
    Log "8. Follow OK"

    # 9. Follow counts
    $counts = Invoke-RestMethod -Uri "$base/users/$user2Id/follow-counts"
    Log "9. followers=$($counts.followersCount) following=$($counts.followingCount)"
    if ($counts.followersCount -ne 1) { throw "Expected 1 follower" }

    # 10. Notifications
    $notifs = Invoke-RestMethod -Uri "$base/notifications" -WebSession $s2
    Log "10. Notifications: $($notifs.totalElements)"
    if ($notifs.totalElements -eq 0) { throw "Expected notifications" }
    Log "    => $($notifs.content[0].type): $($notifs.content[0].message)"

    # 11. Unread count
    $unread = Invoke-RestMethod -Uri "$base/notifications/unread-count" -WebSession $s2
    Log "11. Unread: $($unread.count)"
    if ($unread.count -eq 0) { throw "Expected unread > 0" }

    # 12. Mark one read
    if ($notifs.totalElements -gt 0) {
        Invoke-RestMethod -Uri "$base/notifications/$($notifs.content[0].id)/read" -Method Put -WebSession $s2
        Log "12. Marked read OK"
    }

    # 13. Mark all read
    Invoke-RestMethod -Uri "$base/notifications/read-all" -Method Put -WebSession $s2
    $unread2 = Invoke-RestMethod -Uri "$base/notifications/unread-count" -WebSession $s2
    Log "13. After mark-all-read: $($unread2.count)"
    if ($unread2.count -ne 0) { throw "Expected 0 unread" }

    # 14. Unfollow
    Invoke-RestMethod -Uri "$base/users/$user2Id/follow" -Method Delete -WebSession $s1
    Log "14. Unfollow OK"

    # 15. Is following
    $isf = Invoke-RestMethod -Uri "$base/users/$user2Id/is-following" -WebSession $s1
    Log "15. isFollowing: $($isf.isFollowing)"
    if ($isf.isFollowing -ne $false) { throw "Expected isFollowing=false" }

    # 16. Follow again
    Invoke-RestMethod -Uri "$base/users/$user2Id/follow" -Method Post -WebSession $s1
    Log "16. Re-follow OK"

    # 17. Get followers list
    $followers = Invoke-RestMethod -Uri "$base/users/$user2Id/followers"
    Log "17. Followers: $($followers.totalElements)"

    # 18. Get following list
    $following = Invoke-RestMethod -Uri "$base/users/$($login1.userId)/following" -WebSession $s1
    Log "18. Following: $($following.totalElements)"

    # 19. Delete comment
    $c = Invoke-RestMethod -Uri "$base/posts/$postId/comments" -WebSession $s1
    if ($c.totalElements -gt 0) {
        Invoke-RestMethod -Uri "$base/posts/$postId/comments/$($c.content[0].id)" -Method Delete -WebSession $s1
        Log "19. Comment deleted OK"
    }

    Log "`n*** ALL 19 PHASE 4 SMOKE TESTS PASSED ***"
} catch {
    Log "FAILED: $_"
    $server.Kill()
    exit 1
}

$server.Kill()
exit 0
