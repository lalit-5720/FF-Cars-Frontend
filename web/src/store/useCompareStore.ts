import { create } from 'zustand';

interface CompareState {
  compareList: any[];
  addToCompare: (car: any) => void;
  removeFromCompare: (carId: string) => void;
  clearCompare: () => void;
  isInCompare: (carId: string) => boolean;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  compareList: [],
  addToCompare: (car: any) => {
    const list = get().compareList;
    if (list.find((item) => item.id === car.id)) return;
    if (list.length >= 4) return;
    set({ compareList: [...list, car] });
  },
  removeFromCompare: (carId: string) => {
    set({ compareList: get().compareList.filter((item) => item.id !== carId) });
  },
  clearCompare: () => set({ compareList: [] }),
  isInCompare: (carId: string) => {
    return get().compareList.some((item) => item.id === carId);
  },
}));
