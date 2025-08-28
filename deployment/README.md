# IoT Real-time Dashboard - Deployment Guide

This directory contains all the deployment configurations for the IoT Real-time Dashboard, including CI/CD pipelines, Docker configurations, and monitoring setup.



## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git repository with GitHub Actions enabled

### 1. Environment Setup

Copy the environment example file and configure it:

```bash
cp deployment/env.production.example deployment/.env.production
# Edit the .env.production file with your actual values
```

### 2. Deploy with Script

```bash
./deployment/scripts/deploy.sh
```

### 3. Manual Deployment

```bash
# Build and start all services
docker-compose -f deployment/docker-compose.production.yml --env-file deployment/.env.production up -d --build

# Check service status
docker-compose -f deployment/docker-compose.production.yml ps
```

## 🔧 Services Overview

### Core Services
- **Backend API** (Port 3000): NestJS application with REST/GraphQL APIs
- **MongoDB** (Port 27017): Database for storing IoT data and user information
- **MQTT Broker** (Port 1883): Mosquitto broker for real-time IoT communication
- **Nginx** (Port 80/443): Reverse proxy and load balancer

### Monitoring Stack
- **Prometheus** (Port 9090): Metrics collection and storage
- **Grafana** (Port 3001): Metrics visualization and dashboards
- **Elasticsearch** (Port 9200): Log storage and search
- **Kibana** (Port 5601): Log visualization and analysis
- **Filebeat**: Log collection and shipping



### Access URLs
- **Grafana**: http://localhost:3001 (admin/admin)
- **Kibana**: http://localhost:5601
- **Prometheus**: http://localhost:9090
- **Backend API**: http://localhost:3000

## 🔄 CI/CD Pipeline

The GitHub Actions workflow (`ci-cd/.github/workflows/deploy.yml`) includes:

### Stages
1. **Test**: Linting, unit tests, and coverage
2. **Build**: Docker image building and pushing
3. **Security**: Vulnerability scanning with Trivy
4. **Deploy**: Automatic deployment to staging/production

### Triggers
- Push to `main` branch → Deploy to production
- Push to `develop` branch → Deploy to staging
- Pull requests → Run tests and security scans

### Environment Protection
- Production deployments require manual approval
- Environment-specific secrets and variables
- Rollback capabilities



### Health Checks
```bash
# Backend health
curl http://localhost:3000/api/v1/health

# Prometheus metrics
curl http://localhost:3000/metrics

# Service status
docker-compose -f deployment/docker-compose.production.yml ps
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_ROOT_USERNAME` | MongoDB admin username | admin |
| `MONGO_ROOT_PASSWORD` | MongoDB admin password | - |
| `MONGO_DATABASE` | Database name | iot-dashboard |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 24h |
| `CORS_ORIGIN` | Allowed CORS origins | - |
| `LOG_LEVEL` | Logging level | info |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password | admin |


