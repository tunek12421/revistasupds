import { create } from "zustand";
import api from "../lib/api";

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,

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

  register: async (email, password, fullName) => {
    set({ loading: true, error: null });
    try {
      await api.post("/auth/register", {
        email,
        password,
        full_name: fullName,
      });
      set({ loading: false });
    } catch (err) {
      const message =
        err.response?.data?.detail || "Error al registrarse";
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
}));

export default useAuthStore;
