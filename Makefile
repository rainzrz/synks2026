# ==============================================
# SYNKS APPLICATION - MAKEFILE
# ==============================================

.PHONY: help build up down restart logs clean backup restore status health

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
YELLOW := \033[0;33m
NC := \033[0m # No Color

##@ General Commands

help: ## Show this help message
	@echo "$(BLUE)╔═══════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║          SYNKS APPLICATION - DOCKER COMMANDS             ║$(NC)"
	@echo "$(BLUE)╚═══════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make $(YELLOW)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Docker Lifecycle

build: ## Build all Docker images
	@echo "$(BLUE)🔨 Building Docker images...$(NC)"
	docker-compose build --no-cache

up: ## Start all services
	@echo "$(GREEN)🚀 Starting Synks application...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Application started!$(NC)"
	@make status

down: ## Stop all services
	@echo "$(YELLOW)🛑 Stopping all services...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Services stopped!$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)🔄 Restarting services...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✓ Services restarted!$(NC)"

rebuild: ## Rebuild and restart all services
	@echo "$(BLUE)🔨 Rebuilding and restarting...$(NC)"
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "$(GREEN)✓ Rebuild complete!$(NC)"

##@ Monitoring & Logs

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs only
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs only
	docker-compose logs -f frontend

logs-redis: ## Show Redis logs only
	docker-compose logs -f redis

logs-proxy: ## Show Nginx proxy logs only
	docker-compose logs -f nginx-proxy

status: ## Show status of all containers
	@echo "$(BLUE)📊 Container Status:$(NC)"
	@docker-compose ps

health: ## Check health of all services
	@echo "$(BLUE)🏥 Health Check:$(NC)"
	@echo ""
	@echo "$(YELLOW)Backend:$(NC)"
	@curl -s http://localhost:8000/api/health || echo "$(RED)✗ Backend unreachable$(NC)"
	@echo ""
	@echo "$(YELLOW)Frontend:$(NC)"
	@curl -s http://localhost/ -o /dev/null && echo "$(GREEN)✓ Frontend OK$(NC)" || echo "$(RED)✗ Frontend unreachable$(NC)"
	@echo ""
	@echo "$(YELLOW)Redis:$(NC)"
	@docker exec synks-redis redis-cli ping || echo "$(RED)✗ Redis unreachable$(NC)"
	@echo ""
	@echo "$(YELLOW)Grafana:$(NC)"
	@curl -s http://localhost:3000/api/health -o /dev/null && echo "$(GREEN)✓ Grafana OK$(NC)" || echo "$(RED)✗ Grafana unreachable$(NC)"
	@echo ""
	@echo "$(YELLOW)Prometheus:$(NC)"
	@curl -s http://localhost:9090/-/healthy -o /dev/null && echo "$(GREEN)✓ Prometheus OK$(NC)" || echo "$(RED)✗ Prometheus unreachable$(NC)"

stats: ## Show resource usage statistics
	@echo "$(BLUE)📈 Resource Usage:$(NC)"
	docker stats --no-stream

##@ Database & Backup

backup: ## Create database backup
	@echo "$(BLUE)💾 Creating backup...$(NC)"
	docker exec synks-backup sh /backup.sh
	@echo "$(GREEN)✓ Backup complete!$(NC)"

backup-list: ## List all backups
	@echo "$(BLUE)📁 Available backups:$(NC)"
	@ls -lh backups/

backup-restore: ## Restore from latest backup (use BACKUP_FILE=filename to specify)
	@echo "$(YELLOW)⚠️  This will restore the database from backup!$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to cancel, or Enter to continue...$(NC)"
	@read dummy
	@echo "$(BLUE)🔄 Restoring from backup...$(NC)"
	@LATEST=$$(ls -t backups/synks_backup_*.tar.gz | head -1); \
	docker exec -i synks-backend tar -xzf - -C /app/data < $$LATEST
	@echo "$(GREEN)✓ Restore complete!$(NC)"
	@make restart

##@ Database Management

db-shell: ## Open database shell
	@echo "$(BLUE)🗄️  Opening database shell...$(NC)"
	docker exec -it synks-backend sqlite3 /app/data/portal.db

redis-cli: ## Open Redis CLI
	@echo "$(BLUE)💾 Opening Redis CLI...$(NC)"
	docker exec -it synks-redis redis-cli

redis-flush: ## Flush Redis cache
	@echo "$(YELLOW)⚠️  This will clear all cached data!$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to cancel, or Enter to continue...$(NC)"
	@read dummy
	docker exec synks-redis redis-cli FLUSHALL
	@echo "$(GREEN)✓ Redis cache cleared!$(NC)"

##@ Cleanup

clean: ## Remove stopped containers and unused images
	@echo "$(YELLOW)🧹 Cleaning up...$(NC)"
	docker-compose down --remove-orphans
	docker system prune -f
	@echo "$(GREEN)✓ Cleanup complete!$(NC)"

clean-all: ## Remove everything including volumes (DANGER!)
	@echo "$(RED)⚠️  WARNING: This will delete all data including databases!$(NC)"
	@echo "$(RED)Press Ctrl+C to cancel, or Enter to continue...$(NC)"
	@read dummy
	docker-compose down -v
	docker system prune -af --volumes
	@echo "$(GREEN)✓ Full cleanup complete!$(NC)"

##@ Development

dev-backend: ## Run backend in development mode
	@echo "$(BLUE)🔧 Starting backend in dev mode...$(NC)"
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Run frontend in development mode
	@echo "$(BLUE)🔧 Starting frontend in dev mode...$(NC)"
	cd frontend && npm run dev

shell-backend: ## Open shell in backend container
	docker exec -it synks-backend /bin/bash

shell-frontend: ## Open shell in frontend container
	docker exec -it synks-frontend /bin/sh

##@ Monitoring Dashboards

portainer: ## Open Portainer (Docker Management)
	@echo "$(BLUE)🐳 Opening Portainer...$(NC)"
	@echo "$(GREEN)→ http://localhost:9000$(NC)"
	@start http://localhost:9000 || open http://localhost:9000 || xdg-open http://localhost:9000

grafana: ## Open Grafana (Metrics Dashboard)
	@echo "$(BLUE)📊 Opening Grafana...$(NC)"
	@echo "$(GREEN)→ http://localhost:3000$(NC)"
	@echo "$(YELLOW)Default credentials: admin/admin$(NC)"
	@start http://localhost:3000 || open http://localhost:3000 || xdg-open http://localhost:3000

prometheus: ## Open Prometheus (Metrics Collection)
	@echo "$(BLUE)📈 Opening Prometheus...$(NC)"
	@echo "$(GREEN)→ http://localhost:9090$(NC)"
	@start http://localhost:9090 || open http://localhost:9090 || xdg-open http://localhost:9090

app: ## Open main application
	@echo "$(BLUE)🌐 Opening Synks Application...$(NC)"
	@echo "$(GREEN)→ http://localhost$(NC)"
	@start http://localhost || open http://localhost || xdg-open http://localhost

##@ Information

info: ## Show application information
	@echo "$(BLUE)╔═══════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║              SYNKS APPLICATION INFORMATION               ║$(NC)"
	@echo "$(BLUE)╚═══════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)📱 Application URLs:$(NC)"
	@echo "  Frontend:    http://localhost"
	@echo "  Backend API: http://localhost:8000"
	@echo "  Swagger:     http://localhost:8000/docs"
	@echo ""
	@echo "$(GREEN)📊 Monitoring:$(NC)"
	@echo "  Grafana:     http://localhost:3000 (admin/admin)"
	@echo "  Prometheus:  http://localhost:9090"
	@echo "  Portainer:   http://localhost:9000"
	@echo ""
	@echo "$(GREEN)🗄️  Services:$(NC)"
	@echo "  Redis:       localhost:6379"
	@echo "  Nginx Proxy: localhost:8080"
	@echo ""
	@echo "$(YELLOW)💡 Quick Commands:$(NC)"
	@echo "  make up      - Start everything"
	@echo "  make logs    - View all logs"
	@echo "  make health  - Check service health"
	@echo "  make backup  - Create database backup"
	@echo ""

##@ CI/CD & Git

lint-backend: ## Lint backend code (Black + Flake8)
	@echo "$(BLUE)🔍 Linting backend code...$(NC)"
	cd backend && black . && flake8 . --max-line-length=120

lint-frontend: ## Lint frontend code (ESLint)
	@echo "$(BLUE)🔍 Linting frontend code...$(NC)"
	cd frontend && npm run lint

test-backend: ## Run backend tests
	@echo "$(BLUE)🧪 Running backend tests...$(NC)"
	cd backend && pytest tests/ -v

test-frontend: ## Run frontend tests
	@echo "$(BLUE)🧪 Running frontend tests...$(NC)"
	cd frontend && npm test

test-all: ## Run all tests (backend + frontend)
	@make test-backend
	@make test-frontend

security-scan: ## Run security vulnerability scan
	@echo "$(BLUE)🔒 Running security scan...$(NC)"
	docker run --rm -v $(PWD):/app aquasec/trivy fs /app

commit: ## Create a conventional commit (interactive)
	@echo "$(BLUE)📝 Creating conventional commit...$(NC)"
	@echo "$(YELLOW)Select type:$(NC)"
	@echo "  1) feat     - New feature"
	@echo "  2) fix      - Bug fix"
	@echo "  3) docs     - Documentation"
	@echo "  4) refactor - Code refactoring"
	@echo "  5) test     - Tests"
	@echo "  6) chore    - Maintenance"
	@read -p "Choice [1-6]: " choice; \
	case $$choice in \
		1) type="feat";; \
		2) type="fix";; \
		3) type="docs";; \
		4) type="refactor";; \
		5) type="test";; \
		6) type="chore";; \
		*) echo "$(RED)Invalid choice$(NC)"; exit 1;; \
	esac; \
	read -p "Scope (optional): " scope; \
	read -p "Message: " message; \
	if [ -n "$$scope" ]; then \
		git commit -m "$$type($$scope): $$message"; \
	else \
		git commit -m "$$type: $$message"; \
	fi

release: ## Create a new release (interactive)
	@echo "$(BLUE)🎉 Creating release...$(NC)"
	@read -p "Version (e.g., 1.2.3): " version; \
	git tag -a v$$version -m "Release v$$version"; \
	git push origin v$$version; \
	echo "$(GREEN)✓ Release v$$version created!$(NC)"

changelog: ## Generate changelog
	@echo "$(BLUE)📝 Generating changelog...$(NC)"
	@git log --pretty=format:"- %s (%h)" --since="30 days ago" > CHANGELOG.tmp
	@echo "$(GREEN)✓ Changelog saved to CHANGELOG.tmp$(NC)"
