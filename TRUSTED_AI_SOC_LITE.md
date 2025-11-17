# TRUSTED AI SOC LITE – Déploiement Debian natif

## 1. Architecture logique (sans Docker)

```
        [Réseau interne / VM cibles]
                  │
                  ▼
        (1) Nmap Scanner Automatisé
                  │  (résultats XML/JSON)
                  ▼
        (2) Moteur IA + XAI (Python)
                  │  (scores + explications)
                  ▼
        (3) Journal IA → Fichier log custom
                  │
        [Wazuh Agent - envoie les logs au Manager]
                  │
                  ▼
    [Wazuh Manager + Indexer + Dashboard (Kibana)]
                  │
                  ▼
        (4) Règles / Alertes SOC
                  │
                  ├──► (5) Dashboard SOC (Wazuh UI)
                  └──► (6) Moteur de réponse automatique
                           (UFW / iptables / mail / ticket)
```

## 2. Architecture physique Debian

La plateforme repose sur **une unique machine Debian** qui concentre les rôles :

1. **SOC Core** : Wazuh Manager, Indexer et Dashboard.
2. **Moteur de collecte et IA** : Nmap, parsing, scoring, XAI.
3. **Moteur de réponse** : scripts Bash/Python et Active Response.

| Couche   | Composant                          | Description                                                 |
|----------|------------------------------------|-------------------------------------------------------------|
| OS       | Debian 12                          | Gestion des services, comptes, journaux.                    |
| SIEM     | Wazuh Manager                      | Corrélation, règles et alertes.                             |
| SIEM     | Wazuh Indexer (Elastic/OpenSearch) | Indexation et recherche.                                    |
| SIEM     | Wazuh Dashboard                    | Interface SOC temps réel.                                   |
| Agent    | Wazuh Agent local                  | Surveille syslog + logs IA.                                 |
| Collecte | Nmap + scripts                     | Scans planifiés, parsing XML → JSON.                        |
| IA / XAI | Python (venv)                      | Feature engineering, scoring, SHAP/LIME.                    |
| Réponse  | Scripts Bash/Python                | UFW/iptables, mails, création tickets.                      |
| Audit    | JSON / SQLite                      | Traçabilité des décisions IA et réponses exécutées.         |

## 3. Organisation des dossiers

```
/opt/trusted_ai_soc_lite/
├── nmap_scanner/
│   ├── targets.txt
│   ├── run_scan.sh
│   ├── parse_nmap.py
│   └── reports/
├── ai_engine/
│   ├── venv/
│   ├── train_model.py
│   ├── analyse_scan.py
│   ├── models/
│   └── logs/
├── response_engine/
│   ├── responder.py
│   ├── ufw_actions.sh
│   └── mailer.py
└── audit/
    ├── ia_decisions.json
    └── response_actions.json
```

Le journal surveillé par Wazuh : `/var/log/trusted_ai_soc_lite.log`.

## 4. Flux détaillé

### Étape 1 – Scan réseau

- Un `cron` ou `systemd timer` exécute :

```bash
nmap -sV -O -oX /opt/trusted_ai_soc_lite/nmap_scanner/reports/scan_$(date +%F_%H%M).xml \
  -iL /opt/trusted_ai_soc_lite/nmap_scanner/targets.txt
```

- `parse_nmap.py` convertit le XML vers JSON propre.

### Étape 2 – Analyse IA + XAI

- `analyse_scan.py` lit les JSON, crée les features (ports, services, OS, CVSS estimé…).
- Modèle ML (clustering/anomalie) produit un score et une étiquette.
- SHAP/LIME justifie la décision.
- Chaque host/scan alimente `/var/log/trusted_ai_soc_lite.log` avec une ligne JSON :

```json
{
  "timestamp": "2025-11-17T11:30:00Z",
  "host": "192.168.1.10",
  "scan_id": "scan_2025-11-17_1130",
  "risk_score": 0.87,
  "label": "HIGH",
  "top_features": ["port_22_open", "service_ftp", "os=Windows"],
  "explanation": "SSH + FTP ouverts sur hôte exposé"
}
```

### Étape 3 – Intégration Wazuh

1. L'agent local surveille le fichier via `<localfile>` dans `/var/ossec/etc/ossec.conf`.
2. Le manager applique un **decoder** JSON et des **règles** adaptées :
   - `risk_score > 0.8` → alerte haute avec tag `AI_VULN_DETECTED`.
   - `label = "CRITICAL"` → déclenchement réponse auto.
3. Les événements sont indexés et visibles dans Wazuh Dashboard.

### Étape 4 – Réponse automatique

Deux stratégies :

- **Active Response Wazuh** : script déclenché par l'alerte (`ufw deny`, journalisation audit).
- **Service Python `responder.py`** : surveille les logs et agit (firewall, email, ticket, audit JSON).

### Étape 5 – Reporting & Audit

- Dashboard Wazuh : filtres par IP, score, vulnérabilité.
- Fichiers `ia_decisions.json` et `response_actions.json` : base pour graphiques/rapports PFA.

## 5. Couche par couche

1. **Collecte** : Nmap + Wazuh Agent + logs Debian.
2. **Analyse/IA** : scripts Python, modèles ML, XAI.
3. **SIEM** : Wazuh Manager, Indexer, Dashboard.
4. **Réponse** : Active Response ou service custom, scripts UFW/mail.
5. **Supervision** : Dashboard Wazuh + audit JSON/SQLite + éventuel mini dashboard Streamlit.

## 6. Résumé pour rapport

> Le prototype TRUSTED AI SOC LITE est déployé nativement sur une machine Debian unique. La plateforme héberge l'écosystème Wazuh complet, un module Nmap automatisé, un moteur IA/XAI en Python et un moteur de réponse orchestrant firewall, mails et tickets. Les scans sont enrichis par l'IA, journalisés puis ingérés par Wazuh pour analyse, visualisation et déclenchement d'actions défensives tout en alimentant des journaux d'audit consultables.
