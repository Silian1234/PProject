from django.contrib.auth import authenticate
from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers

from .constants import DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_CHOICES, SUPPORTED_LANGUAGE_CODES
from .localization import t
from .models import *
from .translation_service import translate_fields_with_google


def request_language(serializer):
    request = serializer.context.get("request")
    if request and getattr(request, "lang", None) in SUPPORTED_LANGUAGE_CODES:
        return request.lang
    return DEFAULT_LANGUAGE


def make_department_code(name):
    base = slugify(name, allow_unicode=True).strip("-_") or "department"
    base = base[:64]
    code = base
    suffix = 2
    while Department.objects.filter(code=code).exists():
        ending = f"-{suffix}"
        code = f"{base[:64 - len(ending)]}{ending}"
        suffix += 1
    return code


def get_or_create_department_by_name(name):
    normalized = " ".join((name or "").split())
    if not normalized:
        return None

    existing = (
        DepartmentTranslation.objects.select_related("department")
        .filter(name__iexact=normalized, department__is_active=True)
        .first()
    )
    if existing:
        return existing.department

    department = Department.objects.create(code=make_department_code(normalized))
    for language in sorted(SUPPORTED_LANGUAGE_CODES):
        DepartmentTranslation.objects.create(
            department=department,
            language=language,
            name=normalized,
            description="",
        )
    return department


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role_code = serializers.CharField(read_only=True)
    university_id = serializers.SerializerMethodField()
    faculty = serializers.SerializerMethodField()
    course = serializers.SerializerMethodField()
    organization_name = serializers.SerializerMethodField()
    position = serializers.SerializerMethodField()
    employer_department_name = serializers.SerializerMethodField()
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
            "position",
            "employer_department_name",
            "primary_resume_title",
        )

    def get_full_name(self, obj) -> str:
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name or obj.username

    def get_university_id(self, obj) -> str | None:
        if hasattr(obj, "student_profile"):
            return obj.student_profile.university_id
        return None

    def get_faculty(self, obj) -> str | None:
        if hasattr(obj, "student_profile"):
            return obj.student_profile.faculty
        return None

    def get_course(self, obj) -> int | None:
        if hasattr(obj, "student_profile"):
            return obj.student_profile.course
        return None

    def get_organization_name(self, obj) -> str | None:
        if hasattr(obj, "employer_profile"):
            return obj.employer_profile.organization_name
        return None

    def get_position(self, obj) -> str | None:
        if hasattr(obj, "employer_profile"):
            return obj.employer_profile.position
        return None

    def get_employer_department_name(self, obj) -> str | None:
        if hasattr(obj, "employer_profile") and obj.employer_profile.department:
            tr = obj.employer_profile.department.translation_for(request_language(self))
            return tr.name if tr else obj.employer_profile.department.code
        return None

    def get_primary_resume_title(self, obj) -> str | None:
        resume = obj.resumes.filter(is_primary=True).first() or obj.resumes.order_by("-created_at").first()
        return resume.title if resume else None


class MessageSerializer(serializers.Serializer):
    message = serializers.CharField()


class HealthSerializer(serializers.Serializer):
    ok = serializers.BooleanField()
    service = serializers.CharField()


class HomeStatsSerializer(serializers.Serializer):
    active_vacancies = serializers.IntegerField()
    student_applications = serializers.IntegerField()


class StudentProfileUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    preferred_language = serializers.ChoiceField(
        choices=[code for code, _ in SUPPORTED_LANGUAGE_CHOICES],
        required=False,
    )
    faculty = serializers.CharField(required=False, allow_blank=True, max_length=120)
    course = serializers.IntegerField(required=False, min_value=1, max_value=10)
    resume_title = serializers.CharField(required=False, allow_blank=True, max_length=200)
    resume_file = serializers.FileField(required=False, allow_null=True)

    @transaction.atomic
    def update(self, instance, validated_data):
        profile, _ = StudentProfile.objects.get_or_create(
            user=instance,
            defaults={"university_id": f"S-{instance.pk:06d}", "faculty": "", "course": 1},
        )

        for field in ("first_name", "last_name", "preferred_language"):
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()

        if "faculty" in validated_data:
            profile.faculty = validated_data["faculty"]
        if "course" in validated_data:
            profile.course = validated_data["course"]
        profile.save()

        resume_title = validated_data.get("resume_title", "").strip()
        resume_file = validated_data.get("resume_file")
        if resume_title or resume_file:
            resume = instance.resumes.filter(is_primary=True).first() or instance.resumes.order_by("-created_at").first()
            if not resume:
                resume = Resume(student=instance, is_primary=True)
            if resume_title:
                resume.title = resume_title
            elif resume_file:
                resume.title = resume_file.name
            if resume_file:
                resume.file = resume_file
            resume.is_primary = True
            resume.save()
            instance.resumes.exclude(pk=resume.pk).update(is_primary=False)

        return instance


class EmployerProfileUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    preferred_language = serializers.ChoiceField(
        choices=[code for code, _ in SUPPORTED_LANGUAGE_CHOICES],
        required=False,
    )
    organization_name = serializers.CharField(required=False, allow_blank=True, max_length=180)
    position = serializers.CharField(required=False, allow_blank=True, max_length=120)
    department_name = serializers.CharField(required=False, allow_blank=True, max_length=200)

    @transaction.atomic
    def update(self, instance, validated_data):
        for field in ("first_name", "last_name", "preferred_language"):
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()

        profile, _ = EmployerProfile.objects.get_or_create(
            user=instance,
            defaults={"organization_name": instance.get_full_name() or instance.username},
        )
        if "organization_name" in validated_data:
            profile.organization_name = validated_data["organization_name"]
        if "position" in validated_data:
            profile.position = validated_data["position"]
        if "department_name" in validated_data:
            profile.department = get_or_create_department_by_name(validated_data["department_name"])
        profile.save()
        return instance


class DepartmentSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ("id", "code", "name", "description")

    def _tr(self, obj):
        return obj.translation_for(request_language(self))

    def get_name(self, obj) -> str:
        tr = self._tr(obj)
        return tr.name if tr else obj.code

    def get_description(self, obj) -> str:
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

    def get_title(self, obj) -> str:
        tr = self._tr(obj)
        return tr.title if tr else f"Vacancy #{obj.pk}"

    def get_description(self, obj) -> str:
        tr = self._tr(obj)
        return tr.description if tr else ""

    def get_responsibilities(self, obj) -> str:
        tr = self._tr(obj)
        return tr.responsibilities if tr else ""

    def get_requirements(self, obj) -> str:
        tr = self._tr(obj)
        return tr.requirements if tr else ""

    def get_location(self, obj) -> str:
        tr = self._tr(obj)
        if tr and tr.location:
            return tr.location
        return obj.location

    def get_department_name(self, obj) -> str:
        tr = obj.department.translation_for(request_language(self))
        return tr.name if tr else obj.department.code

    def get_employer_name(self, obj) -> str:
        if hasattr(obj.employer, "employer_profile") and obj.employer.employer_profile.organization_name:
            return obj.employer.employer_profile.organization_name
        full_name = f"{obj.employer.first_name} {obj.employer.last_name}".strip()
        return full_name or obj.employer.username


