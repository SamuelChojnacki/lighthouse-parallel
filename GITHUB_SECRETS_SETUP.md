# GitHub Secrets Configuration

## Required Secrets for CI/CD

Pour faire fonctionner la CI GitHub Actions, vous devez configurer les secrets suivants dans votre repository GitHub:

### 1. Aller dans Settings > Secrets and variables > Actions

### 2. Créer les secrets suivants:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `API_KEY` | `wKuU92vSNq67J16/GF55q1s5SYgztBy5vqQ9lILuM+I=` | API key pour l'authentification |
| `JWT_SECRET` | `test-jwt-secret-for-ci-only-do-not-use-in-production` | Secret JWT (changez en production!) |
| `DASHBOARD_PASSWORD_HASH` | `$2b$10$imTl0aNFpkizoRrq7l4tzueGo/sMnG4oykWDaBOoxds2zY7LrY1ha` | Hash du mot de passe dashboard |

### 3. Variables d'environnement (non sensibles)

Dans Settings > Secrets and variables > Actions > Variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `WORKER_CONCURRENCY` | `1` | Nombre de workers pour CI (1 pour GitHub Actions) |

## Note de sécurité

⚠️ **IMPORTANT**: Les valeurs ci-dessus sont pour la CI uniquement. En production:
- Générez une nouvelle API_KEY sécurisée
- Utilisez un JWT_SECRET fort et unique
- Créez un nouveau hash de mot de passe

## Vérification

Une fois configurés, les secrets seront disponibles dans vos workflows GitHub Actions via `${{ secrets.API_KEY }}` etc.