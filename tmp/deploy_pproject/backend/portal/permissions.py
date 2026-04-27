from rest_framework import permissions
from .models import Role


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role_code == Role.RoleCode.STUDENT)


class IsEmployerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return bool(request.user.is_superuser or request.user.role_code in {Role.RoleCode.EMPLOYER, Role.RoleCode.ADMIN})


class IsVacancyOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        return bool(user.is_superuser or user.role_code == Role.RoleCode.ADMIN or obj.employer_id == user.id)
