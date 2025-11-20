import { create } from "zustand";

interface GlobalStore {
    // count: number
    // increament: () => void;
    // decreament: () => void;
}
export const useGlobalStore = create<GlobalStore>((set, get) => ({
    // states
    // count: 0,
    // functions
    // increament: () => set((state) => ({ count: state.count + 1 })),
    // decreament: () => set((state) => ({ count: state.count - 1 }))
}
))