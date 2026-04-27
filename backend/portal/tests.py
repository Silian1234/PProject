from __future__ import annotations

from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from portal.models import (
    Application,
    Department,
    DepartmentTranslation,
    EmployerProfile,
    Role,
    RoleTranslation,
    StudentProfile,
    User,
    Vacancy,
    VacancyTranslation,
)
from portal.serializers import LoginSerializer, RegisterSerializer, VacancyWriteSerializer
from portal.translation_service import _translate_text_batch, translate_fields_with_google


class AutoTranslationFallbackTests(TestCase):
    def setUp(self):
        self.role = Role.objects.create(code=Role.RoleCode.EMPLOYER)
        RoleTranslation.objects.create(
            role=self.role,
            language="en",
            name="Employer",
            description="Employer account",
        )

        self.department = Department.objects.create(code="it")
        DepartmentTranslation.objects.create(
            department=self.department,
            language="en",
            name="IT Department",
            description="Tech department",
        )

        self.employer = User.objects.create_user(
            username="owner",
            password="pass-12345",
            role=self.role,
        )

        self.vacancy = Vacancy.objects.create(
            employer=self.employer,
            department=self.department,
            employment_type=Vacancy.EmploymentType.INTERNSHIP,
            status=Vacancy.VacancyStatus.ACTIVE,
        )
        VacancyTranslation.objects.create(
            vacancy=self.vacancy,
            language="en",
            title="Lab Assistant Intern",
            description="Support instructors in labs",
            responsibilities="Prepare and maintain equipment",
            requirements="Basic laboratory safety knowledge",
            location="Main Campus",
        )

    def test_vacancy_missing_translation_falls_back_without_writes(self):
        translation = self.vacancy.translation_for("de")
        self.assertIsNotNone(translation)
        self.assertEqual(translation.language, "en")
        self.assertEqual(translation.title, "Lab Assistant Intern")
        self.assertFalse(VacancyTranslation.objects.filter(vacancy=self.vacancy, language="de").exists())

    def test_vacancy_existing_translation_is_used(self):
        VacancyTranslation.objects.create(
            vacancy=self.vacancy,
            language="de",
            title="Bereits vorhanden",
            description="Vorhanden",
            responsibilities="Vorhanden",
            requirements="Vorhanden",
            location="Bereits vorhanden",
        )
        translation = self.vacancy.translation_for("de")
        self.assertEqual(translation.title, "Bereits vorhanden")

    def test_vacancy_falls_back_to_source_without_translator_call(self):
        translation = self.vacancy.translation_for("ru")
        self.assertEqual(translation.language, "en")
        self.assertFalse(VacancyTranslation.objects.filter(vacancy=self.vacancy, language="ru").exists())

    def test_role_translation_falls_back_without_writes(self):
        translation = self.role.translation_for("de")
        self.assertIsNotNone(translation)
        self.assertEqual(translation.language, "en")
        self.assertEqual(translation.name, "Employer")
        self.assertFalse(RoleTranslation.objects.filter(role=self.role, language="de").exists())

    def test_department_translation_falls_back_without_writes(self):
        translation = self.department.translation_for("de")
        self.assertIsNotNone(translation)
        self.assertEqual(translation.language, "en")
        self.assertEqual(translation.name, "IT Department")
        self.assertFalse(DepartmentTranslation.objects.filter(department=self.department, language="de").exists())


class TranslationServiceTests(TestCase):
    def test_returns_original_fields_for_same_language(self):
        fields = {"title": "Research Internship"}
        translated = translate_fields_with_google(
            source_language="en",
            target_language="en",
            fields=fields,
        )
        self.assertEqual(translated, fields)

    def test_returns_none_for_unsupported_language(self):
        translated = translate_fields_with_google(
            source_language="en",
            target_language="fr",
            fields={"title": "Research Internship"},
        )
        self.assertIsNone(translated)

    @patch("portal.translation_service._translate_text_batch_single")
    def test_batch_translation_chunks_requests(self, single_call_mock):
        single_call_mock.side_effect = lambda **kwargs: kwargs["texts"]
        texts = [f"Item {i}" for i in range(250)]
        translated = _translate_text_batch(
            texts=texts,
            source_language="en",
            target_language="de",
        )
        self.assertEqual(translated, texts)
        self.assertEqual(single_call_mock.call_count, 3)


