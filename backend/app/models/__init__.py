# Import every REAL (non-stub) model module here so that Base.metadata is
# fully populated wherever `app.models` is imported — this is what makes
# Alembic autogenerate (and our hand-authored migration) see all tables.
#
# Stub models (user, cart_session, order, order_item, review) have no classes
# yet — nothing to import until each phase defines them. Add their imports
# here once they do.
from app.models.admin_user import AdminUser  # noqa: F401
from app.models.base import Base  # noqa: F401
from app.models.category import Category  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.product_image import ProductImage  # noqa: F401
from app.models.product_spec import ProductSpec  # noqa: F401
from app.models.settings import Setting  # noqa: F401
