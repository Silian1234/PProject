import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import {
  createVacancy,
  getVacancies,
  getVacancyApplications,
  getVacancyByLang,
  updateApplicationStatus,
  updateVacancy
} from "../api/services";
import { getToken } from "../auth";
import type { ApplicationStatus, Vacancy, VacancyWritePayload } from "../types/api";

type Mode = "create" | "edit";

type Translation = {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
};

type VacancyForm = {
  department: string;
  employment_type: "internship" | "part_time";
  location: string;
  workload_hours: string;
  salary_from: string;
  salary_to: string;
  status: "draft" | "active" | "archived";
  application_deadline: string;
  en: Translation;
  de: Translation;
  ru: Translation;
};

const emptyTranslation = (): Translation => ({
  title: "",
  description: "",
  responsibilities: "",
  requirements: ""
});

const defaultForm = (): VacancyForm => ({
  department: "1",
  employment_type: "internship",
  location: "",
  workload_hours: "",
  salary_from: "",
  salary_to: "",
  status: "draft",
  application_deadline: "",
  en: emptyTranslation(),
  de: emptyTranslation(),
  ru: emptyTranslation()
});

export default function AdminVacanciesPage() {
  const { t } = useTranslation();
  const token = getToken();
  const [mode, setMode] = useState<Mode>("create");
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(null);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [quickStatus, setQuickStatus] = useState<Record<number, ApplicationStatus>>({});
  const [form, setForm] = useState<VacancyForm>(defaultForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const loadVacancies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getVacancies();
      setVacancies(data);
      const quick: Record<number, ApplicationStatus> = {};
      data.forEach((v) => {
        quick[v.id] = "under_review";
      });
      setQuickStatus(quick);

      const countEntries = await Promise.all(
        data.map(async (vacancy) => {
          try {
            const apps = await getVacancyApplications(vacancy.id);
            return [vacancy.id, apps.length] as const;
          } catch {
            return [vacancy.id, 0] as const;
          }
        })
      );
      setCounts(Object.fromEntries(countEntries));

      if (data.length > 0 && !selectedVacancyId) {
        setSelectedVacancyId(data[0].id);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [selectedVacancyId]);

  useEffect(() => {
    void loadVacancies();
  }, [loadVacancies]);

  const selectedVacancy = useMemo(
    () => vacancies.find((v) => v.id === selectedVacancyId) || null,
    [vacancies, selectedVacancyId]
  );

  const syncFormFromVacancy = async (vacancy: Vacancy) => {
    setError("");
    try {
      const [en, de, ru] = await Promise.all([
        getVacancyByLang(vacancy.id, "en"),
        getVacancyByLang(vacancy.id, "de"),
        getVacancyByLang(vacancy.id, "ru")
      ]);
      setForm({
        department: String(vacancy.department),
        employment_type: vacancy.employment_type as "internship" | "part_time",
        location: vacancy.location || "",
        workload_hours: vacancy.workload_hours ? String(vacancy.workload_hours) : "",
        salary_from: vacancy.salary_from || "",
        salary_to: vacancy.salary_to || "",
        status: vacancy.status as "draft" | "active" | "archived",
        application_deadline: vacancy.application_deadline || "",
        en: {
          title: en.title,
          description: en.description,
          responsibilities: en.responsibilities,
          requirements: en.requirements
        },
        de: {
          title: de.title,
          description: de.description,
          responsibilities: de.responsibilities,
          requirements: de.requirements
        },
        ru: {
          title: ru.title,
          description: ru.description,
          responsibilities: ru.responsibilities,
          requirements: ru.requirements
        }
      });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const toPayload = (): VacancyWritePayload => ({
    department: Number(form.department),
    employment_type: form.employment_type,
    location: form.location,
    workload_hours: form.workload_hours ? Number(form.workload_hours) : null,
    salary_from: form.salary_from || null,
    salary_to: form.salary_to || null,
    status: form.status,
    application_deadline: form.application_deadline || null,
    translations: {
      en: form.en,
      de: form.de,
      ru: form.ru
    }
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const payload = toPayload();
      if (mode === "create") {
        await createVacancy(payload);
        setMsg(t("admin.vacancyCreated"));
        setForm(defaultForm());
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

  const onQuickSet = async (vacancyId: number) => {
    setError("");
    setMsg("");
    try {
      const targetStatus = quickStatus[vacancyId] || "under_review";
      const apps = await getVacancyApplications(vacancyId);
      await Promise.all(
        apps.map((app) => updateApplicationStatus(app.id, targetStatus))
      );
      setMsg(t("admin.updatedApplications", { count: apps.length }));
      await loadVacancies();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (!token) {
    return (
      <p>
        {t("common.loginRequired")} <Link to="/login">{t("nav.login")}</Link>
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
          <h2>{t("admin.actions")}</h2>
          <div className="pp-column">
            <button type="button" className="pp-btn-primary" onClick={() => setMode("create")}>
              {t("admin.createVacancy")}
            </button>
            <button type="button" className="pp-btn-outline" onClick={() => setMode("edit")}>
              {t("admin.editVacancy")}
            </button>
          </div>
        </aside>

        <article className="pp-card">
          <h2>{t("admin.applicationsByVacancy")}</h2>
          {loading && <p>{t("common.loading")}</p>}
          {!loading &&
            vacancies.map((vacancy) => (
              <div key={vacancy.id} className="pp-application-item">
                <h3>{vacancy.title}</h3>
                <p>{t("admin.applicationsCount", { count: counts[vacancy.id] ?? 0 })}</p>
                <div className="pp-row">
                  <select
                    className="pp-select pp-select-sm"
                    value={quickStatus[vacancy.id] || "under_review"}
                    onChange={(e) =>
                      setQuickStatus((prev) => ({
                        ...prev,
                        [vacancy.id]: e.target.value as ApplicationStatus
                      }))
                    }
                  >
                    <option value="submitted">{t("status.submitted")}</option>
                    <option value="under_review">{t("status.under_review")}</option>
                    <option value="interview">{t("status.interview")}</option>
                    <option value="accepted">{t("status.accepted")}</option>
                    <option value="rejected">{t("status.rejected")}</option>
                  </select>
                  <button
                    type="button"
                    className="pp-btn-outline pp-btn-sm"
                    onClick={() => void onQuickSet(vacancy.id)}
                  >
                    {t("admin.setStatus")}: {t(`status.${quickStatus[vacancy.id] || "under_review"}`)}
                  </button>
                </div>
                {mode === "edit" && (
                  <button
                    type="button"
                    className="pp-btn-link"
                    onClick={() => {
                      setSelectedVacancyId(vacancy.id);
                      void syncFormFromVacancy(vacancy);
                    }}
                  >
                    {t("admin.loadToEditor")}
                  </button>
                )}
              </div>
            ))}
        </article>
      </section>

      <section className="pp-card">
        <h2>{mode === "create" ? t("admin.createModeTitle") : t("admin.editModeTitle")}</h2>
        {mode === "edit" && selectedVacancy && (
          <p className="pp-subtitle">{t("admin.editing")}: {selectedVacancy.title}</p>
        )}

        <form onSubmit={onSubmit} className="pp-form-grid">
          <label className="pp-label">
            {t("admin.departmentId")}
            <input
              className="pp-input"
              value={form.department}
              onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
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
            {t("admin.location")}
            <input
              className="pp-input"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            />
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

          {(["en", "de", "ru"] as const).map((lang) => (
            <fieldset key={lang} className="pp-translation-box">
              <legend>{lang.toUpperCase()}</legend>
              <label className="pp-label">
                {t("admin.titleField")}
                <input
                  className="pp-input"
                  value={form[lang].title}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [lang]: { ...prev[lang], title: e.target.value }
                    }))
                  }
                  required
                />
              </label>
              <label className="pp-label">
                {t("admin.descriptionField")}
                <textarea
                  className="pp-textarea pp-textarea-sm"
                  value={form[lang].description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [lang]: { ...prev[lang], description: e.target.value }
                    }))
                  }
                  required
                />
              </label>
              <label className="pp-label">
                {t("admin.responsibilitiesField")}
                <textarea
                  className="pp-textarea pp-textarea-sm"
                  value={form[lang].responsibilities}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [lang]: { ...prev[lang], responsibilities: e.target.value }
                    }))
                  }
                  required
                />
              </label>
              <label className="pp-label">
                {t("admin.requirementsField")}
                <textarea
                  className="pp-textarea pp-textarea-sm"
                  value={form[lang].requirements}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [lang]: { ...prev[lang], requirements: e.target.value }
                    }))
                  }
                  required
                />
              </label>
            </fieldset>
          ))}

          <div className="pp-row">
            <button type="submit" className="pp-btn-primary" disabled={saving}>
              {saving
                ? t("admin.saving")
                : mode === "create"
                  ? t("admin.createVacancy")
                  : t("admin.saveChanges")}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
