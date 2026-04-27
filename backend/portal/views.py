from django.db.models import Q
from rest_framework import generics, permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .permissions import IsEmployerOrAdmin, IsStudent, IsVacancyOwnerOrAdmin
from .serializers import *


def get_lang(request):
    return getattr(request, "lang", "en")


def _vacancy_title(vacancy, lang):
    tr = vacancy.translation_for(lang)
    return tr.title if tr else f"Vacancy #{vacancy.pk}"


def notify_new_vacancy_subscribers(vacancy):
    if vacancy.status != Vacancy.VacancyStatus.ACTIVE:
        return

    subscriptions = VacancySubscription.objects.filter(is_active=True).select_related("user", "department")
    for subscription in subscriptions:
        if subscription.department_id and subscription.department_id != vacancy.department_id:
            continue
        if subscription.employment_type and subscription.employment_type != vacancy.employment_type:
            continue
        if vacancy.employer_id == subscription.user_id:
            continue

        lang = subscription.user.preferred_language or DEFAULT_LANGUAGE
        title = _vacancy_title(vacancy, lang)
        Notification.objects.create(
            user=subscription.user,
            vacancy=vacancy,
            language=lang,
            message=t("msg.new_vacancy", lang).format(title=title),
            event_type=Notification.NotificationType.NEW_VACANCY,
        )


class HealthAPIView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = HealthSerializer

    def get(self, request):
        return Response({"ok": True, "service": "backend"})


class HomeStatsAPIView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = HomeStatsSerializer

    def get(self, request):
        return Response(
            {
                "active_vacancies": Vacancy.objects.filter(status=Vacancy.VacancyStatus.ACTIVE).count(),
                "student_applications": Application.objects.count(),
            }
        )


class DepartmentListAPIView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = DepartmentSerializer
    queryset = Department.objects.filter(is_active=True).prefetch_related("translations").order_by("id")


class VacancyViewSet(viewsets.ModelViewSet):
    queryset = Vacancy.objects.select_related("department", "employer", "employer__employer_profile").prefetch_related(
        "translations",
        "department__translations",
    )
    filterset_fields = ("department", "employment_type", "status")

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return VacancyWriteSerializer
        return VacancySerializer

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsEmployerOrAdmin(), IsVacancyOwnerOrAdmin()]
        if self.action == "applications":
            return [IsEmployerOrAdmin()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        is_admin = bool(user.is_authenticated and (user.is_superuser or user.role_code == Role.RoleCode.ADMIN))
        is_employer = bool(user.is_authenticated and user.role_code == Role.RoleCode.EMPLOYER)
        mine_requested = self.request.query_params.get("mine", "").lower() in {"1", "true", "yes"}

        if self.action in {"applications", "update", "partial_update", "destroy"} and is_employer and not is_admin:
            qs = qs.filter(employer=user)
        elif mine_requested:
            if is_admin:
                pass
            elif is_employer:
                qs = qs.filter(employer=user)
            else:
                qs = qs.none()
        elif not (is_admin or is_employer):
            qs = qs.filter(status=Vacancy.VacancyStatus.ACTIVE)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(translations__title__icontains=q)
                | Q(translations__description__icontains=q)
                | Q(translations__requirements__icontains=q)
            ).distinct()
        return qs

    def perform_create(self, serializer):
        vacancy = serializer.save(employer=self.request.user)
        notify_new_vacancy_subscribers(vacancy)

    def perform_update(self, serializer):
        vacancy = self.get_object()
        old_status = vacancy.status
        user = self.request.user
        if not (user.is_superuser or user.role_code == Role.RoleCode.ADMIN or vacancy.employer_id == user.id):
            raise permissions.PermissionDenied(t("msg.permission_denied", get_lang(self.request)))
        updated = serializer.save()
        if old_status != Vacancy.VacancyStatus.ACTIVE and updated.status == Vacancy.VacancyStatus.ACTIVE:
            notify_new_vacancy_subscribers(updated)

    @action(detail=True, methods=["get"], permission_classes=[IsEmployerOrAdmin])
    def applications(self, request, pk=None):
        vacancy = self.get_object()
        user = request.user
        if not (user.is_superuser or user.role_code == Role.RoleCode.ADMIN or vacancy.employer_id == user.id):
            return Response({"detail": t("msg.permission_denied", get_lang(request))}, status=403)
        data = ApplicationSerializer(
            Application.objects.filter(vacancy=vacancy)
            .select_related("vacancy", "student", "resume", "cover_letter")
            .prefetch_related("vacancy__translations")
            .order_by("-created_at"),
            many=True,
            context={"request": request},
        ).data
        return Response(data)


