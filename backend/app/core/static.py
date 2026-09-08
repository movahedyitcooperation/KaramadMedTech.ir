import os
from typing import Any

from starlette.responses import Response
from starlette.staticfiles import StaticFiles
from starlette.types import Scope

ONE_YEAR_SECONDS = 60 * 60 * 24 * 365


class CacheableStaticFiles(StaticFiles):
    """Adds a long-lived Cache-Control header to every file this mount
    serves — safe here specifically because admin_uploads.py names every
    upload with a content-addressed UUID filename (never reused, never
    overwritten in place), unlike a typical static-files mount where a path
    can be edited and re-served under the same name. Without this, an
    admin-uploaded product image is re-downloaded on every storefront
    navigation (see docs/BACKEND-GAPS.md's "Infrastructure findings")."""

    def file_response(self, full_path: os.PathLike[Any], stat_result: os.stat_result, scope: Scope, status_code: int = 200) -> Response:
        response = super().file_response(full_path, stat_result, scope, status_code)
        response.headers["Cache-Control"] = f"public, max-age={ONE_YEAR_SECONDS}, immutable"
        return response
