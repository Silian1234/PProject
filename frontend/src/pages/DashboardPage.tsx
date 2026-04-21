import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getStoredUser } from "../auth";

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = getStoredUser();

  return (
    <div className="pp-page">
      <h1 className="pp-title">{t("dashboard.title")}</h1>

      <section className="pp-dashboard-grid">
        <article className="pp-card">
          <h2>{user?.first_name || user?.username || t("dashboard.defaultStudent")}</h2>
          <p>{t("dashboard.email")}: {user?.email || "-"}</p>
          <p>{t("dashboard.role")}: {user?.role_code || "-"}</p>
          <p>{t("dashboard.preferredLanguage")}: {user?.preferred_language || "-"}</p>
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
