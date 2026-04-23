from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import serializers

from .constants import DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_CHOICES, SUPPORTED_LANGUAGE_CODES
from .i18n import t
from .models import *


def request_language(serializer):
    request = serializer.context.get("request")
    if request and getattr(request, "lang", None) in SUPPORTED_LANGUAGE_CODES:
        return request.lang
    return DEFAULT_LANGUAGE


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    university_id = serializers.SerializerMethodField()
    faculty = serializers.SerializerMethodField()
    course = serializers.SerializerMethodField()
    organization_name = serializers.SerializerMethodField()
    primary_resume_title = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "preferred_language",
            "role_code",
            "university_id",
            "faculty",
            "course",
            "organization_name",
            "primary_resume_title",
        )

    def get_full_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name or obj.username

    def get_university_id(self, obj):
        if hasattr(obj, "student_profile"):
            return obj.student_profile.university_id
        return None

    def get_faculty(self, obj):
        if hasattr(obj, "student_profile"):
            return obj.student_profile.faculty
        return None

    def get_course(self, obj):
        if hasattr(obj, "student_profile"):
            return obj.student_profile.course
        return None

    def get_organization_name(self, obj):
        if hasattr(obj, "employer_profile"):
            return obj.employer_profile.organization_name
        return None

    def get_primary_resume_title(self, obj):
        resume = obj.resumes.filter(is_primary=True).first() or obj.resumes.order_by("-created_at").first()
        return resume.title if resume else None


class DepartmentSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ("id", "code", "name", "description")

    def _tr(self, obj):
        return obj.translation_for(request_language(self))

    def get_name(self, obj):
        tr = self._tr(obj)
        return tr.name if tr else obj.code

    def get_description(self, obj):
        tr = self._tr(obj)
        return tr.description if tr else ""


class VacancySerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    responsibilities = serializers.SerializerMethodField()
    requirements = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    employer_name = serializers.SerializerMethodField()

    class Meta:
        model = Vacancy
        fields = (
            "id", "title", "description", "responsibilities", "requirements",
            "department", "department_name", "employer_name", "employment_type", "location", "workload_hours",
            "salary_from", "salary_to", "status", "application_deadline", "created_at", "updated_at",
        )

    def _tr(self, obj):
        return obj.translation_for(request_language(self))

    def get_title(self, obj):
        tr = self._tr(obj)
        return tr.title if tr else f"Vacancy #{obj.pk}"

    def get_description(self, obj):
        tr = self._tr(obj)
        return tr.description if tr else ""

    def get_responsibilities(self, obj):
        tr = self._tr(obj)
        return tr.responsibilities if tr else ""

    def get_requirements(self, obj):
        tr = self._tr(obj)
        return tr.requirements if tr else ""

    def get_location(self, obj):
        tr = self._tr(obj)
        if tr and tr.location:
            return tr.location
        return obj.location

    def get_department_name(self, obj):
        tr = obj.department.translation_for(request_language(self))
        return tr.name if tr else obj.department.code

    def get_employer_name(self, obj):
        if hasattr(obj.employer, "employer_profile") and obj.employer.employer_profile.organization_name:
            return obj.employer.employer_profile.organization_name
        full_name = f"{obj.employer.first_name} {obj.employer.last_name}".strip()
        return full_name or obj.employer.username


