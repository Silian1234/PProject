from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from .constants import DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_CHOICES, SUPPORTED_LANGUAGE_CODES


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Role(TimestampedModel):
    class RoleCode(models.TextChoices):
        STUDENT = "student", "Student"
        EMPLOYER = "employer", "Employer"
        ADMIN = "admin", "Administrator"

    code = models.CharField(max_length=32, choices=RoleCode.choices, unique=True)

    def __str__(self):
        return self.code

    def translation_for(self, language: str):
        requested = language if language in SUPPORTED_LANGUAGE_CODES else DEFAULT_LANGUAGE
        existing = self.translations.filter(language=requested).first()
        if existing:
            return existing

        source = self.translations.filter(language="en").first() or self.translations.first()
        return source


class RoleTranslation(TimestampedModel):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="translations")
    language = models.CharField(max_length=2, choices=SUPPORTED_LANGUAGE_CHOICES)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["role", "language"], name="unique_role_translation")]


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


class StudentProfile(TimestampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    university_id = models.CharField(max_length=50, unique=True)
    faculty = models.CharField(max_length=120, blank=True)
    course = models.PositiveSmallIntegerField(default=1)


class Department(TimestampedModel):
    code = models.CharField(max_length=64, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.code

    def translation_for(self, language: str):
        requested = language if language in SUPPORTED_LANGUAGE_CODES else DEFAULT_LANGUAGE
        existing = self.translations.filter(language=requested).first()
        if existing:
            return existing

        source = self.translations.filter(language="en").first() or self.translations.first()
        return source


class DepartmentTranslation(TimestampedModel):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="translations")
    language = models.CharField(max_length=2, choices=SUPPORTED_LANGUAGE_CHOICES)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["department", "language"], name="unique_department_translation")]


class EmployerProfile(TimestampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="employer_profile")
    organization_name = models.CharField(max_length=180)
    position = models.CharField(max_length=120, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)


class Vacancy(TimestampedModel):
    class VacancyStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        ARCHIVED = "archived", "Archived"

    class EmploymentType(models.TextChoices):
        PART_TIME = "part_time", "Part time"
        INTERNSHIP = "internship", "Internship"

    employer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="vacancies")
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="vacancies")
    employment_type = models.CharField(max_length=20, choices=EmploymentType.choices)
    location = models.CharField(max_length=200, blank=True)
    workload_hours = models.PositiveSmallIntegerField(null=True, blank=True)
    salary_from = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_to = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=VacancyStatus.choices, default=VacancyStatus.DRAFT)
    application_deadline = models.DateField(null=True, blank=True)

    def translation_for(self, language: str):
        requested = language if language in SUPPORTED_LANGUAGE_CODES else DEFAULT_LANGUAGE
        existing = self.translations.filter(language=requested).first()
        if existing:
            return existing

        source = self.translations.filter(language="en").first() or self.translations.first()
        return source


class VacancyTranslation(TimestampedModel):
    vacancy = models.ForeignKey(Vacancy, on_delete=models.CASCADE, related_name="translations")
    language = models.CharField(max_length=2, choices=SUPPORTED_LANGUAGE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    responsibilities = models.TextField()
    requirements = models.TextField()
    location = models.CharField(max_length=200, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["vacancy", "language"], name="unique_vacancy_translation")]


class Resume(TimestampedModel):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="resumes")
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to="resumes/", null=True, blank=True)
    is_primary = models.BooleanField(default=False)


class CoverLetter(TimestampedModel):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cover_letters")
    title = models.CharField(max_length=200)
    body = models.TextField()


class Application(TimestampedModel):
    class ApplicationStatus(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under review"
        INTERVIEW = "interview", "Interview"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"

    vacancy = models.ForeignKey(Vacancy, on_delete=models.CASCADE, related_name="applications")
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="applications")
    resume = models.ForeignKey(Resume, on_delete=models.SET_NULL, null=True, blank=True, related_name="applications")
    cover_letter = models.ForeignKey(
        CoverLetter, on_delete=models.SET_NULL, null=True, blank=True, related_name="applications"
    )
    student_message = models.TextField(blank=True)
    employer_comment = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=ApplicationStatus.choices, default=ApplicationStatus.SUBMITTED)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["vacancy", "student"], name="unique_student_application")]


class Interview(TimestampedModel):
    class InterviewStatus(models.TextChoices):
        PLANNED = "planned", "Planned"
        DONE = "done", "Done"
        CANCELLED = "cancelled", "Cancelled"

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="interviews")
    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=InterviewStatus.choices, default=InterviewStatus.PLANNED)
    notes = models.TextField(blank=True)


class Notification(TimestampedModel):
    class NotificationType(models.TextChoices):
        APPLICATION_SUBMITTED = "application_submitted", "Application submitted"
        STATUS_UPDATED = "status_updated", "Status updated"
        NEW_VACANCY = "new_vacancy", "New vacancy"
        INTERVIEW_SCHEDULED = "interview_scheduled", "Interview scheduled"
        REVIEW_CREATED = "review_created", "Review created"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
    vacancy = models.ForeignKey(Vacancy, on_delete=models.SET_NULL, related_name="notifications", null=True, blank=True)
    language = models.CharField(max_length=2, choices=SUPPORTED_LANGUAGE_CHOICES, default="en")
    message = models.TextField()
    event_type = models.CharField(max_length=40, choices=NotificationType.choices)
    is_read = models.BooleanField(default=False)


class VacancySubscription(TimestampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="vacancy_subscription")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    employment_type = models.CharField(max_length=20, choices=Vacancy.EmploymentType.choices, blank=True)
    is_active = models.BooleanField(default=True)


class Review(TimestampedModel):
    class ReviewType(models.TextChoices):
        EMPLOYER_TO_STUDENT = "employer_to_student", "Employer to student"
        STUDENT_TO_EMPLOYER = "student_to_employer", "Student to employer"

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="reviews")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    review_type = models.CharField(
        max_length=32,
        choices=ReviewType.choices,
        default=ReviewType.STUDENT_TO_EMPLOYER,
    )
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["application", "author", "review_type"],
                name="unique_application_author_review_type",
            )
        ]
