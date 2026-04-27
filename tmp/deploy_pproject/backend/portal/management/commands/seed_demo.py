from django.core.management.base import BaseCommand
from django.db import transaction

from portal.models import (
    Application,
    CoverLetter,
    Department,
    DepartmentTranslation,
    EmployerProfile,
    Resume,
    Role,
    RoleTranslation,
    StudentProfile,
    User,
    Vacancy,
    VacancyTranslation,
)


class Command(BaseCommand):
    @transaction.atomic
    def handle(self, *args, **options):
        self.seed_roles()
        departments = self.seed_departments()
        users = self.seed_users(departments)
        self.remove_legacy_records(departments["research"], users["employer"])
        vacancies = self.seed_vacancies(users["employer"], departments)
        self.seed_sample_application(users["student"], vacancies["it_support"])
        self.stdout.write(self.style.SUCCESS("Demo data ready."))

    def seed_roles(self):
        data = {
            "student": {
                "en": ("Student", "Can browse vacancies, apply, and track application statuses."),
                "de": ("Student", "Kann Stellen ansehen, sich bewerben und Bewerbungsstatus verfolgen."),
                "ru": ("Студент", "Может смотреть вакансии, откликаться и отслеживать статусы заявок."),
            },
            "employer": {
                "en": ("Employer", "Can publish vacancies and work with student applications."),
                "de": ("Arbeitgeber", "Kann Stellen veröffentlichen und Bewerbungen bearbeiten."),
                "ru": ("Работодатель", "Может публиковать вакансии и работать с откликами студентов."),
            },
            "admin": {
                "en": ("Administrator", "Has extended access to the service."),
                "de": ("Administrator", "Hat erweiterten Zugriff auf den Dienst."),
                "ru": ("Администратор", "Имеет расширенный доступ к сервису."),
            },
        }
        for code, langs in data.items():
            role, _ = Role.objects.get_or_create(code=code)
            for lang, (name, desc) in langs.items():
                RoleTranslation.objects.update_or_create(
                    role=role,
                    language=lang,
                    defaults={"name": name, "description": desc},
                )

    def seed_departments(self):
        payload = {
            "cs": {
                "en": ("Computer Science Department", "Software, systems, and campus IT projects."),
                "de": ("Fachbereich Informatik", "Software, Systeme und Campus-IT-Projekte."),
                "ru": ("Кафедра компьютерных наук", "Программирование, системы и IT-проекты университета."),
            },
            "library": {
                "en": ("University Library", "Library services, archives, and student research support."),
                "de": ("Universitätsbibliothek", "Bibliotheksdienste, Archive und Unterstützung für Forschung."),
                "ru": ("Университетская библиотека", "Библиотечные сервисы, архивы и помощь студентам."),
            },
            "research": {
                "en": ("Research Projects Office", "Student internships in applied university research."),
                "de": ("Büro für Forschungsprojekte", "Studentische Praktika in angewandter Forschung."),
                "ru": ("Офис исследовательских проектов", "Стажировки студентов в прикладных исследованиях."),
            },
        }
        out = {}
        for code, langs in payload.items():
            dept, _ = Department.objects.get_or_create(code=code, defaults={"is_active": True})
            if not dept.is_active:
                dept.is_active = True
                dept.save(update_fields=["is_active"])
            out[code] = dept
            for lang, (name, desc) in langs.items():
                DepartmentTranslation.objects.update_or_create(
                    department=dept,
                    language=lang,
                    defaults={"name": name, "description": desc},
                )
        return out

    def remove_legacy_records(self, fallback_department, fallback_employer):
        legacy_departments = Department.objects.filter(code__in=["auto-tr", "placeholder", "test"])
        for department in legacy_departments:
            Vacancy.objects.filter(department=department).update(
                department=fallback_department,
                employer=fallback_employer,
                location="Research Projects Office",
            )
            EmployerProfile.objects.filter(department=department).update(department=fallback_department)
            department.delete()

        legacy_users = User.objects.filter(username__in=["auto_employer"])
        for user in legacy_users:
            Vacancy.objects.filter(employer=user).update(
                employer=fallback_employer,
                department=fallback_department,
                location="Research Projects Office",
            )
            user.delete()

        User.objects.filter(username__startswith="st_", first_name="Test").delete()

        Vacancy.objects.filter(
            employer=fallback_employer,
            department__code="cs",
            location="Main Campus",
            translations__title="IT Support Assistant",
        ).distinct().delete()

    def seed_users(self, departments):
        student_role = Role.objects.get(code="student")
        employer_role = Role.objects.get(code="employer")
        admin_role = Role.objects.get(code="admin")

        student, _ = User.objects.get_or_create(
            username="student_demo",
            defaults={
                "email": "student@example.com",
                "first_name": "Anna",
                "last_name": "Kovalenko",
                "role": student_role,
                "preferred_language": "en",
            },
        )
        student.email = "student@example.com"
        student.first_name = "Anna"
        student.last_name = "Kovalenko"
        student.role = student_role
        student.set_password("demo12345")
        student.save()
        StudentProfile.objects.update_or_create(
            user=student,
            defaults={"university_id": "S-1001", "faculty": "Computer Science", "course": 2},
        )

        employer, _ = User.objects.get_or_create(
            username="employer_demo",
            defaults={
                "email": "career.center@example.edu",
                "first_name": "Marta",
                "last_name": "Reed",
                "role": employer_role,
                "preferred_language": "en",
            },
        )
        employer.email = "career.center@example.edu"
        employer.first_name = "Marta"
        employer.last_name = "Reed"
        employer.role = employer_role
        employer.set_password("demo12345")
        employer.save()
        EmployerProfile.objects.update_or_create(
            user=employer,
            defaults={
                "organization_name": "University Career Center",
                "position": "Recruitment Coordinator",
                "department": departments["cs"],
            },
        )

        admin, _ = User.objects.get_or_create(
            username="admin_demo",
            defaults={
                "email": "admin@example.edu",
                "first_name": "Elena",
                "last_name": "Adminova",
                "role": admin_role,
                "is_staff": True,
                "is_superuser": True,
                "preferred_language": "en",
            },
        )
        admin.email = "admin@example.edu"
        admin.first_name = "Elena"
        admin.last_name = "Adminova"
        admin.role = admin_role
        admin.is_staff = True
        admin.is_superuser = True
        admin.set_password("demo12345")
        admin.save()

        return {"student": student, "employer": employer, "admin": admin}

    def seed_vacancies(self, employer, departments):
        vacancies = {}
        specs = {
            "it_support": {
                "department": departments["cs"],
                "employment_type": Vacancy.EmploymentType.INTERNSHIP,
                "location": "Main Campus IT Desk",
                "workload_hours": 20,
                "salary_from": 500,
                "salary_to": 700,
                "translations": {
                    "en": (
                        "IT Support Assistant",
                        "Help students and staff solve everyday campus IT issues.",
                        "Handle service desk requests, prepare classroom equipment, and document recurring issues.",
                        "Basic Windows, network, and communication skills.",
                        "Main Campus IT Desk",
                    ),
                    "de": (
                        "IT-Support-Assistent",
                        "Hilf Studierenden und Mitarbeitenden bei alltäglichen IT-Problemen.",
                        "Serviceanfragen bearbeiten, Unterrichtstechnik vorbereiten und wiederkehrende Probleme dokumentieren.",
                        "Grundkenntnisse in Windows, Netzwerken und Kommunikation.",
                        "IT-Servicepunkt Hauptcampus",
                    ),
                    "ru": (
                        "Ассистент IT-поддержки",
                        "Помогайте студентам и сотрудникам решать повседневные IT-задачи в кампусе.",
                        "Обрабатывать обращения, готовить оборудование аудиторий и описывать повторяющиеся проблемы.",
                        "Базовые знания Windows, сетей и навыки коммуникации.",
                        "IT-служба главного кампуса",
                    ),
                },
            },
            "data_analyst": {
                "department": departments["research"],
                "employment_type": Vacancy.EmploymentType.INTERNSHIP,
                "location": "Research Projects Office",
                "workload_hours": 16,
                "salary_from": 600,
                "salary_to": 850,
                "translations": {
                    "en": (
                        "Data Analyst Intern",
                        "Work with research teams on survey, lab, and academic performance datasets.",
                        "Clean datasets, prepare dashboards, and summarize findings for project supervisors.",
                        "Python or spreadsheet experience, accuracy, and interest in applied research.",
                        "Research Projects Office",
                    ),
                    "de": (
                        "Praktikant Datenanalyse",
                        "Arbeite mit Forschungsteams an Umfrage-, Labor- und Leistungsdaten.",
                        "Datensätze bereinigen, Dashboards vorbereiten und Ergebnisse zusammenfassen.",
                        "Erfahrung mit Python oder Tabellenkalkulation, Genauigkeit und Interesse an Forschung.",
                        "Büro für Forschungsprojekte",
                    ),
                    "ru": (
                        "Стажер-аналитик данных",
                        "Работайте с исследовательскими командами над опросами, лабораторными и учебными данными.",
                        "Очищать наборы данных, готовить дашборды и резюмировать выводы для руководителей проектов.",
                        "Опыт Python или таблиц, внимательность и интерес к прикладным исследованиям.",
                        "Офис исследовательских проектов",
                    ),
                },
            },
            "library_assistant": {
                "department": departments["library"],
                "employment_type": Vacancy.EmploymentType.PART_TIME,
                "location": "University Library",
                "workload_hours": 12,
                "salary_from": 350,
                "salary_to": 450,
                "translations": {
                    "en": (
                        "Library Services Assistant",
                        "Support the library team during evening student service hours.",
                        "Help visitors, organize returned books, and assist with digital catalog requests.",
                        "Accuracy, polite communication, and readiness for evening shifts.",
                        "University Library",
                    ),
                    "de": (
                        "Assistent Bibliotheksservice",
                        "Unterstütze das Bibliotheksteam während der abendlichen Servicezeiten.",
                        "Besuchern helfen, zurückgegebene Bücher sortieren und Kataloganfragen unterstützen.",
                        "Genauigkeit, höfliche Kommunikation und Bereitschaft zu Abendschichten.",
                        "Universitätsbibliothek",
                    ),
                    "ru": (
                        "Помощник библиотечной службы",
                        "Поддерживайте команду библиотеки во время вечерних часов обслуживания студентов.",
                        "Помогать посетителям, разбирать возвращенные книги и работать с запросами к электронному каталогу.",
                        "Внимательность, вежливое общение и готовность к вечерним сменам.",
                        "Университетская библиотека",
                    ),
                },
            },
        }

        for key, spec in specs.items():
            vacancy, _ = Vacancy.objects.update_or_create(
                employer=employer,
                department=spec["department"],
                location=spec["location"],
                defaults={
                    "employment_type": spec["employment_type"],
                    "status": Vacancy.VacancyStatus.ACTIVE,
                    "workload_hours": spec["workload_hours"],
                    "salary_from": spec["salary_from"],
                    "salary_to": spec["salary_to"],
                },
            )
            vacancies[key] = vacancy
            for lang, (title, description, responsibilities, requirements, translated_location) in spec[
                "translations"
            ].items():
                VacancyTranslation.objects.update_or_create(
                    vacancy=vacancy,
                    language=lang,
                    defaults={
                        "title": title,
                        "description": description,
                        "responsibilities": responsibilities,
                        "requirements": requirements,
                        "location": translated_location,
                    },
                )
        return vacancies

    def seed_sample_application(self, student, vacancy):
        resume, _ = Resume.objects.update_or_create(
            student=student,
            title="Anna Kovalenko CV",
            defaults={"is_primary": True},
        )
        cover_letter, _ = CoverLetter.objects.update_or_create(
            student=student,
            title="IT support motivation letter",
            defaults={
                "body": "I have helped classmates troubleshoot laptop and network issues and want to support the campus IT team."
            },
        )
        Application.objects.get_or_create(
            vacancy=vacancy,
            student=student,
            defaults={
                "resume": resume,
                "cover_letter": cover_letter,
                "student_message": "I can work on Mondays, Wednesdays, and Fridays after classes.",
                "status": Application.ApplicationStatus.SUBMITTED,
            },
        )
