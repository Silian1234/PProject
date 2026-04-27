import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import { getVacancy } from "../api/services";
import type { Vacancy } from "../types/api";
import {
  formatDate,
  formatEmploymentType,
  formatSalary,
  formatWorkload,
  withCurrentLanguage
} from "../utils/display";

export default function VacancyDetailsPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const vacancyId = Number(id);
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isFinite(vacancyId)) {
      setError(t("vacancyDetails.invalidId"));
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getVacancy(vacancyId);
        setVacancy(data);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [vacancyId, t]);

  if (loading) return <p>{t("common.loading")}</p>;
  if (error) return <p className="pp-error">{error}</p>;
  if (!vacancy) return <p>{t("vacancyDetails.vacancyNotFound")}</p>;

  const details = [
    [t("vacancyDetails.department"), vacancy.department_name || String(vacancy.department)],
    [t("vacancyDetails.employer"), vacancy.employer_name || t("common.notSpecified")],
    [t("vacancyDetails.employmentType"), formatEmploymentType(vacancy.employment_type, t)],
    [t("vacancyDetails.location"), vacancy.location || t("common.notSpecified")],
    [t("vacancyDetails.workload"), formatWorkload(vacancy.workload_hours, t)],
    [t("vacancyDetails.salary"), formatSalary(vacancy.salary_from, vacancy.salary_to, t)],
    [t("vacancyDetails.deadline"), formatDate(vacancy.application_deadline, i18n.language, t)],
    [t("common.status"), t(`status.${vacancy.status}`, vacancy.status)]
  ];

  return (
    <div className="pp-page">
      <h1 className="pp-title">{t("vacancyDetails.title")}</h1>

      <article className="pp-card">
        <h2>{vacancy.title}</h2>

        <section className="pp-section-block">
          <h3>{t("vacancyDetails.mainInfo")}</h3>
          <div className="pp-info-grid">
            {details.map(([label, value]) => (
              <div key={label} className="pp-info-item">
                <span className="pp-muted">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="pp-section-block">
          <h3>{t("vacancyDetails.description")}</h3>
          <div className="pp-multiline">{vacancy.description}</div>
        </section>

        <section className="pp-section-block">
          <h3>{t("vacancyDetails.responsibilities")}</h3>
          <div className="pp-multiline">{vacancy.responsibilities}</div>
        </section>

        <section className="pp-section-block">
          <h3>{t("vacancyDetails.requirements")}</h3>
          <div className="pp-multiline">{vacancy.requirements}</div>
        </section>

        <div className="pp-actions-bottom">
          <Link to={withCurrentLanguage(`/vacancies/${vacancy.id}/apply`)} className="pp-btn-primary">
            {t("vacancyDetails.apply")}
          </Link>
        </div>
      </article>
    </div>
  );
}
