import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import { getVacancies } from "../api/services";
import type { Vacancy } from "../types/api";

function badgeClass(status: string) {
  if (status === "active") return "pp-pill pp-pill-green";
  if (status === "draft") return "pp-pill pp-pill-orange";
  return "pp-pill";
}

export default function VacanciesPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const data = await getVacancies(query);
      setItems(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void load(q);
  };

  const rows = useMemo(() => items, [items]);

  return (
    <div className="pp-page">
      <h1 className="pp-title">{t("vacancies.title")}</h1>

      <form className="pp-filters-row" onSubmit={onSubmit}>
        <input
          className="pp-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("vacancies.searchPlaceholder")}
        />
        <select className="pp-select" defaultValue="">
          <option value="" disabled>
            {t("vacancies.department")}
          </option>
          <option value="all">{t("vacancies.allDepartments")}</option>
        </select>
        <select className="pp-select" defaultValue="">
          <option value="" disabled>
            {t("vacancies.type")}
          </option>
          <option value="all">{t("vacancies.allTypes")}</option>
        </select>
      </form>

      {loading && <p>{t("common.loading")}</p>}
      {error && <p className="pp-error">{error}</p>}

      {!loading &&
        !error &&
        rows.map((vacancy) => (
          <article key={vacancy.id} className="pp-card pp-vacancy-row">
            <div>
              <h3>{vacancy.title}</h3>
              <p>
                {vacancy.location || t("vacancies.campus")} •{" "}
                {vacancy.employment_type === "part_time"
                  ? t("vacancies.partTime")
                  : t("vacancies.internship")}
              </p>
            </div>
            <div className="pp-row">
              <span className={badgeClass(vacancy.status)}>
                {t(`status.${vacancy.status}`, vacancy.status)}
              </span>
              <Link to={`/vacancies/${vacancy.id}`} className="pp-btn-primary pp-btn-sm">
                {t("vacancies.open")}
              </Link>
            </div>
          </article>
        ))}
    </div>
  );
}

