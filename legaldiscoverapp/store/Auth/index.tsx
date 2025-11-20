import { create } from "zustand";
interface User {
    id: string;
    email: string;
    name?: string;
}
interface AuthStore {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    login: (userData) => {
        set({ user: userData });
    },

    logout: () => {
        set({ user: null });
    }
}));