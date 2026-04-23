from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import *

router = DefaultRouter()
router.register("vacancies", VacancyViewSet, basename="vacancies")

urlpatterns = [
    path("stats/", HomeStatsAPIView.as_view(), name="home-stats"),
    path("departments/", DepartmentListAPIView.as_view(), name="departments"),
    path("health/", HealthAPIView.as_view(), name="health"),
    path("applications/", ApplicationCreateAPIView.as_view(), name="application-create"),
    path("my-applications/", MyApplicationListAPIView.as_view(), name="my-applications"),
    path("applications/<int:pk>/status/", ApplicationStatusUpdateAPIView.as_view(), name="application-status"),
    path("auth/register/", RegisterAPIView.as_view(), name="register"),
    path("auth/login/", LoginAPIView.as_view(), name="login"),
    path("auth/logout/", LogoutAPIView.as_view(), name="logout"),
    path("auth/me/", CurrentUserAPIView.as_view(), name="me"),
]

urlpatterns += router.urls
