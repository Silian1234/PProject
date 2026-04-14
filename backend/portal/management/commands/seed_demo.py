from django.core.management.base import BaseCommand
from portal.models import *

class Command(BaseCommand):
    def handle(self, *args, **options):
        self.seed_roles()
        departments = self.seed_departments()
        users = self.seed_users(departments)
        self.seed_vacancies(users["employer"], departments)
        self.stdout.write(self.style.SUCCESS("Demo data ready."))

    def seed_roles(self):
        data = {
            "student": {"en": ("Student", ""), "de": ("Student", ""), "ru": ("Студент", "")},
            "employer": {"en": ("Employer", ""), "de": ("Arbeitgeber", ""), "ru": ("Работодатель", "")},
            "admin": {"en": ("Administrator", ""), "de": ("Administrator", ""), "ru": ("Администратор", "")},
        }
        for code, langs in data.items():
            role, _ = Role.objects.get_or_create(code=code)
            for lang, (name, desc) in langs.items():
                RoleTranslation.objects.update_or_create(role=role, language=lang, defaults={"name": name, "description": desc})

    def seed_departments(self):
        payload = {
            "cs": {"en": ("Computer Science", ""), "de": ("Informatik", ""), "ru": ("Информатика", "")},
            "library": {"en": ("Library", ""), "de": ("Bibliothek", ""), "ru": ("Библиотека", "")},
        }
        out = {}
        for code, langs in payload.items():
            dept, _ = Department.objects.get_or_create(code=code)
            out[code] = dept
            for lang, (name, desc) in langs.items():
                DepartmentTranslation.objects.update_or_create(
                    department=dept, language=lang, defaults={"name": name, "description": desc}
                )
        return out

    def seed_users(self, departments):
        student_role = Role.objects.get(code="student")
        employer_role = Role.objects.get(code="employer")
        admin_role = Role.objects.get(code="admin")

        student, _ = User.objects.get_or_create(
            username="student_demo",
            defaults={"email": "student@example.com", "first_name": "Anna", "last_name": "Student", "role": student_role},
        )
        student.set_password("demo12345")
        student.save()
        StudentProfile.objects.get_or_create(user=student, defaults={"university_id": "S-1001", "faculty": "CS", "course": 2})

        employer, _ = User.objects.get_or_create(
            username="employer_demo",
            defaults={"email": "employer@example.com", "first_name": "Mark", "last_name": "Employer", "role": employer_role},
        )
        employer.set_password("demo12345")
        employer.save()
        EmployerProfile.objects.get_or_create(
            user=employer,
            defaults={"organization_name": "University Career Center", "position": "Recruiter", "department": departments["cs"]},
        )

        admin, _ = User.objects.get_or_create(
            username="admin_demo",
            defaults={"email": "admin@example.com", "first_name": "Alice", "last_name": "Admin", "role": admin_role, "is_staff": True, "is_superuser": True},
        )
        admin.set_password("demo12345")
        admin.save()

        return {"student": student, "employer": employer, "admin": admin}

    def seed_vacancies(self, employer, departments):
        vacancy, _ = Vacancy.objects.get_or_create(
            employer=employer,
            department=departments["cs"],
            employment_type="internship",
            location="Main Campus",
            defaults={"status": "active", "workload_hours": 20, "salary_from": 500, "salary_to": 700},
        )
        translations = {
            "en": ("IT Support Assistant", "Support IT services", "Service desk", "Basic IT skills"),
            "de": ("IT-Support-Assistent", "IT-Unterstützung", "Service Desk", "Grundkenntnisse IT"),
            "ru": ("Ассистент IT-поддержки", "Поддержка IT-сервисов", "Service desk", "Базовые IT-навыки"),
        }
        for lang, (title, description, responsibilities, requirements) in translations.items():
            VacancyTranslation.objects.update_or_create(
                vacancy=vacancy,
                language=lang,
                defaults={
                    "title": title,
                    "description": description,
                    "responsibilities": responsibilities,
                    "requirements": requirements,
                },
            )
