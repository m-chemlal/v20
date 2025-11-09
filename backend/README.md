# ImpactTracker API - Backend

API REST sécurisée et complète pour ImpactTracker, portail de suivi de projets pour l'ONG "ImpactSolidaire".

## 🚀 Caractéristiques

- **Authentification JWT** : Access tokens (30 min) et refresh tokens (30 jours)
- **Sécurité renforcée** : bcrypt (cost 12), chiffrement AES-256, RBAC, protection CSRF/XSS
- **Politique de mots de passe stricte** : Min 12 caractères, expiration 90 jours, historique
- **RBAC** : Rôles admin, chef_projet, donateur avec permissions granulaires
- **Audit logs complets** : Toutes les actions sensibles sont loggées
- **Rate limiting** : Protection contre les attaques par force brute
- **Stockage S3** : Documents stockés dans un stockage S3-compatible
- **Exports** : PDF et Excel pour rapports
- **Notifications email** : SMTP configurable

## 📋 Prérequis

- Python 3.11+
- PostgreSQL 13+
- Redis (optionnel, pour rate limiting)
- S3-compatible storage (ou local pour dev)

## 🛠️ Installation

### 1. Cloner le repository

```bash
git clone <repository-url>
cd backend
```

### 2. Créer un environnement virtuel

```bash
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 4. Configurer l'environnement

Copier `.env.example` vers `.env` et configurer les variables :

```bash
cp .env.example .env
```

**Variables importantes à configurer :**
- `DATABASE_URL` : URL de connexion PostgreSQL
- `JWT_SECRET` : Clé secrète pour JWT (min 32 caractères)
- `REFRESH_TOKEN_SECRET` : Clé secrète pour refresh tokens
- `ENC_KEY` : Clé de chiffrement AES-256
- `S3_*` : Configuration S3 pour stockage documents
- `SMTP_*` : Configuration SMTP pour emails

### 5. Initialiser la base de données

#### Option A : Utiliser Docker Compose (recommandé)

```bash
docker-compose up -d db redis
```

#### Option B : Installation manuelle PostgreSQL

```bash
# Créer la base de données
psql -U postgres -c "CREATE DATABASE impacttracker;"
psql -U postgres -c "CREATE USER impact_root WITH PASSWORD 'momo12';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE impacttracker TO impact_root;"

# Exécuter le script d'initialisation
psql -U impact_root -d impacttracker -f init.sql

# Exécuter le seed
psql -U impact_root -d impacttracker -f seed.sql
```

#### Option C : Utiliser Alembic migrations

```bash
# Initialiser Alembic (si pas déjà fait)
alembic upgrade head

# Exécuter le seed
psql -U impact_root -d impacttracker -f seed.sql
```

### 6. Lancer l'application

#### Mode développement

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Mode production

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Avec Docker Compose

```bash
docker-compose up
```

L'API sera accessible sur `http://localhost:8000`

## 📚 Documentation API

### Documentation interactive

- **Swagger UI** : http://localhost:8000/api/docs
- **ReDoc** : http://localhost:8000/api/redoc

### Endpoints principaux

#### Authentification

- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/refresh` - Rafraîchir le token
- `POST /api/v1/auth/logout` - Déconnexion
- `POST /api/v1/auth/change-password` - Changer le mot de passe
- `POST /api/v1/auth/forgot-password` - Demande de réinitialisation
- `POST /api/v1/auth/reset-password` - Réinitialiser le mot de passe
- `GET /api/v1/auth/me` - Informations utilisateur connecté

#### Utilisateurs (Admin uniquement)

- `GET /api/v1/users` - Liste des utilisateurs
- `GET /api/v1/users/{id}` - Détails d'un utilisateur
- `POST /api/v1/users` - Créer un utilisateur
- `PUT /api/v1/users/{id}` - Modifier un utilisateur
- `DELETE /api/v1/users/{id}` - Supprimer un utilisateur

#### Projets

- `GET /api/v1/projects` - Liste des projets (filtrés par rôle)
- `GET /api/v1/projects/{id}` - Détails d'un projet
- `POST /api/v1/projects` - Créer un projet
- `PUT /api/v1/projects/{id}` - Modifier un projet
- `DELETE /api/v1/projects/{id}` - Supprimer un projet (admin)

#### Indicateurs

- `GET /api/v1/indicators` - Liste des indicateurs
- `GET /api/v1/indicators/{id}` - Détails d'un indicateur
- `POST /api/v1/indicators` - Créer un indicateur
- `PUT /api/v1/indicators/{id}` - Modifier un indicateur
- `DELETE /api/v1/indicators/{id}` - Supprimer un indicateur

#### Financements

- `GET /api/v1/financements` - Liste des financements
- `GET /api/v1/financements/{id}` - Détails d'un financement
- `POST /api/v1/financements` - Créer un financement
- `PUT /api/v1/financements/{id}` - Modifier un financement
- `DELETE /api/v1/financements/{id}` - Supprimer un financement (admin)

#### Documents

- `GET /api/v1/documents` - Liste des documents
- `GET /api/v1/documents/{id}` - Détails d'un document
- `GET /api/v1/documents/{id}/download` - Télécharger un document
- `POST /api/v1/documents` - Uploader un document
- `DELETE /api/v1/documents/{id}` - Supprimer un document

#### Statistiques (Admin uniquement)

- `GET /api/v1/stats/kpis` - KPIs globaux
- `GET /api/v1/stats/export/pdf` - Export PDF
- `GET /api/v1/stats/export/excel` - Export Excel

#### Audit Logs (Admin uniquement)

- `GET /api/v1/audit-logs` - Liste des logs d'audit

## 🔐 Sécurité

### Authentification

Tous les endpoints (sauf `/auth/login` et `/auth/refresh`) nécessitent un token JWT dans le header :

```
Authorization: Bearer <access_token>
```

### Rôles et Permissions

#### Admin
- Accès complet à toutes les fonctionnalités
- Gestion des utilisateurs
- Accès à tous les projets
- KPIs et statistiques

#### Chef de Projet
- Gestion de ses propres projets
- Création/modification d'indicateurs pour ses projets
- Upload de documents pour ses projets
- Consultation de ses projets et indicateurs

#### Donateur
- Consultation des projets qu'il finance
- Création de financements
- Consultation des indicateurs des projets financés
- Téléchargement de documents des projets financés

### Politique de mots de passe

- Minimum 12 caractères
- Au moins une majuscule
- Au moins une minuscule
- Au moins un chiffre
- Au moins un caractère spécial
- Expiration après 90 jours
- Historique des 5 derniers mots de passe
- Verrouillage après 5 tentatives échouées (15 minutes)

### Chiffrement

Les données sensibles sont chiffrées en base avec AES-256 via pgcrypto :
- Téléphone des utilisateurs
- Coordonnées GPS (latitude/longitude) des projets

## 🗄️ Base de données

### Structure

Le schéma de base de données inclut :
- `users` - Utilisateurs
- `password_history` - Historique des mots de passe
- `projects` - Projets
- `indicators` - Indicateurs de suivi
- `financements` - Financements
- `documents` - Documents
- `audit_logs` - Logs d'audit
- `satisfaction_surveys` - Enquêtes de satisfaction

### Migrations

Utiliser Alembic pour gérer les migrations :

```bash
# Créer une nouvelle migration
alembic revision --autogenerate -m "Description"

# Appliquer les migrations
alembic upgrade head

# Revenir en arrière
alembic downgrade -1
```

## 📦 Déploiement

### Docker

```bash
# Build l'image
docker build -t impacttracker-api .

# Lancer avec docker-compose
docker-compose up -d
```

### Variables d'environnement de production

⚠️ **Important** : Ne jamais commiter les secrets en production. Utiliser un gestionnaire de secrets (AWS Secrets Manager, HashiCorp Vault, etc.)

Variables critiques :
- `JWT_SECRET` : Générer avec `openssl rand -hex 32`
- `REFRESH_TOKEN_SECRET` : Générer avec `openssl rand -hex 32`
- `ENC_KEY` : Générer avec `openssl rand -hex 32`
- `DATABASE_URL` : URL de production
- `S3_*` : Configuration S3 de production

### Sécurité en production

1. **TLS/HTTPS** : Configurer un reverse proxy (nginx) avec certificat SSL
2. **HSTS** : Activé automatiquement via middleware
3. **Rate Limiting** : Configuré avec Redis en production
4. **CORS** : Configurer les origines autorisées
5. **Logs** : Configurer la rotation des logs
6. **Monitoring** : Configurer des alertes pour erreurs critiques

## 🧪 Tests

```bash
# Installer les dépendances de test
pip install pytest pytest-asyncio httpx

# Lancer les tests
pytest
```

## 📝 Données de démonstration

Le script `seed.sql` crée :
- 3 utilisateurs de démonstration :
  - `admin@example.org` / `Admin123!@#` (Admin)
  - `chef@example.org` / `Chef123!@#` (Chef de Projet)
  - `donateur@example.org` / `Donateur123!@#` (Donateur)
- 15 projets de démonstration
- 50+ indicateurs
- Financements et documents d'exemple

⚠️ **Attention** : Ces mots de passe sont pour la démonstration uniquement. Changez-les en production !

## 🤝 Contribution

1. Créer une branche depuis `dev`
2. Développer la fonctionnalité
3. Tester localement
4. Créer une pull request vers `dev`
5. Après validation, merger vers `staging` puis `prod`

## 📄 Licence

[Voir le fichier LICENSE]

## 🆘 Support

Pour toute question ou problème :
- Créer une issue sur le repository
- Contacter l'équipe backend

## 📚 Ressources supplémentaires

- [Documentation FastAPI](https://fastapi.tiangolo.com/)
- [Documentation SQLAlchemy](https://docs.sqlalchemy.org/)
- [Documentation Alembic](https://alembic.sqlalchemy.org/)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)

