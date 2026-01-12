#!/bin/bash

# ==============================================
# SYNKS APPLICATION - STATUS DASHBOARD
# ==============================================

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

clear

echo -e "${BLUE}${BOLD}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              SYNKS APPLICATION STATUS                     ║
║          Real-Time Infrastructure Dashboard               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Function to check service health
check_service() {
    local service=$1
    local url=$2

    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
}

# Function to get container status
get_container_status() {
    local container=$1
    local status=$(docker ps --filter "name=$container" --format "{{.Status}}" 2>/dev/null)

    if [ -n "$status" ]; then
        if [[ "$status" =~ "Up" ]]; then
            echo -e "${GREEN}Running${NC}"
        else
            echo -e "${YELLOW}Starting${NC}"
        fi
    else
        echo -e "${RED}Stopped${NC}"
    fi
}

echo -e "${BOLD}📊 CONTAINER STATUS${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf "%-25s %-15s %-10s\n" "Service" "Status" "Health"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

printf "%-25s %-25s " "Frontend" "$(get_container_status synks-frontend)"
check_service "frontend" "http://localhost/"
echo ""

printf "%-25s %-25s " "Backend API" "$(get_container_status synks-backend)"
check_service "backend" "http://localhost:8000/api/health"
echo ""

printf "%-25s %-25s " "Redis Cache" "$(get_container_status synks-redis)"
docker exec synks-redis redis-cli ping > /dev/null 2>&1 && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"

printf "%-25s %-25s " "Nginx Proxy" "$(get_container_status synks-nginx-proxy)"
check_service "proxy" "http://localhost:8080/nginx-health"
echo ""

printf "%-25s %-25s " "Grafana" "$(get_container_status synks-grafana)"
check_service "grafana" "http://localhost:3000/api/health"
echo ""

printf "%-25s %-25s " "Prometheus" "$(get_container_status synks-prometheus)"
check_service "prometheus" "http://localhost:9090/-/healthy"
echo ""

printf "%-25s %-25s\n" "Portainer" "$(get_container_status synks-portainer)"

printf "%-25s %-25s\n" "Backup Service" "$(get_container_status synks-backup)"

echo ""
echo -e "${BOLD}📈 RESOURCE USAGE${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | head -n 10

echo ""
echo -e "${BOLD}💾 VOLUMES${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker volume ls --filter "name=synks-" --format "table {{.Name}}\t{{.Driver}}"

echo ""
echo -e "${BOLD}🔗 ACCESS POINTS${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${BLUE}Frontend:${NC}     http://localhost"
echo -e "  ${BLUE}Backend API:${NC}  http://localhost:8000"
echo -e "  ${BLUE}Swagger:${NC}      http://localhost:8000/docs"
echo -e "  ${BLUE}Grafana:${NC}      http://localhost:3000 ${YELLOW}(admin/admin)${NC}"
echo -e "  ${BLUE}Prometheus:${NC}   http://localhost:9090"
echo -e "  ${BLUE}Portainer:${NC}    http://localhost:9000"

echo ""
echo -e "${BOLD}📦 LATEST BACKUPS${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "backups" ] && [ "$(ls -A backups)" ]; then
    ls -lht backups/*.tar.gz 2>/dev/null | head -n 3 | awk '{print "  " $9 " (" $5 ")"}'
else
    echo -e "  ${YELLOW}No backups found${NC}"
fi

echo ""
echo -e "${BOLD}⚡ QUICK COMMANDS${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}make logs${NC}      - View all logs"
echo -e "  ${GREEN}make health${NC}    - Detailed health check"
echo -e "  ${GREEN}make backup${NC}    - Create backup now"
echo -e "  ${GREEN}make restart${NC}   - Restart all services"
echo ""
