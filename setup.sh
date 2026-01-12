#!/bin/bash

# ==============================================
# SYNKS APPLICATION - INITIAL SETUP SCRIPT
# ==============================================

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              SYNKS APPLICATION SETUP                      ║
║          Production-Ready Docker Environment              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if Docker is installed
echo -e "${YELLOW}[1/7]${NC} Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed!${NC}"
    echo "Please install Docker from https://www.docker.com/get-started"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if Docker Compose is installed
echo -e "${YELLOW}[2/7]${NC} Checking Docker Compose installation..."
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Create .env file if it doesn't exist
echo -e "${YELLOW}[3/7]${NC} Setting up environment configuration..."
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please review and update .env file with your settings${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Create necessary directories
echo -e "${YELLOW}[4/7]${NC} Creating required directories..."
mkdir -p backups
mkdir -p nginx/ssl
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p scripts
echo -e "${GREEN}✓ Directories created${NC}"

# Set permissions for backup script
echo -e "${YELLOW}[5/7]${NC} Setting up backup script permissions..."
if [ -f scripts/backup.sh ]; then
    chmod +x scripts/backup.sh
    echo -e "${GREEN}✓ Backup script is executable${NC}"
else
    echo -e "${YELLOW}⚠️  Backup script not found${NC}"
fi

# Pull base images
echo -e "${YELLOW}[6/7]${NC} Pulling Docker base images..."
docker-compose pull 2>/dev/null || echo -e "${YELLOW}Note: Some images will be built locally${NC}"
echo -e "${GREEN}✓ Images ready${NC}"

# Build application images
echo -e "${YELLOW}[7/7]${NC} Building application containers..."
docker-compose build --no-cache
echo -e "${GREEN}✓ Containers built successfully${NC}"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  SETUP COMPLETE! 🎉                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. Review and update .env file:"
echo -e "   ${YELLOW}nano .env${NC}"
echo ""
echo "2. Start the application:"
echo -e "   ${GREEN}make up${NC}"
echo ""
echo "3. Check service health:"
echo -e "   ${GREEN}make health${NC}"
echo ""
echo "4. View logs:"
echo -e "   ${GREEN}make logs${NC}"
echo ""
echo -e "${BLUE}📱 Access Points:${NC}"
echo "   Application:  http://localhost"
echo "   Backend API:  http://localhost:8000"
echo "   Grafana:      http://localhost:3000 (admin/admin)"
echo "   Prometheus:   http://localhost:9090"
echo "   Portainer:    http://localhost:9000"
echo ""
echo -e "${YELLOW}💡 Tip: Run 'make help' to see all available commands${NC}"
echo ""
