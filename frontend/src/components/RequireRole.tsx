import { Navigate } from "react-router-dom";
import { getStoredUser, getToken } from "../auth";
import type { ReactNode } from "react";

type Role = "student" | "employer" | "admin";

type Props = {
  allowed: Role[];
  children: ReactNode;
};

export default function RequireRole({ allowed, children }: Props) {
  const token = getToken();
  const user = getStoredUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.role_code || !allowed.includes(user.role_code as Role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

