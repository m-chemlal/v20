from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Document, Project, User, UserRole
from schemas import DocumentCreate, DocumentResponse
from dependencies import get_current_user, require_permission
from storage import upload_file, validate_file_type, get_presigned_url, delete_file
from audit import log_audit, AuditAction

router = APIRouter(prefix="/documents", tags=["documents"])


def filter_documents_by_role(db: Session, current_user: User, query):
    """Filter documents based on user role"""
    from models import Financement
    if current_user.role == UserRole.ADMIN:
        return query
    elif current_user.role == UserRole.CHEF_PROJET:
        # Chef sees documents for their projects
        return query.join(Project, Document.projet_id == Project.id).filter(Project.chef_projet_id == current_user.id)
    elif current_user.role == UserRole.DONATEUR:
        # Donateurs see documents for projects they've financed
        return query.join(Project, Document.projet_id == Project.id).join(
            Financement, Project.id == Financement.projet_id
        ).filter(Financement.donateur_id == current_user.id).distinct()
    return query.filter(False)


@router.get("", response_model=List[DocumentResponse])
def get_documents(
    skip: int = 0,
    limit: int = 100,
    projet_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get documents (filtered by role)"""
    query = db.query(Document)
    
    if projet_id:
        query = query.filter(Document.projet_id == projet_id)
    
    query = filter_documents_by_role(db, current_user, query)
    documents = query.offset(skip).limit(limit).all()
    
    return documents


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get document by ID"""
    query = db.query(Document).filter(Document.id == document_id)
    query = filter_documents_by_role(db, current_user, query)
    document = query.first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get presigned URL for document download"""
    query = db.query(Document).filter(Document.id == document_id)
    query = filter_documents_by_role(db, current_user, query)
    document = query.first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Generate presigned URL
    presigned_url = get_presigned_url(document.url_stockage, expiration=3600)
    
    if not presigned_url:
        raise HTTPException(status_code=500, detail="Failed to generate download URL")
    
    return {"download_url": presigned_url, "filename": document.nom_fichier}


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    projet_id: int,
    description: str = None,
    file: UploadFile = File(...),
    request: Request = None,
    current_user: User = Depends(require_permission("upload_documents")),
    db: Session = Depends(get_db)
):
    """Upload document"""
    # Verify project exists and user has access
    project = db.query(Project).filter(Project.id == projet_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if current_user.role == UserRole.CHEF_PROJET and project.chef_projet_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only upload documents to your own projects")
    
    # Validate file type
    if not validate_file_type(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(['pdf', 'jpg', 'png', 'xlsx'])}"
        )
    
    # Determine content type
    content_type_map = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    file_extension = file.filename.split('.')[-1].lower()
    content_type = content_type_map.get(file_extension, 'application/octet-stream')
    
    try:
        # Upload to S3
        url_stockage, file_size = upload_file(file.file, file.filename, projet_id, content_type)
        
        # Create document record
        new_document = Document(
            projet_id=projet_id,
            nom_fichier=file.filename,
            type_fichier=file_extension,
            taille=file_size,
            url_stockage=url_stockage,
            description=description,
            uploade_par=current_user.id
        )
        
        db.add(new_document)
        db.commit()
        db.refresh(new_document)
        
        log_audit(db, current_user.id, AuditAction.DOCUMENT_UPLOADED, "Document", new_document.id, request=request)
        
        return new_document
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete document"""
    query = db.query(Document).filter(Document.id == document_id)
    
    # Check permissions
    if current_user.role == UserRole.CHEF_PROJET:
        query = query.join(Document.projet).filter(Project.chef_projet_id == current_user.id)
    elif current_user.role == UserRole.DONATEUR:
        # Donateurs cannot delete documents
        raise HTTPException(status_code=403, detail="Donateurs cannot delete documents")
    
    document = query.first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from S3
    delete_file(document.url_stockage)
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    log_audit(db, current_user.id, AuditAction.DOCUMENT_DELETED, "Document", document_id, request=request)
    
    return None

