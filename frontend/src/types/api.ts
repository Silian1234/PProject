export type Vacancy = {
  id: number;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  department: number;
  employment_type: string;
  location: string;
  workload_hours: number | null;
  salary_from: string | null;
  salary_to: string | null;
  status: string;
  application_deadline: string | null;
  created_at: string;
  updated_at: string;
};

export type Application = {
  id: number;
  vacancy: number;
  vacancy_title: string;
  status: string;
  student_message: string;
  employer_comment: string;
  created_at: string;
  updated_at: string;
};

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "interview"
  | "accepted"
  | "rejected";

export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  preferred_language: "en" | "de" | "ru";
  role_code: "student" | "employer" | "admin" | null;
};

export type LoginResponse = {
  message: string;
  token: string;
  user: User;
};

export type RegisterPayload = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  role: "student" | "employer";
  preferred_language: "en" | "de" | "ru";
  university_id?: string;
  organization_name?: string;
};

export type RegisterResponse = LoginResponse;

export type VacancyTranslationPayload = {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
};

export type VacancyWritePayload = {
  department: number;
  employment_type: "part_time" | "internship";
  location?: string;
  workload_hours?: number | null;
  salary_from?: string | null;
  salary_to?: string | null;
  status: "draft" | "active" | "archived";
  application_deadline?: string | null;
  translations: {
    en: VacancyTranslationPayload;
    de: VacancyTranslationPayload;
    ru: VacancyTranslationPayload;
  };
};

export type VacancyApplication = {
  id: number;
  vacancy: number;
  vacancy_title: string;
  status: ApplicationStatus;
  student_message: string;
  employer_comment: string;
  created_at: string;
  updated_at: string;
};
