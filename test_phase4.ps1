$ErrorActionPreference = "Stop"
$base = "http://localhost:8080/api"
$suff = Get-Random -Max 99999
$pw = "Pass1234!"
$jar = "C:\Users\singh\OneDrive\Desktop\community\backend\target\community-backend-0.0.1-SNAPSHOT.jar"

function b($o) { return ($o | ConvertTo-Json -Compress) }

# Start server as background job
$env:DB_USERNAME="community_user"
$env:DB_PASSWORD="community_pass"
$env:DB_URL="jdbc:postgresql://localhost:5434/community_db"
$env:JWT_SECRET="change-me-at-least-32-chars-long!"
$env:ENCRYPTION_SECRET="change-me-at-least-32-chars-long!"

$job = Start-Job -ScriptBlock {
    param($jar,$d,$u,$p,$url,$js,$es)
    $env:DB_USERNAME=$u; $env:DB_PASSWORD=$p; $env:DB_URL=$url; $env:JWT_SECRET=$js; $env:ENCRYPTION_SECRET=$es
    Set-Location "C:\Users\singh\OneDrive\Desktop\community\backend"
    java -jar $jar
} -ArgumentList $jar,"community_user","community_pass","jdbc:postgresql://localhost:5434/community_db","change-me-at-least-32-chars-long!","change-me-at-least-32-chars-long!"

# Wait for server
Write-Output "Waiting for server..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep 1
    try { $r = Invoke-WebRequest -Uri "$base/auth/me" -TimeoutSec 2 -UseBasicParsing; if ($r.StatusCode -eq 401) { $ready = $true; break } }
    catch { if ($_.Exception.Response.StatusCode -eq 401) { $ready = $true; break } }
}
if (-not $ready) { Write-Output "Server not ready"; exit 1 }
Write-Output "Ready."

# Register users
Write-Output "Register..."
$r1 = Invoke-RestMethod "$base/auth/register" -Method Post -ContentType "application/json" -Body (b @{username="ua${suff}"; email="ua${suff}@t.com"; password=$pw}) -SessionVariable s1
$r2 = Invoke-RestMethod "$base/auth/register" -Method Post -ContentType "application/json" -Body (b @{username="ub${suff}"; email="ub${suff}@t.com"; password=$pw}) -SessionVariable s2
Write-Output "A=$($r1.userId) B=$($r2.userId)"

# === FOLLOW TESTS ===
Write-Output "`n--- ORIG follow A->B ---"
try { $r = Invoke-WebRequest "$base/users/$($r2.userId)/follow" -Method Post -WebSession $s1 -UseBasicParsing -ErrorAction Stop; Write-Output "OK $($r.StatusCode)" }
catch { $sc=[int]$_.Exception.Response.StatusCode; $msg=""; try{$reader=New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream());$msg=$reader.ReadToEnd();$reader.Close()}catch{}; Write-Output "$sc $msg" }

Write-Output "`n--- ALT follow A->B (/api/users/follow/{userId}) ---"
try { $r = Invoke-WebRequest "$base/users/follow/$($r2.userId)" -Method Post -WebSession $s1 -UseBasicParsing -ErrorAction Stop; Write-Output "OK $($r.StatusCode)" }
catch { $sc=[int]$_.Exception.Response.StatusCode; $msg=""; try{$reader=New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream());$msg=$reader.ReadToEnd();$reader.Close()}catch{}; Write-Output "$sc $msg" }

Write-Output "`n--- ORIG self-follow ---"
try { $r = Invoke-WebRequest "$base/users/$($r1.userId)/follow" -Method Post -WebSession $s1 -UseBasicParsing -ErrorAction Stop }
catch { $sc=[int]$_.Exception.Response.StatusCode; $msg=""; try{$reader=New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream());$msg=$reader.ReadToEnd();$reader.Close()}catch{}; Write-Output "$sc $msg" }

Write-Output "`n--- ORIG follow B->A (reverse direction) ---"
try { $r = Invoke-WebRequest "$base/users/$($r1.userId)/follow" -Method Post -WebSession $s2 -UseBasicParsing -ErrorAction Stop; Write-Output "OK $($r.StatusCode)" }
catch { $sc=[int]$_.Exception.Response.StatusCode; $msg=""; try{$reader=New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream());$msg=$reader.ReadToEnd();$reader.Close()}catch{}; Write-Output "$sc $msg" }

Write-Output "`n--- GET is-following ---"
try { $r = Invoke-RestMethod "$base/users/$($r2.userId)/is-following" -WebSession $s1; Write-Output "following B=$($r.isFollowing)" }
catch { Write-Output "ERR: $_" }

Write-Output "`n--- GET follow-counts ---"
try { $r = Invoke-RestMethod "$base/users/$($r1.userId)/follow-counts"; Write-Output "A followers=$($r.followersCount) following=$($r.followingCount)" }
catch { Write-Output "ERR: $_" }

Write-Output "`n--- GET followers/following ---"
try { $r = Invoke-RestMethod "$base/users/$($r1.userId)/followers"; Write-Output "A followers: $($r.content | ConvertTo-Json -Compress)" }
catch { Write-Output "ERR: $_" }
try { $r = Invoke-RestMethod "$base/users/$($r2.userId)/following"; Write-Output "B following: $($r.content | ConvertTo-Json -Compress)" }
catch { Write-Output "ERR: $_" }

# === COMMENT TESTS ===
Write-Output "`n--- Create post for commenting ---"
$r3 = Invoke-RestMethod "$base/posts" -Method Post -ContentType "application/json" -Body (b @{content="Test post for comments $suff"; type="TEXT"; communityId=$null}) -WebSession $s1
Write-Output "Post=$($r3.id)"

Write-Output "`n--- POST comment ---"
try {
    $rc = Invoke-WebRequest "$base/posts/$($r3.id)/comments" -Method Post -ContentType "application/json" -Body (b @{content="Hello from $suff"}) -WebSession $s1 -UseBasicParsing
    Write-Output "Created $($rc.StatusCode)"
} catch { Write-Output "ERR: $_" }

Write-Output "`n--- GET comments ---"
try { $r = Invoke-RestMethod "$base/posts/$($r3.id)/comments"; Write-Output "Comments: $(($r.content | ConvertTo-Json -Compress).Length) chars" }
catch { Write-Output "ERR: $_" }

Write-Output "`n--- GET comments (no auth) ---"
try { $r = Invoke-RestMethod "$base/posts/$($r3.id)/comments"; Write-Output "OK, count=$(($r.content).Count)" }
catch { Write-Output "ERR: $_" }

# === NOTIFICATION TESTS ===
# (need a follow to trigger a notification, then read it)

# Stop server
$null = Stop-Job $job -ErrorAction SilentlyContinue
$null = Remove-Job $job -ErrorAction SilentlyContinue
Write-Output "`nDONE"
