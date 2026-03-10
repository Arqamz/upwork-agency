'use client';

import { useState } from 'react';
import {
  useDashboardAnalytics,
  useFunnelAnalytics,
  useTopClosers,
  useOrgAnalytics,
} from '@/hooks/use-analytics';
import { useAuthContext } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const FUNNEL_STAGES = [
  { key: 'discovered', label: 'Discovered', color: 'hsl(220, 70%, 55%)' },
  { key: 'scripted', label: 'Scripted', color: 'hsl(210, 70%, 55%)' },
  { key: 'underReview', label: 'Under Review', color: 'hsl(200, 70%, 55%)' },
  { key: 'assigned', label: 'Assigned', color: 'hsl(190, 70%, 55%)' },
  { key: 'bidSubmitted', label: 'Bid Submitted', color: 'hsl(180, 70%, 50%)' },
  { key: 'viewed', label: 'Viewed', color: 'hsl(170, 65%, 48%)' },
  { key: 'messaged', label: 'Messaged', color: 'hsl(160, 60%, 45%)' },
  { key: 'interview', label: 'Interview', color: 'hsl(150, 60%, 45%)' },
  { key: 'won', label: 'Won', color: 'hsl(140, 65%, 42%)' },
  { key: 'inProgress', label: 'In Progress', color: 'hsl(130, 60%, 42%)' },
  { key: 'completed', label: 'Completed', color: 'hsl(120, 60%, 40%)' },
  { key: 'lost', label: 'Lost', color: 'hsl(0, 65%, 50%)' },
  { key: 'cancelled', label: 'Cancelled', color: 'hsl(30, 50%, 50%)' },
] as const;

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function AnalyticsPage() {
  const { activeOrganizationId } = useAuthContext();
  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);

  const { data: dashboard, isLoading: dashLoading } = useDashboardAnalytics();
  const { data: funnel, isLoading: funnelLoading } = useFunnelAnalytics(startDate, endDate);
  const { data: topClosers, isLoading: closersLoading } = useTopClosers(startDate, endDate);
  const { data: orgSummary, isLoading: orgLoading } = useOrgAnalytics(activeOrganizationId ?? '');

  const statCards = [
    { label: 'Total Projects', value: dashboard?.totalProjects?.toLocaleString() ?? '0' },
    { label: 'Total Meetings', value: dashboard?.totalMeetings?.toLocaleString() ?? '0' },
    { label: 'Projects Won', value: dashboard?.totalWon?.toLocaleString() ?? '0' },
    {
      label: 'Revenue',
      value: `$${dashboard?.totalRevenue?.toLocaleString() ?? '0'}`,
    },
    {
      label: 'Bid Rate',
      value: `${dashboard?.conversionRates?.bidRate ?? 0}%`,
    },
    {
      label: 'Win Rate',
      value: `${dashboard?.conversionRates?.winRate ?? 0}%`,
    },
  ];

  const funnelData = funnel
    ? FUNNEL_STAGES.map((s) => ({
        ...s,
        count: (funnel as unknown as Record<string, number>)[s.key] ?? 0,
      }))
    : [];

  const maxFunnelCount = funnelData.reduce((max, s) => Math.max(max, s.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Performance metrics and insights</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {item.label}
              </p>
              {dashLoading ? (
                <Skeleton className="h-6 w-16 mt-1" />
              ) : (
                <p className="mt-1 text-xl font-semibold">{item.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion Rates */}
      {dashboard?.conversionRates && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Bid Rate', value: dashboard.conversionRates.bidRate },
                { label: 'View Rate', value: dashboard.conversionRates.viewRate },
                { label: 'Interview Rate', value: dashboard.conversionRates.interviewRate },
                { label: 'Win Rate', value: dashboard.conversionRates.winRate },
              ].map((rate) => (
                <div key={rate.label} className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{rate.value}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{rate.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Range Picker */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Funnel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
          </div>

          {/* Funnel Bars */}
          {funnelLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 13 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : funnelData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              Select a date range to view funnel data
            </div>
          ) : (
            <div className="space-y-3">
              {funnelData.map((stage) => {
                const widthPercent = Math.max((stage.count / maxFunnelCount) * 100, 6);
                return (
                  <div key={stage.key} className="flex items-center gap-4">
                    <div className="w-32 flex-shrink-0 text-sm text-muted-foreground text-right">
                      {stage.label}
                    </div>
                    <div className="flex-1 h-9 bg-muted rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: stage.color,
                        }}
                      >
                        <span className="text-sm font-medium text-white drop-shadow-sm">
                          {stage.count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Closers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Closers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {closersLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !topClosers || topClosers.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              No closer data for selected date range
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Closer</TableHead>
                  <TableHead className="text-right">Total Bids</TableHead>
                  <TableHead className="text-right">Won</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClosers.map((closer) => (
                  <TableRow key={closer.closerId}>
                    <TableCell className="font-medium">{closer.closerEmail}</TableCell>
                    <TableCell className="text-right">{closer.totalBids}</TableCell>
                    <TableCell className="text-right">{closer.totalWon}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          closer.winRate >= 50
                            ? 'success'
                            : closer.winRate >= 25
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {closer.winRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${closer.totalRevenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Org Summary */}
      {activeOrganizationId && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {orgLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : orgSummary ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Projects', value: orgSummary.totalProjects },
                  { label: 'Active Projects', value: orgSummary.activeProjects },
                  { label: 'Won Projects', value: orgSummary.wonProjects },
                  {
                    label: 'Revenue',
                    value: `$${orgSummary.totalRevenue.toLocaleString()}`,
                  },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center text-muted-foreground text-sm">
                No organization data available
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
