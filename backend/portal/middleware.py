from .constants import DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_CODES
from .i18n import resolve_language

class LanguageResolverMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        lang = resolve_language(request.headers, request.GET.get("lang"))

        if lang == DEFAULT_LANGUAGE and request.session.get("lang") in SUPPORTED_LANGUAGE_CODES:
            lang = request.session["lang"]

        if (
            lang == DEFAULT_LANGUAGE
            and hasattr(request, "user")
            and request.user.is_authenticated
            and getattr(request.user, "preferred_language", None) in SUPPORTED_LANGUAGE_CODES
        ):
            lang = request.user.preferred_language

        request.lang = lang
        request.session["lang"] = lang
        response = self.get_response(request)
        response["Content-Language"] = lang
        return response
