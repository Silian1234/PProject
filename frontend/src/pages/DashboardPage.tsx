import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("pages.dashboard")}</h1>
      <p>Student profile and quick actions.</p>
    </div>
  );
}
