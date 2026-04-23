import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import { getCurrentUser } from "../api/services";
import { getStoredUser } from "../auth";
import type { User } from "../types/api";

export default function DashboardPage() {
  const { t } = useTranslation();
  const fallbackUser = getStoredUser();
  const [user, setUser] = useState<User | null>(fallbackUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCurrentUser()
      .then((current) => {
        if (!cancelled) {
          setUser(current);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(getErrorMessage(e));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = user?.full_name || user?.username || t("dashboard.defaultStudent");
  const role = user?.role_code || "-";
  const language = user?.preferred_language || "-";
  const extraLine = user?.organization_name || user?.faculty || "-";

  return (
    <div className="pp-page">
      <h1 className="pp-title">{t("dashboard.title")}</h1>
      {loading && <p>{t("common.loading")}</p>}
      {error && <p className="pp-error">{error}</p>}

      <section className="pp-dashboard-grid">
        <article className="pp-card">
          <h2>{displayName}</h2>
          <p>{t("dashboard.email")}: {user?.email || "-"}</p>
          <p>{t("dashboard.role")}: {role}</p>
          <p>{t("dashboard.preferredLanguage")}: {language}</p>
          <p>{t("vacancies.department")}: {extraLine}</p>
        </article>

        <article className="pp-card">
          <h2>{t("dashboard.quickActions")}</h2>
          <div className="pp-column">
            <Link to="/vacancies" className="pp-btn-primary">
              {t("dashboard.browseVacancies")}
            </Link>
            <Link to="/my-applications" className="pp-btn-outline">
              {t("dashboard.viewMyApplications")}
            </Link>
            {(user?.role_code === "employer" || user?.role_code === "admin") && (
              <Link to="/admin/vacancies" className="pp-btn-outline">
                {t("dashboard.openEmployerPanel")}
              </Link>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
