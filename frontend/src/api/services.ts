import api from "./client";
import type {
  Application,
  ApplicationStatus,
  Department,
  HomeStats,
  Interview,
  InterviewStatus,
  LoginResponse,
  NotificationItem,
  RegisterPayload,
  RegisterResponse,
  Review,
  ReviewType,
  StudentProfileUpdateResponse,
  User,
  Vacancy,
  VacancyApplication,
  VacancySubscription,
  VacancyWritePayload
} from "../types/api";

export type VacancyQuery = {
  q?: string;
  department?: number | string;
  employment_type?: "internship" | "part_time" | "";
  status?: "draft" | "active" | "archived" | "";
  mine?: boolean;
};

export async function getVacancies(query: VacancyQuery = {}): Promise<Vacancy[]> {
  const params: Record<string, string | number> = {};
  if (query.q?.trim()) params.q = query.q.trim();
  if (query.department !== undefined && query.department !== "") params.department = query.department;
  if (query.employment_type) params.employment_type = query.employment_type;
  if (query.status) params.status = query.status;
  if (query.mine) params.mine = 1;

  const { data } = await api.get<Vacancy[]>("/vacancies/", {
    params
  });
  return data;
}

export async function getHomeStats(): Promise<HomeStats> {
  const { data } = await api.get<HomeStats>("/stats/");
  return data;
}

export async function getDepartments(): Promise<Department[]> {
  const { data } = await api.get<Department[]>("/departments/");
  return data;
}

export async function getVacancyByLang(id: number, lang: "en" | "de" | "ru"): Promise<Vacancy> {
  const { data } = await api.get<Vacancy>(`/vacancies/${id}/`, {
    params: { lang }
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

export type StudentProfileUpdatePayload = {
  first_name: string;
  last_name: string;
  preferred_language: "en" | "de" | "ru";
  faculty: string;
  course: number;
  resume_title?: string;
  resume_file?: File | null;
};

export type EmployerProfileUpdatePayload = {
  first_name: string;
  last_name: string;
  preferred_language: "en" | "de" | "ru";
  organization_name: string;
  position: string;
  department_name: string;
};

export async function updateStudentProfile(
  payload: StudentProfileUpdatePayload
): Promise<StudentProfileUpdateResponse> {
  const formData = new FormData();
  formData.append("first_name", payload.first_name);
  formData.append("last_name", payload.last_name);
  formData.append("preferred_language", payload.preferred_language);
  formData.append("faculty", payload.faculty);
  formData.append("course", String(payload.course));
  if (payload.resume_title) formData.append("resume_title", payload.resume_title);
  if (payload.resume_file) formData.append("resume_file", payload.resume_file);

  const { data } = await api.patch<StudentProfileUpdateResponse>("/auth/profile/", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

export async function updateEmployerProfile(
  payload: EmployerProfileUpdatePayload
): Promise<StudentProfileUpdateResponse> {
  const formData = new FormData();
  formData.append("first_name", payload.first_name);
  formData.append("last_name", payload.last_name);
  formData.append("preferred_language", payload.preferred_language);
  formData.append("organization_name", payload.organization_name);
  formData.append("position", payload.position);
  formData.append("department_name", payload.department_name);

  const { data } = await api.patch<StudentProfileUpdateResponse>("/auth/profile/", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

export async function logoutUser(): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/logout/");
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>("/auth/register/", payload);
  return data;
}

export async function createVacancy(payload: VacancyWritePayload): Promise<Vacancy> {
  const { data } = await api.post<Vacancy>("/vacancies/", payload);
  return data;
}

export async function updateVacancy(id: number, payload: VacancyWritePayload): Promise<Vacancy> {
  const { data } = await api.patch<Vacancy>(`/vacancies/${id}/`, payload);
  return data;
}

export async function getVacancyApplications(vacancyId: number): Promise<VacancyApplication[]> {
  const { data } = await api.get<VacancyApplication[]>(`/vacancies/${vacancyId}/applications/`);
  return data;
}

export async function updateApplicationStatus(
  applicationId: number,
  status: ApplicationStatus,
  employer_comment = ""
): Promise<{ message: string }> {
  const { data } = await api.patch<{ message: string }>(`/applications/${applicationId}/status/`, {
    status,
    employer_comment
  });
  return data;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const { data } = await api.get<NotificationItem[]>("/notifications/");
  return data;
}

export async function markNotificationRead(id: number): Promise<{ message: string }> {
  const { data } = await api.patch<{ message: string }>(`/notifications/${id}/read/`);
  return data;
}

export type VacancySubscriptionPayload = {
  is_active: boolean;
  department?: number | null;
  employment_type?: "part_time" | "internship" | "";
};

export async function getVacancySubscription(): Promise<VacancySubscription> {
  const { data } = await api.get<VacancySubscription>("/vacancy-subscription/");
  return data;
}

export async function updateVacancySubscription(
  payload: VacancySubscriptionPayload
): Promise<{ message: string; subscription: VacancySubscription }> {
  const { data } = await api.patch<{ message: string; subscription: VacancySubscription }>(
    "/vacancy-subscription/",
    payload
  );
  return data;
}

export async function getInterviews(): Promise<Interview[]> {
  const { data } = await api.get<Interview[]>("/interviews/");
  return data;
}

export async function createInterview(payload: {
  application_id: number;
  scheduled_at: string;
  status?: InterviewStatus;
  notes?: string;
}): Promise<{ message: string; interview: Interview }> {
  const { data } = await api.post<{ message: string; interview: Interview }>("/interviews/", payload);
  return data;
}

export async function updateInterview(
  id: number,
  payload: Partial<Pick<Interview, "scheduled_at" | "status" | "notes">>
): Promise<{ message: string; interview: Interview }> {
  const { data } = await api.patch<{ message: string; interview: Interview }>(`/interviews/${id}/`, payload);
  return data;
}

export async function getReviews(applicationId?: number): Promise<Review[]> {
  const { data } = await api.get<Review[]>("/reviews/", {
    params: applicationId ? { application: applicationId } : undefined
  });
  return data;
}

export async function createReview(payload: {
  application: number;
  review_type?: ReviewType;
  rating: number;
  comment?: string;
}): Promise<{ message: string; review: Review }> {
  const { data } = await api.post<{ message: string; review: Review }>("/reviews/", payload);
  return data;
}

export async function getRecommendedVacancies(): Promise<Vacancy[]> {
  const { data } = await api.get<Vacancy[]>("/recommendations/");
  return data;
}
