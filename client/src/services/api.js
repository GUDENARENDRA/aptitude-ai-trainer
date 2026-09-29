import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5000/api" });

// Attach JWT token to every request automatically
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Intercept 401 Unauthorized responses (invalid or expired token)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("token");
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export default api;
