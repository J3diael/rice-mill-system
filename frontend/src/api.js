import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

const TOKEN_KEY = "ricemill_token";
const USER_KEY = "ricemill_user";

export const session = {
  get token() {
    return localStorage.getItem(TOKEN_KEY);
  },
  get user() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  save({ token, user }) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

api.interceptors.request.use((config) => {
  if (session.token) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

// If the token expires, log out everywhere in the app
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && session.token) {
      session.clear();
      window.dispatchEvent(new Event("ricemill:logout"));
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (err) =>
  err.response?.data?.error || (err.request ? "Cannot reach the server. Is the backend running?" : err.message);

export default api;
