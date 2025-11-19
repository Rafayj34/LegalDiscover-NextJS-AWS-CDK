import { create } from "zustand";

interface CounterState {
    count: number
    increament: () => void;
    decreament: () => void;
}
export const useCounterStore = create<CounterState>((set, get) => ({
    // states
    count: 0,
    // functions
    increament: () => set((state) => ({ count: state.count + 1 })),
    decreament: () => set((state) => ({ count: state.count - 1 }))
}
))