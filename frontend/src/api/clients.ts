import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const lang = localStorage.getItem("lang") || "en";

  config.headers = config.headers ?? {};
  config.headers["Accept-Language"] = lang;

  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }

  config.params = { ...(config.params || {}), lang };
  return config;
});

export default api;
