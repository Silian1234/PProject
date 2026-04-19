import type { User } from "./types/api";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: User): void {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("lang", user.preferred_language);
}

export function clearAuth(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

