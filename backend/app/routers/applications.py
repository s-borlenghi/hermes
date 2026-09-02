from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import Application, ApplicationStatus, Company, InterviewStage, User
from app.schemas import (
    ApplicationCreate,
    ApplicationList,
    ApplicationRead,
    ApplicationUpdate,
    InterviewStageCreate,
    InterviewStageRead,
)

router = APIRouter(prefix="/applications", tags=["applications"])


def _get_owned_application(application_id: int, db: Session, user: User) -> Application:
    application = (
        db.query(Application)
        .options(joinedload(Application.company), joinedload(Application.stages))
        .filter(Application.id == application_id, Application.owner_id == user.id)
        .first()
    )
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application


def _assert_owns_company(company_id: int, db: Session, user: User) -> None:
    exists = db.query(Company).filter(Company.id == company_id, Company.owner_id == user.id).first()
    if exists is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company not found")


@router.get("", response_model=ApplicationList)
def list_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    q: str | None = Query(default=None, description="Search role title or notes"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> ApplicationList:
    query = (
        db.query(Application)
        .options(joinedload(Application.company), joinedload(Application.stages))
        .filter(Application.owner_id == current_user.id)
    )
    if status_filter is not None:
        query = query.filter(Application.status == status_filter)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Application.role_title.ilike(like), Application.notes.ilike(like)))

    total = query.count()
    items = query.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()
    return ApplicationList(total=total, items=items)


@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Application:
    _assert_owns_company(payload.company_id, db, current_user)
    application = Application(owner_id=current_user.id, **payload.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    return _get_owned_application(application.id, db, current_user)


@router.get("/{application_id}", response_model=ApplicationRead)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Application:
    return _get_owned_application(application_id, db, current_user)


@router.patch("/{application_id}", response_model=ApplicationRead)
def update_application(
    application_id: int,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Application:
    application = _get_owned_application(application_id, db, current_user)
    updates = payload.model_dump(exclude_unset=True)
    if "company_id" in updates:
        _assert_owns_company(updates["company_id"], db, current_user)
    for field, value in updates.items():
        setattr(application, field, value)
    db.commit()
    return _get_owned_application(application_id, db, current_user)


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    application = _get_owned_application(application_id, db, current_user)
    db.delete(application)
    db.commit()


@router.post(
    "/{application_id}/stages",
    response_model=InterviewStageRead,
    status_code=status.HTTP_201_CREATED,
)
def add_stage(
    application_id: int,
    payload: InterviewStageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewStage:
    application = _get_owned_application(application_id, db, current_user)
    stage = InterviewStage(application_id=application.id, **payload.model_dump())
    db.add(stage)
    db.commit()
    db.refresh(stage)
    return stage


@router.delete("/{application_id}/stages/{stage_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stage(
    application_id: int,
    stage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    _get_owned_application(application_id, db, current_user)
    stage = (
        db.query(InterviewStage)
        .filter(InterviewStage.id == stage_id, InterviewStage.application_id == application_id)
        .first()
    )
    if stage is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stage not found")
    db.delete(stage)
    db.commit()
