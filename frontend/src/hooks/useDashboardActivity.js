import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLastWeekProgressStats, fetchRecentProgressReports } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export const useRecentProgressActivity = () => {
  const { user } = useContext(AuthContext);
  const teamId = user?.teamId ?? null;

  return useQuery({
    queryKey: ['dashboardRecentActivity', teamId],
    queryFn: fetchRecentProgressReports,
    enabled: Boolean(user?.id)
  });
};

export const useLastWeekProgressStats = () => {
  const { user } = useContext(AuthContext);
  const teamId = user?.teamId ?? null;

  return useQuery({
    queryKey: ['dashboardLastWeekProgressStats', teamId],
    queryFn: fetchLastWeekProgressStats,
    enabled: Boolean(user?.id)
  });
};
