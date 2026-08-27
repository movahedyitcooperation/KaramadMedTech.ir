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

    The real data is a 2-level tree (6 top-level categories, each with a few
    direct children — see lib/mock/categories.ts in the Next.js repo), so
    this does not recurse deeper. If a 3rd level is ever introduced, this
    needs a recursive shape (and the query behind it needs a recursive CTE
    instead of a single selectinload — see app/api/v1/categories.py).
    """

    children: list["CategoryTree"] = []


CategoryTree.model_rebuild()
