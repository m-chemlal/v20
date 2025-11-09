from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Financement, Project, User, UserRole
from schemas import FinancementCreate, FinancementUpdate, FinancementResponse
from dependencies import get_current_user, require_permission, require_role
from audit import log_audit, AuditAction

router = APIRouter(prefix="/financements", tags=["financements"])


def filter_financements_by_role(db: Session, current_user: User, query):
    """Filter financements based on user role"""
    if current_user.role == UserRole.ADMIN:
        return query
    elif current_user.role == UserRole.DONATEUR:
        return query.filter(Financement.donateur_id == current_user.id)
    elif current_user.role == UserRole.CHEF_PROJET:
        # Chef sees financements for their projects
        return query.join(Project, Financement.projet_id == Project.id).filter(Project.chef_projet_id == current_user.id)
    return query.filter(False)


@router.get("", response_model=List[FinancementResponse])
def get_financements(
    skip: int = 0,
    limit: int = 100,
    projet_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get financements (filtered by role)"""
    query = db.query(Financement)
    
    if projet_id:
        query = query.filter(Financement.projet_id == projet_id)
    
    query = filter_financements_by_role(db, current_user, query)
    financements = query.offset(skip).limit(limit).all()
    
    return financements


@router.get("/{financement_id}", response_model=FinancementResponse)
def get_financement(
    financement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get financement by ID"""
    query = db.query(Financement).filter(Financement.id == financement_id)
    query = filter_financements_by_role(db, current_user, query)
    financement = query.first()
    
    if not financement:
        raise HTTPException(status_code=404, detail="Financement not found")
    
    return financement


@router.post("", response_model=FinancementResponse, status_code=status.HTTP_201_CREATED)
def create_financement(
    financement_data: FinancementCreate,
    request: Request,
    current_user: User = Depends(require_permission("create_financement")),
    db: Session = Depends(get_db)
):
    """Create new financement"""
    # Verify project exists
    project = db.query(Project).filter(Project.id == financement_data.projet_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if current_user.role == UserRole.DONATEUR:
        # Donateurs can only create financements for themselves
        financement_data.donateur_id = current_user.id
    elif current_user.role == UserRole.CHEF_PROJET:
        # Chefs cannot create financements
        raise HTTPException(status_code=403, detail="Chef de projet cannot create financements")
    
    # Verify donateur exists
    donateur = db.query(User).filter(User.id == financement_data.donateur_id).first()
    if not donateur or donateur.role != UserRole.DONATEUR:
        raise HTTPException(status_code=400, detail="Invalid donateur_id")
    
    new_financement = Financement(
        projet_id=financement_data.projet_id,
        donateur_id=financement_data.donateur_id,
        montant=financement_data.montant,
        devise=financement_data.devise,
        date_financement=financement_data.date_financement,
        statut=financement_data.statut,
        commentaire=financement_data.commentaire
    )
    
    db.add(new_financement)
    db.commit()
    db.refresh(new_financement)
    
    log_audit(db, current_user.id, AuditAction.FINANCEMENT_CREATED, "Financement", new_financement.id, request=request)
    
    return new_financement


@router.put("/{financement_id}", response_model=FinancementResponse)
def update_financement(
    financement_id: int,
    financement_data: FinancementUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update financement"""
    query = db.query(Financement).filter(Financement.id == financement_id)
    
    # Filter by role
    if current_user.role == UserRole.DONATEUR:
        query = query.filter(Financement.donateur_id == current_user.id)
    elif current_user.role == UserRole.CHEF_PROJET:
        query = query.join(Financement.projet).filter(Project.chef_projet_id == current_user.id)
    
    financement = query.first()
    if not financement:
        raise HTTPException(status_code=404, detail="Financement not found")
    
    # Donateurs can only update their own financements and only certain fields
    if current_user.role == UserRole.DONATEUR:
        if financement_data.donateur_id is not None or financement_data.projet_id is not None:
            raise HTTPException(status_code=403, detail="Cannot change donateur or project")
    
    # Update fields
    if financement_data.montant is not None:
        financement.montant = financement_data.montant
    if financement_data.devise is not None:
        financement.devise = financement_data.devise
    if financement_data.date_financement is not None:
        financement.date_financement = financement_data.date_financement
    if financement_data.statut is not None:
        financement.statut = financement_data.statut
    if financement_data.commentaire is not None:
        financement.commentaire = financement_data.commentaire
    
    db.commit()
    db.refresh(financement)
    
    log_audit(db, current_user.id, AuditAction.FINANCEMENT_UPDATED, "Financement", financement.id, request=request)
    
    return financement


@router.delete("/{financement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_financement(
    financement_id: int,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Delete financement (admin only)"""
    financement = db.query(Financement).filter(Financement.id == financement_id).first()
    if not financement:
        raise HTTPException(status_code=404, detail="Financement not found")
    
    db.delete(financement)
    db.commit()
    
    log_audit(db, current_user.id, AuditAction.FINANCEMENT_DELETED, "Financement", financement_id, request=request)
    
    return None

