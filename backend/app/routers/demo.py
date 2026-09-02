from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session, joinedload

from app.config import get_settings
from app.database import get_db
from app.limiter import limiter
from app.models import Application, User
from app.schemas import ApplicationList, StatsSummary, StatsTimeline
from app.stats_utils import build_summary, build_timeline

router = APIRouter(prefix="/demo", tags=["demo"])
settings = get_settings()


def _get_demo_user(db: Session) -> User:
    user = db.query(User).filter(User.email == settings.demo_user_email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Demo data has not been seeded on this server yet",
        )
    return user


def _demo_applications(db: Session) -> list[Application]:
    user = _get_demo_user(db)
    return (
        db.query(Application)
        .options(joinedload(Application.company), joinedload(Application.stages))
        .filter(Application.owner_id == user.id)
        .order_by(Application.created_at.desc())
        .all()
    )


@router.get("/applications", response_model=ApplicationList)
@limiter.limit("60/minute")
def demo_applications(request: Request, db: Session = Depends(get_db)) -> ApplicationList:
    """Public, read-only sample data backing the GitHub Pages live dashboard."""
    applications = _demo_applications(db)
    return ApplicationList(total=len(applications), items=applications)


@router.get("/stats/summary", response_model=StatsSummary)
@limiter.limit("60/minute")
def demo_stats_summary(request: Request, db: Session = Depends(get_db)) -> StatsSummary:
    return build_summary(_demo_applications(db))


@router.get("/stats/timeline", response_model=StatsTimeline)
@limiter.limit("60/minute")
def demo_stats_timeline(request: Request, months: int = 6, db: Session = Depends(get_db)) -> StatsTimeline:
    return StatsTimeline(points=build_timeline(_demo_applications(db), months))
