from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import engine
from app.core.static import CacheableStaticFiles


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(title="Karamad MedTech API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

# Admin-uploaded product images (app/api/v1/admin_uploads.py). Mounted under
# /api/v1/ so it falls inside the existing Nginx `location /api/` proxy block
# in production with zero additional Nginx config. CacheableStaticFiles adds
# a long-lived Cache-Control header — see app/core/static.py for why that's
# safe for this specific mount.
upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/v1/uploads", CacheableStaticFiles(directory=upload_dir), name="uploads")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
