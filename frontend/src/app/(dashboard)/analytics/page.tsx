'use client';

import { useDashboardAnalytics } from '@/hooks/use-analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface FunnelMetric {
  stage: string;
  count: number;
  conversionRate: number;
}

interface TrendRow {
  period: string;
  proposals: number;
  meetings: number;
  deals: number;
  revenue: number;
}

const fallbackData = {
  funnel: [
    { stage: 'Proposals Sent', count: 0, conversionRate: 100 },
    { stage: 'Viewed', count: 0, conversionRate: 0 },
    { stage: 'Shortlisted', count: 0, conversionRate: 0 },
    { stage: 'Interview', count: 0, conversionRate: 0 },
    { stage: 'Won', count: 0, conversionRate: 0 },
  ] as FunnelMetric[],
  summary: {
    totalProposals: 0,
    totalMeetings: 0,
    totalDeals: 0,
    totalRevenue: 0,
    avgDealSize: 0,
    winRate: 0,
  },
  recentTrends: [] as TrendRow[],
};

const CHART_COLORS = {
  proposals: 'hsl(220, 70%, 55%)',
  meetings: 'hsl(160, 60%, 45%)',
  deals: 'hsl(30, 80%, 55%)',
  revenue: 'hsl(260, 60%, 55%)',
};

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useDashboardAnalytics();

  const data = analytics || fallbackData;
  const summary = data.summary;
  const funnel = data.funnel as FunnelMetric[];
  const trends = (data.recentTrends || []) as TrendRow[];

  const statCards = [
    { label: 'Total Proposals', value: summary.totalProposals?.toLocaleString() ?? '0' },
    { label: 'Total Meetings', value: summary.totalMeetings?.toLocaleString() ?? '0' },
    { label: 'Deals Won', value: summary.totalDeals?.toLocaleString() ?? '0' },
    { label: 'Revenue', value: `$${summary.totalRevenue?.toLocaleString() ?? '0'}` },
    { label: 'Avg Deal Size', value: `$${summary.avgDealSize?.toLocaleString() ?? '0'}` },
    { label: 'Win Rate', value: `${summary.winRate ?? 0}%` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Performance metrics and insights</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {item.label}
              </p>
              {isLoading ? (
                <Skeleton className="h-6 w-16 mt-1" />
              ) : (
                <p className="mt-1 text-xl font-semibold">{item.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {funnel.map((stage, index) => {
                const maxCount = funnel[0]?.count || 1;
                const widthPercent = Math.max((stage.count / maxCount) * 100, 8);
                return (
                  <div key={stage.stage} className="flex items-center gap-4">
                    <div className="w-32 flex-shrink-0 text-sm text-muted-foreground text-right">
                      {stage.stage}
                    </div>
                    <div className="flex-1 h-10 bg-muted rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: `hsl(${220 - index * 20}, 70%, ${55 + index * 5}%)`,
                        }}
                      >
                        <span className="text-sm font-medium text-white drop-shadow-sm">
                          {stage.count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-muted-foreground text-right">
                      {index === 0 ? '---' : `${stage.conversionRate}%`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : trends.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
              No trend data available yet
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="period"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="proposals" fill={CHART_COLORS.proposals} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="meetings" fill={CHART_COLORS.meetings} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deals" fill={CHART_COLORS.deals} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : trends.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
              No revenue data available yet
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="period"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS.revenue}
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
