from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Company, User
from app.schemas import CompanyCreate, CompanyRead, CompanyUpdate

router = APIRouter(prefix="/companies", tags=["companies"])


def _get_owned_company(company_id: int, db: Session, user: User) -> Company:
    company = db.query(Company).filter(Company.id == company_id, Company.owner_id == user.id).first()
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    return company


@router.get("", response_model=list[CompanyRead])
def list_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Company]:
    return db.query(Company).filter(Company.owner_id == current_user.id).order_by(Company.name).all()


@router.post("", response_model=CompanyRead, status_code=status.HTTP_201_CREATED)
def create_company(
    payload: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Company:
    company = Company(owner_id=current_user.id, **payload.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("/{company_id}", response_model=CompanyRead)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Company:
    return _get_owned_company(company_id, db, current_user)


@router.patch("/{company_id}", response_model=CompanyRead)
def update_company(
    company_id: int,
    payload: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Company:
    company = _get_owned_company(company_id, db, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    db.commit()
    db.refresh(company)
    return company


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    company = _get_owned_company(company_id, db, current_user)
    db.delete(company)
    db.commit()
