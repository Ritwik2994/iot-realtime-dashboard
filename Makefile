# IoT Realtime Dashboard Makefile
# Usage: make <command>

# Variables
PROJECT_NAME := iot-realtime-dashboard
DOCKER_COMPOSE_PROD := deployment/docker-compose.production.yml
DOCKER_COMPOSE_DEV := docker-compose.yml
ENV_PROD := deployment/env.production.example
ENV_DEV := .env
NODE_ENV := development

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# Help command
.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)🚀 IoT Realtime Dashboard - Available Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""

# Installation commands
.PHONY: install
install: ## Install all dependencies
	@echo "$(GREEN)📦 Installing dependencies...$(NC)"
	yarn install
	@echo "$(GREEN)✅ Dependencies installed successfully$(NC)"

.PHONY: install-prod
install-prod: ## Install production dependencies only
	@echo "$(GREEN)📦 Installing production dependencies...$(NC)"
	yarn install --production
	@echo "$(GREEN)✅ Production dependencies installed successfully$(NC)"

# Development commands
.PHONY: dev
dev: ## Run the application in development mode
	@echo "$(GREEN)🚀 Starting development server...$(NC)"
	yarn start:dev

.PHONY: dev-debug
dev-debug: ## Run the application in debug mode
	@echo "$(GREEN)🐛 Starting development server in debug mode...$(NC)"
	yarn start:debug

# Production commands
.PHONY: prod
prod: ## Run the application in production mode
	@echo "$(GREEN)🚀 Starting production server...$(NC)"
	yarn start:prod

.PHONY: build
build: ## Build the application for production
	@echo "$(GREEN)🔨 Building application...$(NC)"
	yarn build
	@echo "$(GREEN)✅ Build completed successfully$(NC)"

# Testing commands
.PHONY: test
test: ## Run all tests
	@echo "$(GREEN)🧪 Running tests...$(NC)"
	yarn test

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	@echo "$(GREEN)🧪 Running tests in watch mode...$(NC)"
	yarn test:watch

.PHONY: test-coverage
test-coverage: ## Run tests with coverage
	@echo "$(GREEN)🧪 Running tests with coverage...$(NC)"
	yarn test:cov

.PHONY: test-e2e
test-e2e: ## Run end-to-end tests
	@echo "$(GREEN)🧪 Running end-to-end tests...$(NC)"
	yarn test:e2e

# Docker commands
.PHONY: docker-build
docker-build: ## Build Docker image
	@echo "$(GREEN)🐳 Building Docker image...$(NC)"
	yarn docker:build

.PHONY: docker-run
docker-run: ## Run Docker container
	@echo "$(GREEN)🐳 Running Docker container...$(NC)"
	yarn docker:run

# MQTT Simulator commands
.PHONY: mqtt-simulator
mqtt-simulator: ## Run MQTT simulator
	@echo "$(GREEN)📡 Starting MQTT simulator...$(NC)"
	yarn mqtt:simulate

.PHONY: mqtt-simulator-docker
mqtt-simulator-docker: ## Run MQTT simulator in Docker
	@echo "$(GREEN)📡 Starting MQTT simulator in Docker...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_PROD) --profile simulator up mqtt-simulator

# Deployment commands
.PHONY: deploy
deploy: ## Deploy to production using Docker Compose
	@echo "$(GREEN)🚀 Deploying to production...$(NC)"
	@if [ ! -f "$(ENV_PROD)" ]; then \
		echo "$(RED)❌ Environment file not found: $(ENV_PROD)$(NC)"; \
		echo "$(YELLOW)💡 Please copy env.example to $(ENV_PROD) and configure it$(NC)"; \
		exit 1; \
	fi
	@chmod +x deployment/scripts/deploy.sh
	./deployment/scripts/deploy.sh

.PHONY: deploy-dev
deploy-dev: ## Deploy development environment
	@echo "$(GREEN)🚀 Deploying development environment...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_DEV) up -d --build

.PHONY: deploy-stop
deploy-stop: ## Stop production deployment
	@echo "$(YELLOW)🛑 Stopping production deployment...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_PROD) down

.PHONY: deploy-logs
deploy-logs: ## Show production deployment logs
	@echo "$(BLUE)📋 Showing production logs...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_PROD) logs -f

.PHONY: deploy-status
deploy-status: ## Show production deployment status
	@echo "$(BLUE)📊 Showing production deployment status...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_PROD) ps

# Database commands
.PHONY: db-start
db-start: ## Start MongoDB database
	@echo "$(GREEN)🗄️ Starting MongoDB...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_PROD) up -d mongodb

.PHONY: db-stop
db-stop: ## Stop MongoDB database
	@echo "$(YELLOW)🛑 Stopping MongoDB...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_PROD) stop mongodb

