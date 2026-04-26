from django.db.models import Q
from rest_framework import generics, permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .constants import SUPPORTED_LANGUAGE_CHOICES
from .permissions import IsEmployerOrAdmin, IsStudent, IsVacancyOwnerOrAdmin
from .serializers import *


def get_lang(request):
    return getattr(request, "lang", "en")


class HealthAPIView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"ok": True, "service": "backend"})


class HomeStatsAPIView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(
            {
                "active_vacancies": Vacancy.objects.filter(status=Vacancy.VacancyStatus.ACTIVE).count(),
                "student_applications": Application.objects.count(),
                "supported_languages": [code.upper() for code, _ in SUPPORTED_LANGUAGE_CHOICES],
                "api_docs_url": "/api/docs/swagger/",
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
        if not (user.is_authenticated and (user.is_superuser or user.role_code in {Role.RoleCode.EMPLOYER, Role.RoleCode.ADMIN})):
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
        serializer.save(employer=self.request.user)

    def perform_update(self, serializer):
        vacancy = self.get_object()
        user = self.request.user
        if not (user.is_superuser or user.role_code == Role.RoleCode.ADMIN or vacancy.employer_id == user.id):
            raise permissions.PermissionDenied(t("msg.permission_denied", get_lang(self.request)))
        serializer.save()

    @action(detail=True, methods=["get"], permission_classes=[IsEmployerOrAdmin])
    def applications(self, request, pk=None):
        vacancy = self.get_object()
        user = request.user
        if not (user.is_superuser or user.role_code == Role.RoleCode.ADMIN or vacancy.employer_id == user.id):
            return Response({"detail": t("msg.permission_denied", get_lang(request))}, status=403)
        data = ApplicationSerializer(
            Application.objects.filter(vacancy=vacancy)
            .select_related("vacancy")
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
        return (
            Application.objects.filter(student=self.request.user)
            .select_related("vacancy", "vacancy__department", "vacancy__employer", "vacancy__employer__employer_profile")
            .prefetch_related("vacancy__translations", "vacancy__department__translations")
            .order_by("-created_at")
        )


class ApplicationStatusUpdateAPIView(generics.UpdateAPIView):
    serializer_class = ApplicationStatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsEmployerOrAdmin]
    queryset = Application.objects.select_related("vacancy", "student")
    http_method_names = ["patch", "put"]

    def update(self, request, *args, **kwargs):
        app = self.get_object()
        user = request.user
        if not (user.is_superuser or user.role_code == Role.RoleCode.ADMIN or app.vacancy.employer_id == user.id):
            return Response({"detail": t("msg.permission_denied", get_lang(request))}, status=403)
        response = super().update(request, *args, **kwargs)
        response.data["message"] = t("msg.status_updated", get_lang(request))
        return response


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
