'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProposal, useUpdateProposalStatus } from '@/hooks/use-proposals';
import { useVideoByProposal } from '@/hooks/use-videos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ProposalStatus } from '@/types';
import {
  ArrowLeft,
  ExternalLink,
  User,
  Building2,
  FileText,
  Video,
  Calendar,
  DollarSign,
  Clock,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  VIEWED: 'bg-yellow-100 text-yellow-700',
  REPLIED: 'bg-purple-100 text-purple-700',
  INTERVIEW: 'bg-indigo-100 text-indigo-700',
  HIRED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-200 text-gray-600',
};

const statusTransitions: Record<string, string[]> = {
  DRAFT: ['SENT', 'WITHDRAWN'],
  SENT: ['VIEWED', 'WITHDRAWN'],
  VIEWED: ['REPLIED', 'REJECTED', 'WITHDRAWN'],
  REPLIED: ['INTERVIEW', 'REJECTED', 'WITHDRAWN'],
  INTERVIEW: ['HIRED', 'REJECTED', 'WITHDRAWN'],
};

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: proposal, isLoading } = useProposal(id);
  const { data: video } = useVideoByProposal(id);
  const updateStatus = useUpdateProposalStatus();

  function handleStatusChange(status: string) {
    updateStatus.mutate({ id, status });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Proposal not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nextStatuses = statusTransitions[proposal.status] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {proposal.jobTitle || 'Untitled Proposal'}
            </h1>
            <p className="text-muted-foreground text-sm">
              Created {new Date(proposal.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge className={statusColors[proposal.status] ?? ''}>{proposal.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {proposal.coverLetter && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Cover Letter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{proposal.coverLetter}</p>
              </CardContent>
            </Card>
          )}

          {proposal.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {proposal.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {video && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video Proposal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Duration</p>
                    <p className="font-medium">
                      {video.duration
                        ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}`
                        : '---'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">File Size</p>
                    <p className="font-medium">
                      {video.fileSize ? `${(video.fileSize / (1024 * 1024)).toFixed(1)} MB` : '---'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Views</p>
                    <p className="font-medium">{video.viewCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Type</p>
                    <p className="font-medium">{video.mimeType || '---'}</p>
                  </div>
                </div>
                {video.videoUrl && (
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Video
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {nextStatuses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((status) => (
                    <Button
                      key={status}
                      variant={
                        status === 'WITHDRAWN' || status === 'REJECTED' ? 'outline' : 'default'
                      }
                      size="sm"
                      onClick={() => handleStatusChange(status)}
                      disabled={updateStatus.isPending}
                    >
                      Move to {status.replace(/_/g, ' ')}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {proposal.bidAmount != null && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Bid Amount</p>
                    <p className="font-medium">${proposal.bidAmount.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {proposal.niche && (
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Niche</p>
                    <Badge variant="secondary">{proposal.niche.name}</Badge>
                  </div>
                </div>
              )}

              {proposal.sentAt && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sent At</p>
                    <p className="text-sm">{new Date(proposal.sentAt).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {proposal.claimedAt && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Claimed At</p>
                    <p className="text-sm">{new Date(proposal.claimedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {proposal.jobUrl && (
                <div>
                  <Separator className="my-2" />
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={proposal.jobUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Job Posting
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {proposal.client && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{proposal.client.name}</p>
                  {proposal.client.company && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {proposal.client.company}
                    </p>
                  )}
                </div>
                {proposal.client.country && (
                  <p className="text-sm text-muted-foreground">{proposal.client.country}</p>
                )}
                {proposal.client.totalSpent != null && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Spent</p>
                      <p className="font-medium">${proposal.client.totalSpent.toLocaleString()}</p>
                    </div>
                    {proposal.client.hireRate != null && (
                      <div>
                        <p className="text-muted-foreground">Hire Rate</p>
                        <p className="font-medium">{proposal.client.hireRate}%</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {proposal.closer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assigned Closer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {[proposal.closer.firstName, proposal.closer.lastName]
                    .filter(Boolean)
                    .join(' ') || proposal.closer.email}
                </p>
                <p className="text-sm text-muted-foreground">{proposal.closer.email}</p>
              </CardContent>
            </Card>
          )}

          {proposal.meeting && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Meeting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant={proposal.meeting.status === 'COMPLETED' ? 'success' : 'secondary'}>
                  {proposal.meeting.status}
                </Badge>
                <p className="text-sm">{new Date(proposal.meeting.scheduledAt).toLocaleString()}</p>
                {proposal.meeting.meetingUrl && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={proposal.meeting.meetingUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Join Meeting
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {proposal.deal && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Deal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant={proposal.deal.status === 'WON' ? 'success' : 'secondary'}>
                  {proposal.deal.status}
                </Badge>
                <p className="text-lg font-semibold">
                  ${proposal.deal.value.toLocaleString()} {proposal.deal.currency}
                </p>
                {proposal.deal.notes && (
                  <p className="text-sm text-muted-foreground">{proposal.deal.notes}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
