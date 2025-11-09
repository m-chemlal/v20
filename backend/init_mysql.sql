-- ====================================================================
-- === Script d'initialisation MySQL pour ImpactTracker ==============
-- ====================================================================

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS impacttracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Utiliser la base de données
USE impacttracker;

-- Créer l'utilisateur (si nécessaire)
-- CREATE USER IF NOT EXISTS 'impact_root'@'localhost' IDENTIFIED BY 'momo12';
-- GRANT ALL PRIVILEGES ON impacttracker.* TO 'impact_root'@'localhost';
-- FLUSH PRIVILEGES;

-- ====================================================================
-- === Table users ===
-- ====================================================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  mot_de_passe_hash TEXT NOT NULL,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  telephone LONGBLOB, -- chiffré avec AES_ENCRYPT
  role ENUM('admin','chef_projet','donateur') NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  photo_profil TEXT,
  mot_de_passe_change_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  mot_de_passe_expire_le TIMESTAMP NULL,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMP NULL,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_derniere_connexion TIMESTAMP NULL,
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_actif (actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- === Table password_history ===
-- ====================================================================

CREATE TABLE IF NOT EXISTS password_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_password_history_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- === Table projects ===
-- ====================================================================

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  domaine ENUM('education','sante','environnement','eau','infrastructure') NOT NULL,
  localisation TEXT NOT NULL,
  pays VARCHAR(255) NOT NULL,
  latitude LONGBLOB,   -- chiffré AES
  longitude LONGBLOB,  -- chiffré AES
  date_debut DATE NOT NULL,
  date_fin DATE NULL,
  budget DECIMAL(14,2) NOT NULL,
  statut ENUM('planifie','en_cours','termine','suspendu') NOT NULL DEFAULT 'planifie',
  chef_projet_id INT NOT NULL,
  image_url TEXT,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  cree_par INT NULL,
  INDEX idx_projects_domaine (domaine),
  INDEX idx_projects_statut (statut),
  INDEX idx_projects_chef (chef_projet_id),
  INDEX idx_projects_budget (budget),
  FOREIGN KEY (chef_projet_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (cree_par) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- === Table indicators ===
-- ====================================================================

CREATE TABLE IF NOT EXISTS indicators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projet_id INT NOT NULL,
  nom VARCHAR(255) NOT NULL,
  valeur DECIMAL(14,4) NOT NULL,
  valeur_cible DECIMAL(14,4) NULL,
  unite VARCHAR(50),
  date_saisie DATE NOT NULL,
  periode VARCHAR(255),
  commentaire TEXT,
  saisi_par INT NOT NULL,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_indicators_projet (projet_id),
  INDEX idx_indicators_date (date_saisie),
  INDEX idx_indicators_nom (nom),
  FOREIGN KEY (projet_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (saisi_par) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- === Table financements ===
-- ====================================================================

CREATE TABLE IF NOT EXISTS financements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projet_id INT NOT NULL,
  donateur_id INT NOT NULL,
  montant DECIMAL(14,2) NOT NULL,
  devise VARCHAR(10) NOT NULL DEFAULT 'EUR',
  date_financement DATE NOT NULL,
  statut ENUM('promis','recu','utilise') NOT NULL DEFAULT 'promis',
  commentaire TEXT,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_financements_projet (projet_id),
  INDEX idx_financements_donateur (donateur_id),
  FOREIGN KEY (projet_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (donateur_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- === Table documents ===
-- ====================================================================

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projet_id INT NOT NULL,
  nom_fichier VARCHAR(255) NOT NULL,
  type_fichier VARCHAR(50) NOT NULL,
  taille INT NOT NULL,
  url_stockage TEXT NOT NULL,
  description TEXT,
  uploade_par INT NOT NULL,
  date_upload TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_documents_project (projet_id),
  FOREIGN KEY (projet_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploade_par) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- === Table audit_logs ===
-- ====================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(255),
  resource_id INT,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_created_at (created_at),
  INDEX idx_audit_logs_user (user_id),
  INDEX idx_audit_logs_action (action),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- === Table satisfaction_surveys ===
-- ====================================================================

CREATE TABLE IF NOT EXISTS satisfaction_surveys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donateur_id INT NULL,
  note DECIMAL(2,1) NOT NULL,
  date_enquete DATE NOT NULL,
  commentaire TEXT,
  INDEX idx_satisfaction_date (date_enquete),
  FOREIGN KEY (donateur_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




