# Guide de Démarrage Rapide - ImpactTracker API

## ✅ Configuration effectuée

Le projet est maintenant configuré pour **MySQL** (pas PostgreSQL, pas Docker, pas cloud).

Le fichier `.env` a été créé avec les paramètres suivants :
- **Database** : `mysql+pymysql://impact_root:momo12@localhost:3306/impacttracker`
- **User** : `impact_root`
- **Password** : `momo12`
- **Port** : `3306` (MySQL)
- **JWT Secrets** : Configurés (à changer en production)
- **Encryption Key** : `enc_demo_key_ChangeMe!` (à changer en production)

## 🚀 Démarrer l'API

### Option 1 : Avec environnement virtuel activé

```bash
cd backend
.\venv\Scripts\Activate.ps1  # Windows PowerShell
# ou
source venv/bin/activate  # Linux/macOS

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Option 2 : Avec Python directement

```bash
cd backend
python main.py
```

## 📋 Prérequis

### 1. MySQL doit être installé et démarré

**Windows :**
- Installer MySQL depuis https://dev.mysql.com/downloads/installer/
- Choisir "MySQL Installer for Windows"
- Configurer le mot de passe root lors de l'installation
- MySQL démarre automatiquement comme service Windows

**Linux (Ubuntu/Debian) :**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

**macOS :**
```bash
brew install mysql
brew services start mysql
```

### 2. Créer la base de données et l'utilisateur

Se connecter à MySQL :
```bash
mysql -u root -p
```

Puis exécuter :
```sql
CREATE DATABASE IF NOT EXISTS impacttracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'impact_root'@'localhost' IDENTIFIED BY 'momo12';
GRANT ALL PRIVILEGES ON impacttracker.* TO 'impact_root'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Initialiser la base de données

Exécuter les scripts MySQL :

```bash
# Se connecter et exécuter les scripts
mysql -u impact_root -p impacttracker < init_mysql.sql
mysql -u impact_root -p impacttracker < seed_mysql.sql
```

**Ou utiliser un client MySQL graphique** (MySQL Workbench, phpMyAdmin, DBeaver, etc.)

## 🌐 Accéder à l'API

Une fois l'API démarrée, elle sera accessible sur :
- **API** : http://localhost:8000
- **Documentation Swagger** : http://localhost:8000/api/docs
- **ReDoc** : http://localhost:8000/api/redoc

## 🧪 Tester l'API

### Comptes de test (après avoir exécuté seed.sql)

- **Admin** : `admin@example.org` / `Admin123!@#`
- **Chef Projet** : `chef@example.org` / `Chef123!@#`
- **Donateur** : `donateur@example.org` / `Donateur123!@#`

### Exemple de requête de login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.org", "password": "Admin123!@#"}'
```

## ⚠️ Résolution de problèmes

### Erreur : "Unable to connect to database"

1. Vérifier que PostgreSQL est démarré
2. Vérifier les credentials dans `.env`
3. Vérifier que la base de données `impacttracker` existe

### Erreur : "Module not found"

```bash
pip install -r requirements.txt
```

### Erreur : "Port 8000 already in use"

Changer le port :
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

## 📚 Documentation complète

Voir [README.md](README.md) pour la documentation complète de l'API.

