import { create } from 'zustand';
import { FilterState } from '../types/trial';

interface SearchStore {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  setQuery: (query: string) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  filters: {
    query: '',
    is_free_only: false,
  },
  setFilters: (filters) => set({ filters }),
  setQuery: (query) => set((state) => ({ 
    filters: { ...state.filters, query } 
  })),
}));
