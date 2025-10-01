# Guide de Test - POC Lighthouse Parallèle

## 🧪 Options de Test

### Option 1: Test Local Rapide

Utilise le script automatisé qui lance 10 audits et mesure la performance:

```bash
# Prérequis: Redis doit tourner
docker-compose up -d redis

# Lancer le test
./test-local.sh
```

Le script va:
1. Vérifier que Redis tourne
2. Lancer l'API NestJS
3. Créer un audit unique (test)
4. Lancer 10 audits en parallèle
5. Monitorer la progression
6. Afficher le temps total
7. Nettoyer

### Option 2: Test Manuel avec Docker

Lancer toute la stack avec Docker:

```bash
# Build et lancer
docker-compose up --build

# Dans un autre terminal, tester l'API
curl http://localhost:3000/lighthouse/stats

# Lancer un batch de 10 audits
curl -X POST http://localhost:3000/lighthouse/batch \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com",
      "https://www.google.com",
      "https://github.com",
      "https://stackoverflow.com",
      "https://www.npmjs.com",
      "https://nestjs.com",
      "https://en.wikipedia.org",
      "https://www.reddit.com",
      "https://twitter.com",
      "https://www.linkedin.com"
    ]
  }'

# Récupérer le batchId de la réponse et monitorer
curl http://localhost:3000/lighthouse/batch/{batchId}
```

### Option 3: Tests E2E Automatisés

Les tests E2E valident automatiquement le parallélisme:

```bash
# Avec Docker (recommandé)
docker-compose up -d
npm run test:e2e

# Logs détaillés
docker-compose logs -f api
```

Les tests vérifient:
- ✅ Création d'audits simples
- ✅ Création de batches
- ✅ 10 audits en parallèle
- ✅ Durée < 3 minutes (preuve du parallélisme)
- ✅ Speedup > 2x vs séquentiel
- ✅ Structure des résultats Lighthouse
- ✅ Gestion d'erreurs

### Option 4: CI/CD GitHub Actions

Les tests tournent automatiquement dans GitHub Actions:

```bash
# Push vers main ou develop
git push origin main

# Ou créer une PR
gh pr create
```

La CI exécute:
1. Tests E2E complets
2. Performance benchmark
3. Build validation

## 📊 Métriques à Observer

### Temps d'exécution attendus:
- **1 audit seul**: 45-60 secondes
- **10 audits séquentiels**: 450-600 secondes (7-10 min)
- **10 audits parallèles**: 60-120 secondes (1-2 min)
- **Speedup**: 5-8x

### Endpoints utiles:

```bash
# Stats de la queue
curl http://localhost:3000/lighthouse/stats

# Statut d'un job
curl http://localhost:3000/lighthouse/job/{jobId}

# Statut d'un batch
curl http://localhost:3000/lighthouse/batch/{batchId}
```

## 🐛 Troubleshooting

### Redis n'est pas accessible
```bash
# Vérifier Redis
docker-compose ps redis
docker-compose logs redis

# Redémarrer Redis
docker-compose restart redis
```

### API ne démarre pas
```bash
# Vérifier les logs
docker-compose logs api

# Rebuild
docker-compose up --build
```

### Tests timeout
```bash
# Augmenter les ressources Docker
# Docker Desktop > Settings > Resources
# RAM: 8GB minimum
# CPU: 4 cores minimum
```

### Chrome crashes
```bash
# Vérifier la mémoire partagée
docker-compose logs api | grep chrome

# Le docker-compose.yml a déjà: shm_size: '2gb'
```

## 📈 Validation du POC

Pour considérer le POC comme réussi, vérifier:

1. ✅ Les 10 audits se lancent simultanément
2. ✅ Durée totale < 3 minutes
3. ✅ Tous les audits retournent des résultats
4. ✅ Chaque résultat contient un score Lighthouse valide
5. ✅ Les logs montrent 10 workers actifs en parallèle
6. ✅ Aucun conflit de ports Chrome
7. ✅ Speedup > 2x vs séquentiel

## 🎯 Exemple de Résultat Attendu

```json
{
  "batchId": "uuid",
  "total": 10,
  "completed": 10,
  "failed": 0,
  "active": 0,
  "waiting": 0,
  "jobs": [
    {
      "jobId": "uuid-1",
      "status": "completed",
      "result": {
        "success": true,
        "url": "https://example.com",
        "duration": 45231,
        "lhr": {
          "categories": {
            "performance": {
              "score": 0.98
            }
          }
        }
      }
    },
    // ... 9 autres jobs
  ]
}
```

## 🔄 Itération Continue

Le POC est configuré pour permettre l'itération rapide:

1. Faire des modifications au code
2. Rebuild: `docker-compose up --build`
3. Ou en dev: `npm run start:dev` (auto-reload)
4. Les tests E2E valident automatiquement
5. La CI vérifie sur chaque push

## 📝 Logs Utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f api

# Filtrer les logs Lighthouse
docker-compose logs api | grep "Lighthouse"

# Voir les logs BullMQ
docker-compose logs api | grep "Worker"

# Stats Redis
docker-compose exec redis redis-cli INFO stats
```