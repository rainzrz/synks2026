#  Docker Guide

[![Docker](https://img.shields.io/badge/Docker-Production_Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![Docker Compose](https://img.shields.io/badge/Compose-Multi--Service-2496ED?style=for-the-badge&logo=docker)](https://docs.docker.com/compose/)
[![Image Size](https://img.shields.io/badge/Image_Size-Optimized-brightgreen?style=for-the-badge)](https://hub.docker.com/r/synks/app)

---

##  Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Services](#-services)
- [Configuration](#-configuration)
- [Performance Tuning](#-performance-tuning)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)

---

##  Overview

Synks uses Docker for containerization, providing:

- **Consistent Environments**: Same setup across dev/staging/prod
- **Isolation**: Each service runs independently
- **Scalability**: Easy horizontal scaling
- **Portability**: Deploy anywhere Docker runs

### Container Architecture

```
┌─────────────────────────────────────────────────┐
│               Docker Host                        │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │         Docker Compose Stack             │  │
│  │                                          │  │
│  │  ┌────────┐  ┌────────┐  ┌─────────┐  │  │
│  │  │Frontend│  │Backend │  │PostgreSQL│  │  │
│  │  │ Nginx  │  │FastAPI │  │ Database │  │  │
│  │  └───┬────┘  └───┬────┘  └────┬────┘  │  │
│  │      │           │            │        │  │
│  │  ┌───┴───┐   ┌──┴───┐    ┌───┴────┐  │  │
│  │  │ Redis │   │Nginx │    │Prometheus│  │  │
│  │  │ Cache │   │Proxy │    │  & Graf  │  │  │
│  │  └───────┘   └──────┘    └─────────┘  │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   Volumes    │  │   Networks   │            │
│  │ (Persistent) │  │  (Isolated)  │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
```

---

##  Quick Start

### Prerequisites

```bash
# Check Docker installation
docker --version          # >= 24.0.0
docker-compose --version  # >= 2.20.0

# Verify Docker is running
docker ps
```

### Basic Commands

```bash
# Start all services
make up
# or: docker-compose up -d

# Stop all services
make down
# or: docker-compose down

# Restart services
make restart
# or: docker-compose restart

# View logs
make logs
# or: docker-compose logs -f

# View service status
make ps
# or: docker-compose ps

# Access shell in container
docker-compose exec backend bash
docker-compose exec frontend sh

# Rebuild images
make rebuild
# or: docker-compose up -d --build
```

### First-Time Setup

```bash
# 1. Clone and navigate to project
git clone https://github.com/username/synks.git
cd synks

# 2. Copy environment file
cp .env.example .env

# 3. Start services
make up

# 4. Wait for services to be healthy
make health

# 5. Access application
# Frontend: http://localhost
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs

# 6. Initialize database (if needed)
make db-init
```

---

##  Architecture

### Multi-Stage Builds

Our Dockerfiles use multi-stage builds for optimization:

#### Backend Dockerfile

```dockerfile
# backend/Dockerfile
# =================================
# Stage 1: Builder
# =================================
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# =================================
# Stage 2: Runtime
# =================================
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY . .

# Add Python packages to PATH
ENV PATH=/root/.local/bin:$PATH

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Benefits:**
-  **Smaller images**: ~200MB vs ~1GB
-  **Faster builds**: Cached layers
-  **More secure**: No build tools in production
-  **Better performance**: Optimized runtime

#### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
# =================================
# Stage 1: Builder
# =================================
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# =================================
# Stage 2: Production
# =================================
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Install curl for health checks
RUN apk add --no-cache curl

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose Configuration

#### Production Stack

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ================================
  # Frontend Service
  # ================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL}
    image: synks-frontend:latest
    container_name: synks-frontend
    ports:
      - "80:80"
    networks:
      - synks-network
    depends_on:
      backend:
        condition: service_healthy
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  # ================================
  # Backend Service
  # ================================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: synks-backend:latest
    container_name: synks-backend
    ports:
      - "8000:8000"
    networks:
      - synks-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - ENVIRONMENT=production
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - ./backend/logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ================================
  # PostgreSQL Database
  # ================================
  postgres:
    image: postgres:15-alpine
    container_name: synks-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - synks-network
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  # ================================
  # Redis Cache
  # ================================
  redis:
    image: redis:7-alpine
    container_name: synks-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
    networks:
      - synks-network
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 10s

  # ================================
  # Nginx Reverse Proxy
  # ================================
  nginx-proxy:
    image: nginx:alpine
    container_name: synks-nginx-proxy
    ports:
      - "443:443"
    volumes:
      - ./nginx/proxy.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx-logs:/var/log/nginx
    networks:
      - synks-network
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  # ================================
  # Prometheus (Metrics)
  # ================================
  prometheus:
    image: prom/prometheus:latest
    container_name: synks-prometheus
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    networks:
      - synks-network
    ports:
      - "9090:9090"
    restart: unless-stopped

  # ================================
  # Grafana (Visualization)
  # ================================
  grafana:
    image: grafana/grafana:latest
    container_name: synks-grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_INSTALL_PLUGINS=grafana-clock-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
    networks:
      - synks-network
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
    restart: unless-stopped

  # ================================
  # Portainer (Container Management)
  # ================================
  portainer:
    image: portainer/portainer-ce:latest
    container_name: synks-portainer
    command: -H unix:///var/run/docker.sock
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer-data:/data
    networks:
      - synks-network
    ports:
      - "9000:9000"
    restart: unless-stopped

# ================================
# Networks
# ================================
networks:
  synks-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

# ================================
# Volumes (Persistent Storage)
# ================================
volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
  portainer-data:
    driver: local
  nginx-logs:
    driver: local
```

---

##  Services

### Service Overview

| Service | Image | Port | Purpose | Dependencies |
|---------|-------|------|---------|--------------|
| **frontend** | Custom | 80 | React UI | backend |
| **backend** | Custom | 8000 | FastAPI API | postgres, redis |
| **postgres** | postgres:15 | 5432 | Database | - |
| **redis** | redis:7 | 6379 | Cache & Sessions | - |
| **nginx-proxy** | nginx:alpine | 443 | Reverse Proxy | frontend, backend |
| **prometheus** | prom/prometheus | 9090 | Metrics Collection | - |
| **grafana** | grafana/grafana | 3001 | Dashboards | prometheus |
| **portainer** | portainer/portainer-ce | 9000 | Container Mgmt | - |

### Service Management

```bash
# Start specific service
docker-compose up -d backend

# Stop specific service
docker-compose stop frontend

# Restart service
docker-compose restart backend

# View service logs
docker-compose logs -f backend

# Scale service (horizontal scaling)
docker-compose up -d --scale backend=3

# Execute command in service
docker-compose exec backend python manage.py migrate
docker-compose exec postgres psql -U synks -d synks_db

# View resource usage
docker stats
```

---

##  Configuration

### Environment Variables

```bash
# .env
# =================================
# Application
# =================================
APP_NAME=Synks
APP_VERSION=1.0.0
ENVIRONMENT=production

# =================================
# Backend
# =================================
BACKEND_PORT=8000
SECRET_KEY=your-super-secret-key-here-change-in-production
DEBUG=false
LOG_LEVEL=INFO

# =================================
# Frontend
# =================================
VITE_API_URL=http://localhost:8000

# =================================
# Database
# =================================
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=synks
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=synks_production

# =================================
# Redis
# =================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password

# =================================
# Monitoring
# =================================
GRAFANA_ADMIN_PASSWORD=admin
PROMETHEUS_PORT=9090

# =================================
# SSL (for production)
# =================================
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### Volume Mapping

```yaml
# Persistent data volumes
volumes:
  # Database data
  - postgres-data:/var/lib/postgresql/data

  # Redis data
  - redis-data:/data

  # Application logs
  - ./backend/logs:/app/logs

  # Grafana dashboards
  - grafana-data:/var/lib/grafana

  # SSL certificates
  - ./nginx/ssl:/etc/nginx/ssl:ro
```

### Network Configuration

```yaml
networks:
  synks-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
          gateway: 172.20.0.1

# Static IP assignment (optional)
services:
  backend:
    networks:
      synks-network:
        ipv4_address: 172.20.0.10
```

---

##  Performance Tuning

### Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

  postgres:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### Build Optimization

```dockerfile
# Use .dockerignore to exclude unnecessary files
# .dockerignore
**/.git
**/.gitignore
**/.vscode
**/__pycache__
**/.pytest_cache
**/node_modules
**/.env
**/dist
**/build
**/*.md
```

### Caching Strategy

```dockerfile
# Copy dependency files first (better caching)
COPY requirements.txt .
RUN pip install -r requirements.txt

# Then copy source code
COPY . .

# Multi-layer caching
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
```

---

##  Security

### Security Best Practices

#### 1. Non-Root User

```dockerfile
# Create and use non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser
```

#### 2. Read-Only Filesystem

```yaml
services:
  backend:
    read_only: true
    tmpfs:
      - /tmp
      - /app/logs
```

#### 3. Security Scanning

```bash
# Scan images for vulnerabilities
docker scan synks-backend:latest
docker scan synks-frontend:latest

# Use Trivy
trivy image synks-backend:latest
```

#### 4. Secrets Management

```yaml
# Use Docker secrets (Swarm mode)
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  backend:
    secrets:
      - db_password
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password
```

### Network Security

```yaml
# Isolate services in separate networks
networks:
  frontend-network:
    driver: bridge
  backend-network:
    driver: bridge
    internal: true  # No external access

services:
  backend:
    networks:
      - frontend-network
      - backend-network

  postgres:
    networks:
      - backend-network  # Only accessible from backend
```

---

##  Troubleshooting

### Common Issues

#### Issue: Container Won't Start

```bash
# Check logs
docker-compose logs <service_name>

# Check container status
docker-compose ps

# Inspect container
docker inspect <container_id>

# Common solutions:
# 1. Port already in use
sudo lsof -i :8000
# 2. Missing environment variables
cat .env
# 3. Volume permission issues
sudo chown -R $USER:$USER ./volumes
```

#### Issue: Out of Memory

```bash
# Check memory usage
docker stats

# Increase memory limit
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 4G

# Clear Docker cache
docker system prune -a
```

#### Issue: Slow Build Times

```bash
# Use BuildKit
export DOCKER_BUILDKIT=1
docker-compose build

# Build with no cache
docker-compose build --no-cache

# Parallel builds
docker-compose build --parallel
```

#### Issue: Network Connectivity

```bash
# Test network connectivity
docker-compose exec backend ping postgres
docker-compose exec backend curl http://redis:6379

# Check network configuration
docker network ls
docker network inspect synks_synks-network

# Recreate network
docker-compose down
docker network prune
docker-compose up -d
```

### Health Check Commands

```bash
# Check all services health
docker-compose ps

# Test backend health
curl http://localhost:8000/health

# Test database connection
docker-compose exec postgres pg_isready -U synks

# Test Redis connection
docker-compose exec redis redis-cli ping

# View health check logs
docker inspect --format='{{json .State.Health}}' synks-backend | jq
```

---

##  Monitoring

### Container Metrics

```bash
# Real-time stats
docker stats

# Specific service
docker stats synks-backend

# Format output
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Log Management

```bash
# View logs
docker-compose logs -f

# Follow logs for specific service
docker-compose logs -f backend

# Show timestamps
docker-compose logs --timestamps

# Limit log lines
docker-compose logs --tail 100

# Configure log rotation
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

##  Advanced Topics

### Docker Compose Profiles

```yaml
# docker-compose.yml
services:
  # Always running
  backend:
    profiles: ["core"]

  # Development only
  debug-tools:
    profiles: ["debug"]
    image: nicolaka/netshoot

  # Production only
  backup:
    profiles: ["production"]
    image: backup-service
```

```bash
# Start with specific profile
docker-compose --profile debug up

# Multiple profiles
docker-compose --profile core --profile production up
```

### Multi-Stage Environments

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Staging
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

---

<div align="center">

**For Docker support, check the troubleshooting section or contact the DevOps team.**

[ Back to Documentation](../README.md#-documentation)

</div>
