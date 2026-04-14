import { create } from "zustand";
import api from "../lib/api";

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  initializing: true,
  error: null,

  initializeAuth: async () => {
    const token = localStorage.getItem("token");
    if (token) {
      set({ token, initializing: true });
      try {
        const res = await api.get("/auth/me");
        set({ user: res.data, isAuthenticated: true, initializing: false });
      } catch {
        // Token is invalid or expired
        localStorage.removeItem("token");
        set({ user: null, token: null, isAuthenticated: false, initializing: false });
      }
    } else {
      set({ initializing: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data.access_token;
      localStorage.setItem("token", token);
      set({ token, isAuthenticated: true, loading: false });
      await get().fetchMe();
    } catch (err) {
      const message =
        err.response?.data?.detail || "Error al iniciar sesión";
      set({ loading: false, error: message });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  fetchMe: async () => {
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false, token: null });
      localStorage.removeItem("token");
    }
  },

  isAdmin: () => {
    const u = get().user;
    return !!(u && u.is_admin);
  },
}));

export default useAuthStore;
