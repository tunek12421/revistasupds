from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing extra needed; engine is created at import time.
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

    app.include_router(auth_router)
    app.include_router(api_router)

    @app.get("/api/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
