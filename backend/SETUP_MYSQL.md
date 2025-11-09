# ⚠️ Configuration MySQL Requise

## Problème détecté

L'utilisateur MySQL `impact_root` n'existe pas encore ou le mot de passe est incorrect.

## Solution rapide

### Option 1 : Créer l'utilisateur (Recommandé)

1. **Se connecter à MySQL en tant que root** :
   ```bash
   mysql -u root -p
   ```

2. **Exécuter le script de configuration** :
   ```bash
   mysql -u root -p < setup_mysql.sql
   ```
   
   Ou copier-coller dans MySQL :
   ```sql
   CREATE DATABASE IF NOT EXISTS impacttracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'impact_root'@'localhost' IDENTIFIED BY 'momo12';
   GRANT ALL PRIVILEGES ON impacttracker.* TO 'impact_root'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Initialiser la base de données** :
   ```bash
   mysql -u impact_root -p impacttracker < init_mysql.sql
   mysql -u impact_root -p impacttracker < seed_mysql.sql
   ```

### Option 2 : Utiliser root (Développement uniquement)

Si vous voulez utiliser root directement, modifiez le fichier `.env` :

```env
DATABASE_URL=mysql+pymysql://root:VOTRE_MOT_DE_PASSE_ROOT@localhost:3306/impacttracker?charset=utf8mb4
DB_USER=root
DB_PASSWORD=VOTRE_MOT_DE_PASSE_ROOT
```

⚠️ **Attention** : N'utilisez pas root en production !

## Vérification

Après la configuration, tester la connexion :

```bash
mysql -u impact_root -p impacttracker
```

Si vous pouvez vous connecter, la configuration est correcte.

## Prochaines étapes

Une fois MySQL configuré, redémarrer l'API :

```powershell
.\start.ps1
```

ou

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```




