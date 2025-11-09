# ImpactTracker

ImpactTracker est un portail web qui permet à l'ONG ImpactSolidaire de suivre ses projets, de piloter leurs indicateurs et d'offrir aux donateurs une visibilité en temps réel. Le dépôt contient l'application React (frontend) et l'API Express (backend).

## 🚀 Prérequis

- [Node.js](https://nodejs.org/) 20+ (recommandé) ou 18+
- [pnpm](https://pnpm.io/) 8+
- [SQLite 3](https://www.sqlite.org/index.html) (installé sur votre machine ou via votre gestionnaire de paquets)

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
     - `DATABASE_URL` : chemin vers votre fichier SQLite (par défaut `file:./data/dev.sqlite`)
     - `CORS_ORIGINS` : domaines autorisés pour le frontend

   > Au premier démarrage, le backend crée automatiquement la base SQLite indiquée et la remplit avec des données de démonstration.

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

Le backend tourne désormais entièrement sur SQLite. Pour personnaliser ou manipuler la base :

1. Vérifiez la valeur de `DATABASE_URL` dans `.env` (par défaut `file:./data/dev.sqlite`).
2. Créez le dossier cible si besoin :
   ```bash
   mkdir -p data
   ```
3. Lancez `pnpm dev:server` : le fichier SQLite est généré automatiquement et les données de démonstration sont insérées.
4. Ouvrez le fichier (`data/dev.sqlite` par défaut) dans votre outil favori (DB Browser for SQLite, TablePlus, etc.) pour consulter les tables `users`, `projects`, `indicators`...

> Besoin de repartir de zéro ? Supprimez simplement le fichier `.sqlite`, puis relancez le serveur : les migrations et données d'exemple seront rejouées.

## 🗃️ Et PostgreSQL ?

L'API est optimisée pour SQLite et n'inclut plus le driver PostgreSQL. Si vous souhaitez utiliser PostgreSQL, vous devrez :

- réintroduire un client compatible (`pg`, `kysely`, etc.) ;
- ajuster les migrations et requêtes dans `server/db.ts` et les routes ;
- remplacer `DATABASE_URL` par une chaîne de connexion PostgreSQL.

Ces adaptations sortent du périmètre de la configuration par défaut fournie dans ce dépôt.

---

Bonne contribution !
