import axios from "axios";

type Lang = "en" | "de" | "ru";

const fieldLabels: Record<Lang, Record<string, string>> = {
  en: {
    username: "Username",
    email: "Email",
    password: "Password",
    password_confirm: "Password confirmation",
    first_name: "First name",
    last_name: "Last name",
    preferred_language: "Preferred language",
    faculty: "Program",
    course: "Year",
    resume_title: "Resume title",
    resume_file: "Resume file",
    vacancy_id: "Vacancy",
    student_message: "Student message",
    cover_letter_text: "Cover letter",
    department_name: "Department",
    employment_type: "Type",
    workload_hours: "Workload",
    salary_from: "Salary from",
    salary_to: "Salary to",
    application_deadline: "Application deadline",
    status: "Status",
    translations: "Localization",
    title: "Title",
    description: "Description",
    responsibilities: "Responsibilities",
    requirements: "Requirements",
    location: "Location"
  },
  de: {
    username: "Benutzername",
    email: "E-Mail",
    password: "Passwort",
    password_confirm: "Passwortbestätigung",
    first_name: "Vorname",
    last_name: "Nachname",
    preferred_language: "Bevorzugte Sprache",
    faculty: "Studiengang",
    course: "Studienjahr",
    resume_title: "Lebenslauf-Titel",
    resume_file: "Lebenslauf-Datei",
    vacancy_id: "Stelle",
    student_message: "Nachricht des Studierenden",
    cover_letter_text: "Anschreiben",
    department_name: "Abteilung",
    employment_type: "Typ",
    workload_hours: "Arbeitszeit",
    salary_from: "Gehalt von",
    salary_to: "Gehalt bis",
    application_deadline: "Bewerbungsfrist",
    status: "Status",
    translations: "Lokalisierung",
    title: "Titel",
    description: "Beschreibung",
    responsibilities: "Aufgaben",
    requirements: "Anforderungen",
    location: "Standort"
  },
  ru: {
    username: "Логин",
    email: "Email",
    password: "Пароль",
    password_confirm: "Подтверждение пароля",
    first_name: "Имя",
    last_name: "Фамилия",
    preferred_language: "Предпочитаемый язык",
    faculty: "Программа",
    course: "Курс",
    resume_title: "Название резюме",
    resume_file: "Файл резюме",
    vacancy_id: "Вакансия",
    student_message: "Сообщение студента",
    cover_letter_text: "Сопроводительное письмо",
    department_name: "Подразделение",
    employment_type: "Тип",
    workload_hours: "Занятость",
    salary_from: "Оплата от",
    salary_to: "Оплата до",
    application_deadline: "Дедлайн подачи",
    status: "Статус",
    translations: "Локализация",
    title: "Название",
    description: "Описание",
    responsibilities: "Обязанности",
    requirements: "Требования",
    location: "Локация"
  }
};

function getActiveLang(): Lang {
  const queryLang = new URLSearchParams(window.location.search).get("lang");
  const savedLang = localStorage.getItem("lang");
  const candidate = queryLang || savedLang || "en";
  return ["en", "de", "ru"].includes(candidate) ? (candidate as Lang) : "en";
}

function formatFieldPath(path: string[]): string {
  const labels = fieldLabels[getActiveLang()];
  return path
    .map((field) => {
      if (field === "en" || field === "de" || field === "ru") return field.toUpperCase();
      return labels[field] || field.replace(/_/g, " ");
    })
    .join(" / ");
}

function collectValidationMessages(payload: unknown, prefix: string[] = []): string[] {
  if (payload == null) {
    return [];
  }

  if (typeof payload === "string") {
    const label = prefix.length ? formatFieldPath(prefix) : "";
    return [label ? `${label}: ${payload}` : payload];
  }

  if (Array.isArray(payload)) {
    return payload.flatMap((item) => collectValidationMessages(item, prefix));
  }

  if (typeof payload === "object") {
    const entries = Object.entries(payload as Record<string, unknown>);
    return entries.flatMap(([field, value]) => {
      const normalizedField =
        field === "non_field_errors" || field === "detail" || field === "message" ? "" : field;
      const nextPrefix = normalizedField ? [...prefix, normalizedField] : prefix;
      return collectValidationMessages(value, nextPrefix);
    });
  }

  return [];
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const messages = collectValidationMessages(error.response?.data)
      .map((message) => message.trim())
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.join("\n");
    }
    return error.message;
  }
  return "Unexpected error";
}
