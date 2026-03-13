import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export const useDashboardData = () => {
  const { user } = useContext(AuthContext);
  const teamId = user?.teamId ?? null;

  return useQuery({
    queryKey: ['dashboardData', teamId],
    queryFn: fetchDashboardData,
    enabled: Boolean(user?.id)
  });
};
