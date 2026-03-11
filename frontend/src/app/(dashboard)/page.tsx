'use client';

import Link from 'next/link';
import { useAuthContext } from '@/components/auth-provider';
import { useDashboardAnalytics } from '@/hooks/use-analytics';
import { usePipelineCounts, useProjects } from '@/hooks/use-projects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectStage } from '@/types';
import {
  FolderKanban,
  Calendar,
  DollarSign,
  TrendingUp,
  Plus,
  ListChecks,
  BarChart3,
  Send,
} from 'lucide-react';

const STAGE_LABELS: Record<string, string> = {
  [ProjectStage.DISCOVERED]: 'Discovered',
  [ProjectStage.SCRIPTED]: 'Scripted',
  [ProjectStage.UNDER_REVIEW]: 'Under Review',
  [ProjectStage.ASSIGNED]: 'Assigned',
  [ProjectStage.BID_SUBMITTED]: 'Bid Submitted',
  [ProjectStage.VIEWED]: 'Viewed',
  [ProjectStage.MESSAGED]: 'Messaged',
  [ProjectStage.INTERVIEW]: 'Interview',
  [ProjectStage.WON]: 'Won',
  [ProjectStage.IN_PROGRESS]: 'In Progress',
  [ProjectStage.COMPLETED]: 'Completed',
  [ProjectStage.LOST]: 'Lost',
  [ProjectStage.CANCELLED]: 'Cancelled',
};

const STAGE_COLORS: Record<string, string> = {
  [ProjectStage.DISCOVERED]: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',
  [ProjectStage.SCRIPTED]: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  [ProjectStage.UNDER_REVIEW]: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  [ProjectStage.ASSIGNED]: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  [ProjectStage.BID_SUBMITTED]: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  [ProjectStage.VIEWED]: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
  [ProjectStage.MESSAGED]: 'bg-teal-500/15 text-teal-400 border border-teal-500/20',
  [ProjectStage.INTERVIEW]: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20',
  [ProjectStage.WON]: 'bg-green-500/15 text-green-400 border border-green-500/20',
  [ProjectStage.IN_PROGRESS]: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  [ProjectStage.COMPLETED]: 'bg-green-700/15 text-green-300 border border-green-700/20',
  [ProjectStage.LOST]: 'bg-red-500/15 text-red-400 border border-red-500/20',
  [ProjectStage.CANCELLED]: 'bg-gray-500/15 text-gray-500 border border-gray-500/20',
};

const STAT_CARDS = [
  {
    href: '/projects',
    label: 'Total Projects',
    icon: FolderKanban,
    key: 'totalProjects' as const,
    prefix: '',
  },
  {
    href: '/meetings',
    label: 'Total Meetings',
    icon: Calendar,
    key: 'totalMeetings' as const,
    prefix: '',
  },
  {
    href: '/projects?stage=WON',
    label: 'Projects Won',
    icon: DollarSign,
    key: 'totalWon' as const,
    prefix: '',
  },
  {
    href: '/analytics',
    label: 'Revenue',
    icon: TrendingUp,
    key: 'totalRevenue' as const,
    prefix: '$',
  },
];

export default function DashboardPage() {
  const { user, fullUser, activeOrganizationId } = useAuthContext();
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics();
  const { data: pipelineCounts } = usePipelineCounts(activeOrganizationId ?? undefined);
  const { data: recentProjects } = useProjects({ limit: 5 });

  const displayName = fullUser
    ? [fullUser.firstName, fullUser.lastName].filter(Boolean).join(' ') || fullUser.email
    : (user?.email ?? 'User');

  const role = user?.role?.toLowerCase() ?? '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="gradient-text text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {displayName}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ href, label, icon: Icon, key, prefix }, i) => (
          <Link key={key} href={href}>
            <Card
              className="cursor-pointer transition-shadow hover:shadow-md hover:shadow-primary/5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>{label}</CardDescription>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : key === 'totalWon' ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {analytics?.totalWon?.toLocaleString() ?? '0'}
                    </span>
                    {analytics?.conversionRates?.winRate != null && (
                      <Badge variant="secondary" className="text-xs">
                        {analytics.conversionRates.winRate}% win
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-2xl font-bold">
                    {prefix}
                    {analytics?.[key]?.toLocaleString() ?? '0'}
                  </span>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pipeline Funnel */}
      {pipelineCounts && pipelineCounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {pipelineCounts.map(({ stage, count }) => (
                <div
                  key={stage}
                  className={`rounded-lg p-2 text-center transition-transform hover:scale-105 ${STAGE_COLORS[stage] ?? 'bg-muted/50'}`}
                >
                  <p className="truncate text-xs font-medium uppercase">
                    {STAGE_LABELS[stage] ?? stage.replace(/_/g, ' ')}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Projects */}
      {recentProjects && recentProjects.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProjects.data.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between border-b py-2 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{project.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.organization?.name ?? '---'}{' '}
                      {project.niche ? `/ ${project.niche.name}` : ''}
                    </p>
                  </div>
                  <Badge variant="outline" className={STAGE_COLORS[project.stage] ?? 'bg-muted/50'}>
                    {STAGE_LABELS[project.stage] ?? project.stage.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions by Role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(role === 'bidder' || role === 'admin') && (
              <Link
                href="/projects"
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
              >
                <Plus className="h-4 w-4" />
                Add New Job
              </Link>
            )}
            {(role === 'closer' || role === 'admin') && (
              <Link
                href="/projects?stage=ASSIGNED"
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                <Send className="h-4 w-4" />
                My Assigned Bids
              </Link>
            )}
            {(role === 'closer' || role === 'admin' || role === 'lead') && (
              <Link
                href="/meetings"
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                <Calendar className="h-4 w-4" />
                Meetings
              </Link>
            )}
            {(role === 'operator' || role === 'project_manager' || role === 'admin') && (
              <Link
                href="/tasks"
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                <ListChecks className="h-4 w-4" />
                My Tasks
              </Link>
            )}
            {(role === 'admin' || role === 'lead') && (
              <Link
                href="/analytics"
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
