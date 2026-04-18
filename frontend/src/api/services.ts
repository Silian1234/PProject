import api from "./client";
import type { Application, LoginResponse, User, Vacancy } from "../types/api";

export async function getVacancies(q = ""): Promise<Vacancy[]> {
  const { data } = await api.get<Vacancy[]>("/vacancies/", {
    params: q ? { q } : {}
  });
  return data;
}

export async function getVacancy(id: number): Promise<Vacancy> {
  const { data } = await api.get<Vacancy>(`/vacancies/${id}/`);
  return data;
}

export type CreateApplicationPayload = {
  vacancy_id: number;
  student_message?: string;
  cover_letter_text?: string;
  resume_file?: File;
  resume_title?: string;
};

export async function createApplication(payload: CreateApplicationPayload) {
  if (payload.resume_file) {
    const formData = new FormData();
    formData.append("vacancy_id", String(payload.vacancy_id));
    formData.append("resume_file", payload.resume_file);
    formData.append("resume_title", payload.resume_title || payload.resume_file.name);
    formData.append("student_message", payload.student_message || "");
    formData.append("cover_letter_text", payload.cover_letter_text || "");

    const { data } = await api.post("/applications/", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data as { message: string; application: Application };
  }

  const { data } = await api.post("/applications/", payload);
  return data as { message: string; application: Application };
}

export async function getMyApplications(): Promise<Application[]> {
  const { data } = await api.get<Application[]>("/my-applications/");
  return data;
}

export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login/", {
    username,
    password
  });
  return data;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/auth/me/");
  return data;
}
