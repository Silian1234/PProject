from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Role, User

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("id", "code")

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Campus", {"fields": ("role", "preferred_language")}),)
    list_display = UserAdmin.list_display + ("role", "preferred_language")
