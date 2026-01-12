#  Deployment Guide

[![Deployment](https://img.shields.io/badge/Deployment-Production_Ready-brightgreen?style=for-the-badge)](https://synks.app)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker)](https://hub.docker.com/r/synks/app)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions)](https://github.com/username/synks/actions)

---

##  Table of Contents

- [Overview](#-overview)
- [Prerequisites](#-prerequisites)
- [Environment Setup](#-environment-setup)
- [Deployment Methods](#-deployment-methods)
- [Production Checklist](#-production-checklist)
- [Monitoring & Maintenance](#-monitoring--maintenance)
- [Rollback Procedures](#-rollback-procedures)
- [Troubleshooting](#-troubleshooting)

---

##  Overview

This guide covers deploying the Synks application across different environments, from local development to production cloud infrastructure.

### Supported Deployment Targets

| Environment | Platform | Purpose | Automation |
|-------------|----------|---------|------------|
| **Development** | Docker Compose | Local development | Manual |
| **Staging** | AWS ECS / DigitalOcean | Pre-production testing | Auto (on `develop`) |
| **Production** | AWS ECS / Kubernetes | Live application | Auto (on `main` + tags) |

---

##  Prerequisites

### Required Software

```bash
# Docker & Docker Compose
docker --version          # >= 24.0.0
docker-compose --version  # >= 2.20.0

# Git
git --version            # >= 2.30.0

# Make (optional but recommended)
make --version           # >= 4.0

# AWS CLI (for AWS deployments)
aws --version            # >= 2.0.0

# kubectl (for Kubernetes deployments)
kubectl version          # >= 1.28.0
```

### Required Accounts & Access

- [ ] GitHub account with repository access
- [ ] Docker Hub / GitHub Container Registry account
- [ ] Cloud provider account (AWS/GCP/Azure/DigitalOcean)
- [ ] Domain name and DNS access
- [ ] SSL certificate (Let's Encrypt or commercial)

---

##  Environment Setup

### 1. Environment Variables

Create environment files for each environment:

#### `.env.local` (Development)
```bash
# Application
APP_NAME=Synks
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=true

# Backend
BACKEND_HOST=localhost
BACKEND_PORT=8000
SECRET_KEY=dev-secret-key-change-in-production

# Frontend
FRONTEND_HOST=localhost
FRONTEND_PORT=3000
VITE_API_URL=http://localhost:8000

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=synks_dev
POSTGRES_PASSWORD=dev_password
POSTGRES_DB=synks_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### `.env.staging` (Staging)
```bash
# Application
APP_NAME=Synks
APP_VERSION=1.0.0
ENVIRONMENT=staging
DEBUG=false

# Backend
BACKEND_HOST=staging-api.synks.app
BACKEND_PORT=8000
SECRET_KEY=${SECRET_KEY}  # From secrets manager

# Frontend
FRONTEND_HOST=staging.synks.app
FRONTEND_PORT=80
VITE_API_URL=https://staging-api.synks.app

# Database (RDS)
POSTGRES_HOST=${RDS_ENDPOINT}
POSTGRES_PORT=5432
POSTGRES_USER=${RDS_USERNAME}
POSTGRES_PASSWORD=${RDS_PASSWORD}
POSTGRES_DB=synks_staging

# Redis (ElastiCache)
REDIS_HOST=${ELASTICACHE_ENDPOINT}
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# CORS
CORS_ORIGINS=https://staging.synks.app
```

#### `.env.production` (Production)
```bash
# Application
APP_NAME=Synks
APP_VERSION=1.0.0
ENVIRONMENT=production
DEBUG=false

# Backend
BACKEND_HOST=api.synks.app
BACKEND_PORT=8000
SECRET_KEY=${SECRET_KEY}  # From secrets manager

# Frontend
FRONTEND_HOST=synks.app
FRONTEND_PORT=80
VITE_API_URL=https://api.synks.app

# Database (RDS)
POSTGRES_HOST=${RDS_ENDPOINT}
POSTGRES_PORT=5432
POSTGRES_USER=${RDS_USERNAME}
POSTGRES_PASSWORD=${RDS_PASSWORD}
POSTGRES_DB=synks_production

# Redis (ElastiCache)
REDIS_HOST=${ELASTICACHE_ENDPOINT}
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# CORS
CORS_ORIGINS=https://synks.app,https://www.synks.app

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
PROMETHEUS_ENABLED=true
```

### 2. GitHub Secrets

Configure in **Settings → Secrets and variables → Actions**:

```bash
# Required
GITHUB_TOKEN                 # Auto-generated
DOCKER_USERNAME              # Docker Hub username
DOCKER_PASSWORD              # Docker Hub token

# AWS (if using AWS)
AWS_ACCESS_KEY_ID           # AWS access key
AWS_SECRET_ACCESS_KEY       # AWS secret key
AWS_REGION                  # e.g., us-east-1
ECR_REGISTRY                # ECR registry URL

# Application
SECRET_KEY                  # JWT secret key
DATABASE_URL                # Full database connection string
REDIS_URL                   # Full Redis connection string

# Optional
CODECOV_TOKEN               # Codecov token
SENTRY_DSN                  # Sentry error tracking
SLACK_WEBHOOK_URL           # Deployment notifications
```

---

##  Deployment Methods

### Method 1: Docker Compose (Local/Small Scale)

#### Development Deployment

```bash
# Clone repository
git clone https://github.com/username/synks.git
cd synks

# Copy environment file
cp .env.example .env

# Start all services
make up
# or: docker-compose up -d

# View logs
make logs
# or: docker-compose logs -f

# Access application
# Frontend: http://localhost
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

#### Production with Docker Compose

```bash
# Use production compose file
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or use the Makefile
make prod-up

# Check service health
docker-compose ps

# Monitor logs
docker-compose logs -f backend frontend
```

---

### Method 2: AWS ECS (Recommended for Production)

#### Architecture

```
┌─────────────────────────────────────────────────┐
│                   Route 53                       │
│            (DNS & Health Checks)                 │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│           Application Load Balancer             │
│         (SSL Termination, Routing)              │
└────────────┬────────────────────────────────────┘
             │
     ┌───────┴───────┐
     │               │
┌────▼────┐   ┌─────▼─────┐
│ Frontend│   │  Backend  │
│  Tasks  │   │   Tasks   │
│ (Fargate)   │ (Fargate) │
└─────────┘   └───┬───┬───┘
                  │   │
          ┌───────┴───┴───────┐
          │                   │
     ┌────▼────┐        ┌────▼──────┐
     │   RDS   │        │ElastiCache│
     │(PostgreSQL)      │  (Redis)  │
     └─────────┘        └───────────┘
```

#### Step 1: Infrastructure Setup (Terraform)

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.0"
  backend "s3" {
    bucket = "synks-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "synks-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "synks-production"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# RDS PostgreSQL
module "db" {
  source = "terraform-aws-modules/rds/aws"

  identifier = "synks-db"

  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = "db.t3.medium"
  allocated_storage = 100

  db_name  = "synks_production"
  username = var.db_username
  password = var.db_password

  multi_az               = true
  backup_retention_period = 7

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "synks-cache"
  engine               = "redis"
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 2
  parameter_group_name = "default.redis7"
  port                 = 6379

  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "synks-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
}
```

#### Step 2: ECS Task Definitions

```json
// ecs-backend-task.json
{
  "family": "synks-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ghcr.io/username/synks-backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:synks/secret-key"
        },
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:synks/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/synks-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### Step 3: Deploy with GitHub Actions

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker images
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.ref_name }}
        run: |
          # Build backend
          docker build -t $ECR_REGISTRY/synks-backend:$IMAGE_TAG ./backend
          docker push $ECR_REGISTRY/synks-backend:$IMAGE_TAG

          # Build frontend
          docker build -t $ECR_REGISTRY/synks-frontend:$IMAGE_TAG ./frontend
          docker push $ECR_REGISTRY/synks-frontend:$IMAGE_TAG

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster synks-production \
            --service synks-backend \
            --force-new-deployment

          aws ecs update-service \
            --cluster synks-production \
            --service synks-frontend \
            --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster synks-production \
            --services synks-backend synks-frontend
```

---

### Method 3: Kubernetes (Advanced)

#### Kubernetes Manifests

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: synks-backend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: synks-backend
  template:
    metadata:
      labels:
        app: synks-backend
        version: v1.0.0
    spec:
      containers:
      - name: backend
        image: ghcr.io/username/synks-backend:v1.0.0
        ports:
        - containerPort: 8000
        env:
        - name: ENVIRONMENT
          value: "production"
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: synks-secrets
              key: secret-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: synks-backend
  namespace: production
spec:
  selector:
    app: synks-backend
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: synks-backend
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: synks-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace production

# Create secrets
kubectl create secret generic synks-secrets \
  --from-literal=secret-key=$SECRET_KEY \
  --from-literal=database-url=$DATABASE_URL \
  -n production

# Apply manifests
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl rollout status deployment/synks-backend -n production
kubectl rollout status deployment/synks-frontend -n production

# View pods
kubectl get pods -n production

# View logs
kubectl logs -f deployment/synks-backend -n production
```

---

##  Production Checklist

### Pre-Deployment

- [ ] **Code Review**: All PRs reviewed and approved
- [ ] **Tests**: All tests passing (unit, integration, E2E)
- [ ] **Security Scan**: No critical vulnerabilities
- [ ] **Performance Test**: Load testing completed
- [ ] **Database Migrations**: Tested and ready
- [ ] **Environment Variables**: All secrets configured
- [ ] **Backup**: Recent backup available
- [ ] **Monitoring**: Dashboards and alerts configured
- [ ] **Documentation**: Deployment docs updated
- [ ] **Rollback Plan**: Rollback procedure documented

### Deployment

- [ ] **Maintenance Window**: Announced to users
- [ ] **Database Backup**: Fresh backup created
- [ ] **Migration Dry-Run**: Test migrations on staging
- [ ] **Deploy Application**: New version deployed
- [ ] **Health Checks**: All services healthy
- [ ] **Smoke Tests**: Critical paths verified
- [ ] **Performance Check**: Response times acceptable
- [ ] **Error Rate**: No spike in errors

### Post-Deployment

- [ ] **Monitoring**: Watch metrics for 30 minutes
- [ ] **User Feedback**: Monitor support channels
- [ ] **Documentation**: Update changelog
- [ ] **Cleanup**: Remove old Docker images
- [ ] **Notification**: Announce successful deployment

---

##  Monitoring & Maintenance

### Health Check Endpoints

```bash
# Liveness probe (is app running?)
curl http://localhost:8000/health
# Response: {"status": "healthy", "timestamp": "..."}

# Readiness probe (is app ready to serve traffic?)
curl http://localhost:8000/health/ready
# Response: {"status": "ready", "database": "connected", "cache": "connected"}

# Metrics endpoint
curl http://localhost:8000/metrics
# Response: Prometheus format metrics
```

### Key Metrics to Monitor

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| **Response Time (p95)** | > 500ms | > 1000ms | Scale up, optimize queries |
| **Error Rate** | > 1% | > 5% | Check logs, rollback if needed |
| **CPU Usage** | > 70% | > 85% | Scale horizontally |
| **Memory Usage** | > 80% | > 90% | Scale vertically or fix leaks |
| **Database Connections** | > 80% | > 95% | Increase pool size |
| **Cache Hit Rate** | < 70% | < 50% | Review cache strategy |
| **Disk Space** | > 80% | > 90% | Clean logs, increase storage |

### Automated Alerts

```yaml
# alerts.yml (Prometheus AlertManager)
groups:
  - name: application
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"

      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 5m
        annotations:
          summary: "Slow response times"
          description: "p95 latency is {{ $value }}s"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}%"
```

---

##  Rollback Procedures

### Quick Rollback (ECS)

```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster synks-production \
  --service synks-backend \
  --task-definition synks-backend:PREVIOUS_VERSION \
  --force-new-deployment

# Wait for rollback to complete
aws ecs wait services-stable \
  --cluster synks-production \
  --services synks-backend
```

### Quick Rollback (Kubernetes)

```bash
# Rollback to previous revision
kubectl rollout undo deployment/synks-backend -n production

# Check rollback status
kubectl rollout status deployment/synks-backend -n production

# View rollback history
kubectl rollout history deployment/synks-backend -n production
```

### Database Rollback

```bash
# Restore from backup (PostgreSQL)
pg_restore -h $DB_HOST -U $DB_USER -d synks_production backup_file.dump

# Or use RDS snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier synks-db-restored \
  --db-snapshot-identifier synks-db-snapshot-20240115
```

---

##  Troubleshooting

### Common Issues

#### Issue: Container Won't Start

```bash
# Check container logs
docker logs <container_id>

# Check events
kubectl describe pod <pod_name> -n production

# Common causes:
# - Missing environment variables
# - Database connection failure
# - Port already in use
```

#### Issue: High Memory Usage

```bash
# Check memory usage
docker stats

# Kubernetes
kubectl top pods -n production

# Solutions:
# - Increase memory limits
# - Fix memory leaks
# - Enable garbage collection tuning
```

#### Issue: Database Connection Errors

```bash
# Test database connectivity
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Check connection pool
# In Python:
SELECT count(*) FROM pg_stat_activity;

# Solutions:
# - Increase connection pool size
# - Check network security groups
# - Verify credentials
```

#### Issue: Slow Response Times

```bash
# Check database query performance
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

# Check cache hit rate
INFO stats

# Solutions:
# - Add database indexes
# - Optimize queries
# - Increase cache TTL
# - Enable query caching
```

---

##  Additional Resources

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Kubernetes Production Best Practices](https://kubernetes.io/docs/setup/best-practices/)
- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

<div align="center">

**For deployment support, contact the DevOps team or open an issue.**

[ Back to Documentation](../README.md#-documentation)

</div>
