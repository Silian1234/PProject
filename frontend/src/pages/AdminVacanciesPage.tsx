import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import {
  createInterview,
  createReview,
  createVacancy,
  getVacancies,
  getVacancyApplications,
  getVacancyByLang,
  updateApplicationStatus,
  updateVacancy
} from "../api/services";
import { getToken } from "../auth";
import type {
  ApplicationStatus,
  Vacancy,
  VacancyApplication,
  VacancyWritePayload
} from "../types/api";
import { previewText, withCurrentLanguage } from "../utils/display";

type Mode = "create" | "edit";
type Lang = "en" | "de" | "ru";

type Translation = {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  location: string;
};

type VacancyForm = {
  department_name: string;
  employment_type: "internship" | "part_time";
  workload_hours: string;
  salary_from: string;
  salary_to: string;
  status: "draft" | "active" | "archived";
  application_deadline: string;
  en: Translation;
  de: Translation;
  ru: Translation;
};

type ApplicationDraft = {
  status: ApplicationStatus;
  employer_comment: string;
};

type InterviewDraft = {
  scheduled_at: string;
  notes: string;
};

type ReviewDraft = {
  rating: string;
  comment: string;
};

const languages = ["en", "de", "ru"] as const;

const emptyTranslation = (): Translation => ({
  title: "",
  description: "",
  responsibilities: "",
  requirements: "",
  location: ""
});

const hiddenTranslations = (): Record<Lang, boolean> => ({
  en: false,
  de: false,
  ru: false
});

const defaultForm = (): VacancyForm => ({
  department_name: "",
  employment_type: "internship",
  workload_hours: "",
  salary_from: "",
  salary_to: "",
  status: "draft",
  application_deadline: "",
  en: emptyTranslation(),
  de: emptyTranslation(),
  ru: emptyTranslation()
});

const normalizeLang = (lang: string): Lang => {
  const short = lang.slice(0, 2).toLowerCase();
  return languages.includes(short as Lang) ? (short as Lang) : "en";
};

const isCompleteTranslation = (tr: Translation) =>
  Boolean(
    tr.title.trim() &&
      tr.description.trim() &&
      tr.responsibilities.trim() &&
      tr.requirements.trim() &&
      tr.location.trim()
  );

function applicationStatusClass(status: string) {
  if (status === "submitted") return "pp-pill pp-pill-blue";
  if (status === "under_review") return "pp-pill pp-pill-orange";
  if (status === "interview") return "pp-pill pp-pill-violet";
  if (status === "accepted") return "pp-pill pp-pill-green";
  return "pp-pill";
}

