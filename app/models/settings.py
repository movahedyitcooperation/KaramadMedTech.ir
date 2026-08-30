from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base

# Key-value table so it's admin-editable per row without migrations. Named
# `Setting` (singular) — not `Settings` — to avoid a same-name collision with
# app.core.config.Settings when both are imported in the same module (e.g.
# scripts/seed.py). `key` is the primary key directly: no redundant surrogate
# id + unique constraint is needed for a key-value table.
#
# Seeded rows (via scripts/seed.py, not a migration): "shipping", "contact",
# "social", "hero_slides" — see lib/mock/settings.ts in the Next.js repo for
# the source values.


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[dict | list] = mapped_column(JSONB, nullable=False)
