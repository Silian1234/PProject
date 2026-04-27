LANG_EN = "en"
LANG_DE = "de"
LANG_RU = "ru"

DEFAULT_LANGUAGE = LANG_EN

SUPPORTED_LANGUAGE_CHOICES = (
    (LANG_EN, "English"),
    (LANG_DE, "Deutsch"),
    (LANG_RU, "Русский"),
)

SUPPORTED_LANGUAGE_CODES = {code for code, _ in SUPPORTED_LANGUAGE_CHOICES}
