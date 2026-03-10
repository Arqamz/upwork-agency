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
  [ProjectStage.DISCOVERED]: 'bg-gray-500/20 text-gray-400',
  [ProjectStage.SCRIPTED]: 'bg-blue-500/20 text-blue-400',
  [ProjectStage.UNDER_REVIEW]: 'bg-yellow-500/20 text-yellow-400',
  [ProjectStage.ASSIGNED]: 'bg-purple-500/20 text-purple-400',
  [ProjectStage.BID_SUBMITTED]: 'bg-orange-500/20 text-orange-400',
  [ProjectStage.VIEWED]: 'bg-cyan-500/20 text-cyan-400',
  [ProjectStage.MESSAGED]: 'bg-teal-500/20 text-teal-400',
  [ProjectStage.INTERVIEW]: 'bg-indigo-500/20 text-indigo-400',
  [ProjectStage.WON]: 'bg-green-500/20 text-green-400',
  [ProjectStage.IN_PROGRESS]: 'bg-emerald-500/20 text-emerald-400',
  [ProjectStage.COMPLETED]: 'bg-green-700/20 text-green-300',
  [ProjectStage.LOST]: 'bg-red-500/20 text-red-400',
  [ProjectStage.CANCELLED]: 'bg-gray-500/20 text-gray-500',
};

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
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {displayName}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/projects">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription>Total Projects</CardDescription>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <span className="text-2xl font-bold">
                  {analytics?.totalProjects?.toLocaleString() ?? '0'}
                </span>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/meetings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription>Total Meetings</CardDescription>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <span className="text-2xl font-bold">
                  {analytics?.totalMeetings?.toLocaleString() ?? '0'}
                </span>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/projects?stage=WON">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription>Projects Won</CardDescription>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
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
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/analytics">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription>Revenue</CardDescription>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <span className="text-2xl font-bold">
                  ${analytics?.totalRevenue?.toLocaleString() ?? '0'}
                </span>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Pipeline Funnel */}
      {pipelineCounts && pipelineCounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {pipelineCounts.map(({ stage, count }) => (
                <div
                  key={stage}
                  className={`text-center p-2 rounded-lg ${STAGE_COLORS[stage] ?? 'bg-muted/50'}`}
                >
                  <p className="text-xs font-medium uppercase truncate">
                    {STAGE_LABELS[stage] ?? stage.replace(/_/g, ' ')}
                  </p>
                  <p className="text-lg font-semibold mt-1">{count}</p>
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
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{project.title}</p>
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add New Job
              </Link>
            )}
            {(role === 'closer' || role === 'admin') && (
              <Link
                href="/projects?stage=ASSIGNED"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent text-sm font-medium"
              >
                <Send className="h-4 w-4" />
                My Assigned Bids
              </Link>
            )}
            {(role === 'closer' || role === 'admin' || role === 'lead') && (
              <Link
                href="/meetings"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent text-sm font-medium"
              >
                <Calendar className="h-4 w-4" />
                Meetings
              </Link>
            )}
            {(role === 'operator' || role === 'project_manager' || role === 'admin') && (
              <Link
                href="/tasks"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent text-sm font-medium"
              >
                <ListChecks className="h-4 w-4" />
                My Tasks
              </Link>
            )}
            {(role === 'admin' || role === 'lead') && (
              <Link
                href="/analytics"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent text-sm font-medium"
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
