# 🎨 Lighthouse API - Dashboards Visuels

## Vue d'ensemble

L'API Lighthouse dispose de **dashboards visuels modernes** pour monitorer vos audits en temps réel.

---

## 📊 Dashboard Queue

**URL:** `http://localhost:3000/lighthouse/dashboard`

### Fonctionnalités

✨ **Interface moderne et animée** avec design glassmorphism
🔄 **Auto-refresh** toutes les 5 secondes
📈 **Statistiques en temps réel** :
- Jobs en attente (⏳ Waiting)
- Jobs actifs (🔄 Active)
- Jobs terminés (✅ Completed)
- Jobs échoués (❌ Failed)

📊 **Graphiques interactifs** :
- Barres de progression pour chaque état
- Graphique de répartition de la queue
- Animations fluides

🎨 **Design Features** :
- Gradient violet moderne
- Glassmorphism effect (transparence + blur)
- Hover effects sur les cartes
- Responsive design

### Capture d'écran conceptuelle

```
┌─────────────────────────────────────────────────────────┐
│                 ⚡ Lighthouse API                        │
│         Real-time Performance Monitoring Dashboard       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │   ⏳    │  │   🔄    │  │   ✅    │  │   ❌    │   │
│  │WAITING  │  │ ACTIVE  │  │COMPLETED│  │ FAILED  │   │
│  │   5     │  │   3     │  │  120    │  │   2     │   │
│  │[█████▌] │  │[███▌   ]│  │[███████]│  │[▌      ]│   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │         📊 Répartition de la queue                │  │
│  │                                                     │  │
│  │     5     3    120    2                           │  │
│  │   ┌──┐ ┌──┐ ┌────┐ ┌┐                            │  │
│  │   │  │ │  │ │    │ ││                            │  │
│  │   │  │ │  │ │    │ ││                            │  │
│  │   └──┘ └──┘ └────┘ └┘                            │  │
│  │  Wait Act. Comp Fail                              │  │
│  │                                                     │  │
│  │  [🔄 Rafraîchir] [📚 API Docs] [📈 Metrics]       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│     🔄 Rafraîchissement automatique toutes les 5s        │
└─────────────────────────────────────────────────────────┘
```

---

## 📈 Dashboard Métriques

**URL:** `http://localhost:3000/metrics/dashboard`

### Fonctionnalités

✨ **Dashboard Prometheus visuel** avec design moderne
🔄 **Auto-refresh** toutes les 10 secondes
📊 **Métriques détaillées** :
- Total des jobs exécutés (📊 Counter)
- Durée moyenne (⏱️ Histogram)
- Workers actifs (🔄 Gauge)
- Taille de la queue (📦 Gauge)

🎯 **Gauge d'utilisation** :
- Indicateur circulaire coloré
- Pourcentage d'utilisation des workers
- Animation fluide

📉 **Graphique de tendance** :
- Derniers temps d'exécution
- Barres animées avec valeurs
- Visualisation des performances

### Capture d'écran conceptuelle

```
┌─────────────────────────────────────────────────────────┐
│              📈 Metrics Dashboard                        │
│         Lighthouse API Performance Monitoring            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │📊 Total  │  │⏱️  Avg    │  │🔄 Active │  │📦 Queue │ │
│  │  Jobs    │  │ Duration │  │ Workers  │  │  Size   │ │
│  │          │  │          │  │          │  │         │ │
│  │  250     │  │  12.5s   │  │    3     │  │   25    │ │
│  │  Counter │  │Histogram │  │  Gauge   │  │  Gauge  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │         🎯 Worker Utilization                      │  │
│  │                                                     │  │
│  │                  ┌─────────┐                       │  │
│  │                  │         │                       │  │
│  │                  │  60%    │ ← Circular gauge      │  │
│  │                  │         │                       │  │
│  │                  └─────────┘                       │  │
│  │                                                     │  │
│  │         3 / 5 workers en cours d'utilisation       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │         📉 Performance Trends                      │  │
│  │                                                     │  │
│  │  8s 12s 15s 9s 11s 14s 8s 10s 13s 11s            │  │
│  │  ██  ███ ████ ██  ███ ████ ██  ███ ████ ███     │  │
│  │                                                     │  │
│  │  Derniers temps d'exécution des audits            │  │
│  │                                                     │  │
│  │  [🔄] [📊 Raw] [📈 Queue] [📚 Docs]               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│     🔄 Rafraîchissement automatique toutes les 10s       │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Design System

### Palette de couleurs

#### Dashboard Queue (Violet)
- Gradient principal : `#667eea → #764ba2`
- Cards : Glassmorphism avec `rgba(255, 255, 255, 0.15)`
- Success : `#4ade80 → #22c55e`
- Warning : `#fbbf24 → #f59e0b`
- Error : `#f87171 → #ef4444`
- Info : `#60a5fa → #3b82f6`

