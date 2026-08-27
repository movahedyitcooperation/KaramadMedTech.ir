from fastapi import APIRouter

from app.api.v1 import categories, products, settings

api_router = APIRouter()

api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])

# auth / cart / orders / payments intentionally NOT imported or included here
# yet — each already exists as a bare APIRouter() stub file in this package
# for a future phase to import and wire in. See app/api/v1/{auth,cart,orders,payments}.py.
