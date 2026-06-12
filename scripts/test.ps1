param(
    [string]$Scope = "all"
)

$ErrorActionPreference = "Continue"

function Write-Info  { param($msg) Write-Host "[INFO]  $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "[WARN]  $msg" -ForegroundColor Yellow }
function Write-Err   { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }

$Pass = 0
$Fail = 0

function Invoke-NodeUnit {
    Write-Info "Running Node.js unit tests..."
    npm run test:unit
    if ($LASTEXITCODE -eq 0) { $script:Pass++; Write-Info "Node.js unit tests passed" }
    else { $script:Fail++; Write-Err "Node.js unit tests failed" }
}

function Invoke-Typecheck {
    Write-Info "Running TypeScript type check..."
    npx tsc --noEmit
    if ($LASTEXITCODE -eq 0) { $script:Pass++; Write-Info "TypeScript check passed" }
    else { $script:Fail++; Write-Err "TypeScript check failed" }
}

function Invoke-PythonTests {
    param($ServiceName)
    $dir = "services\$ServiceName"
    if (Test-Path $dir) {
        Write-Info "Running tests for $ServiceName..."
        Push-Location $dir
        python -m pytest tests/ -v --tb=short
        Pop-Location
        if ($LASTEXITCODE -eq 0) { $script:Pass++; Write-Info "$ServiceName tests passed" }
        else { $script:Fail++; Write-Err "$ServiceName tests failed" }
    } else {
        Write-Warn "Service directory not found: $dir"
    }
}

switch ($Scope) {
    "unit"        { Invoke-NodeUnit }
    "typecheck"   { Invoke-Typecheck }
    "python" {
        $services = @("fraud-detection","currency-conversion","tax-calculation","notification-service","report-generation","analytics","recommendation-engine","inventory-forecast","document-processing","ai-scoring")
        foreach ($svc in $services) { Invoke-PythonTests $svc }
    }
    default {
        Invoke-Typecheck
        Invoke-NodeUnit
        $coreServices = @("fraud-detection","currency-conversion","tax-calculation","notification-service")
        foreach ($svc in $coreServices) { Invoke-PythonTests $svc }
    }
}

Write-Host ""
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "  PASSED: $Pass  FAILED: $Fail" -ForegroundColor $(if ($Fail -eq 0) { "Green" } else { "Red" })
Write-Host "=============================" -ForegroundColor Cyan

if ($Fail -gt 0) { exit 1 }
