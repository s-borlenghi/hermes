import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.limiter import limiter
from app.routers import applications, auth, companies, demo, stats

logger = logging.getLogger("hermes")
settings = get_settings()

if settings.environment != "development" and settings.secret_key == "change-me-in-production":
    logger.warning(
        "SECRET_KEY is set to the development default in a non-development environment. "
        "Set a strong, unique SECRET_KEY env var before deploying."
    )

app = FastAPI(
    title="Hermes",
    description=(
        "A job-application tracking API: manage companies, applications, and interview stages, "
        "then pull response/interview/offer-rate analytics. Built as a portfolio project."
    ),
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(applications.router)
app.include_router(stats.router)
app.include_router(demo.router)


@app.get("/", tags=["health"])
def root() -> dict:
    return {
        "name": settings.app_name,
        "status": "ok",
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
