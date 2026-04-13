from django.contrib.auth.models import AbstractUser
from django.db import models

SUPPORTED_LANGUAGE_CHOICES = (
    ("en", "English"),
    ("de", "Deutsch"),
    ("ru", "Русский"),
)

class Role(models.Model):
    class RoleCode(models.TextChoices):
        STUDENT = "student", "Student"
        EMPLOYER = "employer", "Employer"
        ADMIN = "admin", "Administrator"

    code = models.CharField(max_length=32, choices=RoleCode.choices, unique=True)

    def __str__(self):
        return self.code


class User(AbstractUser):
    role = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, blank=True, related_name="users")
    preferred_language = models.CharField(max_length=2, choices=SUPPORTED_LANGUAGE_CHOICES, default="en")

    @property
    def role_code(self):
        return self.role.code if self.role else None

    @property
    def is_student(self):
        return self.role_code == Role.RoleCode.STUDENT

    @property
    def is_employer(self):
        return self.role_code in {Role.RoleCode.EMPLOYER, Role.RoleCode.ADMIN} or self.is_superuser
