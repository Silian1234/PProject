from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import *

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Campus", {"fields": ("role", "preferred_language")}),)
    list_display = UserAdmin.list_display + ("role", "preferred_language")

admin.site.register(Role)
admin.site.register(RoleTranslation)
admin.site.register(StudentProfile)
admin.site.register(EmployerProfile)
admin.site.register(Department)
admin.site.register(DepartmentTranslation)
admin.site.register(Vacancy)
admin.site.register(VacancyTranslation)
admin.site.register(Application)
admin.site.register(Resume)
admin.site.register(CoverLetter)
admin.site.register(Interview)
admin.site.register(Notification)
admin.site.register(Review)
