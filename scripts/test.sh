#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCOPE="${1:-all}"
PASS=0
FAIL=0

run_node_unit() {
  info "Running Node.js unit tests..."
  if npm run test:unit; then
    PASS=$((PASS+1))
    info "Node.js unit tests passed ✓"
  else
    FAIL=$((FAIL+1))
    error "Node.js unit tests failed ✗"
  fi
}

run_node_integration() {
  info "Running Node.js integration tests..."
  if npm run test:integration; then
    PASS=$((PASS+1))
    info "Node.js integration tests passed ✓"
  else
    FAIL=$((FAIL+1))
    error "Node.js integration tests failed ✗"
  fi
}

run_python_tests() {
  local service=$1
  local dir="services/$service"
  if [ -d "$dir" ]; then
    info "Running tests for $service..."
    if (cd "$dir" && python3 -m pytest tests/ -v --tb=short 2>&1); then
      PASS=$((PASS+1))
      info "$service tests passed ✓"
    else
      FAIL=$((FAIL+1))
      error "$service tests failed ✗"
    fi
  else
    warn "Service directory not found: $dir"
  fi
}

run_typecheck() {
  info "Running TypeScript type check..."
  if npx tsc --noEmit; then
    PASS=$((PASS+1))
    info "TypeScript check passed ✓"
  else
    FAIL=$((FAIL+1))
    error "TypeScript check failed ✗"
  fi
}

case "$SCOPE" in
  unit)
    run_node_unit
    ;;
  integration)
    run_node_integration
    ;;
  python)
    for svc in fraud-detection currency-conversion tax-calculation notification-service \
                report-generation analytics recommendation-engine inventory-forecast \
                document-processing ai-scoring; do
      run_python_tests "$svc"
    done
    ;;
  typecheck)
    run_typecheck
    ;;
  all|*)
    run_typecheck
    run_node_unit
    for svc in fraud-detection currency-conversion tax-calculation notification-service; do
      run_python_tests "$svc"
    done
    ;;
esac

echo ""
echo "============================="
echo "  PASSED: $PASS  FAILED: $FAIL"
echo "============================="

[ "$FAIL" -eq 0 ] || exit 1
