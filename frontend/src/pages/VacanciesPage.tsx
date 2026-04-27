import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import { getDepartments, getVacancies } from "../api/services";
import type { Department, Vacancy } from "../types/api";
import {
  formatDate,
  formatEmploymentType,
  formatSalary,
  formatWorkload,
  getCurrentLanguage,
  previewText,
  withCurrentLanguage
} from "../utils/display";

function badgeClass(status: string) {
  if (status === "active") return "pp-pill pp-pill-green";
  if (status === "draft") return "pp-pill pp-pill-orange";
  return "pp-pill";
}

export default function VacanciesPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [department, setDepartment] = useState(searchParams.get("department") || "");
  const [employmentType, setEmploymentType] = useState(searchParams.get("employment_type") || "");

  const [items, setItems] = useState<Vacancy[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (query = q, departmentId = department, type = employmentType) => {
    setLoading(true);
    setError("");
    try {
      const [vacanciesData, departmentsData] = await Promise.all([
        getVacancies({
          q: query,
          department: departmentId || undefined,
          employment_type: (type as "internship" | "part_time" | "") || undefined
        }),
        getDepartments()
      ]);
      setItems(vacanciesData);
      setDepartments(departmentsData);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = {};
    params.lang = searchParams.get("lang") || getCurrentLanguage();
    if (q.trim()) params.q = q.trim();
    if (department) params.department = department;
    if (employmentType) params.employment_type = employmentType;
    setSearchParams(params);
    void load(q, department, employmentType);
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

        <select className="pp-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">{t("vacancies.allDepartments")}</option>
          {departments.map((dep) => (
            <option key={dep.id} value={dep.id}>
              {dep.name}
            </option>
          ))}
        </select>

        <select className="pp-select" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
          <option value="">{t("vacancies.allTypes")}</option>
          <option value="part_time">{t("vacancies.partTime")}</option>
          <option value="internship">{t("vacancies.internship")}</option>
        </select>

        <button type="submit" className="pp-btn-primary">
          {t("common.open")}
        </button>
      </form>

      {loading && <p>{t("common.loading")}</p>}
      {error && <p className="pp-error">{error}</p>}
      {!loading && !error && rows.length === 0 && <p>{t("common.notFound")}</p>}

      {!loading &&
        !error &&
        rows.map((vacancy) => (
          <article key={vacancy.id} className="pp-card pp-vacancy-list-card">
            <div className="pp-vacancy-row">
              <div>
                <h3>{vacancy.title}</h3>
                <p className="pp-subtitle">{previewText(vacancy.description, 180)}</p>
              </div>
              <div className="pp-row">
                <span className={badgeClass(vacancy.status)}>
                  {t(`status.${vacancy.status}`, vacancy.status)}
                </span>
                <Link to={withCurrentLanguage(`/vacancies/${vacancy.id}`)} className="pp-btn-primary pp-btn-sm">
                  {t("vacancies.open")}
                </Link>
              </div>
            </div>

            <div className="pp-info-grid pp-info-grid-compact">
              <div className="pp-info-item">
                <span className="pp-muted">{t("vacancyDetails.department")}</span>
                <strong>{vacancy.department_name || String(vacancy.department)}</strong>
              </div>
              <div className="pp-info-item">
                <span className="pp-muted">{t("vacancyDetails.employer")}</span>
                <strong>{vacancy.employer_name || t("common.notSpecified")}</strong>
              </div>
              <div className="pp-info-item">
                <span className="pp-muted">{t("vacancyDetails.employmentType")}</span>
                <strong>{formatEmploymentType(vacancy.employment_type, t)}</strong>
              </div>
              <div className="pp-info-item">
                <span className="pp-muted">{t("vacancyDetails.location")}</span>
                <strong>{vacancy.location || t("common.notSpecified")}</strong>
              </div>
              <div className="pp-info-item">
                <span className="pp-muted">{t("vacancyDetails.workload")}</span>
                <strong>{formatWorkload(vacancy.workload_hours, t)}</strong>
              </div>
              <div className="pp-info-item">
                <span className="pp-muted">{t("vacancyDetails.salary")}</span>
                <strong>{formatSalary(vacancy.salary_from, vacancy.salary_to, t)}</strong>
              </div>
              <div className="pp-info-item">
                <span className="pp-muted">{t("vacancyDetails.deadline")}</span>
                <strong>{formatDate(vacancy.application_deadline, i18n.language, t)}</strong>
              </div>
            </div>
          </article>
        ))}
    </div>
  );
}
