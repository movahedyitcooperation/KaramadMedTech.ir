from pydantic import BaseModel

# API field casing note: this whole API uses snake_case throughout (matching
# the spec's own query-param names like category_slug, in_stock_only), while
# the Next.js frontend's TS types (lib/types/*.ts) use camelCase. A later
# integration phase — when the frontend actually calls this API to replace
# its lib/db/*.ts mocks — will need a thin camelCase adapter at the fetch
# boundary. Out of scope here; just flagging it so it isn't a surprise later.


class ShippingSetting(BaseModel):
    # mode is free text for now ("flat" | "free" per the frontend); tighten
    # to Literal["flat", "free"] once admin editing of this row lands.
    mode: str
    cost: int
    free_over: int


class ContactSetting(BaseModel):
    phone: str
    whatsapp: str
    telegram: str
    address: str


class SocialLinks(BaseModel):
    telegram: str | None = None
    instagram: str | None = None
    youtube: str | None = None
    aparat: str | None = None


class HeroSlide(BaseModel):
    id: str
    title: str
    highlight: str
    cta_label: str
    cta_href: str
    image_alt: str


class SiteSettings(BaseModel):
    """Mirrors the frontend's SiteSettings TS type (lib/types/settings.ts) in
    snake_case: freeOver -> free_over, ctaLabel -> cta_label,
    ctaHref -> cta_href, imageAlt -> image_alt, heroSlides -> hero_slides."""

    shipping: ShippingSetting
    contact: ContactSetting
    social: SocialLinks
    hero_slides: list[HeroSlide]
