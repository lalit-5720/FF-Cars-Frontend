import { create } from 'zustand';

interface WishlistStore {
  wishlistIds: string[];
  isLoading: boolean;
  fetchWishlist: (userEmail?: string) => Promise<void>;
  toggleWishlist: (carId: string | number, userEmail?: string) => Promise<boolean>;
  isWishlisted: (carId: string | number) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  wishlistIds: [],
  isLoading: false,

  fetchWishlist: async (userEmail?: string) => {
    const emailKey = userEmail ? userEmail.toLowerCase().trim() : 'guest';
    try {
      const saved = localStorage.getItem(`ff_cars_wishlist_${emailKey}`);
      if (saved) {
        set({ wishlistIds: JSON.parse(saved), isLoading: false });
        return;
      }
    } catch (e) {
      console.error('Failed to parse wishlist from storage', e);
    }
    set({ wishlistIds: [], isLoading: false });
  },

  toggleWishlist: async (carId, userEmail?: string) => {
    const strId = String(carId);
    const currentIds = get().wishlistIds;
    const exists = currentIds.includes(strId);
    let updatedIds: string[];

    if (exists) {
      updatedIds = currentIds.filter((id) => id !== strId);
    } else {
      updatedIds = [...currentIds, strId];
    }

    const emailKey = userEmail ? userEmail.toLowerCase().trim() : 'guest';
    try {
      localStorage.setItem(`ff_cars_wishlist_${emailKey}`, JSON.stringify(updatedIds));
    } catch (e) {
      console.error('Failed to save wishlist to storage', e);
    }

    set({ wishlistIds: updatedIds });
    return !exists;
  },

  isWishlisted: (carId) => {
    return get().wishlistIds.includes(String(carId));
  },

  clearWishlist: () => {
    set({ wishlistIds: [] });
  },
}));
