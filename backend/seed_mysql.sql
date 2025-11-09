-- ====================================================================
-- === SEED DATA MySQL (exemples réalistes) ==========================
-- ====================================================================

USE impacttracker;

-- Utilisateurs demo (hash bcrypt cost=12 pré-calculés)
-- Hashes générés via bcrypt (cost 12)
-- Password: Admin123!@# (for admin@example.org)
-- Password: Chef123!@# (for chef@example.org)
-- Password: Donateur123!@# (for donateur@example.org)

INSERT INTO users (email, mot_de_passe_hash, nom, prenom, telephone, role, actif, mot_de_passe_change_le, mot_de_passe_expire_le, failed_login_attempts)
VALUES
('admin@example.org',
 '$2b$12$IaTSBGBlgcYPb.Pjk0Oxdu7axFhhVceHB3yd7BQgpQyFBC62wj38m',
 'Diop', 'Fatou',
 AES_ENCRYPT('+221 77 123 45 67', 'enc_demo_key_ChangeMe!'),
 'admin', TRUE, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 60 DAY), 0)
ON DUPLICATE KEY UPDATE email=email;

INSERT INTO users (email, mot_de_passe_hash, nom, prenom, telephone, role, actif, mot_de_passe_change_le, mot_de_passe_expire_le, failed_login_attempts)
VALUES
('chef@example.org',
 '$2b$12$P7WbGEymI.kR436blFZFDOr3Z7Cz8j46xZ2Pj1xnpdeLd5RhrgXhq',
 'Kane', 'Amadou',
 AES_ENCRYPT('+221 70 987 65 43', 'enc_demo_key_ChangeMe!'),
 'chef_projet', TRUE, DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_ADD(NOW(), INTERVAL 45 DAY), 0)
ON DUPLICATE KEY UPDATE email=email;

INSERT INTO users (email, mot_de_passe_hash, nom, prenom, telephone, role, actif, mot_de_passe_change_le, mot_de_passe_expire_le, failed_login_attempts)
VALUES
('donateur@example.org',
 '$2b$12$porGQTiCwzcsD2rjheOZHekJDxzQ22JCtARlHuVlh7Jh0MSmSX1X.',
 'Mbaye', 'Aïssatou',
 AES_ENCRYPT('+221 76 555 44 33', 'enc_demo_key_ChangeMe!'),
 'donateur', TRUE, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 80 DAY), 0)
ON DUPLICATE KEY UPDATE email=email;

-- Projets seed (15 projets pour demo)
INSERT INTO projects (titre, description, domaine, localisation, pays, latitude, longitude, date_debut, date_fin, budget, statut, chef_projet_id, image_url, cree_par)
VALUES
('Éducation des filles rurales',
 'Programme de scolarisation et suivi des filles en zone rurale.',
 'education', 'Village Keur Mame', 'Sénégal',
 AES_ENCRYPT('14.1372', 'enc_demo_key_ChangeMe!'),
 AES_ENCRYPT('-16.0755', 'enc_demo_key_ChangeMe!'),
 '2023-01-15','2024-12-31', 50000.00, 'en_cours', 
 (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1), 
 'https://cdn.impacttracker.org/projects/1.png', 
 (SELECT id FROM users WHERE email='admin@example.org' LIMIT 1))
ON DUPLICATE KEY UPDATE titre=titre;

INSERT INTO projects (titre, description, domaine, localisation, pays, latitude, longitude, date_debut, date_fin, budget, statut, chef_projet_id, image_url, cree_par)
VALUES
('Accès à l''eau potable - Région Est',
 'Construction de puits et forages, formation maintenance.',
 'eau', 'Commune Doué', 'Mali',
 AES_ENCRYPT('12.6345', 'enc_demo_key_ChangeMe!'),
 AES_ENCRYPT('-7.9876', 'enc_demo_key_ChangeMe!'),
 '2024-03-01', NULL, 75000.00, 'planifie', 
 (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1), 
 NULL, 
 (SELECT id FROM users WHERE email='admin@example.org' LIMIT 1))
ON DUPLICATE KEY UPDATE titre=titre;

-- Ajouter plus de projets pour la demo (13 autres projets)
INSERT INTO projects (titre, description, domaine, localisation, pays, latitude, longitude, date_debut, date_fin, budget, statut, chef_projet_id, cree_par)
SELECT 
  CONCAT('Projet ', n),
  CONCAT('Description du projet ', n),
  CASE (n % 5) 
    WHEN 0 THEN 'education'
    WHEN 1 THEN 'sante'
    WHEN 2 THEN 'environnement'
    WHEN 3 THEN 'eau'
    ELSE 'infrastructure'
  END,
  CONCAT('Localisation ', n),
  CASE (n % 3)
    WHEN 0 THEN 'Sénégal'
    WHEN 1 THEN 'Mali'
    ELSE 'Burkina Faso'
  END,
  AES_ENCRYPT(CONCAT('14.', n * 0.1), 'enc_demo_key_ChangeMe!'),
  AES_ENCRYPT(CONCAT('-16.', n * 0.1), 'enc_demo_key_ChangeMe!'),
  DATE_ADD('2024-01-01', INTERVAL (n * 30) DAY),
  '2025-12-31',
  (10000 + n * 5000),
  CASE (n % 4)
    WHEN 0 THEN 'planifie'
    WHEN 1 THEN 'en_cours'
    WHEN 2 THEN 'termine'
    ELSE 'suspendu'
  END,
  (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1),
  (SELECT id FROM users WHERE email='admin@example.org' LIMIT 1)
