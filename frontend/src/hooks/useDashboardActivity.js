import { useQuery } from '@tanstack/react-query';
import { fetchLastWeekProgressStats, fetchRecentProgressReports } from '../services/api';

export const useRecentProgressActivity = () => {
  return useQuery({
    queryKey: ['dashboardRecentActivity'],
    queryFn: fetchRecentProgressReports
  });
};

export const useLastWeekProgressStats = () => {
  return useQuery({
    queryKey: ['dashboardLastWeekProgressStats'],
    queryFn: fetchLastWeekProgressStats
  });
};
