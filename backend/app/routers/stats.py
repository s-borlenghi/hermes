from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Application, User
from app.schemas import StatsSummary, StatsTimeline
from app.stats_utils import build_summary, build_timeline

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary", response_model=StatsSummary)
def stats_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StatsSummary:
    applications = db.query(Application).filter(Application.owner_id == current_user.id).all()
    return build_summary(applications)


@router.get("/timeline", response_model=StatsTimeline)
def stats_timeline(
    months: int = Query(default=6, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StatsTimeline:
    applications = db.query(Application).filter(Application.owner_id == current_user.id).all()
    return StatsTimeline(points=build_timeline(applications, months))
