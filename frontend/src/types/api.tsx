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
