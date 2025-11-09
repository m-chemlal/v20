from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Project, User, UserRole
from schemas import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetailResponse
from dependencies import get_current_user, require_role, require_permission
from security import encrypt_field, decrypt_field
from audit import log_audit, AuditAction

router = APIRouter(prefix="/projects", tags=["projects"])


def filter_projects_by_role(db: Session, current_user: User, query):
    """Filter projects based on user role"""
    from models import Financement
    if current_user.role == UserRole.ADMIN:
        return query
    elif current_user.role == UserRole.CHEF_PROJET:
        return query.filter(Project.chef_projet_id == current_user.id)
    elif current_user.role == UserRole.DONATEUR:
        # Donateurs see projects they've financed
        return query.join(Financement, Project.id == Financement.projet_id).filter(
            Financement.donateur_id == current_user.id
        ).distinct()
    return query.filter(False)  # No access


@router.get("", response_model=List[ProjectResponse])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get projects (filtered by role)"""
    query = db.query(Project)
    query = filter_projects_by_role(db, current_user, query)
    projects = query.offset(skip).limit(limit).all()
    
    # Decrypt coordinates for response
    result = []
    for project in projects:
        project_data = ProjectResponse.from_orm(project)
        if project.latitude:
            project_data.latitude = float(decrypt_field(db, project.latitude) or 0)
        if project.longitude:
            project_data.longitude = float(decrypt_field(db, project.longitude) or 0)
        result.append(project_data)
    
    return result


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get project by ID"""
    query = db.query(Project).filter(Project.id == project_id)
    query = filter_projects_by_role(db, current_user, query)
    project = query.first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_data = ProjectDetailResponse.from_orm(project)
    
    # Decrypt coordinates
    if project.latitude:
        project_data.latitude = float(decrypt_field(db, project.latitude) or 0)
    if project.longitude:
        project_data.longitude = float(decrypt_field(db, project.longitude) or 0)
    
    # Load relationships
    project_data.indicators = project.indicators
    project_data.financements = project.financements
    project_data.documents = project.documents
    
    return project_data


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    request: Request,
    current_user: User = Depends(require_permission("create_projects")),
    db: Session = Depends(get_db)
):
    """Create new project"""
    # Admin can create projects, chef_projet needs explicit permission
    if current_user.role not in [UserRole.ADMIN, UserRole.CHEF_PROJET]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    # Verify chef_projet exists and has correct role
    if current_user.role != UserRole.ADMIN:
        chef = db.query(User).filter(User.id == project_data.chef_projet_id).first()
        if not chef or chef.role != UserRole.CHEF_PROJET:
            raise HTTPException(status_code=400, detail="Invalid chef_projet_id")
    
    # Encrypt coordinates
    encrypted_lat = encrypt_field(db, str(project_data.latitude)) if project_data.latitude else None
    encrypted_lon = encrypt_field(db, str(project_data.longitude)) if project_data.longitude else None
    
    new_project = Project(
        titre=project_data.titre,
        description=project_data.description,
        domaine=project_data.domaine,
        localisation=project_data.localisation,
        pays=project_data.pays,
        latitude=encrypted_lat,
        longitude=encrypted_lon,
        date_debut=project_data.date_debut,
        date_fin=project_data.date_fin,
        budget=project_data.budget,
        statut=project_data.statut,
        chef_projet_id=project_data.chef_projet_id,
        image_url=project_data.image_url,
        cree_par=current_user.id
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    log_audit(db, current_user.id, AuditAction.PROJECT_CREATED, "Project", new_project.id, request=request)
    
    project_response = ProjectResponse.from_orm(new_project)
    if new_project.latitude:
        project_response.latitude = project_data.latitude
    if new_project.longitude:
        project_response.longitude = project_data.longitude
    
    return project_response


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update project"""
    query = db.query(Project).filter(Project.id == project_id)
    
    # Check permissions
    if current_user.role == UserRole.CHEF_PROJET:
        query = query.filter(Project.chef_projet_id == current_user.id)
    
    project = query.first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update fields
    if project_data.titre is not None:
        project.titre = project_data.titre
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.domaine is not None:
        project.domaine = project_data.domaine
    if project_data.localisation is not None:
        project.localisation = project_data.localisation
    if project_data.pays is not None:
        project.pays = project_data.pays
    if project_data.latitude is not None:
        project.latitude = encrypt_field(db, str(project_data.latitude))
    if project_data.longitude is not None:
        project.longitude = encrypt_field(db, str(project_data.longitude))
    if project_data.date_debut is not None:
        project.date_debut = project_data.date_debut
    if project_data.date_fin is not None:
        project.date_fin = project_data.date_fin
    if project_data.budget is not None:
        project.budget = project_data.budget
    if project_data.statut is not None:
        project.statut = project_data.statut
    if project_data.chef_projet_id is not None and current_user.role == UserRole.ADMIN:
        project.chef_projet_id = project_data.chef_projet_id
    if project_data.image_url is not None:
        project.image_url = project_data.image_url
    
    db.commit()
    db.refresh(project)
    
    log_audit(db, current_user.id, AuditAction.PROJECT_UPDATED, "Project", project.id, request=request)
    
    project_response = ProjectResponse.from_orm(project)
    if project.latitude:
        project_response.latitude = project_data.latitude if project_data.latitude else float(decrypt_field(db, project.latitude) or 0)
    if project.longitude:
        project_response.longitude = project_data.longitude if project_data.longitude else float(decrypt_field(db, project.longitude) or 0)
    
    return project_response


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Delete project (admin only)"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    
    log_audit(db, current_user.id, AuditAction.PROJECT_DELETED, "Project", project_id, request=request)
    
    return None

