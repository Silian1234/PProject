import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import { getHomeStats, getVacancies } from "../api/services";
import { getStoredUser } from "../auth";
import type { HomeStats, Vacancy } from "../types/api";
import { withCurrentLanguage } from "../utils/display";

function stripLeadingNumber(text: string): string {
  return text.replace(/^\s*\d+\s*/, "").trim();
}

function statusClass(status: string): string {
  if (status === "active") return "pp-pill pp-pill-green";
  if (status === "draft") return "pp-pill pp-pill-orange";
  if (status === "archived") return "pp-pill pp-pill-blue-soft";
  return "pp-pill";
}

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const showEmployerLink = user?.role_code !== "student";

  const [stats, setStats] = useState<HomeStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [featuredVacancies, setFeaturedVacancies] = useState<Vacancy[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [featuredError, setFeaturedError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoadingStats(true);
    getHomeStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingStats(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingFeatured(true);
    setFeaturedError("");
    getVacancies({ status: "active" })
      .then((data) => {
        if (!cancelled) {
          setFeaturedVacancies(data.slice(0, 3));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setFeaturedError(getErrorMessage(error));
          setFeaturedVacancies([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingFeatured(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeVacanciesLabel = useMemo(
    () => stripLeadingNumber(t("home.activeVacancies")),
    [t]
  );
  const studentApplicationsLabel = useMemo(
    () => stripLeadingNumber(t("home.studentApplications")),
    [t]
  );

  const activeVacanciesText = `${stats?.active_vacancies ?? 0} ${activeVacanciesLabel}`;
  const studentApplicationsText = `${stats?.student_applications ?? 0} ${studentApplicationsLabel}`;
  const showStats = !isLoadingStats;

  const primaryFeatured = featuredVacancies[0] || null;
  const secondaryFeatured = featuredVacancies.slice(1);

  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    const normalized = searchQuery.trim();
    navigate(withCurrentLanguage(normalized ? `/vacancies?q=${encodeURIComponent(normalized)}` : "/vacancies"));
  };

  return (
    <div className="pp-page">
      <h1 className="pp-title">{t("home.pageTitle")}</h1>

      <section className="pp-home-desktop-grid">
        <article className="pp-card pp-hero-card">
          <h2>{t("home.heroTitle")}</h2>
          <p>{t("home.heroSubtitle")}</p>
          <div className="pp-row">
            <Link to={withCurrentLanguage("/vacancies")} className="pp-btn-primary">
              {t("home.browseVacancies")}
            </Link>
            {showEmployerLink && (
              <Link to={withCurrentLanguage("/admin/vacancies")} className="pp-btn-outline">
                {t("home.forEmployers")}
              </Link>
            )}
          </div>
        </article>

        <aside className="pp-card pp-stats-card">
          <h3>{t("home.quickStats")}</h3>
          <ul className="pp-flat-list">
            <li>{showStats ? activeVacanciesText : t("common.loading")}</li>
            <li>{showStats ? studentApplicationsText : t("common.loading")}</li>
          </ul>
        </aside>
      </section>

      <section className="pp-home-mobile">
        <p className="pp-subtitle">{t("home.featuredOpportunities")}</p>

        <form onSubmit={onSearchSubmit}>
          <input
            className="pp-input"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("home.searchPlaceholder")}
          />
        </form>

        <article className="pp-card pp-mobile-featured">
          <p className="pp-overline">{t("home.featuredInternship")}</p>
          {isLoadingFeatured && <p>{t("common.loading")}</p>}
          {!isLoadingFeatured && featuredError && <p className="pp-error">{featuredError}</p>}
          {!isLoadingFeatured && !featuredError && !primaryFeatured && <p>{t("common.notFound")}</p>}
          {!isLoadingFeatured && !featuredError && primaryFeatured && (
            <>
              <h3>{primaryFeatured.title}</h3>
              <p>{primaryFeatured.department_name || primaryFeatured.location || t("common.notSpecified")}</p>
              <span className={statusClass(primaryFeatured.status)}>
                {t(`status.${primaryFeatured.status}`, primaryFeatured.status)}
              </span>
            </>
          )}
        </article>

        <div className="pp-mobile-stats">
          <article className="pp-card">
            <h2 className="pp-stat-number">{showStats ? stats?.active_vacancies ?? 0 : t("common.loading")}</h2>
            <p>{t("home.activeVacanciesSmall")}</p>
          </article>
          <article className="pp-card">
            <h2 className="pp-stat-number pp-stat-green">
              {showStats ? stats?.student_applications ?? 0 : t("common.loading")}
            </h2>
            <p>{studentApplicationsLabel}</p>
          </article>
        </div>

        {!isLoadingFeatured &&
          !featuredError &&
          secondaryFeatured.map((vacancy) => (
            <article key={vacancy.id} className="pp-card">
              <h3>{vacancy.title}</h3>
              <p>{vacancy.department_name || vacancy.location || t("common.notSpecified")}</p>
              <span className={statusClass(vacancy.status)}>
                {t(`status.${vacancy.status}`, vacancy.status)}
              </span>
            </article>
          ))}
      </section>
    </div>
  );
}
