"""
Script pour initialiser les tables dans MySQL
À exécuter une fois que la base de données est créée
"""
from database import engine, Base
from models import *
import sys

def init_tables():
    """Créer toutes les tables dans la base de données"""
    try:
        print("Création des tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables créées avec succès!")
        return True
    except Exception as e:
        print(f"❌ Erreur lors de la création des tables: {e}")
        return False

if __name__ == "__main__":
    success = init_tables()
    sys.exit(0 if success else 1)