#### Dashboard Métriques (Bleu)
- Gradient principal : `#1e3a8a → #3b82f6`
- Cards : Glassmorphism avec `rgba(255, 255, 255, 0.15)`
- Gauge : Gradient circulaire multicolore

### Effets visuels

- **Glassmorphism** : `backdrop-filter: blur(10px)`
- **Animations** :
  - `fadeInDown` : Header entrante
  - `fadeInUp` : Cards entrantes
  - `pulse` : Texte de rafraîchissement
- **Hover effects** : Translation verticale + ombre
- **Transitions** : 0.3s - 0.5s ease

---

## 🚀 Utilisation

### Accès rapide

Depuis n'importe quelle page, utilisez les boutons de navigation :

```bash
# Dashboard Queue
curl http://localhost:3000/lighthouse/dashboard

# Dashboard Métriques
curl http://localhost:3000/metrics/dashboard

# API Documentation
curl http://localhost:3000/api

# Métriques brutes Prometheus
curl http://localhost:3000/metrics
```

### Navigation

Tous les dashboards incluent des boutons de navigation rapide :
- 🔄 Rafraîchir : Reload manuel
- 📚 API Docs : Documentation Swagger
- 📈 Metrics : Métriques Prometheus brutes
- 📊 Queue/Dashboard : Navigation croisée

---

## 📱 Responsive Design

Les dashboards sont **100% responsives** :
- Desktop : Grid 4 colonnes
- Tablet : Grid 2 colonnes
- Mobile : Grid 1 colonne
- Auto-adaptation avec `minmax(250px, 1fr)`

---

## 🔧 Configuration

### Intervalle de rafraîchissement

Modifiable dans les fichiers controller :

```typescript
// lighthouse-dashboard.controller.ts
setTimeout(() => {
  window.location.reload();
}, 5000);  // 5 secondes

// metrics-dashboard.controller.ts
setTimeout(() => {
  window.location.reload();
}, 10000);  // 10 secondes
```

### Personnalisation des couleurs

Les gradients sont définis en CSS dans chaque controller :

```css
/* Dashboard Queue */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Dashboard Métriques */
background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
```

---

## 🎯 Cas d'usage

### Monitoring en production

1. Ouvrir le dashboard dans un onglet dédié
2. Laisser l'auto-refresh actif
3. Surveiller les pics d'activité
4. Vérifier que les workers ne saturent pas

### Présentation / Demo

1. Lancer plusieurs audits via l'API
2. Afficher le dashboard sur un écran
3. Observer les stats en temps réel
4. Montrer les animations et transitions

### Debugging

1. Ouvrir dashboard + logs en parallèle
2. Créer un batch de tests
3. Suivre l'évolution dans le dashboard
4. Identifier les goulots d'étranglement

---

## 🌟 Features Avancées

### Auto-refresh intelligent

Les dashboards se rafraîchissent automatiquement mais :
- Pas de clignotement grâce aux transitions CSS
- Conservation du scroll position
- Pas de perte de focus

### Animations fluides

Toutes les transitions utilisent `ease` ou `ease-in-out` :
- Hover : 0.3s
- Data update : 0.5s
- Animations d'entrée : 0.6s - 0.8s

### Glassmorphism moderne

Effet de verre dépoli tendance 2024-2025 :
- Transparence partielle
- Blur backdrop
- Borders subtiles
- Shadows douces

---

## 🔗 Liens utiles

- **Dashboard Queue** : [http://localhost:3000/lighthouse/dashboard](http://localhost:3000/lighthouse/dashboard)
- **Dashboard Métriques** : [http://localhost:3000/metrics/dashboard](http://localhost:3000/metrics/dashboard)
- **API Documentation** : [http://localhost:3000/api](http://localhost:3000/api)
- **Métriques Prometheus** : [http://localhost:3000/metrics](http://localhost:3000/metrics)
- **Health Check** : [http://localhost:3000/health](http://localhost:3000/health)

---

**Enjoy your beautiful dashboards! ✨**
