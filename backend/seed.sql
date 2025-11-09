-- ====================================================================
-- === SEED DATA (exemples réalistes) =================================
-- ====================================================================
-- NOTE: Using a demo encryption key 'enc_demo_key_ChangeMe!' for telephone/lat/long encryption in seed.
-- In production use: encrypt(plaintext, :ENC_KEY, 'aes-cbc/pad:pkcs')

-- Utilisateurs demo (hash bcrypt cost=12 pré-calculés)
-- Hashes générés via bcrypt (cost 12)
-- Password: Admin123!@# (for admin@example.org)
-- Password: Chef123!@# (for chef@example.org)
-- Password: Donateur123!@# (for donateur@example.org)

INSERT INTO users (email, mot_de_passe_hash, nom, prenom, telephone, role, actif, mot_de_passe_change_le, mot_de_passe_expire_le)
VALUES
('admin@example.org',
 '$2b$12$IaTSBGBlgcYPb.Pjk0Oxdu7axFhhVceHB3yd7BQgpQyFBC62wj38m',
 'Diop', 'Fatou',
 pgp_sym_encrypt('+221 77 123 45 67','enc_demo_key_ChangeMe!','cipher-algo=aes256'),
 'admin', true, now() - interval '30 days', now() + interval '60 days')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, mot_de_passe_hash, nom, prenom, telephone, role, actif, mot_de_passe_change_le, mot_de_passe_expire_le)
VALUES
('chef@example.org',
 '$2b$12$P7WbGEymI.kR436blFZFDOr3Z7Cz8j46xZ2Pj1xnpdeLd5RhrgXhq',
 'Kane', 'Amadou',
 pgp_sym_encrypt('+221 70 987 65 43','enc_demo_key_ChangeMe!','cipher-algo=aes256'),
 'chef_projet', true, now() - interval '45 days', now() + interval '45 days')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, mot_de_passe_hash, nom, prenom, telephone, role, actif, mot_de_passe_change_le, mot_de_passe_expire_le)
VALUES
('donateur@example.org',
 '$2b$12$porGQTiCwzcsD2rjheOZHekJDxzQ22JCtARlHuVlh7Jh0MSmSX1X.',
 'Mbaye', 'Aïssatou',
 pgp_sym_encrypt('+221 76 555 44 33','enc_demo_key_ChangeMe!','cipher-algo=aes256'),
 'donateur', true, now() - interval '10 days', now() + interval '80 days')
ON CONFLICT (email) DO NOTHING;

-- Récupérer les ids pour références
-- (dans psql on peut faire SELECT id FROM users WHERE email=...;)

-- Exemple: projets seed (15 projets pour demo)
INSERT INTO projects (titre, description, domaine, localisation, pays, latitude, longitude, date_debut, date_fin, budget, statut, chef_projet_id, image_url, cree_par)
VALUES
('Éducation des filles rurales',
 'Programme de scolarisation et suivi des filles en zone rurale.',
 'education', 'Village Keur Mame', 'Sénégal',
 pgp_sym_encrypt('14.1372','enc_demo_key_ChangeMe!','cipher-algo=aes256'),
 pgp_sym_encrypt('-16.0755','enc_demo_key_ChangeMe!','cipher-algo=aes256'),
 '2023-01-15','2024-12-31', 50000.00, 'en_cours', (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1), 'https://cdn.impacttracker.org/projects/1.png', (SELECT id FROM users WHERE email='admin@example.org' LIMIT 1))
ON CONFLICT DO NOTHING;

