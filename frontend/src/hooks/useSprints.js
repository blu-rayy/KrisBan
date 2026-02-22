import { useQuery } from '@tanstack/react-query';
import { sprintService } from '../services/sprintService';

const SPRINTS_CACHE_KEY = 'krisban_sprints_cache_v1';

const readSprintsCache = () => {
  try {
    const raw = localStorage.getItem(SPRINTS_CACHE_KEY);
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
    localStorage.setItem(SPRINTS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // Ignore storage write failures
  }
};

export const useSprints = () => {
  return useQuery({
    queryKey: ['sprints'],
    queryFn: async () => {
      const response = await sprintService.getSprints();
      return response?.data?.data || [];
    },
    initialData: readSprintsCache,
    staleTime: 300000,
    keepPreviousData: true,
    refetchOnMount: true,
    onSuccess: (data) => {
      writeSprintsCache(data);
    }
  });
};
