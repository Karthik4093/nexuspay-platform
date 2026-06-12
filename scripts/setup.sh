#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

check_command() {
  command -v "$1" &>/dev/null || error "$1 is required but not installed."
}

info "Checking prerequisites..."
check_command docker
check_command "docker compose"
check_command node
check_command npm
check_command python3

info "Setting up NexusPay Platform..."

if [ ! -f ".env" ]; then
  cp .env.example .env
  warn ".env created from .env.example — update values before production use"
fi

info "Installing Node.js dependencies..."
npm ci

info "Generating Prisma client..."
npx prisma generate

info "Pulling Docker images..."
docker compose pull

info "Starting infrastructure services..."
docker compose up -d postgres redis rabbitmq

info "Waiting for services to be healthy..."
sleep 10

info "Running database migrations..."
docker compose run --rm migrate

info "Seeding database..."
docker compose run --rm -e NODE_ENV=development api npx ts-node prisma/seeds/seed.ts 2>/dev/null || \
  npx ts-node prisma/seeds/seed.ts

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "  Run: ./scripts/start.sh"
echo "  Or:  docker compose up -d"
