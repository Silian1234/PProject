from __future__ import annotations

from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from portal.models import (
    Application,
    Department,
    DepartmentTranslation,
    Role,
    RoleTranslation,
    User,
    Vacancy,
    VacancyTranslation,
)
from portal.serializers import VacancyWriteSerializer
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

    @patch("portal.models.translate_fields_with_google")
    def test_vacancy_translation_autocreated_when_missing(self, translate_mock):
        translate_mock.return_value = {
            "title": "Laborassistent Praktikant",
            "description": "Unterstutzen Sie Lehrkrafte in Laboren",
            "responsibilities": "Gerate vorbereiten und warten",
            "requirements": "Grundkenntnisse der Laborsicherheit",
            "location": "Hauptcampus",
        }

        translation = self.vacancy.translation_for("de")
        self.assertIsNotNone(translation)
        self.assertEqual(translation.language, "de")
        self.assertEqual(translation.title, "Laborassistent Praktikant")
        self.assertEqual(translation.location, "Hauptcampus")
        self.assertTrue(VacancyTranslation.objects.filter(vacancy=self.vacancy, language="de").exists())
        translate_mock.assert_called_once()

    @patch("portal.models.translate_fields_with_google")
    def test_vacancy_existing_translation_skips_translator(self, translate_mock):
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
        translate_mock.assert_not_called()

    @patch("portal.models.translate_fields_with_google")
    def test_vacancy_falls_back_to_source_when_translate_fails(self, translate_mock):
        translate_mock.return_value = None
        translation = self.vacancy.translation_for("ru")
        self.assertEqual(translation.language, "en")
        self.assertFalse(VacancyTranslation.objects.filter(vacancy=self.vacancy, language="ru").exists())
        translate_mock.assert_called_once()

    @patch("portal.models.translate_fields_with_google")
    def test_role_translation_autocreated_when_missing(self, translate_mock):
        translate_mock.return_value = {
            "name": "Arbeitgeber",
            "description": "Konto fur Arbeitgeber",
        }
        translation = self.role.translation_for("de")
        self.assertIsNotNone(translation)
        self.assertEqual(translation.language, "de")
        self.assertEqual(translation.name, "Arbeitgeber")
        self.assertTrue(RoleTranslation.objects.filter(role=self.role, language="de").exists())
        translate_mock.assert_called_once()

    @patch("portal.models.translate_fields_with_google")
    def test_department_translation_autocreated_when_missing(self, translate_mock):
        translate_mock.return_value = {
            "name": "IT Abteilung",
            "description": "Technische Abteilung",
        }
        translation = self.department.translation_for("de")
        self.assertIsNotNone(translation)
        self.assertEqual(translation.language, "de")
        self.assertEqual(translation.name, "IT Abteilung")
        self.assertTrue(DepartmentTranslation.objects.filter(department=self.department, language="de").exists())
        translate_mock.assert_called_once()


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

    def test_create_requires_english_translation(self):
        serializer = VacancyWriteSerializer(
            data={
                "department": self.department.id,
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
        self.assertFalse(serializer.is_valid())
        self.assertIn("translations.en", str(serializer.errors))

    def test_create_accepts_only_english_and_creates_vacancy(self):
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
        self.assertEqual(response.data["supported_languages"], ["EN", "DE", "RU"])
        self.assertEqual(response.data["api_docs_url"], "/api/docs/swagger/")


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
