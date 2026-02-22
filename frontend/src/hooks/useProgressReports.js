import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchProgressReports } from '../services/api';

const fetchProgressReportsPage = async (filters = {}, page = 1, pageSize = 30) => {
  const data = await fetchProgressReports({
    ...filters,
    page,
    pageSize
  });

  return {
    data,
    pagination: { page, pageSize }
  };
};

export const useInfiniteProgressReports = (filters = {}, pageSize = 30) => {
  return useInfiniteQuery({
    queryKey: ['progressReports', filters],
    queryFn: ({ pageParam = 1 }) => fetchProgressReportsPage(filters, pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const lastPageData = lastPage?.data || [];
      const currentPage = lastPage?.pagination?.page || 1;
      return lastPageData.length < pageSize ? undefined : currentPage + 1;
    },
    retry: (failureCount, error) => {
      if (error?.isUpstream502) {
        return failureCount < 2;
      }
      return failureCount < 1;
    }
  });
};

export const useProgressReports = (filters = {}, pageSize = 30) => {
  const query = useInfiniteProgressReports(filters, pageSize);
  const flattenedReports = query.data?.pages?.flatMap((page) => page?.data || []) || [];

  return {
    ...query,
    data: flattenedReports
  };
};
