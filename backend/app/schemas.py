from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import ApplicationStatus

# ---- Auth ----


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str | None
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---- Company ----


class CompanyBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    website: str | None = None
    notes: str | None = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    website: str | None = None
    notes: str | None = None


class CompanyRead(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


# ---- Interview stage ----


class InterviewStageBase(BaseModel):
    stage_name: str = Field(min_length=1, max_length=255)
    scheduled_at: datetime | None = None
    completed: bool = False
    notes: str | None = None


class InterviewStageCreate(InterviewStageBase):
    pass


class InterviewStageRead(InterviewStageBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int
    created_at: datetime


# ---- Application ----


class ApplicationBase(BaseModel):
    role_title: str = Field(min_length=1, max_length=255)
    company_id: int
    job_url: str | None = None
    location: str | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    source: str | None = None
    status: ApplicationStatus = ApplicationStatus.WISHLIST
    applied_date: datetime | None = None
    notes: str | None = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    role_title: str | None = Field(default=None, min_length=1, max_length=255)
    company_id: int | None = None
    job_url: str | None = None
    location: str | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    source: str | None = None
    status: ApplicationStatus | None = None
    applied_date: datetime | None = None
    notes: str | None = None


class ApplicationRead(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    company: CompanyRead
    stages: list[InterviewStageRead] = []


class ApplicationList(BaseModel):
    total: int
    items: list[ApplicationRead]


# ---- Stats ----


class StatusCount(BaseModel):
    status: ApplicationStatus
    count: int


class StatsSummary(BaseModel):
    total_applications: int
    by_status: list[StatusCount]
    response_rate: float
    interview_rate: float
    offer_rate: float


class TimelinePoint(BaseModel):
    period: str
    count: int


class StatsTimeline(BaseModel):
    points: list[TimelinePoint]
