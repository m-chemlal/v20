# Matrice RBAC - ImpactTracker

## Rôles

- **admin** : Administrateur système avec accès complet
- **chef_projet** : Chef de projet, gère ses projets assignés
- **donateur** : Donateur, peut financer et consulter les projets financés

## Permissions par ressource

### Utilisateurs (`/api/v1/users`)

| Action | Admin | Chef Projet | Donateur |
|--------|-------|-------------|----------|
| GET /users | ✅ | ❌ | ❌ |
| GET /users/{id} | ✅ | ❌ | ❌ |
| POST /users | ✅ | ❌ | ❌ |
| PUT /users/{id} | ✅ | ❌ | ❌ |
| DELETE /users/{id} | ✅ | ❌ | ❌ |

### Projets (`/api/v1/projects`)

| Action | Admin | Chef Projet | Donateur |
|--------|-------|-------------|----------|
| GET /projects | ✅ (tous) | ✅ (ses projets) | ✅ (projets financés) |
| GET /projects/{id} | ✅ (tous) | ✅ (ses projets) | ✅ (projets financés) |
| POST /projects | ✅ | ✅ | ❌ |
| PUT /projects/{id} | ✅ (tous) | ✅ (ses projets) | ❌ |
| DELETE /projects/{id} | ✅ | ❌ | ❌ |

**Filtrage automatique :**
- Admin : Voit tous les projets
- Chef Projet : Voit uniquement les projets où `chef_projet_id == user.id`
- Donateur : Voit uniquement les projets qu'il a financés (via table `financements`)

### Indicateurs (`/api/v1/indicators`)

| Action | Admin | Chef Projet | Donateur |
|--------|-------|-------------|----------|
| GET /indicators | ✅ (tous) | ✅ (ses projets) | ✅ (projets financés) |
| GET /indicators/{id} | ✅ (tous) | ✅ (ses projets) | ✅ (projets financés) |
| POST /indicators | ✅ | ✅ (ses projets) | ❌ |
| PUT /indicators/{id} | ✅ | ✅ (ses projets) | ❌ |
| DELETE /indicators/{id} | ✅ | ✅ (ses projets) | ❌ |

**Filtrage automatique :**
- Admin : Voit tous les indicateurs
- Chef Projet : Voit les indicateurs des projets qu'il gère
- Donateur : Voit les indicateurs des projets qu'il finance

### Financements (`/api/v1/financements`)

| Action | Admin | Chef Projet | Donateur |
|--------|-------|-------------|----------|
| GET /financements | ✅ (tous) | ✅ (ses projets) | ✅ (ses financements) |
| GET /financements/{id} | ✅ (tous) | ✅ (ses projets) | ✅ (ses financements) |
| POST /financements | ✅ | ❌ | ✅ (seulement pour lui) |
| PUT /financements/{id} | ✅ | ❌ | ✅ (ses financements, champs limités) |
| DELETE /financements/{id} | ✅ | ❌ | ❌ |

**Règles spéciales :**
- Donateur peut créer des financements, mais `donateur_id` est automatiquement défini à son ID
- Donateur ne peut modifier que certains champs de ses propres financements

### Documents (`/api/v1/documents`)

| Action | Admin | Chef Projet | Donateur |
|--------|-------|-------------|----------|
| GET /documents | ✅ (tous) | ✅ (ses projets) | ✅ (projets financés) |
| GET /documents/{id} | ✅ (tous) | ✅ (ses projets) | ✅ (projets financés) |
| GET /documents/{id}/download | ✅ (tous) | ✅ (ses projets) | ✅ (projets financés) |
| POST /documents | ✅ | ✅ (ses projets) | ❌ |
| DELETE /documents/{id} | ✅ | ✅ (ses projets) | ❌ |

**Filtrage automatique :**
- Admin : Accès à tous les documents
- Chef Projet : Documents des projets qu'il gère
- Donateur : Documents des projets qu'il finance

### Statistiques (`/api/v1/stats`)

| Action | Admin | Chef Projet | Donateur |
|--------|-------|-------------|----------|
| GET /stats/kpis | ✅ | ❌ | ❌ |
| GET /stats/export/pdf | ✅ | ❌ | ❌ |
| GET /stats/export/excel | ✅ | ❌ | ❌ |

### Audit Logs (`/api/v1/audit-logs`)

| Action | Admin | Chef Projet | Donateur |
|--------|-------|-------------|----------|
| GET /audit-logs | ✅ | ❌ | ❌ |

### Authentification (`/api/v1/auth`)

| Action | Admin | Chef Projet | Donateur |
|--------|-------|-------------|----------|
| POST /auth/login | ✅ (tous) | ✅ (tous) | ✅ (tous) |
| POST /auth/refresh | ✅ (tous) | ✅ (tous) | ✅ (tous) |
| POST /auth/logout | ✅ (tous) | ✅ (tous) | ✅ (tous) |
| POST /auth/change-password | ✅ (tous) | ✅ (tous) | ✅ (tous) |
| POST /auth/forgot-password | ✅ (tous) | ✅ (tous) | ✅ (tous) |
| POST /auth/reset-password | ✅ (tous) | ✅ (tous) | ✅ (tous) |
| GET /auth/me | ✅ (tous) | ✅ (tous) | ✅ (tous) |

## Permissions détaillées

### Chef Projet

**Peut :**
- Créer et gérer ses propres projets
- Ajouter/modifier/supprimer des indicateurs pour ses projets
- Uploader des documents pour ses projets
- Consulter les financements de ses projets
- Modifier ses propres informations (via `/auth/me`)

**Ne peut pas :**
- Créer des financements
- Voir les projets des autres chefs
- Accéder aux statistiques globales
- Gérer les utilisateurs

### Donateur

**Peut :**
- Consulter les projets qu'il finance
- Consulter les indicateurs des projets financés
- Télécharger les documents des projets financés
- Créer des financements (pour lui-même)
- Modifier ses propres financements (champs limités)
- Modifier ses propres informations (via `/auth/me`)

**Ne peut pas :**
- Créer des projets
- Ajouter des indicateurs
- Uploader des documents
- Voir les projets qu'il ne finance pas
- Accéder aux statistiques

### Admin

**Peut :**
- Toutes les opérations sur toutes les ressources
- Gérer les utilisateurs
- Accéder aux statistiques et exports
- Consulter les logs d'audit
- Voir tous les projets, indicateurs, financements, documents

## Implémentation technique

### Décorateurs utilisés

- `@require_role(["admin"])` : Restreint à un ou plusieurs rôles
- `@require_permission("permission_name")` : Vérifie une permission spécifique
- `get_current_user` : Récupère l'utilisateur authentifié (requis pour toutes les routes protégées)

### Filtrage automatique

Le filtrage par rôle est implémenté via des fonctions de filtrage dans chaque route :
- `filter_projects_by_role()`
- `filter_indicators_by_role()`
- `filter_financements_by_role()`
- `filter_documents_by_role()`

Ces fonctions modifient la requête SQLAlchemy pour ne retourner que les données accessibles à l'utilisateur selon son rôle.

