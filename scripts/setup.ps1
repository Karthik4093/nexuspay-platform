param(
    [switch]$SkipPull
)

$ErrorActionPreference = "Stop"

function Write-Info  { param($msg) Write-Host "[INFO]  $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "[WARN]  $msg" -ForegroundColor Yellow }
function Write-Err   { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red; exit 1 }

function Require-Command {
    param($name)
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Err "$name is required but not installed."
    }
}

Write-Info "Checking prerequisites..."
Require-Command "docker"
Require-Command "node"
Require-Command "npm"

Write-Info "Setting up NexusPay Platform..."

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Warn ".env created from .env.example — update values before production use"
}

Write-Info "Installing Node.js dependencies..."
npm ci

Write-Info "Generating Prisma client..."
npx prisma generate

if (-not $SkipPull) {
    Write-Info "Pulling Docker images..."
    docker compose pull
}

Write-Info "Starting infrastructure services..."
docker compose up -d postgres redis rabbitmq

Write-Info "Waiting for services to be healthy (15s)..."
Start-Sleep -Seconds 15

Write-Info "Running database migrations..."
docker compose run --rm migrate

Write-Info "Seeding database..."
try {
    npx ts-node prisma/seeds/seed.ts
} catch {
    Write-Warn "Seed may have already run or ts-node not available locally — skipping"
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Run: .\scripts\start.ps1"
Write-Host "  Or:  docker compose up -d"
