import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import settings
from app.database import Base, async_session, engine

logger = logging.getLogger("uvicorn.error")


async def init_db_and_seed_admin() -> None:
    """Create tables and seed the initial admin if no users exist."""
    # Import models so SQLAlchemy registers them on Base.metadata
    from app.models import User  # noqa: F401
    from app.models import Article  # noqa: F401
    from app.auth.utils import hash_password

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        result = await session.execute(select(User).limit(1))
        if result.scalar_one_or_none() is None:
            admin = User(
                email=settings.INITIAL_ADMIN_EMAIL,
                hashed_password=hash_password(settings.INITIAL_ADMIN_PASSWORD),
                full_name=settings.INITIAL_ADMIN_NAME,
                is_admin=True,
                is_active=True,
            )
            session.add(admin)
            await session.commit()
            logger.info(
                "Initial admin created: %s (change the password immediately)",
                settings.INITIAL_ADMIN_EMAIL,
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed initial admin if needed
    try:
        await init_db_and_seed_admin()
    except Exception as exc:
        logger.error("Failed to initialize DB / seed admin: %s", exc)
    yield
    # Shutdown: dispose the async engine connection pool.
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Revista UPDS - Article PDF Formatter",
        version="1.0.0",
        debug=settings.DEBUG,
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    from app.auth.routes import router as auth_router
    from app.api.routes import router as api_router
    from app.admin.routes import router as admin_router

    app.include_router(auth_router)
    app.include_router(api_router)
    app.include_router(admin_router)

    @app.get("/api/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