class VacancyWriteSerializer(serializers.ModelSerializer):
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )
    department_name = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=200)
    translations = serializers.DictField(write_only=True, required=False)

    class Meta:
        model = Vacancy
        fields = (
            "department", "department_name", "employment_type", "location", "workload_hours",
            "salary_from", "salary_to", "status", "application_deadline", "translations",
        )

    def to_representation(self, instance):
        return VacancySerializer(instance, context=self.context).data

    def validate_translations(self, value):
        lang = request_language(self)
        if not value:
            return {}

        required_fields = ("title", "description", "responsibilities", "requirements", "location")
        supported_codes = {code for code, _ in SUPPORTED_LANGUAGE_CHOICES}
        provided_codes = set(value.keys())

        unknown_codes = provided_codes - supported_codes
        if unknown_codes:
            bad_code = sorted(unknown_codes)[0]
            raise serializers.ValidationError(f"translations.{bad_code}: unsupported language")

        for code in provided_codes:
            payload = value.get(code)
            if not isinstance(payload, dict):
                raise serializers.ValidationError(f"translations.{code}: {t('msg.field_required', lang)}")
            for f in required_fields:
                if not payload.get(f):
                    raise serializers.ValidationError(f"translations.{code}.{f}: {t('msg.field_required', lang)}")
        return value

    def validate(self, attrs):
        lang = request_language(self)
        department = attrs.get("department") or (self.instance.department if self.instance else None)
        department_name = attrs.get("department_name", "").strip()

        if not department and not department_name:
            raise serializers.ValidationError({"department_name": t("msg.field_required", lang)})

        if not self.instance and not attrs.get("translations"):
            raise serializers.ValidationError({"translations": t("msg.field_required", lang)})

        return attrs

    def _department_code(self, name):
        base = slugify(name, allow_unicode=True).strip("-_") or "department"
        base = base[:64]
        code = base
        suffix = 2
        while Department.objects.filter(code=code).exists():
            ending = f"-{suffix}"
            code = f"{base[:64 - len(ending)]}{ending}"
            suffix += 1
        return code

    def _get_or_create_department(self, name):
        normalized = " ".join(name.split())
        existing = (
            DepartmentTranslation.objects.select_related("department")
            .filter(name__iexact=normalized, department__is_active=True)
            .first()
        )
        if existing:
            return existing.department

        department = Department.objects.create(code=self._department_code(normalized))
        for language in SUPPORTED_LANGUAGE_CODES:
            DepartmentTranslation.objects.create(
                department=department,
                language=language,
                name=normalized,
                description="",
            )
        return department

    def _pop_department(self, validated_data):
        department_name = validated_data.pop("department_name", "").strip()
        selected_department = validated_data.pop("department", None)
        if department_name:
            return self._get_or_create_department(department_name)
        if selected_department:
            return selected_department
        return self.instance.department if self.instance else None

    @staticmethod
    def _first_location(translations):
        for payload in translations.values():
            location = payload.get("location") if isinstance(payload, dict) else ""
            if location:
                return location
        return ""

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

    @staticmethod
    def _payload_from_translation(translation):
        return {
            "title": translation.title,
            "description": translation.description,
            "responsibilities": translation.responsibilities,
            "requirements": translation.requirements,
            "location": translation.location,
        }

    def _source_payload(self, vacancy, incoming):
        if incoming:
            if "en" in incoming:
                return "en", incoming["en"]
            first_code = next(iter(incoming))
            return first_code, incoming[first_code]

        source = vacancy.translations.filter(language="en").first() or vacancy.translations.first()
        if not source:
            return None, None
        return source.language, self._payload_from_translation(source)

    def _autofill_missing_translations(self, vacancy, incoming):
        existing_codes = set(vacancy.translations.values_list("language", flat=True))
        missing_codes = SUPPORTED_LANGUAGE_CODES - existing_codes
        if not missing_codes:
            return

        source_language, source_payload = self._source_payload(vacancy, incoming)
        if not source_language or not source_payload:
            return

        for lang_code in sorted(missing_codes):
            translated_values = translate_fields_with_google(
                source_language=source_language,
                target_language=lang_code,
                fields=source_payload,
            )
            if not translated_values:
                continue
            VacancyTranslation.objects.update_or_create(
                vacancy=vacancy,
                language=lang_code,
                defaults=translated_values,
            )

    def create(self, validated_data):
        tr = validated_data.pop("translations", {})
        department = self._pop_department(validated_data)
        if not validated_data.get("location"):
            validated_data["location"] = self._first_location(tr)
        vacancy = Vacancy.objects.create(department=department, **validated_data)
        self._sync(vacancy, tr)
        self._autofill_missing_translations(vacancy, tr)
        return vacancy

    def update(self, instance, validated_data):
        tr = validated_data.pop("translations", None)
        department = self._pop_department(validated_data)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        if department:
            instance.department = department
        if tr and not instance.location:
            instance.location = self._first_location(tr)
        instance.save()
        if tr:
            self._sync(instance, tr)
            self._autofill_missing_translations(instance, tr)
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
    student_name = serializers.SerializerMethodField()
    student_email = serializers.EmailField(source="student.email", read_only=True)
    resume_title = serializers.SerializerMethodField()
    resume_file = serializers.SerializerMethodField()
    cover_letter_text = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = (
            "id",
            "vacancy",
            "vacancy_title",
            "student_name",
            "student_email",
            "resume_title",
            "resume_file",
            "cover_letter_text",
            "status",
            "student_message",
            "employer_comment",
            "created_at",
            "updated_at",
        )

    def get_vacancy_title(self, obj) -> str:
        tr = obj.vacancy.translation_for(request_language(self))
        return tr.title if tr else f"Vacancy #{obj.vacancy_id}"

    def get_student_name(self, obj) -> str:
        full_name = f"{obj.student.first_name} {obj.student.last_name}".strip()
        return full_name or obj.student.username

    def get_resume_title(self, obj) -> str:
        return obj.resume.title if obj.resume else ""

    def get_resume_file(self, obj) -> str:
        if not obj.resume or not obj.resume.file:
            return ""
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.resume.file.url)
        return obj.resume.file.url

    def get_cover_letter_text(self, obj) -> str:
        return obj.cover_letter.body if obj.cover_letter else ""


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
    role = serializers.ChoiceField(choices=(Role.RoleCode.STUDENT, Role.RoleCode.EMPLOYER), default=Role.RoleCode.STUDENT)
    preferred_language = serializers.ChoiceField(choices=[c for c, _ in SUPPORTED_LANGUAGE_CHOICES], default=DEFAULT_LANGUAGE)
    university_id = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        lang = request_language(self)
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": t("msg.password_mismatch", lang)})

        if User.objects.filter(username=attrs["username"]).exists():
            raise serializers.ValidationError({"username": t("msg.username_exists", lang)})
        if User.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({"email": t("msg.email_exists", lang)})

        if attrs["role"] != Role.RoleCode.STUDENT:
            raise serializers.ValidationError({"role": t("msg.employer_registration_disabled", lang)})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password_confirm")
        role_code = validated_data.pop("role")
        university_id = validated_data.pop("university_id", "").strip()

        role, _ = Role.objects.get_or_create(code=role_code)
        user = User.objects.create_user(role=role, **validated_data)
        if not university_id:
            university_id = f"S-{user.pk:06d}"
        StudentProfile.objects.create(user=user, university_id=university_id, faculty="", course=1)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        lang = request_language(self)
        identifier = attrs["username"].strip()
        username = identifier
        if "@" in identifier:
            matched_user = User.objects.filter(email__iexact=identifier).first()
            if matched_user:
                username = matched_user.username
        user = authenticate(username=username, password=attrs["password"])
        if not user:
            raise serializers.ValidationError(t("msg.auth_invalid", lang))
        attrs["user"] = user
        return attrs
