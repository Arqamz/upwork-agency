import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface DashboardSummary {
  totalProjects: number;
  totalMeetings: number;
  totalWon: number;
  totalRevenue: number;
  conversionRates: {
    bidRate: number;
    viewRate: number;
    interviewRate: number;
    winRate: number;
  };
}

interface FunnelMetrics {
  discovered: number;
  scripted: number;
  underReview: number;
  assigned: number;
  bidSubmitted: number;
  viewed: number;
  messaged: number;
  interview: number;
  won: number;
  inProgress: number;
  completed: number;
  lost: number;
  cancelled: number;
}

interface TopCloser {
  closerId: string;
  closerEmail: string;
  totalBids: number;
  totalWon: number;
  totalRevenue: number;
  winRate: number;
}

interface OrgSummary {
  totalProjects: number;
  activeProjects: number;
  wonProjects: number;
  totalRevenue: number;
}

export function useDashboardAnalytics() {
  return useQuery<DashboardSummary>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data;
    },
  });
}

export function useFunnelAnalytics(startDate?: string, endDate?: string) {
  return useQuery<FunnelMetrics>({
    queryKey: ['analytics', 'funnel', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/analytics/funnel', { params });
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useTopClosers(startDate?: string, endDate?: string, limit = 10) {
  return useQuery<TopCloser[]>({
    queryKey: ['analytics', 'top-closers', startDate, endDate, limit],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/analytics/top-closers', { params });
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useOrgAnalytics(organizationId: string) {
  return useQuery<OrgSummary>({
    queryKey: ['analytics', 'orgs', organizationId],
    queryFn: async () => {
      const res = await api.get(`/analytics/orgs/${organizationId}`);
      return res.data;
    },
    enabled: !!organizationId,
  });
}
