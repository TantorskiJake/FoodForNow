# FoodForNow Deployment Documentation

## Overview

This document provides comprehensive guidance for deploying the FoodForNow application in various environments, from local development to production. The application uses Docker for containerization and GitHub Actions for CI/CD automation.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Docker Configuration](#docker-configuration)
3. [Environment Configuration](#environment-configuration)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Production Deployment](#production-deployment)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)

## Local Development Setup

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **MongoDB**: Local instance or MongoDB Atlas
- **Git**: For version control
- **Docker**: For containerized development (optional)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/FoodForNow.git
   cd FoodForNow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env` file in `foodfornow-backend/`:
   ```env
   MONGO_URI=mongodb://localhost:27017/foodfornow
   JWT_SECRET=your_secure_jwt_secret_key_here
   PORT=3001
   CORS_ORIGIN=http://localhost:5173
   NODE_ENV=development
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Development Scripts

```bash
# Start both frontend and backend
npm run dev

# Start only frontend
cd foodfornow-frontend && npm run dev

# Start only backend
cd foodfornow-backend && npm run dev

# Build frontend for production
npm run build

# Start backend in production mode
npm run start
```

## Docker Configuration

### Backend Dockerfile

```dockerfile
# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
```

### Frontend Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx
RUN adduser -S nginx -u 1001 -G nginx

# Change ownership
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chown -R nginx:nginx /var/cache/nginx
RUN chown -R nginx:nginx /var/log/nginx
RUN chown -R nginx:nginx /etc/nginx/conf.d

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API proxy (if needed)
        location /api/ {
            proxy_pass http://backend:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### Docker Compose

```yaml
version: '3.8'

services:
  # MongoDB
  mongodb:
    image: mongo:6.0
    container_name: foodfornow-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: foodfornow
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    ports:
      - "27017:27017"
    networks:
      - foodfornow-network

  # Backend API
  backend:
    build:
      context: ./foodfornow-backend
      dockerfile: Dockerfile
    container_name: foodfornow-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://admin:password@mongodb:27017/foodfornow?authSource=admin
      - JWT_SECRET=your_production_jwt_secret
      - PORT=3001
      - CORS_ORIGIN=http://localhost:8080
    ports:
      - "3001:3001"
    depends_on:
      - mongodb
    networks:
      - foodfornow-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend
  frontend:
    build:
      context: ./foodfornow-frontend
      dockerfile: Dockerfile
    container_name: foodfornow-frontend
    restart: unless-stopped
    ports:
      - "8080:80"
    depends_on:
      - backend
    networks:
      - foodfornow-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis (for caching and sessions)
  redis:
    image: redis:7-alpine
    container_name: foodfornow-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - foodfornow-network

volumes:
  mongodb_data:
  redis_data:

networks:
  foodfornow-network:
    driver: bridge
```

### Docker Commands

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Access containers
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec mongodb mongosh

# Clean up
docker-compose down -v
docker system prune -a
```

## Environment Configuration

### Development Environment

```env
# Backend (.env)
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/foodfornow
JWT_SECRET=dev_jwt_secret_key
PORT=3001
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
```

```env
# Frontend (.env)
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=FoodForNow
VITE_APP_VERSION=1.0.0
VITE_GEONAMES_USERNAME=your_geonames_username
```

**Note:** `VITE_GEONAMES_USERNAME` is required for location features (city search, timezone) in the Profile page. Get a free username at [geonames.org](https://www.geonames.org/). If not set, location-related features will throw; callers should handle errors gracefully.

### Staging Environment

```env
# Backend (.env)
NODE_ENV=staging
MONGO_URI=mongodb://staging-mongodb:27017/foodfornow
JWT_SECRET=staging_jwt_secret_key
PORT=3001
CORS_ORIGIN=https://staging.foodfornow.com
LOG_LEVEL=info
REDIS_URL=redis://staging-redis:6379
```

### Production Environment

```env
# Backend (.env)
NODE_ENV=production
MONGO_URI=mongodb://production-mongodb:27017/foodfornow
JWT_SECRET=production_jwt_secret_key
PORT=3001
CORS_ORIGIN=https://foodfornow.com
LOG_LEVEL=warn
REDIS_URL=redis://production-redis:6379
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### Environment Variable Management

**Using Docker Secrets (Production):**
```yaml
services:
  backend:
    secrets:
      - jwt_secret
      - mongo_uri
    environment:
      - JWT_SECRET_FILE=/run/secrets/jwt_secret
      - MONGO_URI_FILE=/run/secrets/mongo_uri

secrets:
  jwt_secret:
    external: true
  mongo_uri:
    external: true
```

**Using Kubernetes ConfigMaps:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: foodfornow-config
data:
  NODE_ENV: "production"
  PORT: "3001"
  CORS_ORIGIN: "https://foodfornow.com"
  LOG_LEVEL: "warn"
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Test job
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6.0
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.runCommand(\"ping\").ok'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run backend tests
      run: |
        cd foodfornow-backend
        npm test
      env:
        MONGO_URI: mongodb://localhost:27017/test
        JWT_SECRET: test_secret
    
    - name: Run frontend tests
      run: |
        cd foodfornow-frontend
        npm test
    
    - name: Run linting
      run: |
        npm run lint
        cd foodfornow-frontend && npm run lint

  # Build and push Docker images
  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=sha
    
    - name: Build and push backend image
      uses: docker/build-push-action@v5
      with:
        context: ./foodfornow-backend
        push: true
        tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:${{ steps.meta.outputs.version }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Build and push frontend image
      uses: docker/build-push-action@v5
      with:
        context: ./foodfornow-frontend
        push: true
        tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend:${{ steps.meta.outputs.version }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  # Deploy to staging
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment"
        # Add your staging deployment commands here

  # Deploy to production
  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production environment"
        # Add your production deployment commands here
```

### Deployment Scripts

**Staging Deployment:**
```bash
#!/bin/bash
# deploy-staging.sh

set -e

echo "Deploying to staging..."

# Pull latest images
docker pull ghcr.io/yourusername/foodfornow-backend:develop
docker pull ghcr.io/yourusername/foodfornow-frontend:develop

# Update docker-compose
docker-compose -f docker-compose.staging.yml pull
docker-compose -f docker-compose.staging.yml up -d

# Health check
./scripts/health-check.sh staging.foodfornow.com

echo "Staging deployment completed!"
```

**Production Deployment:**
```bash
#!/bin/bash
# deploy-production.sh

set -e

echo "Deploying to production..."

# Backup database
./scripts/backup-db.sh

# Pull latest images
docker pull ghcr.io/yourusername/foodfornow-backend:main
docker pull ghcr.io/yourusername/foodfornow-frontend:main

# Zero-downtime deployment
docker-compose -f docker-compose.prod.yml up -d --no-deps backend
sleep 30
docker-compose -f docker-compose.prod.yml up -d --no-deps frontend

# Health check
./scripts/health-check.sh foodfornow.com

# Cleanup old images
docker image prune -f

echo "Production deployment completed!"
```

## Production Deployment

### Kubernetes Deployment

**Backend Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: foodfornow-backend
  labels:
    app: foodfornow-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: foodfornow-backend
  template:
    metadata:
      labels:
        app: foodfornow-backend
    spec:
      containers:
      - name: backend
        image: ghcr.io/yourusername/foodfornow-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: mongo-secret
              key: uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Frontend Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: foodfornow-frontend
  labels:
    app: foodfornow-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: foodfornow-frontend
  template:
    metadata:
      labels:
        app: foodfornow-frontend
    spec:
      containers:
      - name: frontend
        image: ghcr.io/yourusername/foodfornow-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Service Configuration:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: foodfornow-backend-service
spec:
  selector:
    app: foodfornow-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: foodfornow-frontend-service
spec:
  selector:
    app: foodfornow-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

### Load Balancer Configuration

**Nginx Ingress:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: foodfornow-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - foodfornow.com
    - www.foodfornow.com
    secretName: foodfornow-tls
  rules:
  - host: foodfornow.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: foodfornow-backend-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: foodfornow-frontend-service
            port:
              number: 80
```

## Monitoring and Logging

### Application Monitoring

**Health Check Endpoint:**
```javascript
// Backend health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});
```

**Prometheus Metrics:**
```javascript
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

### Logging Configuration

**Structured Logging:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'foodfornow-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Error Tracking

**Sentry Integration:**
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app })
  ],
  tracesSampleRate: 1.0,
});

// Request handler
app.use(Sentry.Handlers.requestHandler());

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

## Security Considerations

### Docker Security

**Multi-stage builds:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --only=production
EXPOSE 3001
CMD ["npm", "start"]
```

**Security scanning:**
```yaml
# GitHub Actions security scan
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:${{ steps.meta.outputs.version }}
    format: 'sarif'
    output: 'trivy-results.sarif'
```

### Network Security

**Firewall Configuration:**
```bash
# UFW configuration
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

**SSL/TLS Configuration:**
```nginx
# Nginx SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### Application Security

**Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

**CORS Configuration:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check container logs
docker logs container_name

# Check container status
docker ps -a

# Inspect container
docker inspect container_name
```

**Database connection issues:**
```bash
# Test MongoDB connection
docker exec -it mongodb mongosh --eval "db.runCommand('ping')"

# Check MongoDB logs
docker logs mongodb

# Verify network connectivity
docker network ls
docker network inspect foodfornow-network
```

**Memory issues:**
```bash
# Check container resource usage
docker stats

# Monitor system resources
htop
free -h
df -h
```

### Performance Optimization

**Database optimization:**
```javascript
// MongoDB connection optimization
mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0
});
```

**Caching strategy:**
```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache frequently accessed data
app.get('/api/recipes', async (req, res) => {
  const cacheKey = `recipes:${req.user.id}:${req.query.page}`;
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  const recipes = await Recipe.find({ createdBy: req.user.id });
  await client.setex(cacheKey, 300, JSON.stringify(recipes));
  res.json(recipes);
});
```

### Backup and Recovery

**Database backup script:**
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
MONGO_URI="mongodb://localhost:27017/foodfornow"

# Create backup
docker exec mongodb mongodump --uri="$MONGO_URI" --out="/dump"

# Compress backup
docker exec mongodb tar -czf "/dump_$DATE.tar.gz" -C /dump .

# Copy to backup directory
docker cp mongodb:/dump_$DATE.tar.gz $BACKUP_DIR/

# Cleanup
docker exec mongodb rm -rf /dump /dump_$DATE.tar.gz

echo "Backup completed: $BACKUP_DIR/dump_$DATE.tar.gz"
```

**Restore script:**
```bash
#!/bin/bash
# restore-db.sh

BACKUP_FILE=$1
MONGO_URI="mongodb://localhost:27017/foodfornow"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

# Extract backup
docker exec mongodb tar -xzf "/$BACKUP_FILE" -C /

# Restore database
docker exec mongodb mongorestore --uri="$MONGO_URI" --drop /dump

echo "Database restored from $BACKUP_FILE"
```

---

This deployment documentation provides comprehensive guidance for deploying the FoodForNow application in various environments. For specific implementation details or additional support, refer to the individual configuration files and the development team. 