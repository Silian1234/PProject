import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import { getMyApplications } from "../api/services";
import { getStoredUser, getToken } from "../auth";
import type { Application } from "../types/api";

function statusClass(status: string) {
  if (status === "submitted") return "pp-pill pp-pill-blue";
  if (status === "under_review") return "pp-pill pp-pill-orange";
  if (status === "interview") return "pp-pill pp-pill-violet";
  if (status === "accepted") return "pp-pill pp-pill-green";
  return "pp-pill";
}

export default function MyApplicationsPage() {
  const { t } = useTranslation();
  const token = getToken();
  const user = getStoredUser();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getMyApplications();
        setItems(data);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const rows = useMemo(() => items, [items]);

  if (!token) {
    return (
      <p>
        {t("common.loginRequired")} <Link to="/login">{t("nav.login")}</Link>
      </p>
    );
  }

  return (
    <div className="pp-page">
      <h1 className="pp-title">{t("myApplications.title")}</h1>

      {loading && <p>{t("common.loading")}</p>}
      {error && <p className="pp-error">{error}</p>}

      {!loading && !error && (
        <section className="pp-dashboard-grid">
          <article className="pp-card">
            <h2>{t("myApplications.profile")}</h2>
            <p>
              {t("myApplications.name")}: {user?.first_name || t("dashboard.defaultStudent")} {user?.last_name || ""}
            </p>
            <p>{t("myApplications.program")}: {t("myApplications.programValue")}</p>
            <p>{t("myApplications.year")}: {t("myApplications.yearValue")}</p>
            <p>{t("myApplications.resume")}: {t("myApplications.resumeValue")}</p>
          </article>

          <article className="pp-card">
            <h2>{t("myApplications.myApplications")}</h2>
            {rows.length === 0 && <p>{t("myApplications.noApplications")}</p>}
            {rows.map((application) => (
              <div key={application.id} className="pp-application-item">
                <h3>{application.vacancy_title}</h3>
                <div className="pp-row">
                  <span className="pp-muted">{t("myApplications.status")}</span>
                  <span className={statusClass(application.status)}>
                    {t(`status.${application.status}`, application.status)}
                  </span>
                </div>
              </div>
            ))}
          </article>
        </section>
      )}
    </div>
  );
}
