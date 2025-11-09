# ✅ ImpactTracker - Démarrage Complet

## 🎉 Statut

- ✅ **Backend API** : Démarré sur http://localhost:8000
- ✅ **Frontend** : Démarré sur http://localhost:5173 (ou 3000)
- ✅ **Base de données MySQL** : Connectée et initialisée
- ✅ **Données de démo** : Chargées (3 users, 15 projets, 50 indicateurs)
- ✅ **Service API** : Créé pour connecter frontend/backend

## 🌐 Accès aux applications

### Backend API
- **URL** : http://localhost:8000
- **Documentation Swagger** : http://localhost:8000/api/docs
- **ReDoc** : http://localhost:8000/api/redoc
- **Health Check** : http://localhost:8000/health

### Frontend
- **URL** : http://localhost:5173 (Vite) ou http://localhost:3000
- Vérifiez la console pour l'URL exacte

## 🔐 Comptes de test

### Admin
- Email : `admin@example.org`
- Password : `Admin123!@#`

### Chef Projet
- Email : `chef@example.org`
- Password : `Chef123!@#`

### Donateur
- Email : `donateur@example.org`
- Password : `Donateur123!@#`

## 📝 Fichiers créés/modifiés

### Backend
- ✅ `config.py` : Configuration MySQL avec root
- ✅ `models.py` : Adaptés pour MySQL
- ✅ `security.py` : Chiffrement AES pour MySQL
- ✅ `seed_mysql.sql` : Données de démonstration
- ✅ `.env` : Configuration avec root/momo12

### Frontend
- ✅ `client/src/services/api.ts` : Service API pour communiquer avec le backend
- ✅ `client/src/store/authStore.ts` : Mis à jour pour utiliser l'API réelle
- ✅ `.env` : Configuration de l'URL API

## 🚀 Commandes utiles

### Démarrer tout (Backend + Frontend)
```powershell
.\start_all.ps1
```

### Démarrer Backend seul
```powershell
cd backend
.\start.ps1
```

### Démarrer Frontend seul
```bash
pnpm dev
```

### Arrêter les serveurs
Appuyez sur `Ctrl+C` dans chaque fenêtre de serveur

## 🔍 Vérification

1. **Backend** : Ouvrez http://localhost:8000/api/docs
2. **Frontend** : Ouvrez http://localhost:5173
3. **Test de connexion** : Utilisez un compte de test pour vous connecter

## ⚠️ Notes importantes

- Le frontend utilise maintenant l'API réelle au lieu des données mockées
- Les tokens JWT sont stockés dans localStorage
- Le refresh token est géré automatiquement
- Les données sont filtrées automatiquement selon le rôle de l'utilisateur

## 🐛 Résolution de problèmes

### Backend ne démarre pas
- Vérifiez que MySQL est démarré
- Vérifiez les credentials dans `.env`
- Vérifiez que le port 8000 n'est pas utilisé

### Frontend ne démarre pas
- Vérifiez que Node.js et pnpm sont installés
- Exécutez `pnpm install` si nécessaire
- Vérifiez les ports 5173 ou 3000

### Erreur de connexion API
- Vérifiez que le backend est démarré
- Vérifiez l'URL dans `.env` (VITE_API_URL)
- Vérifiez les CORS settings dans le backend

## 📚 Documentation

- Backend : Voir `backend/README.md`
- Frontend : Voir la documentation dans le code
- API : http://localhost:8000/api/docs

---

🎉 **Le projet est maintenant opérationnel !**