export default function AdminVacanciesPage() {
  const { t, i18n } = useTranslation();
  const token = getToken();
  const baseLanguage = useMemo(() => normalizeLang(i18n.language), [i18n.language]);
  const optionalLanguages = useMemo(
    () => languages.filter((lang) => lang !== baseLanguage),
    [baseLanguage]
  );

  const [mode, setMode] = useState<Mode>("create");
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(null);
  const [applications, setApplications] = useState<VacancyApplication[]>([]);
  const [applicationDrafts, setApplicationDrafts] = useState<Record<number, ApplicationDraft>>({});
  const [interviewDrafts, setInterviewDrafts] = useState<Record<number, InterviewDraft>>({});
  const [reviewDrafts, setReviewDrafts] = useState<Record<number, ReviewDraft>>({});
  const [expandedApplicationId, setExpandedApplicationId] = useState<number | null>(null);
  const [form, setForm] = useState<VacancyForm>(defaultForm());
  const [visibleTranslations, setVisibleTranslations] = useState<Record<Lang, boolean>>(
    hiddenTranslations()
  );
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] = useState<number | null>(null);
  const [schedulingApplicationId, setSchedulingApplicationId] = useState<number | null>(null);
  const [reviewingApplicationId, setReviewingApplicationId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const selectedVacancy = useMemo(
    () => vacancies.find((v) => v.id === selectedVacancyId) || null,
    [vacancies, selectedVacancyId]
  );

  const loadVacancies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getVacancies({ mine: true });
      setVacancies(data);
      setSelectedVacancyId((prev) => prev ?? data[0]?.id ?? null);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadApplications = useCallback(async (vacancyId: number) => {
    setApplicationsLoading(true);
    setError("");
    setExpandedApplicationId(null);
    try {
      const data = await getVacancyApplications(vacancyId);
      setApplications(data);
      setApplicationDrafts(
        Object.fromEntries(
          data.map((item) => [
            item.id,
            {
              status: item.status,
              employer_comment: item.employer_comment || ""
            }
          ])
        )
      );
      setInterviewDrafts(
        Object.fromEntries(data.map((item) => [item.id, { scheduled_at: "", notes: "" }]))
      );
      setReviewDrafts(
        Object.fromEntries(data.map((item) => [item.id, { rating: "5", comment: "" }]))
      );
    } catch (e) {
      setError(getErrorMessage(e));
      setApplications([]);
      setApplicationDrafts({});
      setInterviewDrafts({});
      setReviewDrafts({});
    } finally {
      setApplicationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVacancies();
  }, [loadVacancies]);

  useEffect(() => {
    if (selectedVacancyId) {
      void loadApplications(selectedVacancyId);
    }
  }, [loadApplications, selectedVacancyId]);

  const syncFormFromVacancy = async (vacancy: Vacancy) => {
    setError("");
    try {
      const [en, de, ru] = await Promise.all([
        getVacancyByLang(vacancy.id, "en"),
        getVacancyByLang(vacancy.id, "de"),
        getVacancyByLang(vacancy.id, "ru")
      ]);
      setVisibleTranslations(hiddenTranslations());
      setForm({
        department_name: vacancy.department_name || String(vacancy.department),
        employment_type: vacancy.employment_type as "internship" | "part_time",
        workload_hours: vacancy.workload_hours ? String(vacancy.workload_hours) : "",
        salary_from: vacancy.salary_from || "",
        salary_to: vacancy.salary_to || "",
        status: vacancy.status as "draft" | "active" | "archived",
        application_deadline: vacancy.application_deadline || "",
        en: {
          title: en.title,
          description: en.description,
          responsibilities: en.responsibilities,
          requirements: en.requirements,
          location: en.location || vacancy.location || ""
        },
        de: {
          title: de.title,
          description: de.description,
          responsibilities: de.responsibilities,
          requirements: de.requirements,
          location: de.location || vacancy.location || ""
        },
        ru: {
          title: ru.title,
          description: ru.description,
          responsibilities: ru.responsibilities,
          requirements: ru.requirements,
          location: ru.location || vacancy.location || ""
        }
      });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const toPayload = (): VacancyWritePayload => {
    const translations: VacancyWritePayload["translations"] = {
      [baseLanguage]: form[baseLanguage]
    };

    optionalLanguages.forEach((lang) => {
      if (visibleTranslations[lang] && isCompleteTranslation(form[lang])) {
        translations[lang] = form[lang];
      }
    });

    return {
      department_name: form.department_name.trim(),
      employment_type: form.employment_type,
      location: form[baseLanguage].location,
      workload_hours: form.workload_hours ? Number(form.workload_hours) : null,
      salary_from: form.salary_from || null,
      salary_to: form.salary_to || null,
      status: form.status,
      application_deadline: form.application_deadline || null,
      translations
    };
  };

  const resetEditor = () => {
    setMode("create");
    setForm(defaultForm());
    setVisibleTranslations(hiddenTranslations());
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.department_name.trim()) {
      setError(t("admin.departmentRequired"));
      return;
    }

    setSaving(true);
    setMsg("");
    setError("");
    try {
      const payload = toPayload();
      if (mode === "create") {
        await createVacancy(payload);
        setMsg(t("admin.vacancyCreated"));
        resetEditor();
      } else if (selectedVacancyId) {
        await updateVacancy(selectedVacancyId, payload);
        setMsg(t("admin.vacancyUpdated"));
      }
      await loadVacancies();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onUpdateApplication = async (applicationId: number) => {
    const draft = applicationDrafts[applicationId];
    if (!draft) {
      return;
    }

    setUpdatingApplicationId(applicationId);
    setMsg("");
    setError("");
    try {
      await updateApplicationStatus(applicationId, draft.status, draft.employer_comment);
      setMsg(t("admin.applicationUpdated"));
      if (selectedVacancyId) {
        await loadApplications(selectedVacancyId);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const onScheduleInterview = async (applicationId: number) => {
    const draft = interviewDrafts[applicationId];
    if (!draft?.scheduled_at) {
      setError(t("admin.interviewDateRequired", "Interview date is required."));
      return;
    }

    setSchedulingApplicationId(applicationId);
    setMsg("");
    setError("");
    try {
      const response = await createInterview({
        application_id: applicationId,
        scheduled_at: draft.scheduled_at,
        status: "planned",
        notes: draft.notes
      });
      setMsg(response.message);
      setInterviewDrafts((prev) => ({
        ...prev,
        [applicationId]: { scheduled_at: "", notes: "" }
      }));
      if (selectedVacancyId) {
        await loadApplications(selectedVacancyId);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSchedulingApplicationId(null);
    }
  };

  const onCreateEmployerReview = async (applicationId: number) => {
    const draft = reviewDrafts[applicationId];
    if (!draft) return;

    setReviewingApplicationId(applicationId);
    setMsg("");
    setError("");
    try {
      const response = await createReview({
        application: applicationId,
        review_type: "employer_to_student",
        rating: Number(draft.rating),
        comment: draft.comment
      });
      setMsg(response.message);
      setReviewDrafts((prev) => ({
        ...prev,
        [applicationId]: { rating: "5", comment: "" }
      }));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setReviewingApplicationId(null);
    }
  };

  const renderTranslationFields = (lang: Lang, required: boolean) => (
    <fieldset key={lang} className="pp-translation-box">
      <legend>
        {lang.toUpperCase()} {required ? t("admin.baseLanguage") : t("admin.optionalLanguage")}
      </legend>
      <label className="pp-label">
        {t("admin.titleField")} ({lang.toUpperCase()})
        <input
          className="pp-input"
          value={form[lang].title}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              [lang]: { ...prev[lang], title: e.target.value }
            }))
          }
          required={required || visibleTranslations[lang]}
        />
      </label>
      <label className="pp-label">
        {t("admin.descriptionField")} ({lang.toUpperCase()})
        <textarea
          className="pp-textarea pp-textarea-sm"
          value={form[lang].description}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              [lang]: { ...prev[lang], description: e.target.value }
            }))
          }
          required={required || visibleTranslations[lang]}
        />
      </label>
      <label className="pp-label">
        {t("admin.responsibilitiesField")} ({lang.toUpperCase()})
        <textarea
          className="pp-textarea pp-textarea-sm"
          value={form[lang].responsibilities}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              [lang]: { ...prev[lang], responsibilities: e.target.value }
            }))
          }
          required={required || visibleTranslations[lang]}
        />
      </label>
      <label className="pp-label">
        {t("admin.requirementsField")} ({lang.toUpperCase()})
        <textarea
          className="pp-textarea pp-textarea-sm"
          value={form[lang].requirements}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              [lang]: { ...prev[lang], requirements: e.target.value }
            }))
          }
          required={required || visibleTranslations[lang]}
        />
      </label>
      <label className="pp-label">
        {t("admin.location")} ({lang.toUpperCase()})
        <input
          className="pp-input"
          value={form[lang].location}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              [lang]: { ...prev[lang], location: e.target.value }
            }))
          }
          required={required || visibleTranslations[lang]}
        />
      </label>
    </fieldset>
  );

  if (!token) {
    return (
      <p>
        {t("common.loginRequired")} <Link to={withCurrentLanguage("/login")}>{t("nav.login")}</Link>
      </p>
    );
  }

  return (
    <div className="pp-page">
      <h1 className="pp-title">{t("admin.title")}</h1>
      {msg && <p className="pp-success">{msg}</p>}
      {error && <p className="pp-error">{error}</p>}

      <section className="pp-employer-grid">
        <aside className="pp-card">
          <h2>{t("admin.selectVacancy")}</h2>
          {loading && <p>{t("common.loading")}</p>}
          {!loading && vacancies.length === 0 && <p>{t("common.notFound")}</p>}
          {!loading &&
            vacancies.map((vacancy) => (
              <div key={vacancy.id} className="pp-application-item">
                <h3>{vacancy.title}</h3>
                <p className="pp-subtitle">{vacancy.department_name || vacancy.department}</p>
                <div className="pp-row">
                  <button
                    type="button"
                    className={
                      selectedVacancyId === vacancy.id
                        ? "pp-btn-primary pp-btn-sm"
                        : "pp-btn-outline pp-btn-sm"
                    }
                    onClick={() => setSelectedVacancyId(vacancy.id)}
                  >
                    {t("admin.showApplications")}
                  </button>
                  <button
                    type="button"
                    className="pp-btn-link"
                    onClick={() => {
                      setMode("edit");
                      setSelectedVacancyId(vacancy.id);
                      void syncFormFromVacancy(vacancy);
                    }}
                  >
                    {t("admin.loadToEditor")}
                  </button>
                </div>
              </div>
            ))}
        </aside>

        <article className="pp-card">
          <h2>{t("admin.applicationsByVacancy")}</h2>
          {selectedVacancy && (
            <p className="pp-subtitle">
              {t("admin.selectedVacancy")}: {selectedVacancy.title}
            </p>
          )}
          {applicationsLoading && <p>{t("common.loading")}</p>}
          {!applicationsLoading && selectedVacancyId && applications.length === 0 && (
            <p>{t("admin.noApplications")}</p>
          )}
          {!applicationsLoading && applications.length > 0 && (
            <div className="pp-applications-list">
              {applications.map((application) => {
                const draft = applicationDrafts[application.id] || {
                  status: application.status,
                  employer_comment: application.employer_comment || ""
                };
                const isExpanded = expandedApplicationId === application.id;

                return (
                  <div key={application.id} className="pp-application-item pp-application-compact">
                    <div className="pp-application-summary">
                      <div>
                        <h3>{application.student_name || t("common.notSpecified")}</h3>
                        <p className="pp-subtitle">
                          {application.student_email || t("common.notSpecified")}
                        </p>
                      </div>
                      <span className={applicationStatusClass(draft.status)}>
                        {t(`status.${draft.status}`, draft.status)}
                      </span>
                    </div>

                    <div className="pp-application-meta">
                      <span>
                        {t("admin.resume")}:{" "}
                        {application.resume_title || t("admin.noResume")}
                      </span>
                      <span>
                        {t("admin.studentMessage")}:{" "}
                        {application.student_message
                          ? previewText(application.student_message, 70)
                          : t("common.notSpecified")}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="pp-btn-outline pp-btn-sm"
                      onClick={() => setExpandedApplicationId(isExpanded ? null : application.id)}
                    >
                      {isExpanded ? t("admin.hideApplication") : t("admin.openApplication")}
                    </button>

                    {isExpanded && (
                      <div className="pp-application-details">
                        <p>
                          {t("admin.resume")}:{" "}
                          {application.resume_file ? (
                            <a href={application.resume_file} target="_blank" rel="noreferrer">
                              {application.resume_title || t("admin.openResume")}
                            </a>
                          ) : (
                            t("admin.noResume")
                          )}
                        </p>

                        {application.student_message && (
                          <div className="pp-note">
                            <strong>{t("admin.studentMessage")}</strong>
                            <br />
                            {application.student_message}
                          </div>
                        )}
                        {application.cover_letter_text && (
                          <div className="pp-note">
                            <strong>{t("admin.coverLetter")}</strong>
                            <br />
                            {application.cover_letter_text}
                          </div>
                        )}

                        <div className="pp-row">
                          <label className="pp-label">
                            {t("admin.status")}
                            <select
                              className="pp-select pp-select-sm"
                              value={draft.status}
                              onChange={(e) =>
                                setApplicationDrafts((prev) => ({
                                  ...prev,
                                  [application.id]: {
                                    ...draft,
                                    status: e.target.value as ApplicationStatus
                                  }
                                }))
                              }
                            >
                              <option value="submitted">{t("status.submitted")}</option>
                              <option value="under_review">{t("status.under_review")}</option>
                              <option value="interview">{t("status.interview")}</option>
                              <option value="accepted">{t("status.accepted")}</option>
                              <option value="rejected">{t("status.rejected")}</option>
                            </select>
                          </label>
                          <label className="pp-label pp-grow">
                            {t("admin.employerComment")}
                            <textarea
                              className="pp-textarea pp-textarea-sm"
                              value={draft.employer_comment}
                              placeholder={t("admin.commentPlaceholder")}
                              onChange={(e) =>
                                setApplicationDrafts((prev) => ({
                                  ...prev,
                                  [application.id]: {
                                    ...draft,
                                    employer_comment: e.target.value
                                  }
                                }))
                              }
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          className="pp-btn-primary pp-btn-sm"
                          disabled={updatingApplicationId === application.id}
                          onClick={() => void onUpdateApplication(application.id)}
                        >
                          {updatingApplicationId === application.id
                            ? t("admin.saving")
                            : t("admin.saveApplication")}
                        </button>

                        <div className="pp-admin-action-box">
                          <h4>{t("admin.scheduleInterview", "Schedule interview")}</h4>
                          <div className="pp-form-grid pp-inline-form">
                            <label className="pp-label">
                              {t("admin.interviewDate", "Date and time")}
                              <input
                                className="pp-input"
                                type="datetime-local"
                                value={interviewDrafts[application.id]?.scheduled_at || ""}
                                onChange={(e) =>
                                  setInterviewDrafts((prev) => ({
                                    ...prev,
                                    [application.id]: {
                                      ...(prev[application.id] || { scheduled_at: "", notes: "" }),
                                      scheduled_at: e.target.value
                                    }
                                  }))
                                }
                              />
                            </label>
                            <label className="pp-label pp-grow">
                              {t("admin.interviewNotes", "Notes")}
                              <input
                                className="pp-input"
                                value={interviewDrafts[application.id]?.notes || ""}
                                onChange={(e) =>
                                  setInterviewDrafts((prev) => ({
                                    ...prev,
                                    [application.id]: {
                                      ...(prev[application.id] || { scheduled_at: "", notes: "" }),
                                      notes: e.target.value
                                    }
                                  }))
                                }
                              />
                            </label>
                            <button
                              type="button"
                              className="pp-btn-outline pp-btn-sm"
                              disabled={schedulingApplicationId === application.id}
                              onClick={() => void onScheduleInterview(application.id)}
                            >
                              {schedulingApplicationId === application.id
                                ? t("admin.saving")
                                : t("admin.scheduleInterview", "Schedule interview")}
                            </button>
                          </div>
                        </div>

                        <div className="pp-admin-action-box">
                          <h4>{t("admin.employerReview", "Employer review")}</h4>
                          <div className="pp-form-grid pp-inline-form">
                            <label className="pp-label">
                              {t("admin.rating", "Rating")}
                              <select
                                className="pp-select"
                                value={reviewDrafts[application.id]?.rating || "5"}
                                onChange={(e) =>
                                  setReviewDrafts((prev) => ({
                                    ...prev,
                                    [application.id]: {
                                      ...(prev[application.id] || { rating: "5", comment: "" }),
                                      rating: e.target.value
                                    }
                                  }))
                                }
                              >
                                {[5, 4, 3, 2, 1].map((value) => (
                                  <option key={value} value={value}>
                                    {value}/5
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="pp-label pp-grow">
                              {t("admin.reviewComment", "Review comment")}
                              <input
                                className="pp-input"
                                value={reviewDrafts[application.id]?.comment || ""}
                                onChange={(e) =>
                                  setReviewDrafts((prev) => ({
                                    ...prev,
                                    [application.id]: {
                                      ...(prev[application.id] || { rating: "5", comment: "" }),
                                      comment: e.target.value
                                    }
                                  }))
                                }
                              />
                            </label>
                            <button
                              type="button"
                              className="pp-btn-outline pp-btn-sm"
                              disabled={reviewingApplicationId === application.id}
                              onClick={() => void onCreateEmployerReview(application.id)}
                            >
                              {reviewingApplicationId === application.id
                                ? t("admin.saving")
                                : t("admin.saveReview", "Save review")}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="pp-card">
        <h2>{mode === "create" ? t("admin.createModeTitle") : t("admin.editModeTitle")}</h2>
        {mode === "edit" && selectedVacancy && (
          <p className="pp-subtitle">{t("admin.editing")}: {selectedVacancy.title}</p>
        )}

        <form onSubmit={onSubmit} className="pp-form-grid">
          <label className="pp-label">
            {t("admin.departmentName")}
            <input
              className="pp-input"
              value={form.department_name}
              placeholder={t("admin.departmentPlaceholder")}
              onChange={(e) => setForm((prev) => ({ ...prev, department_name: e.target.value }))}
              required
            />
          </label>

          <label className="pp-label">
            {t("admin.type")}
            <select
              className="pp-select"
              value={form.employment_type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  employment_type: e.target.value as "internship" | "part_time"
                }))
              }
            >
              <option value="internship">{t("vacancies.internship")}</option>
              <option value="part_time">{t("vacancies.partTime")}</option>
            </select>
          </label>

          <label className="pp-label">
            {t("admin.status")}
            <select
              className="pp-select"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as "draft" | "active" | "archived"
                }))
              }
            >
              <option value="draft">{t("status.draft")}</option>
              <option value="active">{t("status.active")}</option>
              <option value="archived">{t("status.archived")}</option>
            </select>
          </label>

          <label className="pp-label">
            {t("admin.workloadHours")}
            <input
              className="pp-input"
              type="number"
              min={0}
              step={1}
              value={form.workload_hours}
              onChange={(e) => setForm((prev) => ({ ...prev, workload_hours: e.target.value }))}
            />
          </label>

          <label className="pp-label">
            {t("admin.salaryFrom")}
            <input
              className="pp-input"
              type="number"
              min={0}
              step="0.01"
              value={form.salary_from}
              onChange={(e) => setForm((prev) => ({ ...prev, salary_from: e.target.value }))}
            />
          </label>

          <label className="pp-label">
            {t("admin.salaryTo")}
            <input
              className="pp-input"
              type="number"
              min={0}
              step="0.01"
              value={form.salary_to}
              onChange={(e) => setForm((prev) => ({ ...prev, salary_to: e.target.value }))}
            />
          </label>

          <label className="pp-label">
            {t("admin.applicationDeadline")}
            <input
              className="pp-input"
              type="date"
              value={form.application_deadline}
              onChange={(e) => setForm((prev) => ({ ...prev, application_deadline: e.target.value }))}
            />
          </label>

          {renderTranslationFields(baseLanguage, true)}

          <div className="pp-row">
            {optionalLanguages.map((lang) =>
              visibleTranslations[lang] ? null : (
                <button
                  key={lang}
                  type="button"
                  className="pp-btn-outline pp-btn-sm"
                  onClick={() =>
                    setVisibleTranslations((prev) => ({
                      ...prev,
                      [lang]: true
                    }))
                  }
                >
                  {t("admin.addTranslation", { lang: lang.toUpperCase() })}
                </button>
              )
            )}
          </div>

          {optionalLanguages
            .filter((lang) => visibleTranslations[lang])
            .map((lang) => renderTranslationFields(lang, false))}

          <div className="pp-row">
            <button type="submit" className="pp-btn-primary" disabled={saving}>
              {saving
                ? t("admin.saving")
                : mode === "create"
                  ? t("admin.createVacancy")
                  : t("admin.saveChanges")}
            </button>
            {mode === "edit" && (
              <button type="button" className="pp-btn-outline" onClick={resetEditor}>
                {t("common.cancel")}
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
