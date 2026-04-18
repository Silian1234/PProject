import axios from "axios";

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: string; message?: string }
      | undefined;
    return data?.detail || data?.message || error.message;
  }
  return "Unexpected error";
}
