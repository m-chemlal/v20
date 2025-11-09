from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from models import UserRole, ProjectDomain, ProjectStatus, FinancementStatut


# Auth Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=12)

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 12:
            raise ValueError('Password must be at least 12 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v):
            raise ValueError('Password must contain at least one special character')
        return v


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=12)

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 12:
            raise ValueError('Password must be at least 12 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v):
            raise ValueError('Password must contain at least one special character')
        return v


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    nom: str
    prenom: str
    telephone: Optional[str] = None
    role: UserRole
    actif: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=12)

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 12:
            raise ValueError('Password must be at least 12 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v):
            raise ValueError('Password must contain at least one special character')
        return v


class UserUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    telephone: Optional[str] = None
    role: Optional[UserRole] = None
    actif: Optional[bool] = None
    photo_profil: Optional[str] = None


class UserResponse(UserBase):
    id: int
    photo_profil: Optional[str] = None
    date_creation: datetime
    date_derniere_connexion: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserMeResponse(UserResponse):
    mot_de_passe_expire_le: Optional[datetime] = None
    date_modification: datetime


# Project Schemas
class ProjectBase(BaseModel):
    titre: str
    description: str
    domaine: ProjectDomain
    localisation: str
    pays: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    date_debut: date
    date_fin: Optional[date] = None
    budget: Decimal
    statut: ProjectStatus = ProjectStatus.PLANIFIE
    chef_projet_id: int
    image_url: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    titre: Optional[str] = None
    description: Optional[str] = None
    domaine: Optional[ProjectDomain] = None
    localisation: Optional[str] = None
    pays: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    budget: Optional[Decimal] = None
    statut: Optional[ProjectStatus] = None
    chef_projet_id: Optional[int] = None
    image_url: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    date_creation: datetime
    date_modification: datetime
    cree_par: Optional[int] = None

    class Config:
        from_attributes = True


class ProjectDetailResponse(ProjectResponse):
    indicators: List['IndicatorResponse'] = []
    financements: List['FinancementResponse'] = []
    documents: List['DocumentResponse'] = []


# Indicator Schemas
class IndicatorBase(BaseModel):
    nom: str
    valeur: Decimal
    valeur_cible: Optional[Decimal] = None
    unite: Optional[str] = None
    date_saisie: date
    periode: Optional[str] = None
    commentaire: Optional[str] = None


class IndicatorCreate(IndicatorBase):
    projet_id: int


class IndicatorUpdate(BaseModel):
    nom: Optional[str] = None
    valeur: Optional[Decimal] = None
    valeur_cible: Optional[Decimal] = None
    unite: Optional[str] = None
    date_saisie: Optional[date] = None
    periode: Optional[str] = None
    commentaire: Optional[str] = None


class IndicatorResponse(IndicatorBase):
    id: int
    projet_id: int
    saisi_par: int
    date_creation: datetime
    date_modification: datetime

    class Config:
        from_attributes = True


# Financement Schemas
class FinancementBase(BaseModel):
    montant: Decimal
    devise: str = "EUR"
    date_financement: date
    statut: FinancementStatut = FinancementStatut.PROMIS
    commentaire: Optional[str] = None


class FinancementCreate(FinancementBase):
    projet_id: int
    donateur_id: int


class FinancementUpdate(BaseModel):
    montant: Optional[Decimal] = None
    devise: Optional[str] = None
    date_financement: Optional[date] = None
    statut: Optional[FinancementStatut] = None
    commentaire: Optional[str] = None


class FinancementResponse(FinancementBase):
    id: int
    projet_id: int
    donateur_id: int
    date_creation: datetime
    date_modification: datetime

    class Config:
        from_attributes = True


# Document Schemas
class DocumentBase(BaseModel):
    nom_fichier: str
    type_fichier: str
    taille: int
    description: Optional[str] = None


class DocumentCreate(BaseModel):
    projet_id: int
    description: Optional[str] = None


class DocumentResponse(DocumentBase):
    id: int
    projet_id: int
    url_stockage: str
    uploade_par: int
    date_upload: datetime

    class Config:
        from_attributes = True


# Audit Log Schema
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# KPI & Stats Schemas
class KPIResponse(BaseModel):
    total_projects: int
    active_projects: int
    total_budget: Decimal
    total_financed: Decimal
    total_donateurs: int
    average_satisfaction: Optional[Decimal] = None
    projects_by_domain: dict
    projects_by_status: dict


# Update forward references
ProjectDetailResponse.model_rebuild()

