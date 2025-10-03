# Lighthouse Parallel API - Documentation

## 🚀 Introduction

Cette API permet d'effectuer des audits Lighthouse sur des sites web de manière parallèle et optimisée. Elle supporte l'audit unique ou par batch de plusieurs URLs simultanément.

## 📋 Prérequis

- **URL de l'API** : `https://lighthouse.mitain.com`
- **Clé API** : Requise pour toutes les requêtes (header `X-API-Key`)
- **Format des données** : JSON

## 🔐 Authentification

Toutes les requêtes doivent inclure la clé API dans les headers :

```http
X-API-Key: wKuU92vSNq67J16/GF55q1s5SYgztBy5vqQ9lILuM+I=
Content-Type: application/json
```

## 📍 Endpoints disponibles

### 1. Audit unique

**POST** `/lighthouse/audit`

Crée un audit Lighthouse pour une URL unique.

#### Request Body

```json
{
  "url": "https://example.com",
  "categories": ["performance", "accessibility", "seo", "best-practices"]  // Optionnel
}
```

#### Catégories disponibles
- `performance` - Analyse des performances
- `accessibility` - Accessibilité
- `best-practices` - Bonnes pratiques
- `seo` - Optimisation SEO
- `pwa` - Progressive Web App

Si aucune catégorie n'est spécifiée, toutes seront analysées.

#### Response (201 Created)

```json
{
  "jobId": "abc123-def456-ghi789",
  "url": "https://example.com",
  "status": "pending",
  "message": "Audit job queued successfully"
}
```

### 2. Audit en batch

**POST** `/lighthouse/batch`

Crée des audits Lighthouse pour plusieurs URLs en parallèle.

#### Request Body

```json
{
  "urls": [
    "https://example.com",
    "https://google.com",
    "https://github.com"
  ],
  "categories": ["performance", "accessibility"]  // Optionnel
}
```

#### Response (201 Created)

```json
{
  "batchId": "batch-xyz789",
  "jobIds": ["job-1", "job-2", "job-3"],
  "total": 3,
  "status": "queued"
}
```

### 3. Statut d'un job

**GET** `/lighthouse/job/{jobId}`

Récupère le statut et les résultats d'un audit.

#### Response (200 OK)

```json
{
  "jobId": "abc123-def456-ghi789",
  "state": "completed",
  "progress": 100,
  "result": {
    "success": true,
    "scores": {
      "performance": 95,
      "accessibility": 98,
      "best-practices": 92,
      "seo": 100,
      "pwa": 75
    },
    "duration": 8600,
    "metrics": {
      "firstContentfulPaint": 1200,
      "speedIndex": 1800,
      "largestContentfulPaint": 2500,
      "timeToInteractive": 3200,
      "totalBlockingTime": 150,
      "cumulativeLayoutShift": 0.05
    }
  }
}
```

#### États possibles
- `waiting` - En attente de traitement
- `active` - En cours d'exécution
- `completed` - Terminé avec succès
- `failed` - Échec de l'audit

### 4. Statut d'un batch

**GET** `/lighthouse/batch/{batchId}`

Récupère le statut global d'un batch d'audits.

#### Response (200 OK)

```json
{
  "batchId": "batch-xyz789",
  "total": 3,
  "completed": 2,
  "failed": 0,
  "active": 1,
  "waiting": 0,
  "jobs": [
    {
      "jobId": "job-1",
      "url": "https://example.com",
      "status": "completed",
      "scores": {
        "performance": 95,
        "accessibility": 98
      }
    },
    {
      "jobId": "job-2",
      "url": "https://google.com",
      "status": "completed",
      "scores": {
        "performance": 100,
        "accessibility": 95
      }
    },
    {
      "jobId": "job-3",
      "url": "https://github.com",
      "status": "active"
    }
  ]
}
```

## 💻 Exemples d'utilisation

### Avec cURL

#### Audit unique
```bash
curl -X POST http://localhost:3000/lighthouse/audit \
  -H "X-API-Key: votre-cle-api" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "categories": ["performance", "accessibility"]
  }'
```

#### Batch d'audits
```bash
curl -X POST http://localhost:3000/lighthouse/batch \
  -H "X-API-Key: votre-cle-api" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com",
      "https://google.com",
      "https://github.com"
    ],
    "categories": ["performance", "seo"]
  }'
```

#### Vérifier le statut
```bash
# Pour un job unique
curl -X GET http://localhost:3000/lighthouse/job/{jobId} \
  -H "X-API-Key: votre-cle-api"

# Pour un batch
curl -X GET http://localhost:3000/lighthouse/batch/{batchId} \
  -H "X-API-Key: votre-cle-api"
```

### Avec JavaScript (Node.js)

