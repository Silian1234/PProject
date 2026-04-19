import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../auth";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function RequireAuth({ children }: Props) {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

