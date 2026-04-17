import { useTranslation } from "react-i18next";

export default function RegisterPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("pages.register")}</h1>
      <p>Registration form will be here.</p>
    </div>
  );
}
