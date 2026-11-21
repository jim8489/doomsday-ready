from rest_framework.routers import DefaultRouter

from apps.cinemas.views import CinemaViewSet


router = DefaultRouter()

router.register(
    "cinemas",
    CinemaViewSet,
    basename="cinema",
)

urlpatterns = router.urls