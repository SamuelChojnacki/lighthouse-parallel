# 🚀 Lighthouse Parallel

<div align="center">

**Production-ready API for running Google Lighthouse audits at scale**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![NestJS](https://img.shields.io/badge/NestJS-v11-E0234E?logo=nestjs)](https://nestjs.com/)
[![BullMQ](https://img.shields.io/badge/BullMQ-v5-FF6B6B?logo=redis)](https://bullmq.io/)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-v12-F44B21?logo=lighthouse)](https://github.com/GoogleChrome/lighthouse)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)

[Features](#-features) • [Quick Start](#-quick-start) • [API Docs](#-api-documentation) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

Lighthouse Parallel is a **high-performance API** that enables running Google Lighthouse audits **concurrently at massive scale**. Built with NestJS, BullMQ, and modern DevOps practices, it's designed for:

- 🏢 **Enterprises** monitoring hundreds of web properties
- 📊 **Performance teams** running continuous audits in CI/CD
- 🔍 **SEO agencies** analyzing client websites at scale
- 🛠️ **Developers** integrating performance testing into workflows

### Why Lighthouse Parallel?

| Problem | Solution |
|---------|----------|
| Running audits sequentially is **slow** ⏱️ | **Parallel execution** with configurable workers |
| Chrome instances are **resource-heavy** 💾 | **Isolated child processes** with smart lifecycle management |
| Managing job queues is **complex** 🤯 | **BullMQ integration** with retry logic & monitoring |
| No built-in **reporting dashboard** 📊 | **Modern React dashboard** with real-time updates |
| Difficult to **integrate webhooks** 🔔 | **Built-in webhook support** for CI/CD pipelines |

---

## ✨ Features

### 🎯 Core Capabilities

- **⚡ Massive Parallelism**: Run 8-32 concurrent audits (configurable based on server resources)
- **🌍 Internationalization**: Generate reports in 20+ languages (`en`, `fr`, `de`, `es`, `ja`, etc.)
- **📦 Batch Processing**: Audit hundreds of URLs with a single API call
- **🔄 Smart Retries**: Automatic retry with exponential backoff on failures
- **🪝 Webhooks**: Real-time notifications when audits complete
- **📊 Prometheus Metrics**: Production-grade monitoring and observability
- **🎨 Modern Dashboard**: React-based UI for managing audits and viewing results
- **🔒 Security**: API key authentication, JWT tokens, Helmet protection
- **🐳 Docker Ready**: Production-optimized multi-stage builds
- **📈 Auto-scaling**: Handles traffic spikes with BullMQ's smart concurrency

### 🛠️ Technical Highlights

- **Zero Race Conditions**: Parent-controlled child process lifecycle (no arbitrary timeouts)
- **Resource Efficient**: Automatic cleanup of completed jobs and reports
- **Health Checks**: `/health` endpoints for Kubernetes/Docker orchestration
- **Structured Logging**: Winston with daily rotation for production debugging
- **Type Safety**: Full TypeScript across backend and frontend
- **Developer Experience**: Hot reload, comprehensive error handling, Swagger docs

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm 9+
- **Docker** & Docker Compose (recommended)
- **Redis** 6+ (included in docker-compose)

### 🐳 Docker Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/lighthouse-parallel.git
cd lighthouse-parallel

# Generate secure credentials
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" > .api-key
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))" > .jwt-secret

# Create .env file
cat > .env << EOF
PORT=3002
REDIS_HOST=redis
REDIS_PORT=6379
API_KEY=$(cat .api-key)
JWT_SECRET=$(cat .jwt-secret)
WORKER_CONCURRENCY=8
NODE_ENV=production
EOF

# Start all services
docker-compose up --build

# API available at http://localhost:3002
# Dashboard at http://localhost:3002/ (login with configured password)
```

### 💻 Local Development

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Start Redis
docker-compose up redis -d

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run in development mode
npm run start:dev

# Build for production
npm run build
npm run start:prod
```

---

## 📚 API Documentation

### Authentication

All API requests require authentication via API key:

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:3002/lighthouse/stats
```

### Endpoints

#### 🔍 Single Audit

```bash
POST /lighthouse/audit
```

```json
{
  "url": "https://example.com",
  "categories": ["performance", "accessibility", "seo"],
  "locale": "fr",
  "webhookUrl": "https://your-app.com/webhook",
  "webhookToken": "secret"
}
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://example.com",
  "status": "queued",
  "reportUrl": "/reports/550e8400-e29b-41d4-a716-446655440000.json"
}
```

#### 📦 Batch Audits

```bash
POST /lighthouse/batch
```

```json
{
  "urls": [
    "https://example.com",
    "https://google.com",
    "https://github.com"
  ],
  "categories": ["performance"],
  "locale": "de",
  "webhookUrl": "https://your-app.com/batch-webhook"
}
```

**Response:**
```json
{
  "batchId": "batch-550e8400-e29b-41d4-a716-446655440000",
  "total": 3,
  "jobIds": ["job1", "job2", "job3"],
  "status": "processing"
}
```

#### 📊 Check Status

```bash
GET /lighthouse/job/:jobId
GET /lighthouse/batch/:batchId
GET /lighthouse/stats
```

#### 🗑️ Cleanup (Admin)

```bash
POST /lighthouse/cleanup
```

### Webhooks

When a job completes, a POST request is sent to your `webhookUrl`:

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://example.com",
  "status": "completed",
  "performance": 95,
  "accessibility": 100,
  "reportUrl": "https://your-api.com/reports/550e8400.json"
}
```

---

## 🏗️ Architecture

```
┌─────────────────┐
│   React SPA     │  ← Modern Dashboard (Vite + React 19 + Tailwind)
└────────┬────────┘
         │ HTTP/REST
┌────────▼────────────────────────────────────────┐
│           NestJS API (Port 3002)                │
│  ┌──────────────────────────────────────────┐  │
│  │  Controllers (Auth, Audit, Admin, Logs)  │  │
│  └────────────────┬─────────────────────────┘  │
│                   │                             │
│  ┌────────────────▼─────────────────────────┐  │
│  │     Lighthouse Service (Job Manager)     │  │
│  └────────────────┬─────────────────────────┘  │
└───────────────────┼──────────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │   BullMQ Queue      │ ← Redis-backed job queue
         │  (8-32 concurrent)  │
         └──────────┬──────────┘
                    │
      ┌─────────────┴─────────────┐
      │   Lighthouse Processor    │
      │  (Worker with concurrency │
      │   controlled by parent)   │
      └─────────────┬─────────────┘
                    │
        ┌───────────▼────────────┐
        │  Child Process Pool    │
        │  ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
        │  │C1│ │C2│ │..│ │CN│  │ ← Isolated Chrome instances
        │  └──┘ └──┘ └──┘ └──┘  │
        └────────────────────────┘
                    │
        ┌───────────▼────────────┐
        │    Lighthouse Core     │ ← Google's audit engine
        │   (Performance, SEO,   │
        │   Accessibility, etc.) │
        └────────────────────────┘
```

### Key Design Decisions

1. **Parent-Controlled Lifecycle**: No arbitrary timeouts - parent process fully controls child termination with SIGKILL
2. **Process Isolation**: Each audit runs in a forked child process with dedicated Chrome instance
3. **Smart Concurrency**: Worker count configurable based on server CPU/RAM (1-2x vCPU cores)
4. **Graceful Shutdown**: BullMQ handles in-flight jobs during deployment
5. **Stateless Workers**: Horizontal scaling ready (add more workers/servers)

---

## 📊 Performance

### Benchmarks

| Scenario | Sequential | Parallel (8 workers) | Speedup |
|----------|------------|----------------------|---------|
| 10 audits | ~450s | ~60s | **7.5x** |
| 50 audits | ~2250s | ~300s | **7.5x** |
| 100 audits | ~4500s | ~600s | **7.5x** |

**Test environment**: 16 vCPU, 64GB RAM, Hetzner Cloud

### Resource Usage

- **Memory**: ~400MB per Chrome instance
- **CPU**: ~0.5-1 vCPU per active audit
- **Recommended**: 16 workers on 16 vCPU machine

### Scaling Recommendations

| Server Specs | Recommended Workers |
|--------------|---------------------|
| 4 vCPU, 8GB RAM | 4-6 workers |
| 8 vCPU, 16GB RAM | 8-12 workers |
| 16 vCPU, 64GB RAM | 16-24 workers ⭐ |
| 32 vCPU, 128GB RAM | 32-48 workers |

---

## 🛠️ Configuration

### Environment Variables

```env
# Server
PORT=3002
NODE_ENV=production

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Security
API_KEY=your-secure-api-key
JWT_SECRET=your-jwt-secret
DASHBOARD_PASSWORD_HASH=bcrypt-hash

# Performance
WORKER_CONCURRENCY=8  # Adjust based on server resources

# CORS
CORS_ORIGINS=http://localhost:5173,https://your-domain.com
```

### Lighthouse Options

Customize audit settings in `src/lighthouse/workers/lighthouse-runner.js`:

```javascript
const lighthouseOptions = {
  logLevel: 'error',
  output: 'json',
  onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
  locale: 'en',
  formFactor: 'mobile',
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4
  }
};
```

---

## 🐳 Production Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

  api:
    build: .
    ports:
      - "3002:3002"
    environment:
      REDIS_HOST: redis
      WORKER_CONCURRENCY: 16
    depends_on:
      - redis
    deploy:
      resources:
        limits:
          cpus: '8'
          memory: 16G
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lighthouse-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: lighthouse-parallel:latest
        resources:
          requests:
            cpu: "4"
            memory: "8Gi"
          limits:
            cpu: "8"
            memory: "16Gi"
        env:
        - name: WORKER_CONCURRENCY
          value: "8"
```

---

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Contribution Ideas

- 🌟 Add support for custom Lighthouse configs
- 📊 Enhance dashboard with charts and analytics
- 🔌 Add integrations (Slack, Discord, Teams)
- 🧪 Improve test coverage
- 📝 Translate documentation to other languages
- 🚀 Performance optimizations
- 🐛 Bug fixes and improvements

---

## 🗺️ Roadmap

- [x] Parallel audit execution
- [x] Batch processing
- [x] Webhook notifications
- [x] React dashboard
- [x] Multi-language reports
- [x] Prometheus metrics
- [ ] GraphQL API
- [ ] WebSocket real-time updates
- [ ] Historical trend analysis
- [ ] Custom Lighthouse plugins
- [ ] Slack/Discord integrations
- [ ] Scheduled recurring audits
- [ ] PDF report generation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Google Lighthouse](https://github.com/GoogleChrome/lighthouse) - The audit engine
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [BullMQ](https://bullmq.io/) - Premium queue package for handling distributed jobs
- [Chrome Launcher](https://github.com/GoogleChrome/chrome-launcher) - Chrome instance management

---

## 📞 Support

- 📧 Email: support@lighthouse-parallel.dev
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/lighthouse-parallel/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/lighthouse-parallel/discussions)
- 📖 Documentation: [Wiki](https://github.com/yourusername/lighthouse-parallel/wiki)

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ by Sabaï team

</div>
