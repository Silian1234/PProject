from .constants import DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_CODES

TRANSLATIONS = {
    "en": {
        "msg.application_submitted": "Application submitted successfully.",
        "msg.application_exists": "You already applied for this vacancy.",
        "msg.vacancy_not_found": "Vacancy not found.",
        "msg.permission_denied": "Permission denied.",
        "msg.auth_invalid": "Invalid username or password.",
        "msg.auth_registered": "Registration completed successfully.",
        "msg.auth_logged_in": "Login successful.",
        "msg.auth_logged_out": "Logout successful.",
        "msg.status_updated": "Application status updated.",
        "msg.field_required": "This field is required.",
        "msg.password_mismatch": "Passwords do not match.",
        "msg.username_exists": "Username already exists.",
        "msg.email_exists": "Email already exists.",
        "msg.only_students": "Only students can perform this action.",
        "msg.only_employers": "Only employers or administrators can perform this action.",
        "msg.unauthorized": "Authentication required.",
    },
    "de": {
        "msg.application_submitted": "Bewerbung wurde erfolgreich gesendet.",
        "msg.application_exists": "Du hast dich bereits auf diese Stelle beworben.",
        "msg.vacancy_not_found": "Stelle nicht gefunden.",
        "msg.permission_denied": "Zugriff verweigert.",
        "msg.auth_invalid": "Ungültiger Benutzername oder Passwort.",
        "msg.auth_registered": "Registrierung erfolgreich abgeschlossen.",
        "msg.auth_logged_in": "Anmeldung erfolgreich.",
        "msg.auth_logged_out": "Abmeldung erfolgreich.",
        "msg.status_updated": "Bewerbungsstatus aktualisiert.",
        "msg.field_required": "Dieses Feld ist erforderlich.",
        "msg.password_mismatch": "Passwoerter stimmen nicht ueberein.",
        "msg.username_exists": "Benutzername ist bereits vergeben.",
        "msg.email_exists": "E-Mail ist bereits vergeben.",
        "msg.only_students": "Nur Studierende dürfen diese Aktion ausführen.",
        "msg.only_employers": "Nur Arbeitgeber oder Administratoren dürfen diese Aktion ausführen.",
        "msg.unauthorized": "Authentifizierung erforderlich.",
    },
    "ru": {
        "msg.application_submitted": "Отклик успешно отправлен.",
        "msg.application_exists": "Вы уже откликались на эту вакансию.",
        "msg.vacancy_not_found": "Вакансия не найдена.",
        "msg.permission_denied": "Доступ запрещён.",
        "msg.auth_invalid": "Неверный логин или пароль.",
        "msg.auth_registered": "Регистрация успешно завершена.",
        "msg.auth_logged_in": "Вход выполнен.",
        "msg.auth_logged_out": "Выход выполнен.",
        "msg.status_updated": "Статус заявки обновлён.",
        "msg.field_required": "Это поле обязательно.",
        "msg.password_mismatch": "\u041f\u0430\u0440\u043e\u043b\u0438 \u043d\u0435 \u0441\u043e\u0432\u043f\u0430\u0434\u0430\u044e\u0442.",
        "msg.username_exists": "Пользователь с таким логином уже существует.",
        "msg.email_exists": "Пользователь с таким email уже существует.",
        "msg.only_students": "Это действие доступно только студентам.",
        "msg.only_employers": "Это действие доступно только работодателям и администраторам.",
        "msg.unauthorized": "Требуется авторизация.",
    },
}

def normalize_language(raw_value: str | None) -> str:
    if not raw_value:
        return DEFAULT_LANGUAGE
    primary = raw_value.split(",")[0].split(";")[0].strip().lower()
    normalized = primary.split("-")[0]
    return normalized if normalized in SUPPORTED_LANGUAGE_CODES else DEFAULT_LANGUAGE

def resolve_language(headers=None, query_lang=None):
    if query_lang:
        q = normalize_language(query_lang)
        if q in SUPPORTED_LANGUAGE_CODES:
            return q
    header_lang = headers.get("Accept-Language") if headers else None
    if header_lang:
        h = normalize_language(header_lang)
        if h in SUPPORTED_LANGUAGE_CODES:
            return h
    return DEFAULT_LANGUAGE

def t(key: str, lang: str | None = None, default: str | None = None):
    lang = lang if lang in SUPPORTED_LANGUAGE_CODES else DEFAULT_LANGUAGE
    return TRANSLATIONS.get(lang, {}).get(key) or TRANSLATIONS[DEFAULT_LANGUAGE].get(key) or default or key
