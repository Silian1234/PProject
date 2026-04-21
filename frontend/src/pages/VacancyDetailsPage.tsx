import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import { getVacancy, getVacancyByLang } from "../api/services";
import type { Vacancy } from "../types/api";

type LocalizedPreview = {
  en: string;
  de: string;
  ru: string;
};

export default function VacancyDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const vacancyId = Number(id);
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [localization, setLocalization] = useState<LocalizedPreview | null>(null);
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
        const [base, en, de, ru] = await Promise.all([
          getVacancy(vacancyId),
          getVacancyByLang(vacancyId, "en"),
          getVacancyByLang(vacancyId, "de"),
          getVacancyByLang(vacancyId, "ru")
        ]);
        setVacancy(base);
        setLocalization({
          en: en.title,
          de: de.title,
          ru: ru.title
        });
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

  return (
    <div className="pp-page">
      <h1 className="pp-title">{t("vacancyDetails.title")}</h1>

      <div className="pp-details-grid">
        <article className="pp-card">
          <h2>{vacancy.title}</h2>
          <p className="pp-subtitle">
            {t("vacancyDetails.department")}: {vacancy.department}
          </p>

          <h3>{t("vacancyDetails.responsibilities")}</h3>
          <div className="pp-multiline">{vacancy.responsibilities}</div>

          <h3>{t("vacancyDetails.requirements")}</h3>
          <div className="pp-multiline">{vacancy.requirements}</div>

          <div className="pp-actions-bottom">
            <Link to={`/vacancies/${vacancy.id}/apply`} className="pp-btn-primary">
              {t("vacancyDetails.apply")}
            </Link>
          </div>
        </article>

        <aside className="pp-card">
          <h3>{t("vacancyDetails.localizationPreview")}</h3>
          <p>EN: {localization?.en || "-"}</p>
          <p>DE: {localization?.de || "-"}</p>
          <p>RU: {localization?.ru || "-"}</p>

          <div className="pp-note">
            {t("vacancyDetails.selectorAffects")}
            <br />
            {t("vacancyDetails.uiLabels")}
            <br />
            {t("vacancyDetails.apiMessages")}
            <br />
            {t("vacancyDetails.vacancyContent")}
          </div>
        </aside>
      </div>
    </div>
  );
}