```javascript
const API_URL = 'http://localhost:3000';
const API_KEY = 'votre-cle-api';

// Fonction pour lancer un batch d'audits
async function runBatchAudit(urls) {
  const response = await fetch(`${API_URL}/lighthouse/batch`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      urls: urls,
      categories: ['performance', 'accessibility']
    })
  });

  const data = await response.json();
  console.log('Batch créé:', data.batchId);
  return data.batchId;
}

// Fonction pour vérifier le statut
async function checkBatchStatus(batchId) {
  const response = await fetch(`${API_URL}/lighthouse/batch/${batchId}`, {
    headers: {
      'X-API-Key': API_KEY
    }
  });

  return await response.json();
}

// Utilisation
async function main() {
  const urls = [
    'https://example.com',
    'https://google.com',
    'https://github.com'
  ];

  // Lancer le batch
  const batchId = await runBatchAudit(urls);

  // Attendre et vérifier le statut
  let completed = false;
  while (!completed) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Attendre 5 secondes

    const status = await checkBatchStatus(batchId);
    console.log(`Progression: ${status.completed}/${status.total}`);

    if (status.completed === status.total) {
      completed = true;
      console.log('Résultats finaux:', status.jobs);
    }
  }
}

main().catch(console.error);
```

### Avec Python

```python
import requests
import time
import json

API_URL = 'http://localhost:3000'
API_KEY = 'votre-cle-api'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

def run_batch_audit(urls, categories=None):
    """Lance un batch d'audits Lighthouse"""
    data = {
        'urls': urls
    }
    if categories:
        data['categories'] = categories

    response = requests.post(
        f'{API_URL}/lighthouse/batch',
        headers=headers,
        json=data
    )
    response.raise_for_status()
    return response.json()

def check_batch_status(batch_id):
    """Vérifie le statut d'un batch"""
    response = requests.get(
        f'{API_URL}/lighthouse/batch/{batch_id}',
        headers={'X-API-Key': API_KEY}
    )
    response.raise_for_status()
    return response.json()

# Utilisation
if __name__ == '__main__':
    # Liste des URLs à auditer
    urls_to_audit = [
        'https://example.com',
        'https://google.com',
        'https://github.com'
    ]

    # Lancer le batch
    print("Lancement du batch d'audits...")
    result = run_batch_audit(urls_to_audit, categories=['performance', 'seo'])
    batch_id = result['batchId']
    print(f"Batch ID: {batch_id}")

    # Attendre la fin
    while True:
        time.sleep(5)
        status = check_batch_status(batch_id)
        print(f"Progression: {status['completed']}/{status['total']}")

        if status['completed'] == status['total']:
            print("\n✅ Audits terminés!")
            for job in status['jobs']:
                print(f"\nURL: {job['url']}")
                print(f"Status: {job['status']}")
                if 'scores' in job:
                    print(f"Scores: {json.dumps(job['scores'], indent=2)}")
            break
```

## 🔄 Workflow recommandé

1. **Envoi du batch** : Envoyer la liste des URLs à auditer
2. **Récupération du batchId** : Conserver le `batchId` retourné
3. **Polling régulier** : Vérifier le statut toutes les 5-10 secondes
4. **Traitement des résultats** : Une fois tous les jobs complétés, traiter les scores

## ⚡ Limites et performances

- **Concurrence** : L'API traite jusqu'à 3 audits en parallèle (configurable)
- **Timeout** : Chaque audit a un timeout de 60 secondes
- **Taille du batch** : Recommandé de ne pas dépasser 50 URLs par batch
- **Rate limiting** : Pas de limite par défaut (à configurer selon vos besoins)

## ❌ Gestion des erreurs

### Codes de réponse HTTP

- `201 Created` : Job créé avec succès
- `200 OK` : Statut récupéré avec succès
- `400 Bad Request` : Paramètres invalides (URL malformée, etc.)
- `401 Unauthorized` : Clé API manquante ou invalide
- `404 Not Found` : Job ou Batch introuvable
- `500 Internal Server Error` : Erreur serveur

### Exemple d'erreur

```json
{
  "statusCode": 401,
  "message": "Invalid API Key",
  "error": "Unauthorized"
}
```

## 📊 Métriques disponibles

Les résultats d'audit incluent les métriques suivantes :

- **Performance Score** : Score global de performance (0-100)
- **First Contentful Paint (FCP)** : Premier rendu de contenu
- **Speed Index** : Vitesse de chargement perçue
- **Largest Contentful Paint (LCP)** : Plus grand élément rendu
- **Time to Interactive (TTI)** : Temps avant interactivité
- **Total Blocking Time (TBT)** : Temps de blocage total
- **Cumulative Layout Shift (CLS)** : Stabilité visuelle

## 🛠️ Configuration côté serveur

Pour configurer votre propre instance :

```env
# .env
PORT=3000
API_KEY=votre-cle-api-securisee
WORKER_CONCURRENCY=3
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 📝 Notes importantes

1. **Sécurité** : Gardez votre clé API secrète et utilisez HTTPS en production
2. **Performance** : Les audits peuvent prendre 10-60 secondes selon le site
3. **Cache** : Les résultats sont conservés 24h (configurable)
4. **Logs** : Tous les appels API sont loggés côté serveur

## 🆘 Support

Pour toute question ou problème :
- Consultez les logs du serveur (`/logs/application.log`)
- Vérifiez le dashboard de monitoring (`http://votre-domaine:3000`)
- Consultez la documentation Swagger (`http://votre-domaine:3000/api`)

---

**Version API** : 1.0.0
**Dernière mise à jour** : 2025