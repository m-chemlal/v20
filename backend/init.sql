-- === Création d'un rôle / base (DEMO) ===
-- NOTE: ceci est pour un environnement de dev/demo. Ne pas utiliser root en prod.

CREATE ROLE IF NOT EXISTS impact_root WITH LOGIN PASSWORD 'momo12';

CREATE DATABASE IF NOT EXISTS impacttracker OWNER impact_root;

-- Connect to DB (exécuter dans psql ou via client connecté à la DB impacttracker)
\c impacttracker;

-- Activer l'extension pgcrypto (pour encrypt/decrypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- === Paramètre de démonstration : clé de chiffrement (pour seed only) ===
-- EN PRODUCTION : utilise une variable d'environnement et secrets manager.
-- Ici : enc_demo_key_ChangeMe! (exemple)
-- We'll use this literal in seed inserts. In app, use parameterized queries with env key.
-- ------------------------------------------------------------------------------

-- === Table users ===
CREATE TYPE user_role AS ENUM ('admin','chef_projet','donateur');

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  mot_de_passe_hash TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone BYTEA, -- chiffré avec pgcrypto.encrypt(...)
  role user_role NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  photo_profil TEXT,
  mot_de_passe_change_le TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  mot_de_passe_expire_le TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_derniere_connexion TIMESTAMP WITH TIME ZONE,
  date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_actif ON users(actif);

-- === Table password_history ===
CREATE TABLE IF NOT EXISTS password_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);

-- === Table projects ===
CREATE TYPE project_domain AS ENUM ('education','sante','environnement','eau','infrastructure');
CREATE TYPE project_status AS ENUM ('planifie','en_cours','termine','suspendu');

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  domaine project_domain NOT NULL,
  localisation TEXT NOT NULL,
  pays TEXT NOT NULL,
  latitude BYTEA,   -- chiffre AES
  longitude BYTEA,  -- chiffre AES
  date_debut DATE NOT NULL,
  date_fin DATE,
  budget NUMERIC(14,2) NOT NULL,
  statut project_status NOT NULL DEFAULT 'planifie',
  chef_projet_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  image_url TEXT,
  date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cree_par INTEGER REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_projects_domaine ON projects(domaine);
CREATE INDEX IF NOT EXISTS idx_projects_statut ON projects(statut);
CREATE INDEX IF NOT EXISTS idx_projects_chef ON projects(chef_projet_id);
CREATE INDEX IF NOT EXISTS idx_projects_budget ON projects(budget);

-- === Table indicators ===
CREATE TABLE IF NOT EXISTS indicators (
  id SERIAL PRIMARY KEY,
  projet_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  valeur NUMERIC(14,4) NOT NULL,
  valeur_cible NUMERIC(14,4),
  unite TEXT,
  date_saisie DATE NOT NULL,
  periode TEXT,
  commentaire TEXT,
  saisi_par INTEGER NOT NULL REFERENCES users(id),
  date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_indicators_projet ON indicators(projet_id);
CREATE INDEX IF NOT EXISTS idx_indicators_date ON indicators(date_saisie);
CREATE INDEX IF NOT EXISTS idx_indicators_nom ON indicators(nom);

-- === Table financements ===
CREATE TYPE financement_statut AS ENUM ('promis','recu','utilise');

CREATE TABLE IF NOT EXISTS financements (
  id SERIAL PRIMARY KEY,
  projet_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  donateur_id INTEGER NOT NULL REFERENCES users(id),
  montant NUMERIC(14,2) NOT NULL,
  devise TEXT NOT NULL DEFAULT 'EUR',
  date_financement DATE NOT NULL,
  statut financement_statut NOT NULL DEFAULT 'promis',
  commentaire TEXT,
  date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_financements_projet ON financements(projet_id);
CREATE INDEX IF NOT EXISTS idx_financements_donateur ON financements(donateur_id);

-- === Table documents ===
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  projet_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nom_fichier TEXT NOT NULL,
  type_fichier TEXT NOT NULL,
  taille INTEGER NOT NULL,
  url_stockage TEXT NOT NULL,
  description TEXT,
  uploade_par INTEGER NOT NULL REFERENCES users(id),
  date_upload TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(projet_id);

-- === Table audit_logs ===
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id INTEGER,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- === Table satisfaction_surveys (pour demo KPI) ===
CREATE TABLE IF NOT EXISTS satisfaction_surveys (
  id SERIAL PRIMARY KEY,
  donateur_id INTEGER REFERENCES users(id),
  note NUMERIC(2,1) NOT NULL,
  date_enquete DATE NOT NULL,
  commentaire TEXT
);
CREATE INDEX IF NOT EXISTS idx_satisfaction_date ON satisfaction_surveys(date_enquete);

-- === Contraintes & triggers basiques ===
-- Trigger / function to auto-update date_modification
CREATE OR REPLACE FUNCTION set_updated_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date_modification = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_projects_updated ON projects;
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_timestamp();

DROP TRIGGER IF EXISTS trg_indicators_updated ON indicators;
CREATE TRIGGER trg_indicators_updated BEFORE UPDATE ON indicators FOR EACH ROW EXECUTE FUNCTION set_updated_timestamp();

DROP TRIGGER IF EXISTS trg_financements_updated ON financements;
CREATE TRIGGER trg_financements_updated BEFORE UPDATE ON financements FOR EACH ROW EXECUTE FUNCTION set_updated_timestamp();