class ApplicationCreateAPIView(generics.CreateAPIView):
    serializer_class = ApplicationCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        return Response(
            {
                "message": t("msg.application_submitted", get_lang(request)),
                "application": ApplicationSerializer(application, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MyApplicationListAPIView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Application.objects.none()
        return (
            Application.objects.filter(student=self.request.user)
            .select_related(
                "vacancy",
                "vacancy__department",
                "vacancy__employer",
                "vacancy__employer__employer_profile",
                "student",
                "resume",
                "cover_letter",
            )
            .prefetch_related("vacancy__translations", "vacancy__department__translations")
            .order_by("-created_at")
        )


class ApplicationStatusUpdateAPIView(generics.UpdateAPIView):
    serializer_class = ApplicationStatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsEmployerOrAdmin]
    queryset = Application.objects.select_related("vacancy", "student")
    http_method_names = ["patch", "put"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser or user.role_code == Role.RoleCode.ADMIN:
            return qs
        if user.role_code == Role.RoleCode.EMPLOYER:
            return qs.filter(vacancy__employer=user)
        return qs.none()

    def update(self, request, *args, **kwargs):
        app = self.get_object()
        user = request.user
        if not (user.is_superuser or user.role_code == Role.RoleCode.ADMIN or app.vacancy.employer_id == user.id):
            return Response({"detail": t("msg.permission_denied", get_lang(request))}, status=403)
        response = super().update(request, *args, **kwargs)
        response.data["message"] = t("msg.status_updated", get_lang(request))
        return response


class NotificationListAPIView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Notification.objects.none()
        return (
            Notification.objects.filter(user=self.request.user)
            .select_related("application", "application__vacancy", "vacancy")
            .prefetch_related("application__vacancy__translations", "vacancy__translations")
            .order_by("-created_at")
        )


class NotificationMarkReadAPIView(generics.GenericAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        updated = Notification.objects.filter(pk=pk, user=request.user).update(is_read=True)
        if not updated:
            return Response({"detail": t("msg.notification_not_found", get_lang(request))}, status=404)
        return Response({"message": t("msg.notification_marked_read", get_lang(request))})


class VacancySubscriptionAPIView(generics.GenericAPIView):
    serializer_class = VacancySubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        subscription = VacancySubscription.objects.filter(user=request.user).select_related("department").first()
        if not subscription:
            return Response(
                {
                    "id": None,
                    "is_active": False,
                    "department": None,
                    "department_name": "",
                    "employment_type": "",
                    "created_at": None,
                    "updated_at": None,
                }
            )
        return Response(self.get_serializer(subscription).data)

    def patch(self, request):
        subscription = VacancySubscription.objects.filter(user=request.user).first()
        serializer = self.get_serializer(subscription, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if subscription:
            subscription = serializer.save(user=request.user)
        else:
            subscription = serializer.save(user=request.user)
        return Response(
            {
                "message": t("msg.subscription_updated", get_lang(request)),
                "subscription": self.get_serializer(subscription).data,
            }
        )

    post = patch


def interview_queryset_for_user(user):
    qs = Interview.objects.select_related(
        "application",
        "application__student",
        "application__vacancy",
        "application__vacancy__employer",
        "application__vacancy__employer__employer_profile",
    ).prefetch_related("application__vacancy__translations")
    if user.is_superuser or user.role_code == Role.RoleCode.ADMIN:
        return qs
    if user.role_code == Role.RoleCode.EMPLOYER:
        return qs.filter(application__vacancy__employer=user)
    return qs.filter(application__student=user)


class InterviewListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return InterviewCreateSerializer
        return InterviewSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Interview.objects.none()
        return interview_queryset_for_user(self.request.user).order_by("scheduled_at")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        interview = serializer.save()
        return Response(
            {
                "message": t("msg.interview_scheduled", get_lang(request)),
                "interview": InterviewSerializer(interview, context={"request": request}).data,
            },
            status=201,
        )


class InterviewDetailAPIView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "put"]

    def get_serializer_class(self):
        if self.request.method in {"PATCH", "PUT"}:
            return InterviewUpdateSerializer
        return InterviewSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Interview.objects.none()
        return interview_queryset_for_user(self.request.user)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        interview = self.get_object()
        response.data = {
            "message": t("msg.interview_updated", get_lang(request)),
            "interview": InterviewSerializer(interview, context={"request": request}).data,
        }
        return response


def review_queryset_for_user(user):
    qs = Review.objects.select_related(
        "application",
        "application__student",
        "application__vacancy",
        "application__vacancy__employer",
        "application__vacancy__employer__employer_profile",
        "author",
    ).prefetch_related("application__vacancy__translations")
    if user.is_superuser or user.role_code == Role.RoleCode.ADMIN:
        return qs
    return qs.filter(Q(author=user) | Q(application__student=user) | Q(application__vacancy__employer=user)).distinct()


class ReviewListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Review.objects.none()
        qs = review_queryset_for_user(self.request.user)
        application_id = self.request.query_params.get("application")
        if application_id:
            qs = qs.filter(application_id=application_id)
        return qs.order_by("-created_at")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        return Response(
            {
                "message": t("msg.review_created", get_lang(request)),
                "review": ReviewSerializer(review, context={"request": request}).data,
            },
            status=201,
        )


class RecommendationListAPIView(generics.ListAPIView):
    serializer_class = VacancySerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Vacancy.objects.none()

        applied_ids = Application.objects.filter(student=self.request.user).values_list("vacancy_id", flat=True)
        qs = (
            Vacancy.objects.filter(status=Vacancy.VacancyStatus.ACTIVE)
            .exclude(id__in=applied_ids)
            .select_related("department", "employer", "employer__employer_profile")
            .prefetch_related("translations", "department__translations")
        )
        faculty = ""
        if hasattr(self.request.user, "student_profile"):
            faculty = (self.request.user.student_profile.faculty or "").strip()
        if faculty:
            matched = qs.filter(
                Q(translations__title__icontains=faculty)
                | Q(translations__description__icontains=faculty)
                | Q(department__translations__name__icontains=faculty)
            ).distinct()
            if matched.exists():
                return matched.order_by("-created_at")[:6]
        return qs.order_by("-created_at")[:6]


class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"message": t("msg.auth_registered", get_lang(request)), "token": token.key, "user": UserSerializer(user).data},
            status=201,
        )


class LoginAPIView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"message": t("msg.auth_logged_in", get_lang(request)), "token": token.key, "user": UserSerializer(user).data})


