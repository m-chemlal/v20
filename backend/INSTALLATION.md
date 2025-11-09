# Guide d'Installation - ImpactTracker API

## Prérequis système

- Python 3.11 ou supérieur
- PostgreSQL 13 ou supérieur
- Redis (optionnel, pour rate limiting en production)
- Git

## Installation étape par étape

### 1. Cloner le repository

```bash
git clone <repository-url>
cd backend
```

### 2. Créer et activer un environnement virtuel

**Linux/macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Installer les dépendances

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configurer PostgreSQL

#### Option A : Docker (recommandé pour développement)

```bash
docker-compose up -d db redis
```

#### Option B : Installation locale

1. Installer PostgreSQL selon votre système d'exploitation
2. Créer la base de données :

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE impacttracker;
CREATE USER impact_root WITH PASSWORD 'momo12';
GRANT ALL PRIVILEGES ON DATABASE impacttracker TO impact_root;
\q
```

### 5. Configurer les variables d'environnement

Créer un fichier `.env` à la racine du dossier `backend` :

```bash
cp .env.example .env
```

Modifier les valeurs dans `.env` selon votre configuration :

```env
DATABASE_URL=postgresql://impact_root:momo12@localhost:5432/impacttracker
JWT_SECRET=votre-secret-jwt-min-32-caracteres-changez-en-production
REFRESH_TOKEN_SECRET=votre-secret-refresh-min-32-caracteres-changez-en-production
ENC_KEY=votre-cle-chiffrement-aes-256-changez-en-production
```

**⚠️ IMPORTANT :** En production, générer des secrets sécurisés :

```bash
# Générer JWT_SECRET
openssl rand -hex 32

# Générer REFRESH_TOKEN_SECRET
openssl rand -hex 32

# Générer ENC_KEY
openssl rand -hex 32
```

### 6. Initialiser la base de données

#### Option A : Utiliser les scripts SQL

```bash
# Exécuter le script d'initialisation
psql -U impact_root -d impacttracker -f init.sql

# Exécuter le seed (données de démonstration)
psql -U impact_root -d impacttracker -f seed.sql
```

#### Option B : Utiliser Alembic (recommandé pour migrations)

```bash
# Créer la migration initiale (si nécessaire)
alembic revision --autogenerate -m "Initial migration"

# Appliquer les migrations
alembic upgrade head

# Exécuter le seed
psql -U impact_root -d impacttracker -f seed.sql
```

### 7. Vérifier l'installation

```bash
# Lancer l'application
uvicorn main:app --reload

# L'API devrait être accessible sur http://localhost:8000
# Documentation Swagger : http://localhost:8000/api/docs
```

### 8. Tester avec les données de démonstration

Comptes de test créés par le seed :

- **Admin** : `admin@example.org` / `Admin123!@#`
- **Chef Projet** : `chef@example.org` / `Chef123!@#`
- **Donateur** : `donateur@example.org` / `Donateur123!@#`

## Configuration avancée

### S3 Storage (pour upload de documents)

Si vous utilisez un stockage S3-compatible (AWS S3, MinIO, etc.) :

```env
S3_ENDPOINT_URL=https://s3.amazonaws.com
S3_ACCESS_KEY_ID=votre-access-key
S3_SECRET_ACCESS_KEY=votre-secret-key
S3_BUCKET_NAME=impacttracker-bucket
S3_REGION=us-east-1
```

### SMTP (pour emails)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-app-password
SMTP_FROM_EMAIL=noreply@impacttracker.org
SMTP_USE_TLS=True
```

### Redis (pour rate limiting en production)

```env
REDIS_URL=redis://localhost:6379/0
```

## Dépannage

### Erreur de connexion à la base de données

- Vérifier que PostgreSQL est démarré
- Vérifier les credentials dans `.env`
- Vérifier que la base de données `impacttracker` existe

### Erreur d'import

- Vérifier que l'environnement virtuel est activé
- Réinstaller les dépendances : `pip install -r requirements.txt`

### Erreur de migration Alembic

- Vérifier que `alembic.ini` pointe vers la bonne base de données
- Supprimer le dossier `alembic/versions` et recréer les migrations si nécessaire

### Rate limiting ne fonctionne pas

- Vérifier que Redis est démarré (si configuré)
- Sinon, le rate limiting utilise le stockage mémoire par défaut

## Prochaines étapes

1. Lire le [README.md](README.md) pour la documentation complète
2. Consulter [RBAC_MATRIX.md](RBAC_MATRIX.md) pour comprendre les permissions
3. Tester l'API avec Swagger UI : http://localhost:8000/api/docs

## Support

Pour toute question ou problème, créer une issue sur le repository.

