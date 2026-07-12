import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const ADMIN_PASSWORD = "instructor123";

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  login: (password: string) => {
    const ok = password === ADMIN_PASSWORD;
    if (ok) set({ isAuthenticated: true });
    return ok;
  },
  logout: () => set({ isAuthenticated: false }),
}));
