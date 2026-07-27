import { create } from 'zustand';

interface WishlistStore {
  wishlistIds: string[];
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (carId: string) => Promise<boolean>;
  isWishlisted: (carId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  wishlistIds: [],
  isLoading: false,

  fetchWishlist: async () => {
    set({ isLoading: false });
  },

  toggleWishlist: async (carId) => {
    const currentIds = get().wishlistIds;
    const exists = currentIds.includes(carId);
    let updatedIds: string[];

    if (exists) {
      updatedIds = currentIds.filter((id) => id !== carId);
    } else {
      updatedIds = [...currentIds, carId];
    }

    set({ wishlistIds: updatedIds });
    return !exists;
  },

  isWishlisted: (carId) => {
    return get().wishlistIds.includes(carId);
  },

  clearWishlist: () => {
    set({ wishlistIds: [] });
  },
}));
