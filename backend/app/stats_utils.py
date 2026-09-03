from collections import Counter
from collections.abc import Sequence
from datetime import UTC, datetime

from app.models import Application, ApplicationStatus
from app.schemas import StatsSummary, StatusCount, TimelinePoint

RESPONSE_STATUSES = {
    ApplicationStatus.PHONE_SCREEN,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFER,
    ApplicationStatus.REJECTED,
    ApplicationStatus.ACCEPTED,
}
INTERVIEW_STATUSES = {ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER, ApplicationStatus.ACCEPTED}
OFFER_STATUSES = {ApplicationStatus.OFFER, ApplicationStatus.ACCEPTED}


def build_summary(applications: Sequence[Application]) -> StatsSummary:
    counts = Counter(app.status for app in applications)
    submitted = [app for app in applications if app.status != ApplicationStatus.WISHLIST]
    submitted_count = len(submitted)

    def rate(statuses: set[ApplicationStatus]) -> float:
        if submitted_count == 0:
            return 0.0
        matched = sum(1 for app in submitted if app.status in statuses)
        return round(matched / submitted_count, 4)

    by_status = [StatusCount(status=status, count=counts.get(status, 0)) for status in ApplicationStatus]

    return StatsSummary(
        total_applications=len(applications),
        by_status=by_status,
        response_rate=rate(RESPONSE_STATUSES),
        interview_rate=rate(INTERVIEW_STATUSES),
        offer_rate=rate(OFFER_STATUSES),
    )


def build_timeline(applications: Sequence[Application], months: int) -> list[TimelinePoint]:
    now = datetime.now(UTC)
    buckets: dict[str, int] = {}
    order: list[str] = []
    for i in range(months - 1, -1, -1):
        month = now.month - i
        year = now.year
        while month <= 0:
            month += 12
            year -= 1
        key = f"{year:04d}-{month:02d}"
        buckets[key] = 0
        order.append(key)

    for app in applications:
        reference = app.applied_date or app.created_at
        key = f"{reference.year:04d}-{reference.month:02d}"
        if key in buckets:
            buckets[key] += 1

    return [TimelinePoint(period=key, count=buckets[key]) for key in order]
