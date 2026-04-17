import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function VacancyDetailsPage() {
  const { id } = useParams();
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("pages.vacancyDetails")}</h1>
      <p>Vacancy ID: {id}</p>
    </div>
  );
}
