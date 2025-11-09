-- Script de configuration MySQL pour ImpactTracker
-- À exécuter en tant que root

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS impacttracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur
CREATE USER IF NOT EXISTS 'impact_root'@'localhost' IDENTIFIED BY 'momo12';

-- Donner les permissions
GRANT ALL PRIVILEGES ON impacttracker.* TO 'impact_root'@'localhost';

-- Recharger les privilèges
FLUSH PRIVILEGES;

-- Afficher la confirmation
SELECT 'Base de donnees et utilisateur crees avec succes!' AS Message;




