from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Project, Financement, User, SatisfactionSurvey, Indicator, UserRole
from schemas import KPIResponse
from dependencies import get_current_user, require_role
from exports import generate_pdf_report, generate_excel_report

router = APIRouter(prefix="/stats", tags=["statistics"])


@router.get("/kpis", response_model=KPIResponse)
def get_kpis(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get KPIs (admin only)"""
    # Total projects
    total_projects = db.query(Project).count()
    
    # Active projects
    active_projects = db.query(Project).filter(Project.statut == "en_cours").count()
    
    # Total budget
    total_budget_result = db.query(func.sum(Project.budget)).scalar()
    total_budget = total_budget_result if total_budget_result else 0
    
    # Total financed
    total_financed_result = db.query(func.sum(Financement.montant)).filter(
        Financement.statut.in_(["recu", "utilise"])
    ).scalar()
    total_financed = total_financed_result if total_financed_result else 0
    
    # Total donateurs
    total_donateurs = db.query(User).filter(User.role == UserRole.DONATEUR).count()
    
    # Average satisfaction
    avg_satisfaction_result = db.query(func.avg(SatisfactionSurvey.note)).scalar()
    average_satisfaction = avg_satisfaction_result if avg_satisfaction_result else None
    
    # Projects by domain
    projects_by_domain = {}
    domain_counts = db.query(Project.domaine, func.count(Project.id)).group_by(Project.domaine).all()
    for domain, count in domain_counts:
        projects_by_domain[domain.value] = count
    
    # Projects by status
    projects_by_status = {}
    status_counts = db.query(Project.statut, func.count(Project.id)).group_by(Project.statut).all()
    for status, count in status_counts:
        projects_by_status[status.value] = count
    
    return KPIResponse(
        total_projects=total_projects,
        active_projects=active_projects,
        total_budget=total_budget,
        total_financed=total_financed,
        total_donateurs=total_donateurs,
        average_satisfaction=average_satisfaction,
        projects_by_domain=projects_by_domain,
        projects_by_status=projects_by_status
    )


@router.get("/export/pdf")
def export_pdf(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Export projects as PDF (admin only)"""
    projects = db.query(Project).all()
    pdf_data = generate_pdf_report(projects, db)
    
    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=projects_report.pdf"}
    )


@router.get("/export/excel")
def export_excel(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Export projects as Excel (admin only)"""
    projects = db.query(Project).all()
    excel_data = generate_excel_report(projects, db)
    
    return Response(
        content=excel_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=projects_report.xlsx"}
    )

