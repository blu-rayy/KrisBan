import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from '../services/api';

export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    keepPreviousData: true
  });
};
