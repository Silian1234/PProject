import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="pp-page">
      <h1 className="pp-title">{t("home.pageTitle")}</h1>

      <section className="pp-home-desktop-grid">
        <article className="pp-card pp-hero-card">
          <h2>{t("home.heroTitle")}</h2>
          <p>{t("home.heroSubtitle")}</p>
          <div className="pp-row">
            <Link to="/vacancies" className="pp-btn-primary">
              {t("home.browseVacancies")}
            </Link>
            <Link to="/admin/vacancies" className="pp-btn-outline">
              {t("home.forEmployers")}
            </Link>
          </div>
        </article>

        <aside className="pp-card pp-stats-card">
          <h3>{t("home.quickStats")}</h3>
          <ul className="pp-flat-list">
            <li>{t("home.activeVacancies")}</li>
            <li>{t("home.studentApplications")}</li>
            <li>{t("home.localization")}</li>
            <li>{t("home.apiDocs")}</li>
          </ul>
        </aside>
      </section>

      <section className="pp-home-mobile">
        <p className="pp-subtitle">{t("home.featuredOpportunities")}</p>
        <input className="pp-input" placeholder={t("home.searchPlaceholder")} />

        <article className="pp-card pp-mobile-featured">
          <p className="pp-overline">{t("home.featuredInternship")}</p>
          <h3>IT Support Assistant</h3>
          <p>Library Digital Lab</p>
          <span className="pp-pill pp-pill-blue-soft">{t("home.paid")}</span>
        </article>

        <div className="pp-mobile-stats">
          <article className="pp-card">
            <h2 className="pp-stat-number">12</h2>
            <p>{t("home.activeVacanciesSmall")}</p>
          </article>
          <article className="pp-card">
            <h2 className="pp-stat-number pp-stat-green">5</h2>
            <p>{t("home.newUpdates")}</p>
          </article>
        </div>

        <article className="pp-card">
          <h3>Research Intern</h3>
          <p>Computer Vision Lab</p>
          <span className="pp-text-orange">{t("status.under_review")}</span>
        </article>

        <article className="pp-card">
          <h3>Event Coordinator</h3>
          <p>Student Affairs Office</p>
          <span className="pp-text-blue">{t("home.new")}</span>
        </article>
      </section>
    </div>
  );
}
