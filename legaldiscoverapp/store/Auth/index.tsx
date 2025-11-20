import { create } from "zustand";

interface AuthStore {
    // count: number
    // increament: () => void;
    // decreament: () => void;
}
export const useAuthStore = create<AuthStore>((set, get) => ({
    // states
    // count: 0,
    // functions
    // increament: () => set((state) => ({ count: state.count + 1 })),
    // decreament: () => set((state) => ({ count: state.count - 1 }))
}
))