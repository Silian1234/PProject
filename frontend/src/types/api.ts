export type Vacancy = {
  id: number;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  department: number;
  department_name?: string;
  employer_name?: string;
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
  student_name?: string;
  student_email?: string;
  resume_title?: string;
  resume_file?: string;
  cover_letter_text?: string;
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
  full_name?: string;
  first_name: string;
  last_name: string;
  preferred_language: "en" | "de" | "ru";
  role_code: "student" | "employer" | "admin" | null;
  university_id?: string | null;
  faculty?: string | null;
  course?: number | null;
  organization_name?: string | null;
  position?: string | null;
  employer_department_name?: string | null;
  primary_resume_title?: string | null;
};

export type Department = {
  id: number;
  code: string;
  name: string;
  description: string;
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
  role: "student";
  preferred_language: "en" | "de" | "ru";
};

export type RegisterResponse = LoginResponse;

export type StudentProfileUpdateResponse = {
  message: string;
  user: User;
};

export type VacancyTranslationPayload = {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  location: string;
};

export type VacancyWritePayload = {
  department?: number;
  department_name?: string;
  employment_type: "part_time" | "internship";
  location?: string;
  workload_hours?: number | null;
  salary_from?: string | null;
  salary_to?: string | null;
  status: "draft" | "active" | "archived";
  application_deadline?: string | null;
  translations: {
    en?: VacancyTranslationPayload;
    de?: VacancyTranslationPayload;
    ru?: VacancyTranslationPayload;
  };
};

export type VacancyApplication = {
  id: number;
  vacancy: number;
  vacancy_title: string;
  student_name: string;
  student_email: string;
  resume_title: string;
  resume_file: string;
  cover_letter_text: string;
  status: ApplicationStatus;
  student_message: string;
  employer_comment: string;
  created_at: string;
  updated_at: string;
};

export type HomeStats = {
  active_vacancies: number;
  student_applications: number;
};
