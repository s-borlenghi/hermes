"""Seed a demo user with realistic sample data for the public /demo endpoints.

Run with: python -m app.seed
Safe to re-run: it wipes and recreates only the demo user's own data.
"""

from datetime import datetime, timedelta

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.models import Application, ApplicationStatus, Company, InterviewStage, User
from app.security import hash_password

settings = get_settings()

SAMPLE_COMPANIES = [
    {"name": "Northwind Analytics", "website": "https://northwind.example.com"},
    {"name": "Bluepeak Systems", "website": "https://bluepeak.example.com"},
    {"name": "Ferrovia Software", "website": "https://ferrovia.example.com"},
    {"name": "Cascade Robotics", "website": "https://cascade.example.com"},
    {"name": "Solstice Health", "website": "https://solstice.example.com"},
]

SAMPLE_APPLICATIONS = [
    {
        "company": "Northwind Analytics",
        "role_title": "Backend Engineer",
        "status": ApplicationStatus.OFFER,
        "source": "Referral",
        "days_ago": 42,
        "stages": [("Recruiter screen", 38, True), ("Technical interview", 30, True), ("Onsite", 20, True)],
    },
    {
        "company": "Bluepeak Systems",
        "role_title": "Platform Engineer",
        "status": ApplicationStatus.INTERVIEW,
        "source": "LinkedIn",
        "days_ago": 21,
        "stages": [("Recruiter screen", 18, True), ("Technical interview", 7, False)],
    },
    {
        "company": "Ferrovia Software",
        "role_title": "Software Engineer, APIs",
        "status": ApplicationStatus.PHONE_SCREEN,
        "source": "Company site",
        "days_ago": 12,
        "stages": [("Recruiter screen", 5, True)],
    },
    {
        "company": "Cascade Robotics",
        "role_title": "Python Developer",
        "status": ApplicationStatus.APPLIED,
        "source": "LinkedIn",
        "days_ago": 6,
        "stages": [],
    },
    {
        "company": "Solstice Health",
        "role_title": "Backend Engineer",
        "status": ApplicationStatus.REJECTED,
        "source": "Referral",
        "days_ago": 55,
        "stages": [("Recruiter screen", 50, True)],
    },
    {
        "company": "Northwind Analytics",
        "role_title": "Data Engineer",
        "status": ApplicationStatus.WISHLIST,
        "source": "Company site",
        "days_ago": 2,
        "stages": [],
    },
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == settings.demo_user_email).first()
        if demo_user is None:
            demo_user = User(
                email=settings.demo_user_email,
                hashed_password=hash_password(settings.demo_user_password),
                full_name="Demo Candidate",
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        else:
            db.query(Application).filter(Application.owner_id == demo_user.id).delete()
            db.query(Company).filter(Company.owner_id == demo_user.id).delete()
            db.commit()

        companies_by_name: dict[str, Company] = {}
        for data in SAMPLE_COMPANIES:
            company = Company(owner_id=demo_user.id, name=data["name"], website=data["website"])
            db.add(company)
            companies_by_name[data["name"]] = company
        db.commit()
        for company in companies_by_name.values():
            db.refresh(company)

        now = datetime.now()
        for data in SAMPLE_APPLICATIONS:
            applied_date = now - timedelta(days=data["days_ago"])
            application = Application(
                owner_id=demo_user.id,
                company_id=companies_by_name[data["company"]].id,
                role_title=data["role_title"],
                status=data["status"],
                source=data["source"],
                applied_date=applied_date,
                location="Remote",
            )
            db.add(application)
            db.commit()
            db.refresh(application)
            for stage_name, stage_days_ago, completed in data["stages"]:
                db.add(
                    InterviewStage(
                        application_id=application.id,
                        stage_name=stage_name,
                        scheduled_at=now - timedelta(days=stage_days_ago),
                        completed=completed,
                    )
                )
        db.commit()
        print(f"Seeded demo user '{settings.demo_user_email}' with sample data.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
