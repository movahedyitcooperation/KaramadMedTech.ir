# Import every REAL model module here so that Base.metadata is fully
# populated wherever `app.models` is imported — this is what makes Alembic
# autogenerate (and our hand-authored migrations) see all tables.
from app.models.address import Address  # noqa: F401
from app.models.admin_user import AdminUser  # noqa: F401
from app.models.base import Base  # noqa: F401
from app.models.cart_item import CartItem  # noqa: F401
from app.models.cart_session import CartSession  # noqa: F401
from app.models.category import Category  # noqa: F401
from app.models.order import Order  # noqa: F401
from app.models.order_item import OrderItem  # noqa: F401
from app.models.otp_code import OtpCode  # noqa: F401
from app.models.payment import Payment  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.product_image import ProductImage  # noqa: F401
from app.models.product_spec import ProductSpec  # noqa: F401
from app.models.review import Review  # noqa: F401
from app.models.settings import Setting  # noqa: F401
from app.models.user import User  # noqa: F401
