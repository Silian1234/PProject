import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("pages.login")}</h1>
      <p>Login form will be here.</p>
    </div>
  );
}
