import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../api/error";
import {
  createVacancy,
  getCurrentUser,
  getVacancies,
  getVacancyApplications,
  getVacancyByLang,
  updateApplicationStatus,
  updateVacancy
} from "../api/services";
import type {
  ApplicationStatus,
  User,
  Vacancy,
  VacancyApplication,
  VacancyTranslationPayload,
  VacancyWritePayload
} from "../types/api";

type Translations = {
  en: VacancyTranslationPayload;
  de: VacancyTranslationPayload;
  ru: VacancyTranslationPayload;
};

type AppDraft = {
  status: ApplicationStatus;
  employer_comment: string;
};

const emptyTranslation = (): VacancyTranslationPayload => ({
  title: "",
  description: "",
  responsibilities: "",
  requirements: ""
});

const emptyTranslations = (): Translations => ({
  en: emptyTranslation(),
  de: emptyTranslation(),
  ru: emptyTranslation()
});

export default function AdminVacanciesPage() {
  const token = localStorage.getItem("token");
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loadingVacancies, setLoadingVacancies] = useState(false);
  const [vacancyError, setVacancyError] = useState("");
  const [message, setMessage] = useState("");

  const [editingVacancyId, setEditingVacancyId] = useState<number | null>(null);
  const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(null);

  const [department, setDepartment] = useState("1");
  const [employmentType, setEmploymentType] = useState<"part_time" | "internship">("internship");
  const [location, setLocation] = useState("");
  const [workloadHours, setWorkloadHours] = useState("");
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "archived">("draft");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [translations, setTranslations] = useState<Translations>(emptyTranslations());
  const [savingVacancy, setSavingVacancy] = useState(false);

  const [applications, setApplications] = useState<VacancyApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applicationError, setApplicationError] = useState("");
  const [appDrafts, setAppDrafts] = useState<Record<number, AppDraft>>({});
  const [updatingApplicationId, setUpdatingApplicationId] = useState<number | null>(null);

  const isAllowed = useMemo(() => {
    if (!user) return false;
    return user.role_code === "employer" || user.role_code === "admin";
  }, [user]);

  const resetVacancyForm = () => {
    setEditingVacancyId(null);
    setDepartment("1");
    setEmploymentType("internship");
    setLocation("");
    setWorkloadHours("");
    setSalaryFrom("");
    setSalaryTo("");
    setStatus("draft");
    setApplicationDeadline("");
    setTranslations(emptyTranslations());
  };

  const loadVacancies = async () => {
    setLoadingVacancies(true);
    setVacancyError("");
    try {
      const data = await getVacancies();
      setVacancies(data);
      if (data.length > 0 && !selectedVacancyId) {
        setSelectedVacancyId(data[0].id);
      }
    } catch (e) {
      setVacancyError(getErrorMessage(e));
    } finally {
      setLoadingVacancies(false);
    }
  };

  const loadApplications = async (vacancyId: number) => {
    setLoadingApplications(true);
    setApplicationError("");
    try {
      const data = await getVacancyApplications(vacancyId);
      setApplications(data);
      const draftMap: Record<number, AppDraft> = {};
      data.forEach((item) => {
        draftMap[item.id] = {
          status: item.status,
          employer_comment: item.employer_comment || ""
        };
      });
      setAppDrafts(draftMap);
    } catch (e) {
      setApplicationError(getErrorMessage(e));
      setApplications([]);
      setAppDrafts({});
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoadingAuth(false);
      return;
    }

    const loadAuth = async () => {
      try {
        const me = await getCurrentUser();
        setUser(me);
      } catch (e) {
        setAuthError(getErrorMessage(e));
      } finally {
        setLoadingAuth(false);
      }
    };

    void loadAuth();
  }, [token]);

  useEffect(() => {
    if (!isAllowed) return;
    void loadVacancies();
  }, [isAllowed]);

  useEffect(() => {
    if (!isAllowed || !selectedVacancyId) return;
    void loadApplications(selectedVacancyId);
  }, [isAllowed, selectedVacancyId]);

  const setTranslation = (
    lang: "en" | "de" | "ru",
    field: keyof VacancyTranslationPayload,
    value: string
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value
      }
    }));
  };

  const applyVacancyToForm = async (vacancy: Vacancy) => {
    setMessage("");
    setVacancyError("");
    setEditingVacancyId(vacancy.id);
    setDepartment(String(vacancy.department));
    setEmploymentType(vacancy.employment_type as "part_time" | "internship");
    setLocation(vacancy.location || "");
    setWorkloadHours(vacancy.workload_hours ? String(vacancy.workload_hours) : "");
    setSalaryFrom(vacancy.salary_from || "");
    setSalaryTo(vacancy.salary_to || "");
    setStatus(vacancy.status as "draft" | "active" | "archived");
    setApplicationDeadline(vacancy.application_deadline || "");

    try {
      const [en, de, ru] = await Promise.all([
        getVacancyByLang(vacancy.id, "en"),
        getVacancyByLang(vacancy.id, "de"),
        getVacancyByLang(vacancy.id, "ru")
      ]);
      setTranslations({
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
      setVacancyError(getErrorMessage(e));
    }
  };

  const buildPayload = (): VacancyWritePayload => {
    const dept = Number(department);
    if (!Number.isFinite(dept) || dept <= 0) {
      throw new Error("Department must be a positive numeric id");
    }

    return {
      department: dept,
      employment_type: employmentType,
      location,
      workload_hours: workloadHours ? Number(workloadHours) : null,
      salary_from: salaryFrom || null,
      salary_to: salaryTo || null,
      status,
      application_deadline: applicationDeadline || null,
      translations
    };
  };

  const onSubmitVacancy = async (e: FormEvent) => {
    e.preventDefault();
    setVacancyError("");
    setMessage("");
    setSavingVacancy(true);
    try {
      const payload = buildPayload();
      if (editingVacancyId) {
        await updateVacancy(editingVacancyId, payload);
        setMessage("Vacancy updated");
      } else {
        await createVacancy(payload);
        setMessage("Vacancy created");
      }
      await loadVacancies();
      if (selectedVacancyId) {
        await loadApplications(selectedVacancyId);
      }
      resetVacancyForm();
    } catch (e) {
      setVacancyError(getErrorMessage(e));
    } finally {
      setSavingVacancy(false);
    }
  };

  const onUpdateApplication = async (applicationId: number) => {
    const draft = appDrafts[applicationId];
    if (!draft) return;

    setApplicationError("");
    setMessage("");
    setUpdatingApplicationId(applicationId);
    try {
      const data = await updateApplicationStatus(
        applicationId,
        draft.status,
        draft.employer_comment
      );
      setMessage(data.message);
      if (selectedVacancyId) {
        await loadApplications(selectedVacancyId);
      }
    } catch (e) {
      setApplicationError(getErrorMessage(e));
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  if (!token) {
    return (
      <p>
        Login required: <Link to="/login">Login</Link>
      </p>
    );
  }

  if (loadingAuth) {
    return <p>Loading...</p>;
  }

  if (authError) {
    return <p style={{ color: "crimson" }}>{authError}</p>;
  }

  if (!isAllowed) {
    return <p style={{ color: "crimson" }}>Access denied: employer/admin only.</p>;
  }

  return (
    <div>
      <h1>Admin Vacancy Management</h1>
      <p>Use this page to create/edit vacancies and manage application statuses.</p>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {vacancyError && <p style={{ color: "crimson" }}>{vacancyError}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 16
        }}
      >
        <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
          <h2>{editingVacancyId ? `Edit vacancy #${editingVacancyId}` : "Create vacancy"}</h2>
          <form onSubmit={onSubmitVacancy}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              <label>
                Department ID
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </label>

              <label>
                Employment type
                <select
                  value={employmentType}
                  onChange={(e) =>
                    setEmploymentType(e.target.value as "part_time" | "internship")
                  }
                >
                  <option value="internship">internship</option>
                  <option value="part_time">part_time</option>
                </select>
              </label>

              <label>
                Location
                <input value={location} onChange={(e) => setLocation(e.target.value)} />
              </label>

              <label>
                Workload hours
                <input
                  type="number"
                  min={0}
                  value={workloadHours}
                  onChange={(e) => setWorkloadHours(e.target.value)}
                />
              </label>

              <label>
                Salary from
                <input value={salaryFrom} onChange={(e) => setSalaryFrom(e.target.value)} />
              </label>

              <label>
                Salary to
                <input value={salaryTo} onChange={(e) => setSalaryTo(e.target.value)} />
              </label>

              <label>
                Status
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "draft" | "active" | "archived")
                  }
                >
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="archived">archived</option>
                </select>
              </label>

              <label>
                Application deadline
                <input
                  type="date"
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                />
              </label>
            </div>

            {(["en", "de", "ru"] as const).map((lang) => (
              <fieldset
                key={lang}
                style={{
                  marginTop: 12,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 10
                }}
              >
                <legend>Translations ({lang.toUpperCase()})</legend>
                <label style={{ display: "block", marginBottom: 6 }}>
                  Title
                  <input
                    style={{ width: "100%" }}
                    value={translations[lang].title}
                    onChange={(e) => setTranslation(lang, "title", e.target.value)}
                    required
                  />
                </label>
                <label style={{ display: "block", marginBottom: 6 }}>
                  Description
                  <textarea
                    style={{ width: "100%" }}
                    rows={3}
                    value={translations[lang].description}
                    onChange={(e) => setTranslation(lang, "description", e.target.value)}
                    required
                  />
                </label>
                <label style={{ display: "block", marginBottom: 6 }}>
                  Responsibilities
                  <textarea
                    style={{ width: "100%" }}
                    rows={3}
                    value={translations[lang].responsibilities}
                    onChange={(e) => setTranslation(lang, "responsibilities", e.target.value)}
                    required
                  />
                </label>
                <label style={{ display: "block" }}>
                  Requirements
                  <textarea
                    style={{ width: "100%" }}
                    rows={3}
                    value={translations[lang].requirements}
                    onChange={(e) => setTranslation(lang, "requirements", e.target.value)}
                    required
                  />
                </label>
              </fieldset>
            ))}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="submit" disabled={savingVacancy}>
                {savingVacancy
                  ? "Saving..."
                  : editingVacancyId
                    ? "Update vacancy"
                    : "Create vacancy"}
              </button>
              {editingVacancyId && (
                <button type="button" onClick={resetVacancyForm}>
                  Cancel editing
                </button>
              )}
            </div>
          </form>
        </section>

        <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
          <h2>Vacancies</h2>
          {loadingVacancies && <p>Loading vacancies...</p>}
          {!loadingVacancies && vacancies.length === 0 && <p>No vacancies</p>}
          <ul>
            {vacancies.map((vacancy) => (
              <li key={vacancy.id} style={{ marginBottom: 10 }}>
                <div>
                  <strong>{vacancy.title}</strong> (id: {vacancy.id}) - {vacancy.status}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button type="button" onClick={() => void applyVacancyToForm(vacancy)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => setSelectedVacancyId(vacancy.id)}>
                    View applications
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
          <h2>
            Applications
            {selectedVacancyId ? ` for vacancy #${selectedVacancyId}` : ""}
          </h2>
          {applicationError && <p style={{ color: "crimson" }}>{applicationError}</p>}
          {loadingApplications && <p>Loading applications...</p>}
          {!loadingApplications && applications.length === 0 && (
            <p>No applications for selected vacancy.</p>
          )}
          {applications.map((app) => {
            const draft = appDrafts[app.id] || {
              status: app.status,
              employer_comment: app.employer_comment || ""
            };
            return (
              <div
                key={app.id}
                style={{
                  border: "1px solid #e5e5e5",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 10
                }}
              >
                <div>
                  <strong>{app.vacancy_title}</strong> (application #{app.id})
                </div>
                <div style={{ marginTop: 6 }}>
                  <label>
                    Status
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        setAppDrafts((prev) => ({
                          ...prev,
                          [app.id]: {
                            ...draft,
                            status: e.target.value as ApplicationStatus
                          }
                        }))
                      }
                      style={{ marginLeft: 8 }}
                    >
                      <option value="submitted">submitted</option>
                      <option value="under_review">under_review</option>
                      <option value="interview">interview</option>
                      <option value="accepted">accepted</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </label>
                </div>
                <div style={{ marginTop: 6 }}>
                  <label style={{ display: "block" }}>
                    Employer comment
                    <textarea
                      rows={3}
                      style={{ width: "100%" }}
                      value={draft.employer_comment}
                      onChange={(e) =>
                        setAppDrafts((prev) => ({
                          ...prev,
                          [app.id]: {
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
                  disabled={updatingApplicationId === app.id}
                  onClick={() => void onUpdateApplication(app.id)}
                >
                  {updatingApplicationId === app.id ? "Updating..." : "Update status"}
                </button>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
