import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function VacanciesPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("pages.vacancies")}</h1>
      <p>Temporary placeholder list:</p>
      <ul>
        <li><Link to="/vacancies/1">Teaching Assistant</Link></li>
        <li><Link to="/vacancies/2">IT Support Assistant</Link></li>
      </ul>
    </div>
  );
}
