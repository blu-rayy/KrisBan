import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sprintService } from '../services/sprintService';
import { AuthContext } from '../context/AuthContext';

const getSprintsCacheKey = (teamId) => `krisban_sprints_cache_v1_team_${teamId ?? 'none'}`;

const readSprintsCache = (teamId) => {
  try {
    const raw = localStorage.getItem(getSprintsCacheKey(teamId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.data)) return [];

    return parsed.data;
  } catch {
    return [];
  }
};

const writeSprintsCache = (data) => {
  try {
    localStorage.setItem(getSprintsCacheKey(data?.teamId), JSON.stringify({ data: data?.items || [], ts: Date.now() }));
  } catch {
    // Ignore storage write failures
  }
};

export const useSprints = () => {
  const { user } = useContext(AuthContext);
  const teamId = user?.teamId ?? null;

  return useQuery({
    queryKey: ['sprints', teamId],
    queryFn: async () => {
      const response = await sprintService.getSprints();
      return response?.data?.data || [];
    },
    initialData: () => readSprintsCache(teamId),
    staleTime: 300000,
    keepPreviousData: true,
    refetchOnMount: true,
    onSuccess: (data) => {
      writeSprintsCache({ teamId, items: data });
    }
  });
};
