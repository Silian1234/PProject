import { useTranslation } from "react-i18next";

export default function MyApplicationsPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("pages.applications")}</h1>
      <p>Your submitted applications will be shown here.</p>
    </div>
  );
}
