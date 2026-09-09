import asyncio
import io
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from app.api.v1.auth import get_current_admin
from app.core.config import settings

router = APIRouter(dependencies=[Depends(get_current_admin)])

# CWD is always backend/ — see backend/README.md's `uv run uvicorn app.main:app`
# and deploy/karamad-backend.service's WorkingDirectory. Relative path is safe.
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
# Matches the storefront's own pre-optimised hero art (docs/BACKEND-GAPS.md:
# "1600px WebP sources") — admin uploads get the same treatment now, rather
# than shipping a raw 4MB PNG straight from someone's phone.
MAX_LONG_EDGE = 1600
WEBP_QUALITY = 82

# Deliberately no SVG support in the allowlist — next.config.ts's
# dangerouslyAllowSVG is scoped (per its own comment) to local, self-authored
# placeholder SVGs only; arbitrary uploaded SVGs are a stored-XSS vector even
# with the current CSP sandboxing.


def _process_image(raw: bytes) -> bytes:
    """Re-encodes any accepted upload to a size-capped WebP, regardless of
    the original format or dimensions (see docs/BACKEND-GAPS.md's
    "infrastructure findings"). Also a real content-verification step, not
    just optimization: the Content-Type header checked in upload_image is
    caller-supplied and unverified, so this is the point where the bytes are
    actually confirmed to be a decodable image — Pillow's own
    Image.MAX_IMAGE_PIXELS guard (left at its default) additionally rejects
    a decompression-bomb-sized image before it gets anywhere near a resize.

    Pure CPU work with no I/O of its own — called via asyncio.to_thread so
    it never blocks the event loop, the same reasoning as core/payment.py's
    to_thread use for its own blocking call.
    """
    try:
        image = Image.open(io.BytesIO(raw))
        image.load()  # force full decode now, inside the try — Image.open() alone is lazy
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=415, detail="Unsupported or corrupt image file") from exc

    # WebP supports alpha, so a transparent PNG is preserved as RGBA rather
    # than flattened onto a background it never had. Anything else (P-mode
    # palette images, CMYK, etc.) becomes plain RGB.
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")

    if max(image.size) > MAX_LONG_EDGE:
        image.thumbnail((MAX_LONG_EDGE, MAX_LONG_EDGE), Image.Resampling.LANCZOS)

    buffer = io.BytesIO()
    image.save(buffer, format="WEBP", quality=WEBP_QUALITY)
    return buffer.getvalue()


@router.post("/images")
async def upload_image(file: UploadFile):
    if (file.content_type or "") not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image type — use JPEG, PNG or WebP")

    raw = bytearray()
    while chunk := await file.read(1024 * 1024):
        raw.extend(chunk)
        if len(raw) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Image exceeds 5MB limit")

    processed = await asyncio.to_thread(_process_image, bytes(raw))

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    # Always .webp now, regardless of the original format — the frontend
    # never assumes an extension, it only ever uses the URL this endpoint
    # returns (ImageUploader.tsx / lib/api/mappers.ts's resolveImageUrl).
    filename = f"{uuid.uuid4().hex}.webp"
    (UPLOAD_DIR / filename).write_bytes(processed)

    return {"url": f"/api/v1/uploads/{filename}"}
