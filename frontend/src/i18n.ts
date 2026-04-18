import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const supported = ["en", "de", "ru"] as const;
type Lang = (typeof supported)[number];

const queryLang = new URLSearchParams(window.location.search).get("lang");
const savedLang = localStorage.getItem("lang");
const browserLang = navigator.language?.slice(0, 2);

const detectLang = (): Lang => {
  const candidate = queryLang || savedLang || browserLang || "en";
  return (supported as readonly string[]).includes(candidate) ? (candidate as Lang) : "en";
};

const resources = {
  en: {
    translation: {
      nav: {
        home: "Home",
        vacancies: "Vacancies",
        dashboard: "Dashboard",
        applications: "My Applications",
        admin: "Admin",
        login: "Login",
        register: "Register"
      },
      pages: {
        home: "Home",
        vacancies: "Vacancies",
        vacancyDetails: "Vacancy Details",
        dashboard: "Student Dashboard",
        applications: "My Applications",
        admin: "Admin Vacancy Management",
        login: "Login",
        register: "Register",
        notFound: "Page not found"
      },
      home: {
        title: "Campus Jobs & Internships",
        subtitle: "Find temporary jobs and internships in your university ecosystem.",
        ctaVacancies: "Browse vacancies",
        ctaLogin: "Login",
        studentTitle: "For students",
        studentText: "Search vacancies, apply with resume and track application statuses.",
        employerTitle: "For employers and administration",
        employerText: "Publish vacancies, review applications and update statuses."
      }
    }
  },
  de: {
    translation: {
      nav: {
        home: "Startseite",
        vacancies: "Stellenangebote",
        dashboard: "Dashboard",
        applications: "Meine Bewerbungen",
        admin: "Admin",
        login: "Anmelden",
        register: "Registrieren"
      },
      pages: {
        home: "Startseite",
        vacancies: "Stellenangebote",
        vacancyDetails: "Stellendetails",
        dashboard: "Studenten-Dashboard",
        applications: "Meine Bewerbungen",
        admin: "Stellenverwaltung",
        login: "Anmelden",
        register: "Registrieren",
        notFound: "Seite nicht gefunden"
      },
      home: {
        title: "Campus Jobs & Praktika",
        subtitle:
          "Finde Nebenjobs und Praktika innerhalb des universitären Umfelds.",
        ctaVacancies: "Stellen ansehen",
        ctaLogin: "Anmelden",
        studentTitle: "Für Studierende",
        studentText:
          "Stellen suchen, sich mit Lebenslauf bewerben und den Status verfolgen.",
        employerTitle: "Für Arbeitgeber und Verwaltung",
        employerText:
          "Stellen veröffentlichen, Bewerbungen prüfen und Status aktualisieren."
      }
    }
  },
  ru: {
    translation: {
      nav: {
        home: "Главная",
        vacancies: "Вакансии",
        dashboard: "Кабинет",
        applications: "Мои заявки",
        admin: "Админ",
        login: "Вход",
        register: "Регистрация"
      },
      pages: {
        home: "Главная",
        vacancies: "Вакансии",
        vacancyDetails: "Детали вакансии",
        dashboard: "Личный кабинет студента",
        applications: "Мои заявки",
        admin: "Управление вакансиями",
        login: "Вход",
        register: "Регистрация",
        notFound: "Страница не найдена"
      },
      home: {
        title: "Вакансии и стажировки кампуса",
        subtitle:
          "Ищи временную работу и стажировки внутри университетской среды.",
        ctaVacancies: "Смотреть вакансии",
        ctaLogin: "Войти",
        studentTitle: "Для студентов",
        studentText:
          "Ищи вакансии, откликайся с резюме и отслеживай статусы заявок.",
        employerTitle: "Для работодателей и администрации",
        employerText:
          "Публикуй вакансии, просматривай отклики и меняй статусы заявок."
      }
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: detectLang(),
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
