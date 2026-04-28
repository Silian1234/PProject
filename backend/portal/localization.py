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
        "msg.employer_registration_disabled": "Employer accounts are issued by the university administration.",
        "msg.profile_updated": "Profile updated successfully.",
        "msg.department_not_found": "Department not found.",
        "msg.application_not_found": "Application not found.",
        "msg.notification_not_found": "Notification not found.",
        "msg.notification_marked_read": "Notification marked as read.",
        "msg.subscription_updated": "Vacancy notification subscription updated.",
        "msg.new_vacancy": "New vacancy available: {title}",
        "msg.new_vacancy_generic": "New vacancy available.",
        "msg.interview_scheduled": "Interview scheduled.",
        "msg.interview_updated": "Interview updated.",
        "msg.review_created": "Review saved.",
        "msg.review_exists": "You already left this review.",
        "msg.self_review_not_allowed": "You cannot leave a review for yourself.",
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
        "msg.password_mismatch": "Passwörter stimmen nicht überein.",
        "msg.username_exists": "Benutzername ist bereits vergeben.",
        "msg.email_exists": "E-Mail ist bereits vergeben.",
        "msg.only_students": "Nur Studierende dürfen diese Aktion ausführen.",
        "msg.only_employers": "Nur Arbeitgeber oder Administratoren dürfen diese Aktion ausführen.",
        "msg.unauthorized": "Authentifizierung erforderlich.",
        "msg.employer_registration_disabled": "Arbeitgeberkonten werden von der Universitätsverwaltung vergeben.",
        "msg.profile_updated": "Profil erfolgreich aktualisiert.",
        "msg.department_not_found": "Abteilung nicht gefunden.",
        "msg.application_not_found": "Bewerbung nicht gefunden.",
        "msg.notification_not_found": "Benachrichtigung nicht gefunden.",
        "msg.notification_marked_read": "Benachrichtigung als gelesen markiert.",
        "msg.subscription_updated": "Benachrichtigungseinstellungen für neue Stellen aktualisiert.",
        "msg.new_vacancy": "Neue Stelle verfügbar: {title}",
        "msg.new_vacancy_generic": "Neue Stelle verfügbar.",
        "msg.interview_scheduled": "Interview geplant.",
        "msg.interview_updated": "Interview aktualisiert.",
        "msg.review_created": "Bewertung gespeichert.",
        "msg.review_exists": "Du hast diese Bewertung bereits abgegeben.",
        "msg.self_review_not_allowed": "Du kannst keine Bewertung für dich selbst abgeben.",
    },
    "ru": {
        "msg.application_submitted": "Отклик успешно отправлен.",
        "msg.application_exists": "Вы уже откликались на эту вакансию.",
        "msg.vacancy_not_found": "Вакансия не найдена.",
        "msg.permission_denied": "Доступ запрещен.",
        "msg.auth_invalid": "Неверный логин или пароль.",
        "msg.auth_registered": "Регистрация успешно завершена.",
        "msg.auth_logged_in": "Вход выполнен.",
        "msg.auth_logged_out": "Выход выполнен.",
        "msg.status_updated": "Статус заявки обновлен.",
        "msg.field_required": "Это поле обязательно.",
        "msg.password_mismatch": "Пароли не совпадают.",
        "msg.username_exists": "Пользователь с таким логином уже существует.",
        "msg.email_exists": "Пользователь с таким email уже существует.",
        "msg.only_students": "Это действие доступно только студентам.",
        "msg.only_employers": "Это действие доступно только работодателям и администраторам.",
        "msg.unauthorized": "Требуется авторизация.",
        "msg.employer_registration_disabled": "Аккаунты работодателей выдает администрация университета.",
        "msg.profile_updated": "Профиль успешно обновлен.",
        "msg.department_not_found": "Подразделение не найдено.",
        "msg.application_not_found": "Заявка не найдена.",
        "msg.notification_not_found": "Уведомление не найдено.",
        "msg.notification_marked_read": "Уведомление отмечено как прочитанное.",
        "msg.subscription_updated": "Подписка на новые вакансии обновлена.",
        "msg.new_vacancy": "Появилась новая вакансия: {title}",
        "msg.new_vacancy_generic": "Появилась новая вакансия.",
        "msg.interview_scheduled": "Собеседование запланировано.",
        "msg.interview_updated": "Собеседование обновлено.",
        "msg.review_created": "Отзыв сохранен.",
        "msg.review_exists": "Вы уже оставили этот отзыв.",
        "msg.self_review_not_allowed": "Нельзя оставить отзыв самому себе.",
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
