import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getErrorMessage } from "../api/error";
import { getVacancy, getVacancyByLang } from "../api/services";
import type { Vacancy } from "../types/api";

type LocalizedPreview = {
  en: string;
  de: string;
  ru: string;
};

export default function VacancyDetailsPage() {
  const { id } = useParams();
  const vacancyId = Number(id);
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [localization, setLocalization] = useState<LocalizedPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isFinite(vacancyId)) {
      setError("Invalid vacancy id");
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
  }, [vacancyId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="pp-error">{error}</p>;
  if (!vacancy) return <p>Vacancy not found.</p>;

  return (
    <div className="pp-page">
      <h1 className="pp-title">Vacancy Details</h1>

      <div className="pp-details-grid">
        <article className="pp-card">
          <h2>{vacancy.title}</h2>
          <p className="pp-subtitle">Department: {vacancy.department}</p>

          <h3>Responsibilities</h3>
          <div className="pp-multiline">{vacancy.responsibilities}</div>

          <h3>Requirements</h3>
          <div className="pp-multiline">{vacancy.requirements}</div>

          <div className="pp-actions-bottom">
            <Link to={`/vacancies/${vacancy.id}/apply`} className="pp-btn-primary">
              Apply
            </Link>
          </div>
        </article>

        <aside className="pp-card">
          <h3>Localization Preview</h3>
          <p>EN: {localization?.en || "-"}</p>
          <p>DE: {localization?.de || "-"}</p>
          <p>RU: {localization?.ru || "-"}</p>

          <div className="pp-note">
            Language selector affects:
            <br />
            UI labels
            <br />
            API messages
            <br />
            Vacancy content
          </div>
        </aside>
      </div>
    </div>
  );
}

