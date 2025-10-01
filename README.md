# Lighthouse Parallel POC

POC démontrant l'exécution de 10 audits Lighthouse en parallèle avec NestJS, BullMQ et Docker.

## 🎯 Objectif

Prouver qu'il est possible d'exécuter 10 audits Lighthouse simultanément avec:
- Isolation complète via child processes
- Queue managée par BullMQ
- Tests E2E automatisés
- CI/CD pour validation continue

## 🏗️ Architecture

```
API NestJS → BullMQ Queue → 10 Workers (child processes) → Chrome instances isolées
                ↓
             Redis
```

## 📦 Stack Technique

- **NestJS** - Framework API
- **BullMQ** - Queue de jobs avec 10 workers concurrents
- **Lighthouse** - Audits de performance
- **Chrome-launcher** - Gestion des instances Chrome
- **Redis** - Backend pour BullMQ
- **Docker** - Containerisation

## 🚀 Installation

### Prérequis
- Node.js 20+
- Docker & Docker Compose
- Redis (via Docker ou local)

### Setup Local

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# IMPORTANT: Configurer l'authentification du dashboard
# Étape 1: Générer une API Key sécurisée
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Copier le résultat dans .env → API_KEY

# Étape 2: Générer un secret JWT
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
# Copier le résultat dans .env → JWT_SECRET

# Étape 3: Créer un hash bcrypt pour votre mot de passe dashboard
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('VotreMotDePasseIci', 10).then(console.log)"
# Copier le résultat dans .env → DASHBOARD_PASSWORD_HASH

# Démarrer Redis (via Docker)
docker-compose up redis -d

# Lancer l'application
npm run start:dev
```

### Setup avec Docker

```bash
# Build et lancer tous les services
docker-compose up --build

# L'API sera disponible sur http://localhost:3000
```

## 🎮 Utilisation

### Lancer un audit unique

```bash
curl -X POST http://localhost:3000/lighthouse/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

Réponse:
```json
{
  "jobId": "uuid",
  "url": "https://example.com",
  "status": "queued"
}
```

### Lancer 10 audits en parallèle

```bash
curl -X POST http://localhost:3000/lighthouse/batch \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com",
      "https://google.com",
      "https://github.com",
      "https://stackoverflow.com",
      "https://npmjs.com",
      "https://nestjs.com",
      "https://wikipedia.org",
      "https://reddit.com",
      "https://twitter.com",
      "https://linkedin.com"
    ]
  }'
```

Réponse:
```json
{
  "batchId": "uuid",
  "jobIds": ["uuid1", "uuid2", ...],
  "total": 10,
  "status": "queued"
}
```

### Vérifier le statut d'un job

```bash
curl http://localhost:3000/lighthouse/job/{jobId}
```

### Vérifier le statut d'un batch

```bash
curl http://localhost:3000/lighthouse/batch/{batchId}
```

### Statistiques de la queue

```bash
curl http://localhost:3000/lighthouse/stats
```

## 🧪 Tests

### Tests E2E

```bash
# Avec Docker (recommandé)
docker-compose up -d
npm run test:e2e

# Local (nécessite Redis)
npm run test:e2e
```

### Tests incluent:
- ✅ Audit unique
- ✅ 10 audits en parallèle
- ✅ Validation du speedup (> 2x)
- ✅ Vérification des résultats Lighthouse
- ✅ Batches concurrents
- ✅ Gestion d'erreurs

## 📊 Résultats Attendus

- **1 audit seul**: ~45-60s
- **10 audits parallèles**: ~60-120s
- **Speedup attendu**: 5-8x
- **Si séquentiel**: ~450-600s

## 🔄 CI/CD

GitHub Actions pipeline inclut:
1. **test-parallel-lighthouse** - Tests E2E complets
2. **performance-benchmark** - Mesure de performance
3. **build-test** - Validation du build

Pipeline se déclenche sur:
- Push sur `main` ou `develop`
- Pull requests vers `main`

## 📁 Structure du Projet

```
/
├── src/
│   ├── config/
│   │   └── queue.config.ts          # Configuration BullMQ
│   ├── lighthouse/
│   │   ├── lighthouse.module.ts      # Module Lighthouse
│   │   ├── lighthouse.controller.ts  # Endpoints API
│   │   ├── lighthouse.service.ts     # Business logic
│   │   ├── lighthouse.processor.ts   # BullMQ worker (10 concurrent)
│   │   ├── dto/                      # DTOs de validation
│   │   └── workers/
│   │       └── lighthouse-runner.js  # Child process script
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── parallel-lighthouse.e2e-spec.ts  # Tests E2E
│   └── jest-e2e.json
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI/CD pipeline
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 🔧 Configuration

### Variables d'environnement

```env
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
```

### Configuration BullMQ

```typescript
{
  concurrency: 10,  // 10 workers parallèles
  limiter: {
    max: 10,        // Max 10 jobs simultanés
    duration: 1000  // Par seconde
  }
}
```

### Configuration Lighthouse

```typescript
{
  onlyCategories: ['performance'],
  formFactor: 'mobile',
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4
  },
  timeout: 90000  // 90s max par audit
}
```

## ⚠️ Points d'Attention

1. **Mémoire**: 10 Chrome instances = ~2-4GB RAM
2. **CPU**: Minimum 4 cores recommandé
3. **Timeouts**: 90s par audit + 30s overhead
4. **Ports**: Chrome-launcher auto-assigne les ports
5. **Résultats**: Les scores peuvent être légèrement faussés par la charge système

## 🐛 Troubleshooting

### Docker n'a pas assez de mémoire
```bash
# Augmenter les ressources Docker
# Docker Desktop > Settings > Resources
# RAM: 8GB minimum
```

### Tests timeout
```bash
# Augmenter le timeout dans jest-e2e.json
"testTimeout": 600000  # 10 minutes
```

### Chrome crashes
```bash
# Vérifier les logs
docker-compose logs api

# Augmenter shared memory
# Dans docker-compose.yml: shm_size: '2gb'
```

## 📈 Métriques

Le POC mesure:
- Durée totale d'exécution
- Nombre de jobs complétés/échoués
- Speedup vs exécution séquentielle
- Performance individuelle de chaque audit

## 🎉 Critères de Succès

- ✅ 10 audits lancés simultanément
- ✅ Tous les résultats retournés avec succès
- ✅ Durée < 3 minutes (preuve du parallélisme)
- ✅ Tests E2E passent en CI/CD
- ✅ Speedup > 2x vs séquentiel
- ✅ Isolation complète entre audits

## 📝 Licence

MIT