class LogoutAPIView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"message": t("msg.auth_logged_out", get_lang(request))})


class CurrentUserAPIView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return (
            User.objects.select_related("role", "student_profile", "employer_profile")
            .prefetch_related("resumes")
            .get(pk=self.request.user.pk)
        )


class StudentProfileUpdateAPIView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["patch", "put"]

    def get_serializer_class(self):
        if getattr(self, "swagger_fake_view", False):
            return StudentProfileUpdateSerializer
        user = self.request.user
        if user.role_code == Role.RoleCode.STUDENT:
            return StudentProfileUpdateSerializer
        if user.is_superuser or user.role_code in {Role.RoleCode.EMPLOYER, Role.RoleCode.ADMIN}:
            return EmployerProfileUpdateSerializer
        raise permissions.PermissionDenied(t("msg.permission_denied", get_lang(self.request)))

    def get_object(self):
        return (
            User.objects.select_related("role", "student_profile", "employer_profile", "employer_profile__department")
            .prefetch_related("resumes")
            .get(pk=self.request.user.pk)
        )

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()
        updated_user = (
            User.objects.select_related("role", "student_profile", "employer_profile", "employer_profile__department")
            .prefetch_related("resumes")
            .get(pk=updated_user.pk)
        )
        return Response(
            {
                "message": t("msg.profile_updated", get_lang(request)),
                "user": UserSerializer(updated_user, context={"request": request}).data,
            }
        )
