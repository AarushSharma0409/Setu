param(
  [string]$ApiBaseUrl = "http://localhost:4000/api/v1",
  [switch]$ReadyOnly
)

$ErrorActionPreference = "Stop"

function Assert-Healthy([string]$Path) {
  $response = Invoke-WebRequest -Uri "$ApiBaseUrl$Path" -UseBasicParsing
  if ($response.StatusCode -ne 200) {
    throw "Smoke test failed for $Path: HTTP $($response.StatusCode)"
  }
  Write-Host "PASS $Path"
}

Assert-Healthy "/health/live"
Assert-Healthy "/health/ready"

if (-not $ReadyOnly) {
  Assert-Healthy "/health"
  Write-Host "Open the public, vendor, and admin staging journeys manually using docs/smoke-test.md."
}
