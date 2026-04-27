from __future__ import annotations

import html
import json
import logging
import re
import time
from functools import lru_cache
from urllib import error, parse, request

from django.conf import settings

from .constants import SUPPORTED_LANGUAGE_CODES

logger = logging.getLogger(__name__)
LANG_RE = re.compile(r"^[a-z]{2}([_-][a-z]{2})?$", re.IGNORECASE)


def _translate_text_batch_single(*, texts: list[str], source_language: str, target_language: str) -> list[str] | None:
    api_key = getattr(settings, "GOOGLE_TRANSLATE_API_KEY", "").strip()
    if not api_key:
        return None

    endpoint = getattr(
        settings,
        "GOOGLE_TRANSLATE_API_URL",
        "https://translation.googleapis.com/language/translate/v2",
    ).strip()
    timeout = float(getattr(settings, "GOOGLE_TRANSLATE_TIMEOUT_SECONDS", 12))

    payload: dict[str, object] = {
        "q": texts,
        "target": target_language,
        "format": "text",
    }
    if source_language:
        payload["source"] = source_language

    body = json.dumps(payload).encode("utf-8")
    query = parse.urlencode({"key": api_key})
    req = request.Request(
        f"{endpoint}?{query}",
        data=body,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )

    for attempt in (1, 2):
        try:
            with request.urlopen(req, timeout=timeout) as response:  # noqa: S310
                raw = response.read().decode("utf-8")
            data = json.loads(raw)
            translated_items = data.get("data", {}).get("translations", [])
            if len(translated_items) != len(texts):
                return None
            result: list[str] = []
            for item in translated_items:
                translated_text = item.get("translatedText")
                if not isinstance(translated_text, str):
                    return None
                result.append(html.unescape(translated_text))
            return result
        except error.HTTPError as exc:
            try:
                response_body = exc.read().decode("utf-8")
            except Exception:  # noqa: BLE001
                response_body = "<unreadable body>"
            logger.warning(
                "Google Translate HTTP error: status=%s body=%s",
                exc.code,
                response_body,
            )
            return None
        except (error.URLError, TimeoutError, OSError, ValueError) as exc:
            if attempt == 1:
                time.sleep(0.25)
                continue
            logger.warning("Google Translate request failed after retry: %s", exc)
            return None
    return None


def _translate_text_batch(*, texts: list[str], source_language: str, target_language: str) -> list[str] | None:
    if not texts:
        return []

    # Google Translate v2 may reject large arrays with "too many text segments".
    max_segments = int(getattr(settings, "GOOGLE_TRANSLATE_MAX_SEGMENTS_PER_REQUEST", 100))
    max_segments = max(1, min(max_segments, 100))

    translated_all: list[str] = []
    for idx in range(0, len(texts), max_segments):
        chunk = texts[idx : idx + max_segments]
        translated_chunk = _translate_text_batch_single(
            texts=chunk,
            source_language=source_language,
            target_language=target_language,
        )
        if translated_chunk is None:
            return None
        translated_all.extend(translated_chunk)
    return translated_all


def translate_fields_with_google(
    *,
    source_language: str,
    target_language: str,
    fields: dict[str, str],
) -> dict[str, str] | None:
    if source_language == target_language:
        return fields
    if source_language not in SUPPORTED_LANGUAGE_CODES or target_language not in SUPPORTED_LANGUAGE_CODES:
        return None

    non_empty_items = [(key, value) for key, value in fields.items() if isinstance(value, str) and value.strip()]
    if not non_empty_items:
        return fields

    translated = _translate_text_batch(
        texts=[value for _, value in non_empty_items],
        source_language=source_language,
        target_language=target_language,
    )
    if translated is None:
        return None

    translated_map = fields.copy()
    for (field_name, _), translated_text in zip(non_empty_items, translated, strict=True):
        translated_map[field_name] = translated_text
    return translated_map


def _normalize_lang(lang: str) -> str | None:
    if not isinstance(lang, str):
        return None
    normalized = lang.strip().lower().replace("_", "-")
    if not normalized:
        return None
    primary = normalized.split("-")[0]
    if not LANG_RE.match(primary):
        return None
    return primary


def translate_texts_with_google(
    *,
    texts: list[str],
    source_language: str = "en",
    target_language: str = "en",
) -> list[str] | None:
    source = _normalize_lang(source_language)
    target = _normalize_lang(target_language)
    if source is None or target is None:
        return None
    if source == target:
        return texts
    if not texts:
        return []
    return _translate_text_batch(texts=texts, source_language=source, target_language=target)


@lru_cache(maxsize=4096)
def _translate_single_cached(text: str, source_language: str, target_language: str) -> str | None:
    translated = translate_texts_with_google(
        texts=[text],
        source_language=source_language,
        target_language=target_language,
    )
    if not translated:
        return None
    return translated[0]


def translate_text_with_google(
    *,
    text: str,
    source_language: str = "en",
    target_language: str = "en",
) -> str | None:
    if not text:
        return text
    source = _normalize_lang(source_language)
    target = _normalize_lang(target_language)
    if source is None or target is None:
        return None
    if source == target:
        return text
    return _translate_single_cached(text, source, target)
