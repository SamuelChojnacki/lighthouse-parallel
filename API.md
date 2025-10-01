# Lighthouse Parallel API - Guide d'utilisation

## Vue d'ensemble

API production-ready pour exécuter des audits Lighthouse en parallèle. Cette API permet d'auditer plusieurs sites web simultanément avec des workers configurables.

**Caractéristiques principales:**
- ✅ Traitement parallèle avec concurrence configurable (défaut: 5 workers)
- ✅ File d'attente Redis avec BullMQ
- ✅ Health checks (liveness & readiness)
- ✅ Métriques Prometheus
- ✅ Logs structurés (JSON en production)
- ✅ Graceful shutdown
- ✅ Documentation Swagger interactive

## Démarrage rapide

### Avec Docker

```bash
# Démarrer l'API et Redis
docker-compose up -d

# Vérifier les logs
docker-compose logs -f api

# Arrêter
docker-compose down
```

### En local

```bash
# Installer les dépendances
npm install

# Démarrer Redis
docker-compose up -d redis

# Démarrer l'API en mode développement
npm run start:dev

# Ou en mode production
npm run build
npm run start:prod
```

Au démarrage, vous verrez un joli banner avec tous les endpoints disponibles :

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ⚡ LIGHTHOUSE API - Production Ready ⚡                    ║
║                                                               ║
║  🚀 Server:        http://localhost:3000                      ║
║  📊 Dashboard:     http://localhost:3000/lighthouse/dashboard ║
║  📚 API Docs:      http://localhost:3000/api                  ║
║  📈 Metrics:       http://localhost:3000/metrics              ║
║  🏥 Health:        http://localhost:3000/health               ║
║  ✅ Ready:         http://localhost:3000/health/ready         ║
║                                                               ║
║  🔧 Workers: 5 concurrent audits                             ║
║  🗄️  Redis:  localhost:6379                                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

## Configuration

Variables d'environnement (fichier `.env`):

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Workers
WORKER_CONCURRENCY=5

# API
PORT=3000
NODE_ENV=production
```

**Note importante:** `WORKER_CONCURRENCY` contrôle le nombre d'audits exécutés simultanément.
- Valeur recommandée: 5-10
- Trop élevé (>20) peut causer des problèmes de performance système

## Endpoints disponibles

### Base URL
```
http://localhost:3000
```

### Documentation et Dashboards

#### 📊 Dashboard Queue (NOUVEAU!)
```
http://localhost:3000/lighthouse/dashboard
```
Interface visuelle magnifique avec :
- Statistiques en temps réel
- Graphiques animés
- Barres de progression
- Auto-refresh toutes les 5 secondes

#### 📈 Dashboard Métriques (NOUVEAU!)
```
http://localhost:3000/metrics/dashboard
```
Dashboard des métriques Prometheus avec :
- Indicateurs visuels (gauges)
- Graphiques de tendance
- Utilisation des workers
- Auto-refresh toutes les 10 secondes

#### 📚 Documentation Swagger
```
http://localhost:3000/api
```
Documentation interactive avec tous les endpoints et exemples.

---

## 1. Créer un audit simple

**Endpoint:** `POST /lighthouse/audit`

Audite une seule URL avec Lighthouse.

### Requête

```bash
curl -X POST http://localhost:3000/lighthouse/audit \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "categories": ["performance", "accessibility"]
  }'
```

### Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `url` | string | ✅ | URL complète à auditer (doit commencer par http:// ou https://) |
| `categories` | string[] | ❌ | Catégories Lighthouse: `performance`, `accessibility`, `best-practices`, `seo`, `pwa` |

### Réponse

```json
{
  "jobId": "abc123-def456-ghi789",
  "url": "https://example.com",
  "status": "pending",
  "message": "Audit job queued successfully"
}
```

---

## 2. Créer un audit batch (plusieurs URLs)

**Endpoint:** `POST /lighthouse/batch`

**✨ C'est l'endpoint principal pour auditer plusieurs sites en parallèle.**

### Requête

```bash
curl -X POST http://localhost:3000/lighthouse/batch \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com",
      "https://www.google.com",
      "https://github.com",
      "https://stackoverflow.com",
      "https://www.wikipedia.org"
    ],
    "categories": ["performance", "accessibility"]
  }'
```

### Avec un fichier JSON

```bash
# Créer le fichier batch-request.json
cat > batch-request.json << 'EOF'
{
  "urls": [
    "https://example.com",
    "https://www.google.com",
    "https://github.com"
  ],
  "categories": ["performance", "accessibility", "seo"]
}
EOF

# Envoyer la requête
curl -X POST http://localhost:3000/lighthouse/batch \
  -H "Content-Type: application/json" \
  -d @batch-request.json
