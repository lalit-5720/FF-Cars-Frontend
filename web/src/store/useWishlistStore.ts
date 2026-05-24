import { create } from 'zustand';
import { api } from '../services/api';

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
    try {
      set({ isLoading: true });
      const response = await api.get('/wishlist');
      const ids = response.data.map((item: any) => item.id || item.carId);
      set({ wishlistIds: ids, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
      set({ isLoading: false });
    }
  },

  toggleWishlist: async (carId) => {
    try {
      // Toggle backend
      await api.post('/wishlist', { carId });
      
      const currentIds = get().wishlistIds;
      const exists = currentIds.includes(carId);
      let updatedIds: string[];

      if (exists) {
        updatedIds = currentIds.filter((id) => id !== carId);
      } else {
        updatedIds = [...currentIds, carId];
      }

      set({ wishlistIds: updatedIds });
      return !exists; // Returns new state: true if added, false if removed
    } catch (error) {
      console.error('Failed to toggle wishlist', error);
      return get().wishlistIds.includes(carId); // Return old state on error
    }
  },

  isWishlisted: (carId) => {
    return get().wishlistIds.includes(carId);
  },

  clearWishlist: () => {
    set({ wishlistIds: [] });
  },
}));
