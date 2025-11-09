from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Indicator, Project, User, UserRole
from schemas import IndicatorCreate, IndicatorUpdate, IndicatorResponse
from dependencies import get_current_user, require_permission, require_role
from audit import log_audit, AuditAction

router = APIRouter(prefix="/indicators", tags=["indicators"])


def filter_indicators_by_role(db: Session, current_user: User, query):
    """Filter indicators based on user role"""
    from models import Financement
    if current_user.role == UserRole.ADMIN:
        return query
    elif current_user.role == UserRole.CHEF_PROJET:
        # Chef sees indicators for their projects
        return query.join(Project, Indicator.projet_id == Project.id).filter(Project.chef_projet_id == current_user.id)
    elif current_user.role == UserRole.DONATEUR:
        # Donateurs see indicators for projects they've financed
        return query.join(Project, Indicator.projet_id == Project.id).join(
            Financement, Project.id == Financement.projet_id
        ).filter(Financement.donateur_id == current_user.id).distinct()
    return query.filter(False)


@router.get("", response_model=List[IndicatorResponse])
def get_indicators(
    skip: int = 0,
    limit: int = 100,
    projet_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get indicators (filtered by role)"""
    query = db.query(Indicator)
    
    if projet_id:
        query = query.filter(Indicator.projet_id == projet_id)
    
    query = filter_indicators_by_role(db, current_user, query)
    indicators = query.offset(skip).limit(limit).all()
    
    return indicators


@router.get("/{indicator_id}", response_model=IndicatorResponse)
def get_indicator(
    indicator_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get indicator by ID"""
    query = db.query(Indicator).filter(Indicator.id == indicator_id)
    query = filter_indicators_by_role(db, current_user, query)
    indicator = query.first()
    
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")
    
    return indicator


@router.post("", response_model=IndicatorResponse, status_code=status.HTTP_201_CREATED)
def create_indicator(
    indicator_data: IndicatorCreate,
    request: Request,
    current_user: User = Depends(require_permission("create_indicators")),
    db: Session = Depends(get_db)
):
    """Create new indicator"""
    # Verify project exists and user has access
    project = db.query(Project).filter(Project.id == indicator_data.projet_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if current_user.role == UserRole.CHEF_PROJET and project.chef_projet_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only add indicators to your own projects")
    
    new_indicator = Indicator(
        projet_id=indicator_data.projet_id,
        nom=indicator_data.nom,
        valeur=indicator_data.valeur,
        valeur_cible=indicator_data.valeur_cible,
        unite=indicator_data.unite,
        date_saisie=indicator_data.date_saisie,
        periode=indicator_data.periode,
        commentaire=indicator_data.commentaire,
        saisi_par=current_user.id
    )
    
    db.add(new_indicator)
    db.commit()
    db.refresh(new_indicator)
    
    log_audit(db, current_user.id, AuditAction.INDICATOR_CREATED, "Indicator", new_indicator.id, request=request)
    
    return new_indicator


@router.put("/{indicator_id}", response_model=IndicatorResponse)
def update_indicator(
    indicator_id: int,
    indicator_data: IndicatorUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update indicator"""
    query = db.query(Indicator).filter(Indicator.id == indicator_id)
    
    # Filter by role
    if current_user.role == UserRole.CHEF_PROJET:
        query = query.join(Indicator.projet).filter(Project.chef_projet_id == current_user.id)
    
    indicator = query.first()
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")
    
    # Update fields
    if indicator_data.nom is not None:
        indicator.nom = indicator_data.nom
    if indicator_data.valeur is not None:
        indicator.valeur = indicator_data.valeur
    if indicator_data.valeur_cible is not None:
        indicator.valeur_cible = indicator_data.valeur_cible
    if indicator_data.unite is not None:
        indicator.unite = indicator_data.unite
    if indicator_data.date_saisie is not None:
        indicator.date_saisie = indicator_data.date_saisie
    if indicator_data.periode is not None:
        indicator.periode = indicator_data.periode
    if indicator_data.commentaire is not None:
        indicator.commentaire = indicator_data.commentaire
    
    db.commit()
    db.refresh(indicator)
    
    log_audit(db, current_user.id, AuditAction.INDICATOR_UPDATED, "Indicator", indicator.id, request=request)
    
    return indicator


@router.delete("/{indicator_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_indicator(
    indicator_id: int,
    request: Request,
    current_user: User = Depends(require_role(["admin", "chef_projet"])),
    db: Session = Depends(get_db)
):
    """Delete indicator"""
    query = db.query(Indicator).filter(Indicator.id == indicator_id)
    
    if current_user.role == UserRole.CHEF_PROJET:
        query = query.join(Indicator.projet).filter(Project.chef_projet_id == current_user.id)
    
    indicator = query.first()
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")
    
    db.delete(indicator)
    db.commit()
    
    log_audit(db, current_user.id, AuditAction.INDICATOR_DELETED, "Indicator", indicator_id, request=request)
    
    return None

