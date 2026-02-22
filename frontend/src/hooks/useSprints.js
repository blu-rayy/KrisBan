import { useQuery } from '@tanstack/react-query';
import { sprintService } from '../services/sprintService';

export const useSprints = () => {
  return useQuery({
    queryKey: ['sprints'],
    queryFn: async () => {
      const response = await sprintService.getSprints();
      return response?.data?.data || [];
    }
  });
};
