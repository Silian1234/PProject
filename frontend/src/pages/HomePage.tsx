import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("home.title")}</h1>
      <p>{t("home.subtitle")}</p>

      <div style={{ display: "flex", gap: 10, margin: "14px 0 20px" }}>
        <Link to="/vacancies">
          <button>{t("home.ctaVacancies")}</button>
        </Link>
        <Link to="/login">
          <button>{t("home.ctaLogin")}</button>
        </Link>
      </div>

      <section style={{ marginBottom: 16 }}>
        <h3>{t("home.studentTitle")}</h3>
        <p>{t("home.studentText")}</p>
      </section>

      <section>
        <h3>{t("home.employerTitle")}</h3>
        <p>{t("home.employerText")}</p>
      </section>
    </div>
  );
}
