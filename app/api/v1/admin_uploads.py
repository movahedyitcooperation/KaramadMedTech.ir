import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.api.v1.auth import get_current_admin
from app.core.config import settings

router = APIRouter(dependencies=[Depends(get_current_admin)])

# CWD is always the repo root (where `app/` lives) — see the README's
# `uv run uvicorn app.main:app` and deploy/karamad-backend.service's
# WorkingDirectory. Relative path is safe.
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
ALLOWED_CONTENT_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024

# Deliberately no SVG support in the allowlist — next.config.ts's
# dangerouslyAllowSVG is scoped (per its own comment) to local, self-authored
# placeholder SVGs only; arbitrary uploaded SVGs are a stored-XSS vector even
# with the current CSP sandboxing.


@router.post("/images")
async def upload_image(file: UploadFile):
    ext = ALLOWED_CONTENT_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(status_code=415, detail="Unsupported image type — use JPEG, PNG or WebP")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / filename

    size = 0
    with dest.open("wb") as out:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                out.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="Image exceeds 5MB limit")
            out.write(chunk)

    return {"url": f"/api/v1/uploads/{filename}"}
