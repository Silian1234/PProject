from rest_framework.views import exception_handler

from .localization import t

def localized_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    request = context.get("request")
    lang = getattr(request, "lang", "en")

    if isinstance(response.data, dict):
        if "detail" in response.data and str(response.data["detail"]) in {"Authentication credentials were not provided."}:
            response.data["detail"] = t("msg.unauthorized", lang)

        for field, value in response.data.items():
            if isinstance(value, list):
                response.data[field] = [
                    t("msg.field_required", lang) if str(item) == "This field is required." else item for item in value
                ]
    return response