```

### Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `urls` | string[] | ✅ | Tableau d'URLs à auditer (toutes doivent être valides) |
| `categories` | string[] | ❌ | Catégories appliquées à tous les audits |

### Réponse

```json
{
  "batchId": "batch-xyz789",
  "jobs": [
    {
      "jobId": "job-1",
      "url": "https://example.com",
      "status": "pending"
    },
    {
      "jobId": "job-2",
      "url": "https://www.google.com",
      "status": "pending"
    },
    {
      "jobId": "job-3",
      "url": "https://github.com",
      "status": "pending"
    }
  ],
  "totalJobs": 3,
  "message": "Batch audit jobs queued successfully"
}
```

### Comportement du traitement parallèle

Si `WORKER_CONCURRENCY=5` et vous envoyez 20 URLs:
1. Les 5 premières URLs seront traitées immédiatement
2. Dès qu'un audit se termine, le suivant démarre
3. Maximum 5 audits actifs simultanément
4. Les 15 autres attendent en file (`waiting` state)

**Exemple avec 20 URLs:**
```
Active:  5/5 (100%)  ████████████
Waiting: 15         ████████████████████████
```

---

## 3. Vérifier le statut d'un job

**Endpoint:** `GET /lighthouse/job/:jobId`

Récupère le statut et les résultats d'un audit.

### Requête

```bash
curl http://localhost:3000/lighthouse/job/abc123-def456-ghi789
```

### Réponse (en cours)

```json
{
  "jobId": "abc123-def456-ghi789",
  "state": "active",
  "progress": 50,
  "data": {
    "url": "https://example.com",
    "categories": ["performance"]
  }
}
```

### Réponse (terminé)

```json
{
  "jobId": "abc123-def456-ghi789",
  "state": "completed",
  "progress": 100,
  "result": {
    "success": true,
    "url": "https://example.com",
    "scores": {
      "performance": 100,
      "accessibility": 95,
      "best-practices": 92,
      "seo": 100
    },
    "metrics": {
      "firstContentfulPaint": 1200,
      "largestContentfulPaint": 2400,
      "totalBlockingTime": 150,
      "cumulativeLayoutShift": 0.01,
      "speedIndex": 1800
    },
    "duration": 8600
  }
}
```

### États possibles

| État | Description |
|------|-------------|
| `waiting` | Job en file d'attente |
| `active` | Audit en cours d'exécution |
| `completed` | Audit terminé avec succès |
| `failed` | Audit échoué |

---

## 4. Vérifier le statut d'un batch

**Endpoint:** `GET /lighthouse/batch/:batchId`

Récupère le statut de tous les jobs d'un batch.

### Requête

```bash
curl http://localhost:3000/lighthouse/batch/batch-xyz789
```

### Réponse

```json
{
  "batchId": "batch-xyz789",
  "totalJobs": 3,
  "completed": 2,
  "failed": 0,
  "pending": 0,
  "active": 1,
  "jobs": [
    {
      "jobId": "job-1",
      "url": "https://example.com",
      "state": "completed",
      "result": {
        "success": true,
        "scores": { "performance": 100 }
      }
    },
    {
      "jobId": "job-2",
      "url": "https://www.google.com",
      "state": "completed",
      "result": {
        "success": true,
        "scores": { "performance": 98 }
      }
    },
    {
      "jobId": "job-3",
      "url": "https://github.com",
      "state": "active",
      "progress": 60
    }
  ]
}
```

---

## 5. Statistiques de la queue

**Endpoint:** `GET /lighthouse/stats`

Affiche l'état actuel de la file d'attente.

### Requête

```bash
curl http://localhost:3000/lighthouse/stats
```

### Réponse

```json
{
  "waiting": 5,
  "active": 3,
  "completed": 120,
  "failed": 2,
  "delayed": 0,
  "paused": 0
}
```

---

## Health Checks

### Liveness check

**Endpoint:** `GET /health`

Vérifie que l'API est en vie (pour Kubernetes liveness probe).

```bash
curl http://localhost:3000/health
```

### Readiness check

**Endpoint:** `GET /health/ready`

Vérifie que l'API et toutes ses dépendances sont prêtes (pour Kubernetes readiness probe).

```bash
curl http://localhost:3000/health/ready
```

---

## Métriques Prometheus

**Endpoint:** `GET /metrics`

Expose les métriques au format Prometheus.

```bash
curl http://localhost:3000/metrics
```

### Métriques personnalisées

| Métrique | Type | Description |
|----------|------|-------------|
| `lighthouse_jobs_total` | Counter | Total des jobs (labels: status) |
| `lighthouse_jobs_failed_total` | Counter | Total des jobs échoués (labels: reason) |
| `lighthouse_job_duration_seconds` | Histogram | Durée des audits (labels: url_host) |
| `lighthouse_queue_wait_time_seconds` | Histogram | Temps d'attente en queue |
| `lighthouse_queue_size` | Gauge | Taille de la queue (labels: state) |
| `lighthouse_active_workers` | Gauge | Nombre de workers actifs |

---

## Cas d'usage: Intégration avec un autre service

Cette API est conçue pour être appelée par un autre service interne.

### Exemple: Service de monitoring

```javascript
// monitoring-service.js
const axios = require('axios');

