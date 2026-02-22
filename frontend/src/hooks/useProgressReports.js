import { useQuery } from '@tanstack/react-query';
import { fetchProgressReports } from '../services/api';

export const useProgressReports = (filters = {}) => {
  return useQuery({
    queryKey: ['progressReports'],
    queryFn: () => fetchProgressReports(filters),
    retry: (failureCount, error) => {
      if (error?.isUpstream502) {
        return failureCount < 2;
      }
      return failureCount < 1;
    }
  });
};