FROM (
  SELECT 3 + t1.n + t2.n*10 AS n
  FROM (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t1
  CROSS JOIN (SELECT 0 AS n UNION SELECT 1) t2
) numbers
WHERE n <= 15
AND NOT EXISTS (SELECT 1 FROM projects WHERE titre = CONCAT('Projet ', n));

-- Indicators seed (50+ indicateurs pour demo)
INSERT INTO indicators (projet_id, nom, valeur, valeur_cible, unite, date_saisie, periode, commentaire, saisi_par)
VALUES
((SELECT id FROM projects WHERE titre='Éducation des filles rurales' LIMIT 1),
 'Nombre d''élèves inscrits', 487, 500, 'personnes', '2024-04-15', 'Avril 2024', 'Campagne dans 5 villages terminée.', 
 (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1))
ON DUPLICATE KEY UPDATE nom=nom;

INSERT INTO indicators (projet_id, nom, valeur, valeur_cible, unite, date_saisie, periode, commentaire, saisi_par)
VALUES
((SELECT id FROM projects WHERE titre='Éducation des filles rurales' LIMIT 1),
 'Taux d''assiduité', 87, 90, '%', '2024-04-15', 'Avril 2024', NULL, 
 (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1))
ON DUPLICATE KEY UPDATE nom=nom;

INSERT INTO indicators (projet_id, nom, valeur, valeur_cible, unite, date_saisie, periode, commentaire, saisi_par)
VALUES
((SELECT id FROM projects WHERE titre='Accès à l''eau potable - Région Est' LIMIT 1),
 'Nombre de puits construits', 0, 10, 'puits', '2024-05-01', 'Mai 2024', 'Phase préparation.', 
 (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1))
ON DUPLICATE KEY UPDATE nom=nom;

-- Ajouter plus d'indicateurs (47 autres)
INSERT INTO indicators (projet_id, nom, valeur, valeur_cible, unite, date_saisie, periode, saisi_par)
SELECT 
  p.id,
  CONCAT('Indicateur ', n),
  ROUND(RAND() * 1000, 4),
  ROUND(RAND() * 1200, 4),
  CASE FLOOR(RAND() * 4)
    WHEN 0 THEN 'personnes'
    WHEN 1 THEN '%'
    WHEN 2 THEN 'unités'
    ELSE 'kg'
  END,
  DATE_ADD('2024-01-01', INTERVAL FLOOR(RAND() * 365) DAY),
  CONCAT('Période ', n),
  (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1)
FROM (
  SELECT 4 + t1.n + t2.n*10 AS n
  FROM (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t1
  CROSS JOIN (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) t2
) numbers
CROSS JOIN projects p
WHERE n <= 50
LIMIT 47;

-- Financements seed
INSERT INTO financements (projet_id, donateur_id, montant, devise, date_financement, statut, commentaire)
VALUES
((SELECT id FROM projects WHERE titre='Éducation des filles rurales' LIMIT 1), 
 (SELECT id FROM users WHERE email='donateur@example.org' LIMIT 1), 
 20000.00, 'EUR', '2024-02-20', 'recu', 'Soutien majeur pour scolarisation.')
ON DUPLICATE KEY UPDATE projet_id=projet_id;

INSERT INTO financements (projet_id, donateur_id, montant, devise, date_financement, statut, commentaire)
VALUES
((SELECT id FROM projects WHERE titre='Accès à l''eau potable - Région Est' LIMIT 1), 
 (SELECT id FROM users WHERE email='donateur@example.org' LIMIT 1), 
 15000.00, 'EUR', '2024-06-01', 'promis', 'Engagement conditionnel.')
ON DUPLICATE KEY UPDATE projet_id=projet_id;

-- Documents seed
INSERT INTO documents (projet_id, nom_fichier, type_fichier, taille, url_stockage, description, uploade_par)
VALUES
((SELECT id FROM projects WHERE titre='Éducation des filles rurales' LIMIT 1), 
 'rapport_initial.pdf', 'pdf', 234567, 's3://impacttracker-bucket/projects/1/rapport_initial.pdf', 
 'Rapport de démarrage', 
 (SELECT id FROM users WHERE email='admin@example.org' LIMIT 1))
ON DUPLICATE KEY UPDATE nom_fichier=nom_fichier;

-- Password history seed (dernier hash)
INSERT INTO password_history (user_id, password_hash) 
SELECT id, mot_de_passe_hash FROM users WHERE email='admin@example.org' LIMIT 1
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Audit log seed
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
VALUES (
  (SELECT id FROM users WHERE email='admin@example.org' LIMIT 1), 
  'USER_CREATED', 'User', 
  (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1), 
  '{"created_by":"bootstrap"}', 
  '127.0.0.1', 'seed-script');

-- Satisfaction surveys seed
INSERT INTO satisfaction_surveys (donateur_id, note, date_enquete, commentaire)
VALUES (
  (SELECT id FROM users WHERE email='donateur@example.org' LIMIT 1), 
  4.5, '2024-04-01', 'Satisfait des rapports trimestriels.')
ON DUPLICATE KEY UPDATE donateur_id=donateur_id;

