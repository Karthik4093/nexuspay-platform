$ErrorActionPreference = "Stop"

function Write-Info { param($msg) Write-Host "[INFO]  $msg" -ForegroundColor Green }

Write-Info "Starting NexusPay Platform..."
docker compose up -d

Write-Info "Waiting for services to initialize..."
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "NexusPay is running!" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:     http://localhost:8080"
Write-Host "  API:          http://localhost:3000"
Write-Host "  API Docs:     http://localhost:3000/docs"
Write-Host "  Grafana:      http://localhost:3001  (admin/admin)"
Write-Host "  Prometheus:   http://localhost:9090"
Write-Host "  RabbitMQ UI:  http://localhost:15672 (nexuspay/nexuspay123)"
Write-Host ""
Write-Host "  Demo Credentials:"
Write-Host "    Admin:    admin@nexuspay.com / Admin@123456"
Write-Host "    Merchant: billing@techcorp.com / Merchant@123456"
Write-Host "    Support:  support@nexuspay.com / Support@123456"
Write-Host ""
Write-Host "  Logs: docker compose logs -f api"
Write-Host "  Stop: docker compose down"
