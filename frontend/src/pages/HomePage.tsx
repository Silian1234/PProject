import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("pages.home")}</h1>
      <p>University jobs and internships platform.</p>
    </div>
  );
}
