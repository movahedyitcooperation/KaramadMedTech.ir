from fastapi import APIRouter

from app.api.v1 import (
    account,
    admin_categories,
    admin_orders,
    admin_products,
    admin_uploads,
    auth,
    cart,
    categories,
    customer_auth,
    orders,
    payments,
    products,
    settings,
)

api_router = APIRouter()

api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(customer_auth.router, prefix="/auth", tags=["customer-auth"])
api_router.include_router(cart.router, prefix="/cart", tags=["cart"])
api_router.include_router(account.router, prefix="/account", tags=["account"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(admin_products.router, prefix="/admin/products", tags=["admin"])
api_router.include_router(admin_categories.router, prefix="/admin/categories", tags=["admin"])
api_router.include_router(admin_uploads.router, prefix="/admin/uploads", tags=["admin"])
api_router.include_router(admin_orders.router, prefix="/admin/orders", tags=["admin"])
