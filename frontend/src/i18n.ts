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
        admin: "Employer Panel",
        login: "Login",
        register: "Register",
        logout: "Logout",
        profile: "Profile"
      },
      common: {
        loading: "Loading...",
        notFound: "Not found",
        loginRequired: "Login required:",
        unexpectedError: "Unexpected error",
        cancel: "Cancel",
        open: "Open",
        status: "Status",
        type: "Type",
        department: "Department",
        role: "Role",
        location: "Location"
      },
      status: {
        submitted: "submitted",
        under_review: "under_review",
        interview: "interview",
        accepted: "accepted",
        rejected: "rejected",
        active: "active",
        draft: "draft",
        archived: "archived"
      },
      home: {
        pageTitle: "Home",
        heroTitle: "Find campus jobs and internships faster",
        heroSubtitle: "One platform for students, departments, and partner employers.",
        browseVacancies: "Browse vacancies",
        forEmployers: "For employers",
        quickStats: "Quick Stats",
        activeVacancies: "124 active vacancies",
        studentApplications: "842 student applications",
        localization: "EN | DE | RU localization",
        apiDocs: "API docs: /api/docs/",
        featuredOpportunities: "Featured campus opportunities",
        searchPlaceholder: "Search by role, department, or keyword",
        featuredInternship: "Featured Internship",
        paid: "Paid",
        activeVacanciesSmall: "Active vacancies",
        newUpdates: "New updates",
        new: "new"
      },
      vacancies: {
        title: "Vacancies List",
        searchPlaceholder: "Search by keyword, company, role...",
        department: "Department",
        allDepartments: "All departments",
        type: "Type",
        allTypes: "All types",
        campus: "Campus",
        partTime: "Part-time",
        internship: "Internship",
        open: "Open"
      },
      vacancyDetails: {
        title: "Vacancy Details",
        invalidId: "Invalid vacancy id",
        vacancyNotFound: "Vacancy not found.",
        department: "Department",
        responsibilities: "Responsibilities",
        requirements: "Requirements",
        apply: "Apply",
        localizationPreview: "Localization Preview",
        selectorAffects: "Language selector affects:",
        uiLabels: "UI labels",
        apiMessages: "API messages",
        vacancyContent: "Vacancy content"
      },
      apply: {
        title: "Apply Form",
        submitTitle: "Submit your application",
        resume: "Resume",
        coverLetter: "Cover letter",
        messageForEmployer: "Message for employer",
        coverLetterPlaceholder: "Write why you fit this role...",
        employerMessagePlaceholder: "Additional details...",
        sendApplication: "Send Application",
        sending: "Sending...",
        invalidId: "Invalid vacancy id."
      },
      dashboard: {
        title: "Profile",
        defaultStudent: "Student",
        email: "Email",
        role: "Role",
        preferredLanguage: "Preferred language",
        quickActions: "Quick Actions",
        browseVacancies: "Browse vacancies",
        viewMyApplications: "View my applications",
        openEmployerPanel: "Open employer panel"
      },
      myApplications: {
        title: "Student Dashboard / My Applications",
        profile: "Profile",
        name: "Name",
        program: "Program",
        programValue: "Computer Science",
        year: "Year",
        yearValue: "3",
        resume: "Resume",
        resumeValue: "alex_cv.pdf",
        noApplications: "No applications yet.",
        myApplications: "My Applications",
        status: "Status"
      },
      auth: {
        loginTitle: "Login",
        loginSubtitle: "Sign in to apply for vacancies and track application statuses.",
        username: "Username",
        roleStudent: "Student",
        roleEmployer: "Employer",
        usernamePlaceholder: "Enter your username",
        password: "Password",
        passwordPlaceholder: "Enter your password",
        signingIn: "Signing in...",
        loginButton: "Login",
        createAccount: "Create account",
        registerTitle: "Register",
        registerSubtitle:
          "Create your account to apply for vacancies or manage candidate applications.",
        studentHint: "Student registration requires University ID.",
        employerHint: "Employer registration requires organization name.",
        preferredLanguage: "Preferred language",
        firstName: "First name",
        lastName: "Last name",
        universityId: "University ID",
        universityIdPlaceholder: "e.g. STU-2026-001",
        organizationName: "Organization name",
        organizationNamePlaceholder: "Department or company name",
        confirmPassword: "Confirm password",
        passwordsMismatch: "Passwords do not match.",
        creating: "Creating...",
        backToLogin: "Back to login",
        loggingOut: "..."
      },
      admin: {
        title: "Employer Vacancy Management",
        actions: "Actions",
        createVacancy: "Create Vacancy",
        editVacancy: "Edit Vacancy",
        applicationsByVacancy: "Applications by Vacancy",
        applicationsCount: "{{count}} applications",
        setStatus: "Set",
        loadToEditor: "Load to editor",
        createModeTitle: "Create vacancy",
        editModeTitle: "Edit vacancy",
        editing: "Editing",
        departmentId: "Department ID",
        type: "Type",
        location: "Location",
        workloadHours: "Workload (hours/week)",
        salaryFrom: "Salary from",
        salaryTo: "Salary to",
        applicationDeadline: "Application deadline",
        status: "Status",
        titleField: "Title",
        descriptionField: "Description",
        responsibilitiesField: "Responsibilities",
        requirementsField: "Requirements",
        saveChanges: "Save changes",
        saving: "Saving...",
        vacancyCreated: "Vacancy created",
        vacancyUpdated: "Vacancy updated",
        updatedApplications: "Updated {{count}} applications"
      },
      pages: {
        notFound: "Page not found"
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
        admin: "Arbeitgeber-Panel",
        login: "Anmelden",
        register: "Registrieren",
        logout: "Abmelden",
        profile: "Profil"
      },
      common: {
        loading: "Laden...",
        notFound: "Nicht gefunden",
        loginRequired: "Anmeldung erforderlich:",
        unexpectedError: "Unerwarteter Fehler",
        cancel: "Abbrechen",
        open: "Öffnen",
        status: "Status",
        type: "Typ",
        department: "Abteilung",
        role: "Rolle",
        location: "Standort"
      },
      status: {
        submitted: "eingereicht",
        under_review: "in Prüfung",
        interview: "Interview",
        accepted: "angenommen",
        rejected: "abgelehnt",
        active: "aktiv",
        draft: "entwurf",
        archived: "archiviert"
      },
      home: {
        pageTitle: "Startseite",
        heroTitle: "Finde Campus-Jobs und Praktika schneller",
        heroSubtitle:
          "Eine Plattform für Studierende, Fachbereiche und Partner-Arbeitgeber.",
        browseVacancies: "Stellen ansehen",
        forEmployers: "Für Arbeitgeber",
        quickStats: "Schnelle Statistik",
        activeVacancies: "124 aktive Stellen",
        studentApplications: "842 studentische Bewerbungen",
        localization: "EN | DE | RU Lokalisierung",
        apiDocs: "API-Doku: /api/docs/",
        featuredOpportunities: "Ausgewählte Campus-Möglichkeiten",
        searchPlaceholder: "Suche nach Rolle, Abteilung oder Stichwort",
        featuredInternship: "Empfohlenes Praktikum",
        paid: "Bezahlt",
        activeVacanciesSmall: "Aktive Stellen",
        newUpdates: "Neue Updates",
        new: "neu"
      },
      vacancies: {
        title: "Stellenliste",
        searchPlaceholder: "Suche nach Stichwort, Firma, Rolle...",
        department: "Abteilung",
        allDepartments: "Alle Abteilungen",
        type: "Typ",
        allTypes: "Alle Typen",
        campus: "Campus",
        partTime: "Teilzeit",
        internship: "Praktikum",
        open: "Öffnen"
      },
      vacancyDetails: {
        title: "Stellendetails",
        invalidId: "Ungültige Stellen-ID",
        vacancyNotFound: "Stelle nicht gefunden.",
        department: "Abteilung",
        responsibilities: "Aufgaben",
        requirements: "Anforderungen",
        apply: "Bewerben",
        localizationPreview: "Lokalisierungsvorschau",
        selectorAffects: "Sprachauswahl beeinflusst:",
        uiLabels: "UI-Bezeichnungen",
        apiMessages: "API-Nachrichten",
        vacancyContent: "Stelleninhalt"
      },
      apply: {
        title: "Bewerbungsformular",
        submitTitle: "Sende deine Bewerbung",
        resume: "Lebenslauf",
        coverLetter: "Anschreiben",
        messageForEmployer: "Nachricht an Arbeitgeber",
        coverLetterPlaceholder: "Warum passt du zu dieser Stelle?",
        employerMessagePlaceholder: "Zusätzliche Details...",
        sendApplication: "Bewerbung senden",
        sending: "Wird gesendet...",
        invalidId: "Ungültige Stellen-ID."
      },
      dashboard: {
        title: "Profil",
        defaultStudent: "Studierende/r",
        email: "E-Mail",
        role: "Rolle",
        preferredLanguage: "Bevorzugte Sprache",
        quickActions: "Schnellaktionen",
        browseVacancies: "Stellen ansehen",
        viewMyApplications: "Meine Bewerbungen",
        openEmployerPanel: "Arbeitgeber-Panel öffnen"
      },
      myApplications: {
        title: "Studenten-Dashboard / Meine Bewerbungen",
        profile: "Profil",
        name: "Name",
        program: "Studiengang",
        programValue: "Informatik",
        year: "Jahr",
        yearValue: "3",
        resume: "Lebenslauf",
        resumeValue: "alex_cv.pdf",
        noApplications: "Noch keine Bewerbungen.",
        myApplications: "Meine Bewerbungen",
        status: "Status"
      },
      auth: {
        loginTitle: "Anmelden",
        loginSubtitle:
          "Melde dich an, um dich auf Stellen zu bewerben und Status zu verfolgen.",
        username: "Benutzername",
        roleStudent: "Studierende/r",
        roleEmployer: "Arbeitgeber",
        usernamePlaceholder: "Benutzername eingeben",
        password: "Passwort",
        passwordPlaceholder: "Passwort eingeben",
        signingIn: "Anmeldung...",
        loginButton: "Anmelden",
        createAccount: "Konto erstellen",
        registerTitle: "Registrierung",
        registerSubtitle:
          "Erstelle ein Konto, um dich zu bewerben oder Bewerbungen zu verwalten.",
        studentHint: "Für Studierende ist eine University-ID erforderlich.",
        employerHint: "Für Arbeitgeber ist ein Organisationsname erforderlich.",
        preferredLanguage: "Bevorzugte Sprache",
        firstName: "Vorname",
        lastName: "Nachname",
        universityId: "University-ID",
        universityIdPlaceholder: "z. B. STU-2026-001",
        organizationName: "Organisationsname",
        organizationNamePlaceholder: "Abteilung oder Firmenname",
        confirmPassword: "Passwort bestätigen",
        passwordsMismatch: "Passwörter stimmen nicht überein.",
        creating: "Wird erstellt...",
        backToLogin: "Zur Anmeldung",
        loggingOut: "..."
      },
      admin: {
        title: "Arbeitgeber Stellenverwaltung",
        actions: "Aktionen",
        createVacancy: "Stelle erstellen",
        editVacancy: "Stelle bearbeiten",
        applicationsByVacancy: "Bewerbungen nach Stelle",
        applicationsCount: "{{count}} Bewerbungen",
        setStatus: "Setzen",
        loadToEditor: "In Editor laden",
        createModeTitle: "Stelle erstellen",
        editModeTitle: "Stelle bearbeiten",
        editing: "Bearbeitung",
        departmentId: "Abteilungs-ID",
        type: "Typ",
        location: "Standort",
        workloadHours: "Auslastung (Stunden/Woche)",
        salaryFrom: "Gehalt von",
        salaryTo: "Gehalt bis",
        applicationDeadline: "Bewerbungsfrist",
        status: "Status",
        titleField: "Titel",
        descriptionField: "Beschreibung",
        responsibilitiesField: "Aufgaben",
        requirementsField: "Anforderungen",
        saveChanges: "Änderungen speichern",
        saving: "Speichert...",
        vacancyCreated: "Stelle erstellt",
        vacancyUpdated: "Stelle aktualisiert",
        updatedApplications: "{{count}} Bewerbungen aktualisiert"
      },
      pages: {
        notFound: "Seite nicht gefunden"
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
        admin: "Панель работодателя",
        login: "Вход",
        register: "Регистрация",
        logout: "Выход",
        profile: "Профиль"
      },
      common: {
        loading: "Загрузка...",
        notFound: "Не найдено",
        loginRequired: "Требуется вход:",
        unexpectedError: "Непредвиденная ошибка",
        cancel: "Отмена",
        open: "Открыть",
        status: "Статус",
        type: "Тип",
        department: "Отдел",
        role: "Роль",
        location: "Локация"
      },
      status: {
        submitted: "отправлено",
        under_review: "на рассмотрении",
        interview: "интервью",
        accepted: "принято",
        rejected: "отклонено",
        active: "активна",
        draft: "черновик",
        archived: "в архиве"
      },
      home: {
        pageTitle: "Главная",
        heroTitle: "Находите работу и стажировки в кампусе быстрее",
        heroSubtitle:
          "Единая платформа для студентов, подразделений и партнерских работодателей.",
        browseVacancies: "Смотреть вакансии",
        forEmployers: "Для работодателей",
        quickStats: "Быстрая статистика",
        activeVacancies: "124 активных вакансии",
        studentApplications: "842 студенческих отклика",
        localization: "EN | DE | RU локализация",
        apiDocs: "API-документация: /api/docs/",
        featuredOpportunities: "Рекомендуемые предложения",
        searchPlaceholder: "Поиск по роли, отделу или ключевому слову",
        featuredInternship: "Рекомендуемая стажировка",
        paid: "Оплачиваемая",
        activeVacanciesSmall: "Активные вакансии",
        newUpdates: "Новые обновления",
        new: "новое"
      },
      vacancies: {
        title: "Список вакансий",
        searchPlaceholder: "Поиск по ключевому слову, компании, роли...",
        department: "Отдел",
        allDepartments: "Все отделы",
        type: "Тип",
        allTypes: "Все типы",
        campus: "Кампус",
        partTime: "Частичная занятость",
        internship: "Стажировка",
        open: "Открыть"
      },
      vacancyDetails: {
        title: "Детали вакансии",
        invalidId: "Некорректный ID вакансии",
        vacancyNotFound: "Вакансия не найдена.",
        department: "Отдел",
        responsibilities: "Обязанности",
        requirements: "Требования",
        apply: "Откликнуться",
        localizationPreview: "Предпросмотр локализации",
        selectorAffects: "Выбор языка влияет на:",
        uiLabels: "Тексты интерфейса",
        apiMessages: "Сообщения API",
        vacancyContent: "Контент вакансии"
      },
      apply: {
        title: "Форма отклика",
        submitTitle: "Отправьте заявку",
        resume: "Резюме",
        coverLetter: "Сопроводительное письмо",
        messageForEmployer: "Сообщение работодателю",
        coverLetterPlaceholder: "Почему вы подходите на эту роль...",
        employerMessagePlaceholder: "Дополнительные детали...",
        sendApplication: "Отправить отклик",
        sending: "Отправка...",
        invalidId: "Некорректный ID вакансии."
      },
      dashboard: {
        title: "Профиль",
        defaultStudent: "Студент",
        email: "Email",
        role: "Роль",
        preferredLanguage: "Предпочитаемый язык",
        quickActions: "Быстрые действия",
        browseVacancies: "Смотреть вакансии",
        viewMyApplications: "Мои заявки",
        openEmployerPanel: "Открыть панель работодателя"
      },
      myApplications: {
        title: "Кабинет студента / Мои заявки",
        profile: "Профиль",
        name: "Имя",
        program: "Программа",
        programValue: "Компьютерные науки",
        year: "Курс",
        yearValue: "3",
        resume: "Резюме",
        resumeValue: "alex_cv.pdf",
        noApplications: "Пока нет заявок.",
        myApplications: "Мои заявки",
        status: "Статус"
      },
      auth: {
        loginTitle: "Вход",
        loginSubtitle:
          "Войдите, чтобы откликаться на вакансии и отслеживать статусы заявок.",
        username: "Логин",
        roleStudent: "Студент",
        roleEmployer: "Работодатель",
        usernamePlaceholder: "Введите логин",
        password: "Пароль",
        passwordPlaceholder: "Введите пароль",
        signingIn: "Вход...",
        loginButton: "Войти",
        createAccount: "Создать аккаунт",
        registerTitle: "Регистрация",
        registerSubtitle:
          "Создайте аккаунт, чтобы откликаться на вакансии или управлять откликами.",
        studentHint: "Для студента требуется University ID.",
        employerHint: "Для работодателя требуется название организации.",
        preferredLanguage: "Предпочитаемый язык",
        firstName: "Имя",
        lastName: "Фамилия",
        universityId: "University ID",
        universityIdPlaceholder: "например, STU-2026-001",
        organizationName: "Название организации",
        organizationNamePlaceholder: "Название отдела или компании",
        confirmPassword: "Подтвердите пароль",
        passwordsMismatch: "Пароли не совпадают.",
        creating: "Создание...",
        backToLogin: "Назад ко входу",
        loggingOut: "..."
      },
      admin: {
        title: "Управление вакансиями работодателя",
        actions: "Действия",
        createVacancy: "Создать вакансию",
        editVacancy: "Редактировать вакансию",
        applicationsByVacancy: "Отклики по вакансиям",
        applicationsCount: "{{count}} откликов",
        setStatus: "Установить",
        loadToEditor: "Загрузить в редактор",
        createModeTitle: "Создать вакансию",
        editModeTitle: "Редактировать вакансию",
        editing: "Редактирование",
        departmentId: "ID отдела",
        type: "Тип",
        location: "Локация",
        workloadHours: "\u0417\u0430\u043d\u044f\u0442\u043e\u0441\u0442\u044c (\u0447\u0430\u0441\u043e\u0432/\u043d\u0435\u0434\u0435\u043b\u044e)",
        salaryFrom: "\u041e\u043f\u043b\u0430\u0442\u0430 \u043e\u0442",
        salaryTo: "\u041e\u043f\u043b\u0430\u0442\u0430 \u0434\u043e",
        applicationDeadline: "\u0414\u0435\u0434\u043b\u0430\u0439\u043d \u043f\u043e\u0434\u0430\u0447\u0438",
        status: "Статус",
        titleField: "Название",
        descriptionField: "Описание",
        responsibilitiesField: "Обязанности",
        requirementsField: "Требования",
        saveChanges: "Сохранить изменения",
        saving: "Сохранение...",
        vacancyCreated: "Вакансия создана",
        vacancyUpdated: "Вакансия обновлена",
        updatedApplications: "Обновлено откликов: {{count}}"
      },
      pages: {
        notFound: "Страница не найдена"
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