.PHONY: db-logs
db-logs: ## Show MongoDB logs
	@echo "$(BLUE)📋 Showing MongoDB logs...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_PROD) logs -f mongodb

# MQTT Broker commands
.PHONY: mqtt-start
mqtt-start: ## Start MQTT broker
	@echo "$(GREEN)📡 Starting MQTT broker...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_PROD) up -d mqtt-broker

.PHONY: mqtt-stop
mqtt-stop: ## Stop MQTT broker
	@echo "$(YELLOW)🛑 Stopping MQTT broker...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_PROD) stop mqtt-broker

.PHONY: mqtt-logs
mqtt-logs: ## Show MQTT broker logs
	@echo "$(BLUE)📋 Showing MQTT broker logs...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_PROD) logs -f mqtt-broker

# Utility commands
.PHONY: clean
clean: ## Clean build artifacts and node_modules
	@echo "$(YELLOW)🧹 Cleaning build artifacts...$(NC)"
	rm -rf dist/
	rm -rf node_modules/
	rm -rf coverage/
	@echo "$(GREEN)✅ Clean completed$(NC)"

.PHONY: clean-docker
clean-docker: ## Clean Docker containers and images
	@echo "$(YELLOW)🧹 Cleaning Docker containers and images...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_PROD) down -v --rmi all
	docker system prune -f
	@echo "$(GREEN)✅ Docker clean completed$(NC)"

.PHONY: lint
lint: ## Run ESLint
	@echo "$(GREEN)🔍 Running ESLint...$(NC)"
	yarn lint

.PHONY: format
format: ## Format code with Prettier
	@echo "$(GREEN)💅 Formatting code...$(NC)"
	yarn format

.PHONY: health
health: ## Check application health
	@echo "$(GREEN)🏥 Checking application health...$(NC)"
	@if curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; then \
		echo "$(GREEN)✅ Application is healthy$(NC)"; \
	else \
		echo "$(RED)❌ Application health check failed$(NC)"; \
		exit 1; \
	fi

# Setup commands
.PHONY: setup
setup: ## Initial project setup
	@echo "$(GREEN)🔧 Setting up project...$(NC)"
	@if [ ! -f ".env" ]; then \
		cp env.example .env; \
		echo "$(YELLOW)📝 Created .env file from env.example$(NC)"; \
	fi
	@if [ ! -f "$(ENV_PROD)" ]; then \
		cp env.example $(ENV_PROD); \
		echo "$(YELLOW)📝 Created $(ENV_PROD) from env.example$(NC)"; \
	fi
	yarn install
	@echo "$(GREEN)✅ Project setup completed$(NC)"

.PHONY: setup-docker
setup-docker: ## Setup Docker environment
	@echo "$(GREEN)🐳 Setting up Docker environment...$(NC)"
	@if [ ! -f "$(ENV_PROD)" ]; then \
		cp env.example $(ENV_PROD); \
		echo "$(YELLOW)📝 Created $(ENV_PROD) from env.example$(NC)"; \
	fi
	@echo "$(GREEN)✅ Docker environment setup completed$(NC)"
	@echo "$(YELLOW)💡 Please configure $(ENV_PROD) before running deploy$(NC)"

# Monitoring commands
.PHONY: logs
logs: ## Show all application logs
	@echo "$(BLUE)📋 Showing all application logs...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_PROD) logs -f

.PHONY: logs-backend
logs-backend: ## Show backend logs
	@echo "$(BLUE)📋 Showing backend logs...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_PROD) logs -f backend

.PHONY: logs-nginx
logs-nginx: ## Show nginx logs
	@echo "$(BLUE)📋 Showing nginx logs...$(NC)"
	docker-compose -f $(DOCKER_COMPOSE_PROD) logs -f nginx

# Quick start commands
.PHONY: quick-start
quick-start: ## Quick start development environment
	@echo "$(GREEN)⚡ Quick starting development environment...$(NC)"
	@make setup
	@make dev

.PHONY: quick-deploy
quick-deploy: ## Quick deploy to production
	@echo "$(GREEN)⚡ Quick deploying to production...$(NC)"
	@make setup-docker
	@make deploy

# Development workflow
.PHONY: dev-workflow
dev-workflow: ## Complete development workflow (install, lint, test, dev)
	@echo "$(GREEN)🔄 Running development workflow...$(NC)"
	@make install
	@make lint
	@make test
	@make dev

# Production workflow
.PHONY: prod-workflow
prod-workflow: ## Complete production workflow (build, test, deploy)
	@echo "$(GREEN)🔄 Running production workflow...$(NC)"
	@make build
	@make test
	@make deploy
