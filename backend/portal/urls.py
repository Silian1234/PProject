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
    path("notifications/", NotificationListAPIView.as_view(), name="notifications"),
    path("notifications/<int:pk>/read/", NotificationMarkReadAPIView.as_view(), name="notification-read"),
    path("vacancy-subscription/", VacancySubscriptionAPIView.as_view(), name="vacancy-subscription"),
    path("interviews/", InterviewListCreateAPIView.as_view(), name="interviews"),
    path("interviews/<int:pk>/", InterviewDetailAPIView.as_view(), name="interview-detail"),
    path("reviews/", ReviewListCreateAPIView.as_view(), name="reviews"),
    path("recommendations/", RecommendationListAPIView.as_view(), name="recommendations"),
    path("auth/register/", RegisterAPIView.as_view(), name="register"),
    path("auth/login/", LoginAPIView.as_view(), name="login"),
    path("auth/logout/", LogoutAPIView.as_view(), name="logout"),
    path("auth/me/", CurrentUserAPIView.as_view(), name="me"),
    path("auth/profile/", StudentProfileUpdateAPIView.as_view(), name="student-profile-update"),
]

urlpatterns += router.urls
