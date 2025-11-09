# Configuration MySQL pour ImpactTracker

## ✅ Modifications effectuées

Le projet a été configuré pour utiliser **MySQL** au lieu de PostgreSQL :

1. **Driver de base de données** : `pymysql` au lieu de `psycopg2`
2. **URL de connexion** : Changée pour MySQL (`mysql+pymysql://`)
3. **Port par défaut** : 3306 (au lieu de 5432)
4. **Fonctions de chiffrement** : `AES_ENCRYPT`/`AES_DECRYPT` au lieu de `pgcrypto`
5. **Scripts SQL** : Créés pour MySQL (`init_mysql.sql` et `seed_mysql.sql`)

## 📋 Installation de MySQL

### Windows

1. **Télécharger MySQL** : https://dev.mysql.com/downloads/installer/
   - Choisir "MySQL Installer for Windows"
   - Version recommandée : MySQL 8.0 ou supérieur

2. **Installer MySQL** :
   - Exécuter l'installateur
   - Choisir "Developer Default" ou "Server only"
   - Configurer le mot de passe root lors de l'installation
   - Noter le mot de passe root

3. **Vérifier l'installation** :
   ```powershell
   mysql --version
   ```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### macOS

```bash
brew install mysql
brew services start mysql
```

## 🔧 Configuration de la base de données

### 1. Démarrer MySQL

**Windows** : MySQL devrait démarrer automatiquement comme service Windows.

**Linux/macOS** :
```bash
sudo systemctl start mysql  # Linux
# ou
brew services start mysql  # macOS
```

### 2. Se connecter à MySQL

```bash
mysql -u root -p
```

Entrer le mot de passe root configuré lors de l'installation.

### 3. Créer la base de données et l'utilisateur

Dans le client MySQL :

```sql
-- Créer la base de données
CREATE DATABASE IF NOT EXISTS impacttracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur
CREATE USER IF NOT EXISTS 'impact_root'@'localhost' IDENTIFIED BY 'momo12';

-- Donner les permissions
GRANT ALL PRIVILEGES ON impacttracker.* TO 'impact_root'@'localhost';
FLUSH PRIVILEGES;

-- Vérifier
SHOW DATABASES;
```

### 4. Exécuter les scripts d'initialisation

```bash
# Se connecter avec l'utilisateur créé
mysql -u impact_root -p impacttracker < init_mysql.sql

# Charger les données de démo
mysql -u impact_root -p impacttracker < seed_mysql.sql
```

**Ou depuis le client MySQL** :

```sql
USE impacttracker;
SOURCE /chemin/vers/backend/init_mysql.sql;
SOURCE /chemin/vers/backend/seed_mysql.sql;
```

## 🔐 Configuration du fichier .env

Le fichier `.env` a déjà été mis à jour avec :

```env
DATABASE_URL=mysql+pymysql://impact_root:momo12@localhost:3306/impacttracker?charset=utf8mb4
DB_HOST=localhost
DB_PORT=3306
DB_USER=impact_root
DB_PASSWORD=momo12
```

## 🚀 Démarrer l'API

```bash
cd backend
.\venv\Scripts\Activate.ps1  # Windows
# ou
source venv/bin/activate  # Linux/macOS

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## ✅ Vérification

Une fois l'API démarrée, tester la connexion :

```bash
curl http://localhost:8000/health
```

## 🔍 Résolution de problèmes

### Erreur : "Access denied for user"

1. Vérifier que l'utilisateur existe :
   ```sql
   SELECT User, Host FROM mysql.user WHERE User='impact_root';
   ```

2. Recréer l'utilisateur si nécessaire :
   ```sql
   DROP USER IF EXISTS 'impact_root'@'localhost';
   CREATE USER 'impact_root'@'localhost' IDENTIFIED BY 'momo12';
   GRANT ALL PRIVILEGES ON impacttracker.* TO 'impact_root'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Erreur : "Unknown database 'impacttracker'"

Exécuter le script `init_mysql.sql` pour créer la base de données.

### Erreur : "Can't connect to MySQL server"

1. Vérifier que MySQL est démarré :
   ```bash
   # Windows
   services.msc  # Chercher "MySQL"
   
   # Linux
   sudo systemctl status mysql
   ```

2. Vérifier le port :
   ```bash
   netstat -an | findstr 3306  # Windows
   # ou
   sudo netstat -tlnp | grep 3306  # Linux
   ```

### Erreur : "Module 'pymysql' not found"

```bash
pip install pymysql
```

## 📚 Commandes MySQL utiles

```sql
-- Voir toutes les bases de données
SHOW DATABASES;

-- Utiliser une base de données
USE impacttracker;

-- Voir toutes les tables
SHOW TABLES;

-- Voir la structure d'une table
DESCRIBE users;

-- Vérifier les utilisateurs
SELECT User, Host FROM mysql.user;
```

## 🎯 Comptes de test

Après avoir exécuté `seed_mysql.sql` :

- **Admin** : `admin@example.org` / `Admin123!@#`
- **Chef Projet** : `chef@example.org` / `Chef123!@#`
- **Donateur** : `donateur@example.org` / `Donateur123!@#`

## 📝 Différences MySQL vs PostgreSQL

1. **Types de données** :
   - `SERIAL` → `AUTO_INCREMENT`
   - `BYTEA` → `LONGBLOB`
   - `JSONB` → `JSON`
   - `TIMESTAMP WITH TIME ZONE` → `TIMESTAMP`

2. **Chiffrement** :
   - PostgreSQL : `pgp_sym_encrypt()` / `pgp_sym_decrypt()`
   - MySQL : `AES_ENCRYPT()` / `AES_DECRYPT()`

3. **Syntaxe SQL** :
   - `ON CONFLICT DO NOTHING` → `ON DUPLICATE KEY UPDATE`
   - Pas de support natif des ENUM comme PostgreSQL (mais MySQL les supporte différemment)




