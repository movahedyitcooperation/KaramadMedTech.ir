from fastapi import APIRouter

from app.api.v1 import admin_categories, admin_products, admin_uploads, auth, categories, products, settings

api_router = APIRouter()

api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin_products.router, prefix="/admin/products", tags=["admin"])
api_router.include_router(admin_categories.router, prefix="/admin/categories", tags=["admin"])
api_router.include_router(admin_uploads.router, prefix="/admin/uploads", tags=["admin"])

# cart / orders / payments intentionally still NOT imported or included here
# yet — each already exists as a bare APIRouter() stub file in this package
# for a future phase to import and wire in. See app/api/v1/{cart,orders,payments}.py.
