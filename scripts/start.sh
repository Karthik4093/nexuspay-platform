#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }

info "Starting NexusPay Platform..."
docker compose up -d

info "Waiting for services to initialize..."
sleep 5

echo ""
echo -e "${GREEN}✅ NexusPay is running!${NC}"
echo ""
echo "  Frontend:     http://localhost:8080"
echo "  API:          http://localhost:3000"
echo "  API Docs:     http://localhost:3000/docs"
echo "  Grafana:      http://localhost:3001  (admin/admin)"
echo "  Prometheus:   http://localhost:9090"
echo "  RabbitMQ UI:  http://localhost:15672 (nexuspay/nexuspay123)"
echo ""
echo "  Demo Credentials:"
echo "    Admin:    admin@nexuspay.com / Admin@123456"
echo "    Merchant: billing@techcorp.com / Merchant@123456"
echo "    Support:  support@nexuspay.com / Support@123456"
echo ""
echo "  Logs: docker compose logs -f api"
echo "  Stop: docker compose down"
