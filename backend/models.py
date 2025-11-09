from sqlalchemy import Column, Integer, String, Text, Numeric, Date, Boolean, DateTime, ForeignKey, BigInteger, Enum as SQLEnum, JSON, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import LONGBLOB, JSON as MySQLJSON
from sqlalchemy.sql import func
from datetime import datetime
import enum
from database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    CHEF_PROJET = "chef_projet"
    DONATEUR = "donateur"


class ProjectDomain(str, enum.Enum):
    EDUCATION = "education"
    SANTE = "sante"
    ENVIRONNEMENT = "environnement"
    EAU = "eau"
    INFRASTRUCTURE = "infrastructure"


class ProjectStatus(str, enum.Enum):
    PLANIFIE = "planifie"
    EN_COURS = "en_cours"
    TERMINE = "termine"
    SUSPENDU = "suspendu"


class FinancementStatut(str, enum.Enum):
    PROMIS = "promis"
    RECU = "recu"
    UTILISE = "utilise"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    mot_de_passe_hash = Column(Text, nullable=False)
    nom = Column(String(255), nullable=False)
    prenom = Column(String(255), nullable=False)
    telephone = Column(LargeBinary)  # Encrypted with AES_ENCRYPT
    role = Column(SQLEnum(UserRole), nullable=False, index=True)
    actif = Column(Boolean, nullable=False, default=True, index=True)
    photo_profil = Column(Text)
    mot_de_passe_change_le = Column(DateTime, nullable=False, server_default=func.now())
    mot_de_passe_expire_le = Column(DateTime)
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    locked_until = Column(DateTime)
    date_creation = Column(DateTime, nullable=False, server_default=func.now())
    date_derniere_connexion = Column(DateTime)
    date_modification = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    projects_as_chef = relationship("Project", foreign_keys="Project.chef_projet_id", back_populates="chef_projet")
    projects_created = relationship("Project", foreign_keys="Project.cree_par", back_populates="createur")
    indicators_created = relationship("Indicator", back_populates="saisi_par_user")
    financements = relationship("Financement", back_populates="donateur")
    documents_uploaded = relationship("Document", back_populates="uploade_par_user")
    password_history = relationship("PasswordHistory", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class PasswordHistory(Base):
    __tablename__ = "password_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    user = relationship("User", back_populates="password_history")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    titre = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    domaine = Column(SQLEnum(ProjectDomain), nullable=False, index=True)
    localisation = Column(Text, nullable=False)
    pays = Column(Text, nullable=False)
    latitude = Column(LargeBinary)   # Encrypted with AES_ENCRYPT
    longitude = Column(LargeBinary)  # Encrypted with AES_ENCRYPT
    date_debut = Column(Date, nullable=False)
    date_fin = Column(Date)
    budget = Column(Numeric(14, 2), nullable=False, index=True)
    statut = Column(SQLEnum(ProjectStatus), nullable=False, default=ProjectStatus.PLANIFIE, index=True)
    chef_projet_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    image_url = Column(Text)
    date_creation = Column(DateTime, nullable=False, server_default=func.now())
    date_modification = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    cree_par = Column(Integer, ForeignKey("users.id"))

    # Relationships
    chef_projet = relationship("User", foreign_keys=[chef_projet_id], back_populates="projects_as_chef")
    createur = relationship("User", foreign_keys=[cree_par], back_populates="projects_created")
    indicators = relationship("Indicator", back_populates="projet", cascade="all, delete-orphan")
    financements = relationship("Financement", back_populates="projet", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="projet", cascade="all, delete-orphan")


class Indicator(Base):
    __tablename__ = "indicators"

    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    nom = Column(String(255), nullable=False, index=True)
    valeur = Column(Numeric(14, 4), nullable=False)
    valeur_cible = Column(Numeric(14, 4))
    unite = Column(Text)
    date_saisie = Column(Date, nullable=False, index=True)
    periode = Column(Text)
    commentaire = Column(Text)
    saisi_par = Column(Integer, ForeignKey("users.id"), nullable=False)
    date_creation = Column(DateTime, nullable=False, server_default=func.now())
    date_modification = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    projet = relationship("Project", back_populates="indicators")
    saisi_par_user = relationship("User", back_populates="indicators_created")


class Financement(Base):
    __tablename__ = "financements"

    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    donateur_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    montant = Column(Numeric(14, 2), nullable=False)
    devise = Column(Text, nullable=False, default="EUR")
    date_financement = Column(Date, nullable=False)
    statut = Column(SQLEnum(FinancementStatut), nullable=False, default=FinancementStatut.PROMIS)
    commentaire = Column(Text)
    date_creation = Column(DateTime, nullable=False, server_default=func.now())
    date_modification = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    projet = relationship("Project", back_populates="financements")
    donateur = relationship("User", back_populates="financements")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    nom_fichier = Column(String(255), nullable=False)
    type_fichier = Column(String(50), nullable=False)
    taille = Column(Integer, nullable=False)
    url_stockage = Column(Text, nullable=False)
    description = Column(Text)
    uploade_par = Column(Integer, ForeignKey("users.id"), nullable=False)
    date_upload = Column(DateTime, nullable=False, server_default=func.now())

    # Relationships
    projet = relationship("Project", back_populates="documents")
    uploade_par_user = relationship("User", back_populates="documents_uploaded")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    action = Column(String(255), nullable=False, index=True)
    resource_type = Column(Text)
    resource_id = Column(Integer)
    details = Column(JSON)
    ip_address = Column(Text)
    user_agent = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")


class SatisfactionSurvey(Base):
    __tablename__ = "satisfaction_surveys"

    id = Column(Integer, primary_key=True, index=True)
    donateur_id = Column(Integer, ForeignKey("users.id"))
    note = Column(Numeric(2, 1), nullable=False)
    date_enquete = Column(Date, nullable=False, index=True)
    commentaire = Column(Text)

