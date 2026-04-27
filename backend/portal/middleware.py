from .constants import DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_CODES
from .localization import resolve_language

class LanguageResolverMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        query_lang = request.GET.get("lang")
        lang = resolve_language(request.headers, query_lang)

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
        auth_header = request.headers.get("Authorization", "")
        should_persist_lang = bool(query_lang) and not auth_header.startswith("Token ")
        if should_persist_lang and request.session.get("lang") != lang:
            request.session["lang"] = lang
        response = self.get_response(request)
        response["Content-Language"] = lang
        return response
