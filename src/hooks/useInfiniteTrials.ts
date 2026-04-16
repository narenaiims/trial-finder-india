/**
 * @file src/hooks/useInfiniteTrials.ts
 * @description Infinite scroll hook using TanStack Query for TrialFinder India.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { searchTrials } from '../api/search';
import { FilterState } from '../types/trial';

export function useInfiniteTrials(filters: FilterState) {
  return useInfiniteQuery({
    queryKey: ['trials', filters],
    queryFn: ({ pageParam = 0 }) => searchTrials(filters, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
  });
}