INSERT INTO projects (titre, description, domaine, localisation, pays, latitude, longitude, date_debut, date_fin, budget, statut, chef_projet_id, image_url, cree_par)
VALUES
('Accès à l''eau potable - Région Est',
 'Construction de puits et forages, formation maintenance.',
 'eau', 'Commune Doué', 'Mali',
 pgp_sym_encrypt('12.6345','enc_demo_key_ChangeMe!','cipher-algo=aes256'),
 pgp_sym_encrypt('-7.9876','enc_demo_key_ChangeMe!','cipher-algo=aes256'),
 '2024-03-01', NULL, 75000.00, 'planifie', (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1), NULL, (SELECT id FROM users WHERE email='admin@example.org' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Ajouter plus de projets pour la demo (13 autres projets)
INSERT INTO projects (titre, description, domaine, localisation, pays, latitude, longitude, date_debut, date_fin, budget, statut, chef_projet_id, cree_par)
SELECT 
  'Projet ' || generate_series(3, 15),
  'Description du projet ' || generate_series(3, 15),
  CASE (generate_series(3, 15) % 5) 
    WHEN 0 THEN 'education'
    WHEN 1 THEN 'sante'
    WHEN 2 THEN 'environnement'
    WHEN 3 THEN 'eau'
    ELSE 'infrastructure'
  END,
  'Localisation ' || generate_series(3, 15),
  CASE (generate_series(3, 15) % 3)
    WHEN 0 THEN 'Sénégal'
    WHEN 1 THEN 'Mali'
    ELSE 'Burkina Faso'
  END,
  pgp_sym_encrypt('14.' || (generate_series(3, 15) * 0.1)::text,'enc_demo_key_ChangeMe!','cipher-algo=aes256'),
  pgp_sym_encrypt('-16.' || (generate_series(3, 15) * 0.1)::text,'enc_demo_key_ChangeMe!','cipher-algo=aes256'),
  '2024-01-01'::date + (generate_series(3, 15) * interval '30 days'),
  '2025-12-31'::date,
  (10000 + generate_series(3, 15) * 5000)::numeric(14,2),
  CASE (generate_series(3, 15) % 4)
    WHEN 0 THEN 'planifie'
    WHEN 1 THEN 'en_cours'
    WHEN 2 THEN 'termine'
    ELSE 'suspendu'
  END,
  (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1),
  (SELECT id FROM users WHERE email='admin@example.org' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE titre = 'Projet ' || generate_series(3, 15));

-- Indicators seed (50+ indicateurs pour demo)
INSERT INTO indicators (projet_id, nom, valeur, valeur_cible, unite, date_saisie, periode, commentaire, saisi_par)
VALUES
((SELECT id FROM projects WHERE titre='Éducation des filles rurales' LIMIT 1),
 'Nombre d''élèves inscrits', 487, 500, 'personnes', '2024-04-15', 'Avril 2024', 'Campagne dans 5 villages terminée.', (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1))
ON CONFLICT DO NOTHING;

INSERT INTO indicators (projet_id, nom, valeur, valeur_cible, unite, date_saisie, periode, commentaire, saisi_par)
VALUES
((SELECT id FROM projects WHERE titre='Éducation des filles rurales' LIMIT 1),
 'Taux d''assiduité', 87, 90, '%', '2024-04-15', 'Avril 2024', NULL, (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1))
ON CONFLICT DO NOTHING;

INSERT INTO indicators (projet_id, nom, valeur, valeur_cible, unite, date_saisie, periode, commentaire, saisi_par)
VALUES
((SELECT id FROM projects WHERE titre='Accès à l''eau potable - Région Est' LIMIT 1),
 'Nombre de puits construits', 0, 10, 'puits', '2024-05-01', 'Mai 2024', 'Phase préparation.', (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Ajouter plus d'indicateurs (47 autres)
INSERT INTO indicators (projet_id, nom, valeur, valeur_cible, unite, date_saisie, periode, saisi_par)
SELECT 
  p.id,
  'Indicateur ' || generate_series(4, 50),
  (random() * 1000)::numeric(14,4),
  (random() * 1200)::numeric(14,4),
  CASE (random() * 4)::int
    WHEN 0 THEN 'personnes'
    WHEN 1 THEN '%'
    WHEN 2 THEN 'unités'
    ELSE 'kg'
  END,
  '2024-01-01'::date + (random() * 365)::int,
  'Période ' || generate_series(4, 50),
  (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1)
FROM projects p
WHERE EXISTS (SELECT 1 FROM projects)
LIMIT 47;

-- Financements seed
INSERT INTO financements (projet_id, donateur_id, montant, devise, date_financement, statut, commentaire)
VALUES
((SELECT id FROM projects WHERE titre='Éducation des filles rurales' LIMIT 1), (SELECT id FROM users WHERE email='donateur@example.org' LIMIT 1), 20000.00, 'EUR', '2024-02-20', 'recu', 'Soutien majeur pour scolarisation.')
ON CONFLICT DO NOTHING;

INSERT INTO financements (projet_id, donateur_id, montant, devise, date_financement, statut, commentaire)
VALUES
((SELECT id FROM projects WHERE titre='Accès à l''eau potable - Région Est' LIMIT 1), (SELECT id FROM users WHERE email='donateur@example.org' LIMIT 1), 15000.00, 'EUR', '2024-06-01', 'promis', 'Engagement conditionnel.')
ON CONFLICT DO NOTHING;

-- Documents seed
INSERT INTO documents (projet_id, nom_fichier, type_fichier, taille, url_stockage, description, uploade_par)
VALUES
((SELECT id FROM projects WHERE titre='Éducation des filles rurales' LIMIT 1), 'rapport_initial.pdf', 'pdf', 234567, 's3://impacttracker-bucket/projects/1/rapport_initial.pdf', 'Rapport de démarrage', (SELECT id FROM users WHERE email='admin@example.org' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Password history seed (dernier hash)
INSERT INTO password_history (user_id, password_hash) 
SELECT id, mot_de_passe_hash FROM users WHERE email='admin@example.org' LIMIT 1
ON CONFLICT DO NOTHING;

-- Audit log seed
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
VALUES ((SELECT id FROM users WHERE email='admin@example.org' LIMIT 1), 'USER_CREATED', 'User', (SELECT id FROM users WHERE email='chef@example.org' LIMIT 1), '{"created_by":"bootstrap"}', '127.0.0.1', 'seed-script')
ON CONFLICT DO NOTHING;

-- Satisfaction surveys seed
INSERT INTO satisfaction_surveys (donateur_id, note, date_enquete, commentaire)
VALUES ((SELECT id FROM users WHERE email='donateur@example.org' LIMIT 1), 4.5, '2024-04-01', 'Satisfait des rapports trimestriels.')
ON CONFLICT DO NOTHING;

