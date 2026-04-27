import axios from "axios";

const supportedLanguages = ["en", "de", "ru"] as const;
type SupportedLanguage = (typeof supportedLanguages)[number];

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return Boolean(value && supportedLanguages.includes(value as SupportedLanguage));
}

function getActiveLanguage() {
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (isSupportedLanguage(urlLang)) {
    localStorage.setItem("lang", urlLang);
    return urlLang;
  }

  const savedLang = localStorage.getItem("lang");
  if (isSupportedLanguage(savedLang)) {
    return savedLang;
  }

  return "en";
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const lang = getActiveLanguage();

  config.headers = config.headers ?? {};
  config.headers["Accept-Language"] = lang;

  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }

  // Keep explicit per-request `lang` if it was provided by caller.
  config.params = { lang, ...(config.params || {}) };
  return config;
});

export default api;