class VacancyWriteSerializer(serializers.ModelSerializer):
    translations = serializers.DictField(write_only=True)

    class Meta:
        model = Vacancy
        fields = (
            "department", "employment_type", "location", "workload_hours",
            "salary_from", "salary_to", "status", "application_deadline", "translations",
        )

    def validate_translations(self, value):
        lang = request_language(self)
        required_fields = ("title", "description", "responsibilities", "requirements", "location")
        supported_codes = {code for code, _ in SUPPORTED_LANGUAGE_CHOICES}
        provided_codes = set(value.keys())

        unknown_codes = provided_codes - supported_codes
        if unknown_codes:
            bad_code = sorted(unknown_codes)[0]
            raise serializers.ValidationError(f"translations.{bad_code}: unsupported language")

        if not self.instance and "en" not in provided_codes:
            raise serializers.ValidationError(f"translations.en: {t('msg.field_required', lang)}")

        for code in provided_codes:
            payload = value.get(code)
            if not isinstance(payload, dict):
                raise serializers.ValidationError(f"translations.{code}: {t('msg.field_required', lang)}")
            for f in required_fields:
                if not payload.get(f):
                    raise serializers.ValidationError(f"translations.{code}.{f}: {t('msg.field_required', lang)}")
        return value

    def _sync(self, vacancy, data):
        fallback_location = vacancy.location
        for code, payload in data.items():
            VacancyTranslation.objects.update_or_create(
                vacancy=vacancy,
                language=code,
                defaults={
                    "title": payload["title"],
                    "description": payload["description"],
                    "responsibilities": payload["responsibilities"],
                    "requirements": payload["requirements"],
                    "location": payload.get("location", fallback_location),
                },
            )

    def create(self, validated_data):
        tr = validated_data.pop("translations")
        vacancy = Vacancy.objects.create(**validated_data)
        self._sync(vacancy, tr)
        return vacancy

    def update(self, instance, validated_data):
        tr = validated_data.pop("translations", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if tr:
            self._sync(instance, tr)
        return instance


class ApplicationCreateSerializer(serializers.Serializer):
    vacancy_id = serializers.IntegerField()
    resume_file = serializers.FileField(required=False, allow_null=True)
    resume_title = serializers.CharField(required=False, allow_blank=True, max_length=200)
    cover_letter_text = serializers.CharField(required=False, allow_blank=True)
    student_message = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        lang = request_language(self)
        request = self.context["request"]
        if not request.user.is_authenticated:
            raise serializers.ValidationError(t("msg.unauthorized", lang))
        if not request.user.is_student:
            raise serializers.ValidationError(t("msg.only_students", lang))

        try:
            vacancy = Vacancy.objects.get(pk=attrs["vacancy_id"], status=Vacancy.VacancyStatus.ACTIVE)
        except Vacancy.DoesNotExist:
            raise serializers.ValidationError(t("msg.vacancy_not_found", lang))

        if Application.objects.filter(vacancy=vacancy, student=request.user).exists():
            raise serializers.ValidationError(t("msg.application_exists", lang))

        attrs["vacancy"] = vacancy
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        lang = request_language(self)
        student = request.user
        vacancy = validated_data["vacancy"]

        resume = None
        if validated_data.get("resume_file"):
            resume = Resume.objects.create(
                student=student,
                title=validated_data.get("resume_title") or f"Resume {student.username}",
                file=validated_data["resume_file"],
                is_primary=not student.resumes.exists(),
            )

        cover = None
        if validated_data.get("cover_letter_text"):
            cover = CoverLetter.objects.create(
                student=student,
                title=f"Cover letter {vacancy.pk}",
                body=validated_data["cover_letter_text"],
            )

        app = Application.objects.create(
            vacancy=vacancy,
            student=student,
            resume=resume,
            cover_letter=cover,
            student_message=validated_data.get("student_message", ""),
        )

        Notification.objects.create(
            user=student,
            application=app,
            language=lang,
            message=t("msg.application_submitted", lang),
            event_type=Notification.NotificationType.APPLICATION_SUBMITTED,
        )
        return app


class ApplicationSerializer(serializers.ModelSerializer):
    vacancy_title = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = (
            "id", "vacancy", "vacancy_title", "status", "student_message", "employer_comment", "created_at", "updated_at"
        )

    def get_vacancy_title(self, obj):
        tr = obj.vacancy.translation_for(request_language(self))
        return tr.title if tr else f"Vacancy #{obj.vacancy_id}"


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ("status", "employer_comment")

    def update(self, instance, validated_data):
        lang = request_language(self)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        Notification.objects.create(
            user=instance.student,
            application=instance,
            language=lang,
            message=t("msg.status_updated", lang),
            event_type=Notification.NotificationType.STATUS_UPDATED,
        )
        return instance


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=(Role.RoleCode.STUDENT, Role.RoleCode.EMPLOYER))
    preferred_language = serializers.ChoiceField(choices=[c for c, _ in SUPPORTED_LANGUAGE_CHOICES], default=DEFAULT_LANGUAGE)
    university_id = serializers.CharField(required=False, allow_blank=True)
    organization_name = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        lang = request_language(self)
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": t("msg.field_required", lang)})

        if User.objects.filter(username=attrs["username"]).exists():
            raise serializers.ValidationError({"username": t("msg.username_exists", lang)})
        if User.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({"email": t("msg.email_exists", lang)})

        if attrs["role"] == Role.RoleCode.STUDENT and not attrs.get("university_id"):
            raise serializers.ValidationError({"university_id": t("msg.field_required", lang)})
        if attrs["role"] == Role.RoleCode.EMPLOYER and not attrs.get("organization_name"):
            raise serializers.ValidationError({"organization_name": t("msg.field_required", lang)})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password_confirm")
        role_code = validated_data.pop("role")
        university_id = validated_data.pop("university_id", "")
        organization_name = validated_data.pop("organization_name", "")

        role, _ = Role.objects.get_or_create(code=role_code)
        user = User.objects.create_user(role=role, **validated_data)

        if role_code == Role.RoleCode.STUDENT:
            StudentProfile.objects.create(user=user, university_id=university_id, faculty="", course=1)
        else:
            EmployerProfile.objects.create(user=user, organization_name=organization_name)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        lang = request_language(self)
        user = authenticate(username=attrs["username"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError(t("msg.auth_invalid", lang))
        attrs["user"] = user
        return attrs