class VacancyWriteSerializerTests(TestCase):
    def setUp(self):
        self.role = Role.objects.create(code=Role.RoleCode.EMPLOYER)
        self.department = Department.objects.create(code="eng")
        self.employer = User.objects.create_user(
            username="empl",
            password="pass-12345",
            role=self.role,
        )

    def test_create_requires_at_least_one_translation(self):
        serializer = VacancyWriteSerializer(
            data={
                "department": self.department.id,
                "employment_type": Vacancy.EmploymentType.INTERNSHIP,
                "status": Vacancy.VacancyStatus.ACTIVE,
                "translations": {},
            }
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("translations", str(serializer.errors))

    @patch("portal.serializers.translate_fields_with_google")
    def test_create_accepts_custom_department_name_and_non_english_source(self, translate_mock):
        translate_mock.return_value = None
        serializer = VacancyWriteSerializer(
            data={
                "department_name": "Student Research Hub",
                "employment_type": Vacancy.EmploymentType.INTERNSHIP,
                "status": Vacancy.VacancyStatus.ACTIVE,
                "translations": {
                    "de": {
                        "title": "Praktikum",
                        "description": "Beschreibung",
                        "responsibilities": "Aufgaben",
                        "requirements": "Anforderungen",
                        "location": "Hauptcampus",
                    }
                },
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        vacancy = serializer.save(employer=self.employer)

        self.assertEqual(vacancy.department.translations.filter(name="Student Research Hub").count(), 3)
        self.assertTrue(vacancy.translations.filter(language="de").exists())
        self.assertEqual(translate_mock.call_count, 2)

    @patch("portal.serializers.translate_fields_with_google")
    def test_create_accepts_only_english_and_creates_vacancy(self, translate_mock):
        translate_mock.return_value = None
        serializer = VacancyWriteSerializer(
            data={
                "department": self.department.id,
                "employment_type": Vacancy.EmploymentType.INTERNSHIP,
                "status": Vacancy.VacancyStatus.ACTIVE,
                "translations": {
                    "en": {
                        "title": "Research Internship",
                        "description": "Description",
                        "responsibilities": "Responsibilities",
                        "requirements": "Requirements",
                        "location": "Main Campus",
                    }
                },
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        vacancy = serializer.save(employer=self.employer)
        self.assertEqual(vacancy.translations.count(), 1)
        self.assertTrue(vacancy.translations.filter(language="en").exists())
        self.assertEqual(translate_mock.call_count, 2)

    @patch("portal.serializers.translate_fields_with_google")
    def test_create_autofills_missing_languages(self, translate_mock):
        def fake_translate(*, source_language, target_language, fields):
            translated = fields.copy()
            suffix = target_language.upper()
            for key, value in translated.items():
                if isinstance(value, str) and value:
                    translated[key] = f"{value} [{suffix}]"
            return translated

        translate_mock.side_effect = fake_translate

        serializer = VacancyWriteSerializer(
            data={
                "department": self.department.id,
                "employment_type": Vacancy.EmploymentType.INTERNSHIP,
                "status": Vacancy.VacancyStatus.ACTIVE,
                "translations": {
                    "en": {
                        "title": "Research Internship",
                        "description": "Description",
                        "responsibilities": "Responsibilities",
                        "requirements": "Requirements",
                        "location": "Main Campus",
                    }
                },
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        vacancy = serializer.save(employer=self.employer)

        self.assertTrue(vacancy.translations.filter(language="en").exists())
        self.assertTrue(vacancy.translations.filter(language="de").exists())
        self.assertTrue(vacancy.translations.filter(language="ru").exists())

        de_translation = vacancy.translations.get(language="de")
        self.assertEqual(de_translation.title, "Research Internship [DE]")
        self.assertEqual(translate_mock.call_count, 2)

    @patch("portal.serializers.translate_fields_with_google")
    def test_update_autofills_missing_languages_from_updated_payload(self, translate_mock):
        def fake_translate(*, source_language, target_language, fields):
            translated = fields.copy()
            suffix = target_language.upper()
            translated["title"] = f"{fields['title']} [{suffix}]"
            return translated

        translate_mock.side_effect = fake_translate

        vacancy = Vacancy.objects.create(
            employer=self.employer,
            department=self.department,
            employment_type=Vacancy.EmploymentType.INTERNSHIP,
            status=Vacancy.VacancyStatus.ACTIVE,
        )
        VacancyTranslation.objects.create(
            vacancy=vacancy,
            language="en",
            title="Old title",
            description="Old description",
            responsibilities="Old responsibilities",
            requirements="Old requirements",
            location="Old location",
        )

        serializer = VacancyWriteSerializer(
            instance=vacancy,
            data={
                "department": self.department.id,
                "employment_type": Vacancy.EmploymentType.INTERNSHIP,
                "status": Vacancy.VacancyStatus.ACTIVE,
                "translations": {
                    "en": {
                        "title": "New title",
                        "description": "New description",
                        "responsibilities": "New responsibilities",
                        "requirements": "New requirements",
                        "location": "New location",
                    }
                },
            },
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_vacancy = serializer.save()

        self.assertEqual(updated_vacancy.translations.filter(language="de").count(), 1)
        self.assertEqual(updated_vacancy.translations.filter(language="ru").count(), 1)
        self.assertEqual(updated_vacancy.translations.get(language="de").title, "New title [DE]")
        self.assertEqual(translate_mock.call_count, 2)


class RegisterSerializerTests(TestCase):
    def setUp(self):
        self.role = Role.objects.create(code=Role.RoleCode.STUDENT)

    def test_password_mismatch_error_is_localized(self):
        request = type("Req", (), {"lang": "de"})()
        serializer = RegisterSerializer(
            data={
                "username": "student_one",
                "email": "student_one@example.com",
                "first_name": "Max",
                "last_name": "Mustermann",
                "password": "pass-12345",
                "password_confirm": "pass-12346",
                "role": Role.RoleCode.STUDENT,
                "preferred_language": "de",
                "university_id": "S-001",
            },
            context={"request": request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("Passwörter stimmen nicht überein.", str(serializer.errors))

    def test_student_registration_generates_university_id_when_missing(self):
        request = type("Req", (), {"lang": "en"})()
        serializer = RegisterSerializer(
            data={
                "username": "student_without_id",
                "email": "student_without_id@example.com",
                "first_name": "Alex",
                "last_name": "Student",
                "password": "pass-12345",
                "password_confirm": "pass-12345",
                "role": Role.RoleCode.STUDENT,
                "preferred_language": "en",
            },
            context={"request": request},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.student_profile.university_id, f"S-{user.pk:06d}")


class LoginSerializerTests(TestCase):
    def setUp(self):
        self.role = Role.objects.create(code=Role.RoleCode.STUDENT)
        self.user = User.objects.create_user(
            username="login_student",
            email="login_student@example.com",
            password="pass-12345",
            role=self.role,
        )

    def test_login_accepts_email_as_identifier(self):
        serializer = LoginSerializer(
            data={
                "username": "login_student@example.com",
                "password": "pass-12345",
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["user"], self.user)


class StudentProfileUpdateAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.role = Role.objects.create(code=Role.RoleCode.STUDENT)
        self.student = User.objects.create_user(
            username="profile_student",
            password="pass-12345",
            role=self.role,
            first_name="Old",
            last_name="Name",
        )
        StudentProfile.objects.create(
            user=self.student,
            university_id="S-2001",
            faculty="",
            course=1,
        )

    def test_student_can_update_profile_program_course_and_resume_title(self):
        self.client.force_authenticate(self.student)
        response = self.client.patch(
            "/api/v1/auth/profile/",
            {
                "first_name": "Alex",
                "last_name": "Ivanov",
                "preferred_language": "ru",
                "faculty": "Computer Science",
                "course": 3,
                "resume_title": "alex_cv.pdf",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.student.refresh_from_db()
        self.student.student_profile.refresh_from_db()
        self.assertEqual(self.student.first_name, "Alex")
        self.assertEqual(self.student.student_profile.faculty, "Computer Science")
        self.assertEqual(self.student.student_profile.course, 3)
        self.assertEqual(self.student.resumes.get(is_primary=True).title, "alex_cv.pdf")
        self.assertEqual(response.data["user"]["primary_resume_title"], "alex_cv.pdf")


class EmployerProfileUpdateAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.role = Role.objects.create(code=Role.RoleCode.EMPLOYER)
        self.employer = User.objects.create_user(
            username="profile_employer",
            password="pass-12345",
            role=self.role,
            first_name="Old",
            last_name="Employer",
        )
        EmployerProfile.objects.create(
            user=self.employer,
            organization_name="Old Organization",
            position="Old position",
        )

    def test_employer_can_update_profile_organization_position_and_department(self):
        self.client.force_authenticate(self.employer)
        response = self.client.patch(
            "/api/v1/auth/profile/",
            {
                "first_name": "Career",
                "last_name": "Manager",
                "preferred_language": "en",
                "organization_name": "Career Center",
                "position": "Employer relations manager",
                "department_name": "Career Services",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.employer.refresh_from_db()
        self.employer.employer_profile.refresh_from_db()
        self.assertEqual(self.employer.first_name, "Career")
        self.assertEqual(self.employer.employer_profile.organization_name, "Career Center")
        self.assertEqual(self.employer.employer_profile.position, "Employer relations manager")
        self.assertEqual(self.employer.employer_profile.department.translations.filter(name="Career Services").count(), 3)
        self.assertEqual(response.data["user"]["organization_name"], "Career Center")
        self.assertEqual(response.data["user"]["position"], "Employer relations manager")
        self.assertEqual(response.data["user"]["employer_department_name"], "Career Services")


class HomeStatsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        employer_role = Role.objects.create(code=Role.RoleCode.EMPLOYER)
        student_role = Role.objects.create(code=Role.RoleCode.STUDENT)
        self.department = Department.objects.create(code="stats")
        self.employer = User.objects.create_user(username="stats_employer", password="pass-12345", role=employer_role)
        self.student = User.objects.create_user(username="stats_student", password="pass-12345", role=student_role)

        self.active_vacancy = Vacancy.objects.create(
            employer=self.employer,
            department=self.department,
            employment_type=Vacancy.EmploymentType.INTERNSHIP,
            status=Vacancy.VacancyStatus.ACTIVE,
        )
        VacancyTranslation.objects.create(
            vacancy=self.active_vacancy,
            language="en",
            title="Active",
            description="Active vacancy",
            responsibilities="Do things",
            requirements="Know things",
            location="Main Campus",
        )

        self.archived_vacancy = Vacancy.objects.create(
            employer=self.employer,
            department=self.department,
            employment_type=Vacancy.EmploymentType.PART_TIME,
            status=Vacancy.VacancyStatus.ARCHIVED,
        )
        VacancyTranslation.objects.create(
            vacancy=self.archived_vacancy,
            language="en",
            title="Archived",
            description="Archived vacancy",
            responsibilities="None",
            requirements="None",
            location="Library",
        )

        Application.objects.create(
            vacancy=self.active_vacancy,
            student=self.student,
            status=Application.ApplicationStatus.SUBMITTED,
        )

    def test_home_stats_returns_real_counts(self):
        response = self.client.get("/api/v1/stats/?lang=ru")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["active_vacancies"], 1)
        self.assertEqual(response.data["student_applications"], 1)


class VacancyAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        employer_role = Role.objects.create(code=Role.RoleCode.EMPLOYER)
        self.department = Department.objects.create(code="api-create")
        DepartmentTranslation.objects.create(
            department=self.department,
            language="en",
            name="API Create Department",
            description="Department",
        )
        self.employer = User.objects.create_user(
            username="api_create_employer",
            password="pass-12345",
            role=employer_role,
        )
        EmployerProfile.objects.create(user=self.employer, organization_name="API Employer")

    @patch("portal.serializers.translate_fields_with_google")
    def test_create_vacancy_api_returns_read_shape_with_id(self, translate_mock):
        translate_mock.return_value = None
        self.client.force_authenticate(self.employer)
        response = self.client.post(
            "/api/v1/vacancies/",
            {
                "department_name": "API Custom Department",
                "employment_type": Vacancy.EmploymentType.INTERNSHIP,
                "status": Vacancy.VacancyStatus.ACTIVE,
                "translations": {
                    "en": {
                        "title": "API Vacancy",
                        "description": "Description",
                        "responsibilities": "Responsibilities",
                        "requirements": "Requirements",
                        "location": "Campus",
                    }
                },
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn("id", response.data)
        self.assertEqual(response.data["title"], "API Vacancy")
        self.assertIn("department_name", response.data)


class DepartmentAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.active_department = Department.objects.create(code="cs", is_active=True)
        DepartmentTranslation.objects.create(
            department=self.active_department,
            language="en",
            name="Computer Science",
            description="CS Department",
        )
        DepartmentTranslation.objects.create(
            department=self.active_department,
            language="de",
            name="Informatik",
            description="Informatik-Fakultat",
        )

        self.inactive_department = Department.objects.create(code="old", is_active=False)
        DepartmentTranslation.objects.create(
            department=self.inactive_department,
            language="en",
            name="Old Department",
            description="Deprecated",
        )

    def test_departments_list_returns_only_active_localized_items(self):
        response = self.client.get("/api/v1/departments/?lang=de")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["code"], "cs")
        self.assertEqual(response.data[0]["name"], "Informatik")