const LIGHTHOUSE_API = 'http://lighthouse-api:3000';

async function auditWebsites(urls) {
  // 1. Créer un batch audit
  const response = await axios.post(`${LIGHTHOUSE_API}/lighthouse/batch`, {
    urls: urls,
    categories: ['performance', 'accessibility', 'seo']
  });

  const { batchId, jobs } = response.data;
  console.log(`Batch créé: ${batchId} avec ${jobs.length} jobs`);

  // 2. Attendre que tous les jobs soient terminés
  let allCompleted = false;
  while (!allCompleted) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Attendre 5s

    const status = await axios.get(`${LIGHTHOUSE_API}/lighthouse/batch/${batchId}`);
    const { completed, failed, active, pending } = status.data;

    console.log(`Progression: ${completed}/${jobs.length} terminés, ${active} actifs, ${pending} en attente`);

    allCompleted = (completed + failed) === jobs.length;
  }

  // 3. Récupérer les résultats finaux
  const finalStatus = await axios.get(`${LIGHTHOUSE_API}/lighthouse/batch/${batchId}`);
  return finalStatus.data;
}

// Utilisation
const websites = [
  'https://myapp.com',
  'https://myapp.com/product',
  'https://myapp.com/checkout'
];

auditWebsites(websites)
  .then(results => {
    console.log('Résultats:', JSON.stringify(results, null, 2));
    // Envoyer les résultats à votre API principale
  })
  .catch(error => {
    console.error('Erreur:', error.message);
  });
```

---

## Déploiement en production

### Docker Compose

Le fichier `docker-compose.yml` est configuré pour la production:

```yaml
services:
  redis:
    # Persistence avec AOF (Append-Only File)
    command: redis-server --appendonly yes --appendfsync everysec
    volumes:
      - redis-data:/data

  api:
    environment:
      - NODE_ENV=production
      - WORKER_CONCURRENCY=10
    healthcheck:
      test: ['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1']
      interval: 30s
      timeout: 10s
      retries: 3
```

### Graceful Shutdown

L'API gère correctement les signaux SIGTERM/SIGINT:
1. Arrête d'accepter de nouvelles requêtes
2. Attend que les jobs actifs se terminent (max 2 minutes)
3. Ferme les connexions Redis proprement
4. Exit avec code 0

```bash
# Arrêt gracieux
docker-compose down
# ou
kill -SIGTERM <pid>
```

---

## Monitoring et Observabilité

### Logs

Les logs sont en format JSON en production:

```json
{
  "level": "info",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "Starting Lighthouse audit for https://example.com (Job: job-123)",
  "context": "LighthouseProcessor"
}
```

### Prometheus + Grafana

1. Configurer Prometheus pour scraper `/metrics`
2. Créer des dashboards Grafana avec les métriques

Exemple de configuration Prometheus:

```yaml
scrape_configs:
  - job_name: 'lighthouse-api'
    scrape_interval: 15s
    static_configs:
      - targets: ['lighthouse-api:3000']
```

---

## Troubleshooting

### Les audits ne se lancent pas en parallèle

✅ **Solution:** Vérifier que `WORKER_CONCURRENCY` est configuré dans le `.env` et que le processeur a la configuration de concurrence:

```typescript
@Processor('lighthouse-audits', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
})
```

### L'API crash avec trop d'URLs

✅ **Solution:** Réduire `WORKER_CONCURRENCY` à 5-10. Valeur par défaut recommandée: 5.

### Redis est plein

✅ **Solution:** Les jobs complétés restent en Redis. Pour nettoyer:

```bash
# Se connecter à Redis
docker-compose exec redis redis-cli

# Voir toutes les clés
KEYS *

# Supprimer les jobs terminés
# (À automatiser via un cron job)
```

### Les jobs restent en "waiting"

✅ **Solution:** Vérifier que les workers sont actifs:

```bash
curl http://localhost:3000/lighthouse/stats
```

Si `active: 0` mais `waiting: X`, redémarrer l'API.

---

## Limites et bonnes pratiques

### Limites

- **Timeout par audit:** 2 minutes maximum
- **Concurrence recommandée:** 5-10 workers
- **Ressources:** ~500MB RAM par worker actif

### Bonnes pratiques

1. **Batch size:** Grouper les URLs par lots de 50-100 maximum
2. **Retry logic:** Implémenter une logique de retry dans votre service appelant
3. **Rate limiting:** Ne pas envoyer plus de 1000 URLs/heure sans monitoring
4. **Monitoring:** Toujours surveiller `/metrics` et `/health/ready`
5. **Backup Redis:** Configurer des sauvegardes régulières du volume Redis

---

## Support et contribution

Pour signaler un bug ou demander une fonctionnalité, contactez l'équipe de développement.

**Version:** 1.0.0
**License:** MIT
