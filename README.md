# ImpactTracker

ImpactTracker est un portail web qui permet à l'ONG ImpactSolidaire de suivre ses projets, de piloter leurs indicateurs et d'offrir aux donateurs une visibilité en temps réel. Le dépôt contient l'application React (frontend) et l'API Express (backend).

## 🚀 Prérequis

- [Node.js](https://nodejs.org/) 20+ (recommandé) ou 18+
- [pnpm](https://pnpm.io/) 8+
- PostgreSQL 14+ (optionnel : l'API démarre avec une base en mémoire si `DATABASE_URL` n'est pas défini)

## 📦 Installation après clonage

1. **Cloner le dépôt**
   ```bash
   git clone <URL_DU_DEPOT>
   cd v20
   ```
2. **Installer les dépendances frontend + backend**
   ```bash
   pnpm install
   ```
3. **Configurer l'environnement**
   - Copiez le fichier d'exemple :
     ```bash
     cp .env.example .env
     ```
   - Ajustez si besoin les valeurs suivantes dans `.env` :
     - `VITE_API_URL` : URL de l'API (par défaut `http://localhost:4000/api`)
     - `ACCESS_TOKEN_SECRET` et `REFRESH_TOKEN_SECRET` : secrets JWT (32+ caractères chacun)
    - `DATABASE_URL` : chaîne de connexion PostgreSQL (optionnelle) ou `file:./data/dev.sqlite` pour SQLite local
     - `CORS_ORIGINS` : domaines autorisés pour le frontend

   > Sans `DATABASE_URL`, l'API utilise automatiquement une base PostgreSQL en mémoire avec des données de démonstration.

## 🧑‍💻 Lancer l'environnement de développement

Dans un premier terminal (backend) :
```bash
pnpm dev:server
```
L'API est disponible sur [http://localhost:4000/api](http://localhost:4000/api) et expose un endpoint de santé sur [http://localhost:4000/health](http://localhost:4000/health).

Dans un second terminal (frontend) :
```bash
pnpm dev
```
L'interface React est servie sur [http://localhost:5173](http://localhost:5173).

Les identifiants de démonstration (créés au démarrage du backend) sont :

| Rôle           | Email                     | Mot de passe |
| -------------- | ------------------------- | ------------ |
| Admin          | `admin@impacttracker.org`    | `Impact2024!` |
| Chef de projet | `chef@impacttracker.org`     | `Impact2024!` |
| Donateur       | `donateur@impacttracker.org` | `Impact2024!` |

## 🧪 Commandes utiles

- Vérifier les types TypeScript :
  ```bash
  pnpm check
  ```
- Construire l'application (frontend + backend) :
  ```bash
  pnpm build
  ```
- Lancer la build en mode production :
  ```bash
  pnpm start
  ```

## 🗃️ Utilisation d'une base SQLite locale

Si vous préférez travailler avec SQLite plutôt qu'avec PostgreSQL :

1. Copiez (ou créez) votre fichier `.env` puis remplacez la valeur de `DATABASE_URL` par :
   ```env
   DATABASE_URL=file:./data/dev.sqlite
   ```
2. Créez le dossier et le fichier de base de données :
   ```bash
   mkdir -p data
   touch data/dev.sqlite
   ```
   Sous Windows PowerShell :
   ```powershell
   mkdir data
   ni data/dev.sqlite -ItemType File
   ```
3. Installez le driver SQLite si votre gestionnaire de base de données l'exige (ex. Prisma, Sequelize) :
   ```bash
   pnpm add sqlite3
   ```
4. Relancez l'API avec `pnpm dev:server`. Les tables seront créées au démarrage si elles n'existent pas.

## 🗃️ Utilisation d'une base PostgreSQL réelle

Pour utiliser une base de données PostgreSQL persistante :

1. Créez une base de données et un utilisateur (exemple) :
   ```sql
   CREATE DATABASE impacttracker;
   CREATE USER impacttracker_user WITH PASSWORD 'motdepasse';
   GRANT ALL PRIVILEGES ON DATABASE impacttracker TO impacttracker_user;
   ```
2. Renseignez la chaîne de connexion dans `.env` :
   ```env
   DATABASE_URL=postgresql://impacttracker_user:motdepasse@localhost:5432/impacttracker
   ```
3. (Optionnel) Importez vos données ou laissez l'API créer les tables et jeux de données de démonstration automatiquement au premier démarrage.

---

Bonne contribution !
