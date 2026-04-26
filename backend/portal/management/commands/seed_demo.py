from django.core.management.base import BaseCommand

from portal.models import (
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


class Command(BaseCommand):
    def handle(self, *args, **options):
        self.seed_roles()
        departments = self.seed_departments()
        users = self.seed_users(departments)
        self.seed_vacancies(users["employer"], departments)
        self.stdout.write(self.style.SUCCESS("Demo data ready."))

    def seed_roles(self):
        data = {
            "student": {
                "en": ("Student", ""),
                "de": ("Student", ""),
                "ru": ("\u0421\u0442\u0443\u0434\u0435\u043d\u0442", ""),
            },
            "employer": {
                "en": ("Employer", ""),
                "de": ("Arbeitgeber", ""),
                "ru": ("\u0420\u0430\u0431\u043e\u0442\u043e\u0434\u0430\u0442\u0435\u043b\u044c", ""),
            },
            "admin": {
                "en": ("Administrator", ""),
                "de": ("Administrator", ""),
                "ru": ("\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440", ""),
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
                "en": ("Computer Science", ""),
                "de": ("Informatik", ""),
                "ru": ("\u041a\u043e\u043c\u043f\u044c\u044e\u0442\u0435\u0440\u043d\u044b\u0435 \u043d\u0430\u0443\u043a\u0438", ""),
            },
            "library": {
                "en": ("Library", ""),
                "de": ("Bibliothek", ""),
                "ru": ("\u0411\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0430", ""),
            },
        }
        out = {}
        for code, langs in payload.items():
            dept, _ = Department.objects.get_or_create(code=code)
            out[code] = dept
            for lang, (name, desc) in langs.items():
                DepartmentTranslation.objects.update_or_create(
                    department=dept,
                    language=lang,
                    defaults={"name": name, "description": desc},
                )
        return out

    def seed_users(self, departments):
        student_role = Role.objects.get(code="student")
        employer_role = Role.objects.get(code="employer")
        admin_role = Role.objects.get(code="admin")

        student, _ = User.objects.get_or_create(
            username="student_demo",
            defaults={
                "email": "student@example.com",
                "first_name": "Anna",
                "last_name": "Student",
                "role": student_role,
            },
        )
        student.set_password("demo12345")
        student.save()
        StudentProfile.objects.get_or_create(
            user=student,
            defaults={"university_id": "S-1001", "faculty": "CS", "course": 2},
        )

        employer, _ = User.objects.get_or_create(
            username="employer_demo",
            defaults={
                "email": "employer@example.com",
                "first_name": "Mark",
                "last_name": "Employer",
                "role": employer_role,
            },
        )
        employer.set_password("demo12345")
        employer.save()
        EmployerProfile.objects.get_or_create(
            user=employer,
            defaults={
                "organization_name": "University Career Center",
                "position": "Recruiter",
                "department": departments["cs"],
            },
        )

        admin, _ = User.objects.get_or_create(
            username="admin_demo",
            defaults={
                "email": "admin@example.com",
                "first_name": "Alice",
                "last_name": "Admin",
                "role": admin_role,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin.set_password("demo12345")
        admin.save()

        return {"student": student, "employer": employer, "admin": admin}

    def seed_vacancies(self, employer, departments):
        vacancy, _ = Vacancy.objects.get_or_create(
            employer=employer,
            department=departments["cs"],
            employment_type=Vacancy.EmploymentType.INTERNSHIP,
            location="Main Campus",
            defaults={
                "status": Vacancy.VacancyStatus.ACTIVE,
                "workload_hours": 20,
                "salary_from": 500,
                "salary_to": 700,
            },
        )

        translations = {
            "en": (
                "IT Support Assistant",
                "Support IT services",
                "Service desk",
                "Basic IT skills",
                "Main Campus",
            ),
            "de": (
                "IT-Support-Assistent",
                "IT-Unterstuetzung",
                "Service Desk",
                "Grundkenntnisse IT",
                "Hauptcampus",
            ),
            "ru": (
                "\u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043d\u0442 IT-\u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0438",
                "\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 IT-\u0441\u0435\u0440\u0432\u0438\u0441\u043e\u0432 \u0443\u043d\u0438\u0432\u0435\u0440\u0441\u0438\u0442\u0435\u0442\u0430",
                "\u0420\u0430\u0431\u043e\u0442\u0430 \u043d\u0430 \u043b\u0438\u043d\u0438\u0438 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0438 \u0438 \u043f\u043e\u043c\u043e\u0449\u044c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f\u043c",
                "\u0411\u0430\u0437\u043e\u0432\u044b\u0435 \u043d\u0430\u0432\u044b\u043a\u0438 IT \u0438 \u043a\u043e\u043c\u043c\u0443\u043d\u0438\u043a\u0430\u0446\u0438\u0438",
                "\u0413\u043b\u0430\u0432\u043d\u044b\u0439 \u043a\u0430\u043c\u043f\u0443\u0441",
            ),
        }

        for lang, (title, description, responsibilities, requirements, translated_location) in translations.items():
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
