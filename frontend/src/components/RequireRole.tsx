import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearAuth, getStoredUser, getToken, saveStoredUser } from "../auth";
import { getCurrentUser } from "../api/services";
import type { ReactNode } from "react";
import type { User } from "../types/api";
import { withCurrentLanguage } from "../utils/display";

type Role = "student" | "employer" | "admin";

type Props = {
  allowed: Role[];
  children: ReactNode;
};

export default function RequireRole({ allowed, children }: Props) {
  const token = getToken();
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [loading, setLoading] = useState(Boolean(token && !getStoredUser()));
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    if (!token || user?.role_code) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getCurrentUser()
      .then((currentUser) => {
        if (cancelled) return;
        saveStoredUser(currentUser);
        setUser(currentUser);
      })
      .catch(() => {
        if (cancelled) return;
        clearAuth();
        setAuthFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, user?.role_code]);

  if (!token || authFailed) {
    return <Navigate to={withCurrentLanguage("/login")} replace />;
  }

  if (loading) {
    return null;
  }

  if (!user?.role_code || !allowed.includes(user.role_code as Role)) {
    return <Navigate to={withCurrentLanguage("/")} replace />;
  }

  return <>{children}</>;
}
