import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import { getInterviews, updateInterview } from "../api/services";
import { getStoredUser, getToken } from "../auth";
import type { Interview, InterviewStatus } from "../types/api";
import { formatDate, withCurrentLanguage } from "../utils/display";

type Lang = "en" | "de" | "ru";

const copy = {
  en: {
    title: "Interview Calendar",
    subtitle: "Planned interviews are stored in the system and can be managed by employers.",
    empty: "No interviews yet.",
    vacancy: "Vacancy",
    student: "Student",
    employer: "Employer",
    date: "Date and time",
    notes: "Notes",
    save: "Save",
    planned: "planned",
    done: "done",
    cancelled: "cancelled"
  },
  de: {
    title: "Interview-Kalender",
    subtitle: "Geplante Interviews werden im System gespeichert und kГ¶nnen von Arbeitgebern verwaltet werden.",
    empty: "Noch keine Interviews.",
    vacancy: "Stelle",
    student: "Student",
    employer: "Arbeitgeber",
    date: "Datum und Uhrzeit",
    notes: "Notizen",
    save: "Speichern",
    planned: "geplant",
    done: "erledigt",
    cancelled: "abgesagt"
  },
  ru: {
    title: "РљР°Р»РµРЅРґР°СЂСЊ СЃРѕР±РµСЃРµРґРѕРІР°РЅРёР№",
    subtitle: "Р—Р°РїР»Р°РЅРёСЂРѕРІР°РЅРЅС‹Рµ СЃРѕР±РµСЃРµРґРѕРІР°РЅРёСЏ С…СЂР°РЅСЏС‚СЃСЏ РІ СЃРёСЃС‚РµРјРµ Рё СѓРїСЂР°РІР»СЏСЋС‚СЃСЏ СЂР°Р±РѕС‚РѕРґР°С‚РµР»РµРј.",
    empty: "РЎРѕР±РµСЃРµРґРѕРІР°РЅРёР№ РїРѕРєР° РЅРµС‚.",
    vacancy: "Р’Р°РєР°РЅСЃРёСЏ",
    student: "РЎС‚СѓРґРµРЅС‚",
    employer: "Р Р°Р±РѕС‚РѕРґР°С‚РµР»СЊ",
    date: "Р”Р°С‚Р° Рё РІСЂРµРјСЏ",
    notes: "Р—Р°РјРµС‚РєРё",
    save: "РЎРѕС…СЂР°РЅРёС‚СЊ",
    planned: "Р·Р°РїР»Р°РЅРёСЂРѕРІР°РЅРѕ",
    done: "РїСЂРѕРІРµРґРµРЅРѕ",
    cancelled: "РѕС‚РјРµРЅРµРЅРѕ"
  }
};

function currentCopy(language: string) {
  const code = language.slice(0, 2) as Lang;
  return copy[code] || copy.en;
}

function toLocalDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function statusClass(status: string) {
  if (status === "planned") return "pp-pill pp-pill-blue";
  if (status === "done") return "pp-pill pp-pill-green";
  return "pp-pill pp-pill-orange";
}

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const token = getToken();
  const user = getStoredUser();
  const c = currentCopy(i18n.language);
  const canManage = user?.role_code === "employer" || user?.role_code === "admin";

  const [items, setItems] = useState<Interview[]>([]);
  const [drafts, setDrafts] = useState<Record<number, { scheduled_at: string; status: InterviewStatus; notes: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getInterviews();
      setItems(data);
      setDrafts(
        Object.fromEntries(
          data.map((item) => [
            item.id,
            {
              scheduled_at: toLocalDateTime(item.scheduled_at),
              status: item.status,
              notes: item.notes || ""
            }
          ])
        )
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      void load();
    } else {
      setLoading(false);
    }
  }, [token]);

  const onSave = async (id: number) => {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    setMsg("");
    setError("");
    try {
      const response = await updateInterview(id, draft);
      setMsg(response.message);
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSavingId(null);
    }
  };

  if (!token) {
    return (
      <p>
        {t("common.loginRequired")} <Link to={withCurrentLanguage("/login")}>{t("nav.login")}</Link>
      </p>
    );
  }

  return (
    <div className="pp-page">
      <h1 className="pp-title">{c.title}</h1>
      <p className="pp-subtitle">{c.subtitle}</p>
      {msg && <p className="pp-success">{msg}</p>}
      {error && <p className="pp-error">{error}</p>}

      <section className="pp-card">
        {loading && <p>{t("common.loading")}</p>}
        {!loading && items.length === 0 && <p>{c.empty}</p>}
        {!loading &&
          items.map((item) => {
            const draft = drafts[item.id] || {
              scheduled_at: toLocalDateTime(item.scheduled_at),
              status: item.status,
              notes: item.notes || ""
            };
            return (
              <article key={item.id} className="pp-calendar-item">
                <div className="pp-application-summary">
                  <div>
                    <h3>{item.vacancy_title}</h3>
                    <p className="pp-subtitle">
                      {c.student}: {item.student_name} В· {c.employer}: {item.employer_name}
                    </p>
                  </div>
                  <span className={statusClass(draft.status)}>{c[draft.status]}</span>
                </div>

                {canManage ? (
                  <div className="pp-form-grid pp-calendar-edit">
                    <label className="pp-label">
                      {c.date}
                      <input
                        className="pp-input"
                        type="datetime-local"
                        value={draft.scheduled_at}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [item.id]: { ...draft, scheduled_at: event.target.value }
                          }))
                        }
                      />
                    </label>
                    <label className="pp-label">
                      {t("common.status")}
                      <select
                        className="pp-select"
                        value={draft.status}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [item.id]: { ...draft, status: event.target.value as InterviewStatus }
                          }))
                        }
                      >
                        <option value="planned">{c.planned}</option>
                        <option value="done">{c.done}</option>
                        <option value="cancelled">{c.cancelled}</option>
                      </select>
                    </label>
                    <label className="pp-label pp-col-span-2">
                      {c.notes}
                      <textarea
                        className="pp-textarea pp-textarea-sm"
                        value={draft.notes}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [item.id]: { ...draft, notes: event.target.value }
                          }))
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="pp-btn-primary pp-btn-sm"
                      disabled={savingId === item.id}
                      onClick={() => void onSave(item.id)}
                    >
                      {savingId === item.id ? t("admin.saving") : c.save}
                    </button>
                  </div>
                ) : (
                  <div className="pp-info-grid pp-info-grid-compact">
                    <div className="pp-info-item">
                      <span className="pp-muted">{c.date}</span>
                      <strong>{formatDate(item.scheduled_at, i18n.language, t)}</strong>
                    </div>
                    <div className="pp-info-item">
                      <span className="pp-muted">{c.notes}</span>
                      <strong>{item.notes || t("common.notSpecified")}</strong>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
      </section>
    </div>
  );
}

