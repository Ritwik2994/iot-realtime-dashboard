#!/bin/bash

# IoT Dashboard Production Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="iot-dashboard"
DOCKER_COMPOSE_FILE="deployment/docker-compose.production.yml"
ENV_FILE="deployment/env.production.example"

echo -e "${GREEN}🚀 Starting IoT Dashboard Production Deployment${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
    exit 1
fi

# Create logs directory
echo -e "${YELLOW}📁 Creating logs directory...${NC}"
mkdir -p logs

# Load environment variables
echo -e "${YELLOW}📋 Loading environment variables...${NC}"
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Build and deploy
echo -e "${YELLOW}🔨 Building and deploying services...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE up -d --build

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 30

# Health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Check backend health
if curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

# Check Grafana
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Grafana is running${NC}"
else
    echo -e "${RED}❌ Grafana health check failed${NC}"
fi

# Check Kibana
if curl -f http://localhost:5601 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Kibana is running${NC}"
else
    echo -e "${RED}❌ Kibana health check failed${NC}"
fi

# Check Prometheus
if curl -f http://localhost:9090 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Prometheus is running${NC}"
else
    echo -e "${RED}❌ Prometheus health check failed${NC}"
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📊 Access your services:${NC}"
echo -e "   Backend API: http://localhost:3000"
echo -e "   Grafana: http://localhost:3001 (admin/admin)"
echo -e "   Kibana: http://localhost:5601"
echo -e "   Prometheus: http://localhost:9090"
echo -e "   MQTT Broker: mqtt://localhost:1883"
