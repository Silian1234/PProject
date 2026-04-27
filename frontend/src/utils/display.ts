import type { TFunction } from "i18next";

export type SupportedLang = "en" | "de" | "ru";

const supportedLanguages: SupportedLang[] = ["en", "de", "ru"];

export function getCurrentLanguage(): SupportedLang {
  const queryLang = new URLSearchParams(window.location.search).get("lang");
  const savedLang = localStorage.getItem("lang");
  const candidate = queryLang || savedLang || "en";
  return supportedLanguages.includes(candidate as SupportedLang)
    ? (candidate as SupportedLang)
    : "en";
}

export function withCurrentLanguage(path: string): string {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", getCurrentLanguage());
  return `${pathname}?${params.toString()}`;
}

export function formatEmploymentType(type: string, t: TFunction): string {
  if (type === "part_time") return t("vacancies.partTime");
  if (type === "internship") return t("vacancies.internship");
  return type || t("common.notSpecified");
}

export function formatRole(role: string | null | undefined, t: TFunction): string {
  if (role === "student") return t("roles.student");
  if (role === "employer") return t("roles.employer");
  if (role === "admin") return t("roles.admin");
  return t("common.notSpecified");
}

export function formatLanguage(language: string | null | undefined, t: TFunction): string {
  if (language === "en") return t("languages.en");
  if (language === "de") return t("languages.de");
  if (language === "ru") return t("languages.ru");
  return t("common.notSpecified");
}

export function formatWorkload(hours: number | null | undefined, t: TFunction): string {
  if (hours === null || hours === undefined) return t("common.notSpecified");
  return `${hours} ${t("common.hoursPerWeek")}`;
}

export function formatSalary(
  salaryFrom: string | null | undefined,
  salaryTo: string | null | undefined,
  t: TFunction
): string {
  if (salaryFrom && salaryTo) return `${salaryFrom} - ${salaryTo}`;
  if (salaryFrom) return `${t("common.from")} ${salaryFrom}`;
  if (salaryTo) return `${t("common.to")} ${salaryTo}`;
  return t("common.notSpecified");
}

export function formatDate(value: string | null | undefined, locale: string, t: TFunction): string {
  if (!value) return t("common.notSpecified");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale).format(date);
}

export function previewText(value: string | null | undefined, limit = 80): string {
  const normalized = (value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 1).trim()}...`;
}
