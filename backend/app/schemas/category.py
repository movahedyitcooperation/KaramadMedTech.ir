from __future__ import annotations

import uuid

from pydantic import BaseModel, ConfigDict


class CategoryBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    name: str
    icon: str | None
    sort_order: int
    is_active: bool


class CategoryRead(CategoryBase):
    parent_id: uuid.UUID | None


class CategoryTree(CategoryBase):
    """Category with one level of (active) children eager-loaded.

    `children` is deliberately typed as `list[CategoryBase]`, not a
    recursive `list["CategoryTree"]`: the real data is a 2-level tree
    (6 top-level categories, each with a few direct children — see
    lib/mock/categories.ts in the Next.js repo), and the query behind this
    (app/api/v1/categories.py) only eager-loads that one level via
    selectinload. A recursive schema would make Pydantic try to read a
    `.children` attribute on the grandchild level too — which was never
    loaded and isn't reachable from outside the request's async session,
    raising a MissingGreenlet error at serialization time (confirmed by
    hitting this exact bug against a live DB). If a 3rd category level is
    ever introduced, this needs to become properly recursive AND the query
    needs a recursive CTE instead of a single selectinload.
    """

    children: list[CategoryBase] = []
