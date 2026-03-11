'use client';

import { useState, useEffect } from 'react';
import {
  useProject,
  useUpdateProject,
  useAdvanceStage,
  useSetStage,
  useAssignProject,
  useReviewProject,
  useMilestones,
  useCreateMilestone,
  useCompleteMilestone,
} from '@/hooks/use-projects';
import {
  useVideoProposals,
  useCreateVideoProposal,
  useDeleteVideoProposal,
} from '@/hooks/use-videos';
import { useUsers } from '@/hooks/use-users';
import { useAuthContext } from '@/components/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ExternalLink,
  Save,
  CheckCircle2,
  XCircle,
  Trophy,
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  Clock,
  Building2,
  Tag,
  Users,
  FileText,
  Plus,
  Check,
  Video,
  Trash2,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Send,
} from 'lucide-react';
import { ProjectStage, PricingType, ReviewStatus } from '@/types';
import type { Project, Milestone, VideoProposal } from '@/types';

// ── Stage display helpers ────────────────────────────────────────────────────

export const STAGE_LABELS: Record<string, string> = {
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

export const STAGE_VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  DISCOVERED: 'secondary',
  SCRIPTED: 'default',
  UNDER_REVIEW: 'warning',
  ASSIGNED: 'outline',
  BID_SUBMITTED: 'warning',
  VIEWED: 'default',
  MESSAGED: 'default',
  INTERVIEW: 'default',
  WON: 'success',
  IN_PROGRESS: 'success',
  COMPLETED: 'success',
  LOST: 'destructive',
  CANCELLED: 'secondary',
};

const TERMINAL_STAGES = new Set([
  ProjectStage.COMPLETED,
  ProjectStage.LOST,
  ProjectStage.CANCELLED,
]);

// ── Role capability helpers ──────────────────────────────────────────────────

function canEditScript(role: string) {
  return ['admin', 'lead', 'bidder'].includes(role);
}

function canEditBidDetails(role: string) {
  return ['admin', 'lead', 'closer'].includes(role);
}

function canEditWonDetails(role: string) {
  return ['admin', 'project_manager'].includes(role);
}

function canManageMilestones(role: string) {
  return ['admin', 'project_manager'].includes(role);
}

function canManageVideos(role: string) {
  return ['admin', 'closer'].includes(role);
}

function canReview(role: string) {
  return ['admin', 'lead'].includes(role);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatUserName(
  u?: { firstName?: string | null; lastName?: string | null; email: string } | null,
) {
  if (!u) return '\u2014';
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
  return name || u.email;
}

function formatDate(d?: string | null) {
  if (!d) return '\u2014';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(d?: string | null) {
  if (!d) return '\u2014';
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPricing(project: Project) {
  if (project.pricingType === PricingType.HOURLY) {
    const min = project.hourlyRateMin;
    const max = project.hourlyRateMax;
    if (min && max) return `Hourly \u00b7 $${min}\u2013$${max}/hr`;
    if (min) return `Hourly \u00b7 $${min}+/hr`;
    if (max) return `Hourly \u00b7 up to $${max}/hr`;
    return 'Hourly';
  }
  if (project.fixedPrice) return `Fixed \u00b7 $${project.fixedPrice.toLocaleString()}`;
  return 'Fixed';
}

// ── New Stage Action Banner (updated for review flow) ────────────────────────

interface BannerProps {
  project: Project;
  role: string;
  onAdvance: () => void;
  onSetStage: (stage: ProjectStage) => void;
  onResubmitReview: () => void;
  isPending: boolean;
}

function StageActionBanner({
  project,
  role,
  onAdvance,
  onSetStage,
  onResubmitReview,
  isPending,
}: BannerProps) {
  const stage = project.stage;

  // Build primary action based on stage + role + review state
  let primaryLabel: string | null = null;
  let primaryAction: (() => void) | null = null;
  let primaryIcon: React.ReactNode = <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />;
  let hint = '';

  switch (stage) {
    case ProjectStage.DISCOVERED:
      if (['admin', 'lead', 'bidder'].includes(role)) {
        primaryLabel = 'Mark as Scripted';
        primaryAction = onAdvance;
        hint = 'Fill in cover letter before advancing.';
      }
      break;

    case ProjectStage.SCRIPTED:
      if (['admin', 'lead', 'closer'].includes(role)) {
        primaryLabel = 'Submit for Review';
        primaryAction = onAdvance;
        hint = 'Ensure a video proposal is attached.';
        primaryIcon = <Send className="mr-1.5 h-3.5 w-3.5" />;
      }
      break;

    case ProjectStage.UNDER_REVIEW:
      if (project.reviewStatus === ReviewStatus.REJECTED) {
        // Rejected — closer/bidder can resubmit
        if (['admin', 'closer', 'bidder'].includes(role)) {
          primaryLabel = 'Resubmit for Review';
          primaryAction = onResubmitReview;
          primaryIcon = <RotateCcw className="mr-1.5 h-3.5 w-3.5" />;
          hint = 'Address the review comments and resubmit.';
        }
      } else if (project.reviewStatus === ReviewStatus.APPROVED) {
        // Approved — closer can submit bid
        if (['admin', 'closer'].includes(role)) {
          primaryLabel = 'Submit Bid';
          primaryAction = onAdvance;
          hint = 'Review approved. Fill in bid amount in Script & Bid tab, then submit.';
        }
      }
      // PENDING — no primary action (lead uses Review tab to approve/reject)
      if (project.reviewStatus === ReviewStatus.PENDING && canReview(role)) {
        hint = 'Use the Review tab to approve or reject this submission.';
      }
      break;

    case ProjectStage.BID_SUBMITTED:
      if (['admin', 'closer'].includes(role)) {
        primaryLabel = 'Mark as Viewed';
        primaryAction = onAdvance;
      }
      break;

    case ProjectStage.VIEWED:
      if (['admin', 'closer'].includes(role)) {
        primaryLabel = 'Mark as Messaged';
        primaryAction = onAdvance;
      }
      break;

    case ProjectStage.MESSAGED:
      if (['admin', 'closer'].includes(role)) {
        primaryLabel = 'Schedule Interview';
        primaryAction = onAdvance;
      }
      break;

    case ProjectStage.INTERVIEW:
      if (['admin', 'closer', 'lead'].includes(role)) {
        primaryLabel = 'Mark as Won';
        primaryAction = onAdvance;
        primaryIcon = <Trophy className="mr-1.5 h-3.5 w-3.5" />;
        hint = 'Did the interview go well?';
      }
      break;

    case ProjectStage.IN_PROGRESS:
      if (['admin', 'project_manager'].includes(role)) {
        primaryLabel = 'Mark Complete';
        primaryAction = onAdvance;
      }
      break;
  }

  // Secondary actions (Lost / Cancel)
  const secondaryActions: Array<{
    label: string;
    icon: React.ReactNode;
    variant: 'destructive' | 'outline';
    onClick: () => void;
  }> = [];

  if (!TERMINAL_STAGES.has(stage)) {
    if (['admin', 'lead', 'closer'].includes(role) && stage !== ProjectStage.WON) {
      secondaryActions.push({
        label: 'Mark as Lost',
        icon: <XCircle className="mr-1 h-3 w-3" />,
        variant: 'destructive',
        onClick: () => onSetStage(ProjectStage.LOST),
      });
    }
    if (role === 'admin') {
      secondaryActions.push({
        label: 'Cancel Project',
        icon: <AlertTriangle className="mr-1 h-3 w-3" />,
        variant: 'outline',
        onClick: () => onSetStage(ProjectStage.CANCELLED),
      });
    }
  }

  if (!primaryAction && !hint && secondaryActions.length === 0) return null;

  return (
    <div className="shrink-0 space-y-3 border-b bg-muted/40 px-6 py-4">
      {/* Rejected banner */}
      {stage === ProjectStage.UNDER_REVIEW && project.reviewStatus === ReviewStatus.REJECTED && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm font-medium text-red-400">Review Rejected</p>
          {project.reviewComments && (
            <p className="mt-1 text-xs text-red-300/80">{project.reviewComments}</p>
          )}
          {project.reviewedBy && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              By {formatUserName(project.reviewedBy)} on {formatDateTime(project.reviewedAt)}
            </p>
          )}
        </div>
      )}

      {/* Primary + hint */}
      {(primaryAction || hint) && (
        <div className="flex items-center justify-between">
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
          {primaryAction && (
            <Button size="sm" onClick={primaryAction} disabled={isPending} className="ml-auto">
              {primaryIcon}
              {primaryLabel}
            </Button>
          )}
        </div>
      )}

      {/* Secondary actions */}
      {secondaryActions.length > 0 && (
        <div className="flex items-center gap-2 border-t border-border/50 pt-1">
          <span className="mr-1 text-xs text-muted-foreground">Other actions:</span>
          {secondaryActions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              size="sm"
              className="h-7 text-xs"
              onClick={action.onClick}
              disabled={isPending}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Milestone row ─────────────────────────────────────────────────────────────

function MilestoneRow({
  milestone,
  canManage,
  projectId,
}: {
  milestone: Milestone;
  canManage: boolean;
  projectId: string;
}) {
  const completeMilestone = useCompleteMilestone();

  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
            milestone.completed ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/40'
          }`}
        >
          {milestone.completed && <Check className="h-3 w-3 text-white" />}
        </div>
        <div className="min-w-0">
          <p
            className={`truncate text-sm font-medium ${milestone.completed ? 'text-muted-foreground line-through' : ''}`}
          >
            {milestone.name}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {milestone.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(milestone.dueDate as unknown as string)}
              </span>
            )}
            {milestone.amount && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {milestone.amount.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
      {canManage && !milestone.completed && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 text-xs"
          disabled={completeMilestone.isPending}
          onClick={() => completeMilestone.mutate({ projectId, id: milestone.id })}
        >
          <Check className="mr-1 h-3 w-3" />
          Done
        </Button>
      )}
    </div>
  );
}

// ── Video row ─────────────────────────────────────────────────────────────────

function VideoRow({ video, canDelete }: { video: VideoProposal; canDelete: boolean }) {
  const deleteVideo = useDeleteVideoProposal();

  return (
    <div className="flex items-center justify-between rounded-md border bg-card/50 px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <Video className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <a
            href={video.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm font-medium text-primary hover:underline"
          >
            {video.videoUrl.length > 60 ? video.videoUrl.slice(0, 60) + '...' : video.videoUrl}
          </a>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {video.duration && <span>{Math.round(video.duration)}s</span>}
            {video.mimeType && <span>{video.mimeType}</span>}
            <span>Added {formatDate(video.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => window.open(video.videoUrl, '_blank')}
        >
          <ExternalLink className="mr-1 h-3 w-3" />
          View
        </Button>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            disabled={deleteVideo.isPending}
            onClick={() => deleteVideo.mutate(video.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ProjectDetailSheetProps {
  projectId: string | null;
  onClose: () => void;
}

export function ProjectDetailSheet({ projectId, onClose }: ProjectDetailSheetProps) {
  const { user } = useAuthContext();
  const role = user?.role?.toLowerCase() ?? '';

  const { data: project, isLoading, isError } = useProject(projectId ?? '');
  const { data: usersData } = useUsers({ limit: 100 });
  const closers = usersData?.data.filter((u) => u.role?.name === 'closer') ?? [];

  const milestones = useMilestones(projectId ?? '');
  const { data: videosData } = useVideoProposals(1, 50, projectId ?? undefined);

  const updateProject = useUpdateProject();
  const advanceStage = useAdvanceStage();
  const setStage = useSetStage();
  const assignProject = useAssignProject();
  const reviewProject = useReviewProject();
  const createMilestone = useCreateMilestone();
  const createVideo = useCreateVideoProposal();

  // Script & Bid form state
  const [scriptForm, setScriptForm] = useState({
    coverLetter: '',
    videoScript: '',
    upworkAccount: '',
    bidAmount: '',
  });

  // Won Details form state
  const [wonForm, setWonForm] = useState({
    clientName: '',
    clientNotes: '',
    contractValue: '',
    contractCurrency: 'USD',
    startDate: '',
    endDate: '',
  });

  // Milestone add form
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ name: '', dueDate: '', amount: '' });

  // Video add form
  const [addingVideo, setAddingVideo] = useState(false);
  const [videoForm, setVideoForm] = useState({ videoUrl: '', storageKey: '' });

  // Review form
  const [reviewComments, setReviewComments] = useState('');

  // Closer assignment (for overview tab)
  const [selectedCloser, setSelectedCloser] = useState('');

  // Active tab
  const [activeTab, setActiveTab] = useState('overview');

  // Sync forms when project data loads / changes
  useEffect(() => {
    if (!project) return;
    setScriptForm({
      coverLetter: project.coverLetter ?? '',
      videoScript: project.videoScript ?? '',
      upworkAccount: project.upworkAccount ?? '',
      bidAmount: project.bidAmount?.toString() ?? '',
    });
    setWonForm({
      clientName: project.clientName ?? '',
      clientNotes: project.clientNotes ?? '',
      contractValue: project.contractValue?.toString() ?? '',
      contractCurrency: project.contractCurrency ?? 'USD',
      startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : '',
    });
    setSelectedCloser(project.assignedCloserId ?? '');
  }, [project]);

  // Auto-switch to won tab when project reaches WON+
  useEffect(() => {
    if (
      project?.stage &&
      [ProjectStage.WON, ProjectStage.IN_PROGRESS, ProjectStage.COMPLETED].includes(project.stage)
    ) {
      setActiveTab((prev) => (prev === 'overview' || prev === 'script' ? 'won' : prev));
    }
  }, [project?.stage]);

  // Auto-switch to review tab if at UNDER_REVIEW
  useEffect(() => {
    if (project?.stage === ProjectStage.UNDER_REVIEW && canReview(role)) {
      setActiveTab('review');
    }
  }, [project?.stage, role]);

  const handleSaveScript = async () => {
    if (!project) return;
    await updateProject.mutateAsync({
      id: project.id,
      coverLetter: scriptForm.coverLetter || undefined,
      videoScript: scriptForm.videoScript || undefined,
      upworkAccount: scriptForm.upworkAccount || undefined,
      bidAmount: scriptForm.bidAmount ? parseFloat(scriptForm.bidAmount) : undefined,
      lastEditedById: user?.id,
    });
  };

  const handleSaveWon = async () => {
    if (!project) return;
    await updateProject.mutateAsync({
      id: project.id,
      clientName: wonForm.clientName || undefined,
      clientNotes: wonForm.clientNotes || undefined,
      contractValue: wonForm.contractValue ? parseFloat(wonForm.contractValue) : undefined,
      contractCurrency: wonForm.contractCurrency || 'USD',
      startDate: wonForm.startDate || undefined,
      endDate: wonForm.endDate || undefined,
      lastEditedById: user?.id,
    });
  };

  const handleAdvance = () => {
    if (!project) return;
    advanceStage.mutate(project.id);
  };

  const handleSetStage = (stage: ProjectStage) => {
    if (!project) return;
    setStage.mutate({ id: project.id, stage });
  };

  const handleAssignCloser = () => {
    if (!project || !selectedCloser || selectedCloser === 'none') return;
    assignProject.mutate({
      id: project.id,
      assignedCloserId: selectedCloser,
      lastEditedById: user?.id,
    });
  };

  const handleReview = (status: ReviewStatus) => {
    if (!project) return;
    reviewProject.mutate({
      id: project.id,
      status,
      comments: reviewComments || undefined,
      reviewedById: user?.id,
    });
    setReviewComments('');
  };

  const handleResubmitReview = () => {
    if (!project) return;
    // Resubmit = set review back to PENDING
    reviewProject.mutate({
      id: project.id,
      status: ReviewStatus.PENDING,
      comments: undefined,
      reviewedById: user?.id,
    });
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !videoForm.videoUrl) return;
    await createVideo.mutateAsync({
      projectId: project.id,
      videoUrl: videoForm.videoUrl,
      storageKey: videoForm.storageKey || videoForm.videoUrl,
    });
    setVideoForm({ videoUrl: '', storageKey: '' });
    setAddingVideo(false);
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !milestoneForm.name) return;
    await createMilestone.mutateAsync({
      projectId: project.id,
      name: milestoneForm.name,
      dueDate: milestoneForm.dueDate || undefined,
      amount: milestoneForm.amount ? parseFloat(milestoneForm.amount) : undefined,
    });
    setMilestoneForm({ name: '', dueDate: '', amount: '' });
    setAddingMilestone(false);
  };

  const isPending =
    advanceStage.isPending ||
    setStage.isPending ||
    assignProject.isPending ||
    updateProject.isPending ||
    reviewProject.isPending;

  const showWonTab =
    project &&
    [ProjectStage.WON, ProjectStage.IN_PROGRESS, ProjectStage.COMPLETED].includes(project.stage);

  const showReviewTab = project && project.stage === ProjectStage.UNDER_REVIEW;

  const scriptEditable = canEditScript(role);
  const bidEditable = canEditBidDetails(role);
  const wonEditable = canEditWonDetails(role);
  const milestoneManage = canManageMilestones(role);
  const videoManage = canManageVideos(role);
  const canSaveScript = scriptEditable || bidEditable;
  const canAssign = ['admin', 'lead'].includes(role);

  const videos = videosData?.data ?? [];

  return (
    <Sheet open={!!projectId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="flex w-full flex-col overflow-hidden p-0 sm:w-[640px] sm:max-w-[640px]"
        side="right"
      >
        {isLoading && (
          <div className="space-y-4 p-6">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {isError && (
          <div className="p-6 text-center text-destructive">Failed to load project details.</div>
        )}

        {project && (
          <>
            {/* ── Header ─────────────────────────────────────────────── */}
            <SheetHeader className="shrink-0 border-b px-6 pb-4 pt-6">
              <div className="pr-8">
                <SheetTitle className="text-xl leading-tight">{project.title}</SheetTitle>
                <SheetDescription className="sr-only">Project details</SheetDescription>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={STAGE_VARIANT[project.stage] ?? 'secondary'}>
                    {STAGE_LABELS[project.stage] ?? project.stage}
                  </Badge>
                  {project.stage === ProjectStage.UNDER_REVIEW && project.reviewStatus && (
                    <Badge
                      variant="outline"
                      className={
                        project.reviewStatus === ReviewStatus.APPROVED
                          ? 'border-green-500/30 bg-green-500/20 text-green-400'
                          : project.reviewStatus === ReviewStatus.REJECTED
                            ? 'border-red-500/30 bg-red-500/20 text-red-400'
                            : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                      }
                    >
                      {project.reviewStatus === ReviewStatus.APPROVED && 'Approved'}
                      {project.reviewStatus === ReviewStatus.REJECTED && 'Rejected'}
                      {project.reviewStatus === ReviewStatus.PENDING && 'Pending Review'}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{formatPricing(project)}</span>
                  {project.jobUrl && (
                    <a
                      href={project.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Job
                    </a>
                  )}
                </div>
              </div>
            </SheetHeader>

            {/* ── Stage Action Banner ─────────────────────────────────── */}
            <StageActionBanner
              project={project}
              role={role}
              onAdvance={handleAdvance}
              onSetStage={handleSetStage}
              onResubmitReview={handleResubmitReview}
              isPending={isPending}
            />

            {/* ── Tabs ───────────────────────────────────────────────── */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <div className="shrink-0 px-6 pt-3">
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="script" className="flex-1">
                    Script & Bid
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="flex-1">
                    Videos
                    {videos.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                        {videos.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  {showReviewTab && (
                    <TabsTrigger value="review" className="flex-1">
                      Review
                    </TabsTrigger>
                  )}
                  {showWonTab && (
                    <TabsTrigger value="won" className="flex-1">
                      Won Details
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              {/* ── Overview Tab ─────────────────────────────────────── */}
              <TabsContent
                value="overview"
                className="mt-0 flex-1 space-y-5 overflow-y-auto px-6 pb-6"
              >
                {/* Job Description */}
                {project.jobDescription && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      Job Description
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {project.jobDescription}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Context */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="mb-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      Organization
                    </p>
                    <p className="text-sm font-medium">{project.organization?.name ?? '\u2014'}</p>
                  </div>
                  <div>
                    <p className="mb-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      Niche
                    </p>
                    <p className="text-sm font-medium">{project.niche?.name ?? '\u2014'}</p>
                  </div>
                  <div>
                    <p className="mb-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Team
                    </p>
                    <p className="text-sm font-medium">{project.team?.name ?? '\u2014'}</p>
                  </div>
                  <div>
                    <p className="mb-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Discovered
                    </p>
                    <p className="text-sm font-medium">{formatDate(project.createdAt)}</p>
                  </div>
                </div>

                <Separator />

                {/* Assignments */}
                <div>
                  <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    Assignments
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div>
                      <p className="mb-0.5 text-xs text-muted-foreground">Discovered By</p>
                      <p className="text-sm font-medium">{formatUserName(project.discoveredBy)}</p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-xs text-muted-foreground">Assigned Closer</p>
                      <p className="text-sm font-medium">
                        {formatUserName(project.assignedCloser)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-xs text-muted-foreground">Project Manager</p>
                      <p className="text-sm font-medium">{formatUserName(project.assignedPM)}</p>
                    </div>
                  </div>

                  {/* Reassign closer inline */}
                  {canAssign && (
                    <div className="mt-3 flex items-center gap-2">
                      <Select value={selectedCloser} onValueChange={setSelectedCloser}>
                        <SelectTrigger className="h-8 flex-1 text-sm">
                          <SelectValue placeholder="Reassign closer..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassign</SelectItem>
                          {closers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {formatUserName(c)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={handleAssignCloser}
                        disabled={assignProject.isPending}
                      >
                        <Users className="mr-1 h-3 w-3" />
                        Assign
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Audit */}
                <div>
                  <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Audit
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last edited by</span>
                      <span className="font-medium">{formatUserName(project.lastEditedBy)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last updated</span>
                      <span className="font-medium">{formatDateTime(project.updatedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">{formatDateTime(project.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── Script & Bid Tab ──────────────────────────────────── */}
              <TabsContent
                value="script"
                className="mt-0 flex-1 space-y-5 overflow-y-auto px-6 pb-6"
              >
                {/* Last edited info */}
                {project.lastEditedBy && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last edited by{' '}
                    <span className="font-medium text-foreground">
                      {formatUserName(project.lastEditedBy)}
                    </span>{' '}
                    &middot; {formatDateTime(project.updatedAt)}
                  </p>
                )}

                {/* Cover Letter */}
                <div className="space-y-2">
                  <Label htmlFor="coverLetter" className="text-sm font-semibold">
                    Cover Letter
                    {!scriptEditable && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (read-only)
                      </span>
                    )}
                  </Label>
                  <Textarea
                    id="coverLetter"
                    rows={8}
                    placeholder="Write the Upwork cover letter here..."
                    value={scriptForm.coverLetter}
                    onChange={(e) => setScriptForm((p) => ({ ...p, coverLetter: e.target.value }))}
                    disabled={!scriptEditable}
                    className="resize-none font-mono text-sm"
                  />
                </div>

                {/* Video Script */}
                <div className="space-y-2">
                  <Label htmlFor="videoScript" className="text-sm font-semibold">
                    Video Script
                    {!scriptEditable && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (read-only)
                      </span>
                    )}
                  </Label>
                  <Textarea
                    id="videoScript"
                    rows={8}
                    placeholder="Write the video proposal script here..."
                    value={scriptForm.videoScript}
                    onChange={(e) => setScriptForm((p) => ({ ...p, videoScript: e.target.value }))}
                    disabled={!scriptEditable}
                    className="resize-none font-mono text-sm"
                  />
                </div>

                <Separator />

                {/* Bid Details */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Bid Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="bidAmount" className="text-xs">
                        Bid Amount ($)
                        {!bidEditable && (
                          <span className="ml-1 font-normal text-muted-foreground">
                            (read-only)
                          </span>
                        )}
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="bidAmount"
                          type="number"
                          min="0"
                          placeholder="0"
                          className="pl-7"
                          value={scriptForm.bidAmount}
                          onChange={(e) =>
                            setScriptForm((p) => ({ ...p, bidAmount: e.target.value }))
                          }
                          disabled={!bidEditable}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="upworkAccount" className="text-xs">
                        Upwork Account
                        {!bidEditable && (
                          <span className="ml-1 font-normal text-muted-foreground">
                            (read-only)
                          </span>
                        )}
                      </Label>
                      <Input
                        id="upworkAccount"
                        placeholder="e.g. AOP_Main"
                        value={scriptForm.upworkAccount}
                        onChange={(e) =>
                          setScriptForm((p) => ({ ...p, upworkAccount: e.target.value }))
                        }
                        disabled={!bidEditable}
                      />
                    </div>
                  </div>
                </div>

                {canSaveScript && (
                  <Button
                    onClick={handleSaveScript}
                    disabled={updateProject.isPending}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateProject.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
              </TabsContent>

              {/* ── Videos Tab ───────────────────────────────────────── */}
              <TabsContent
                value="videos"
                className="mt-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    Video Proposals
                    {videos.length > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">
                        ({videos.length})
                      </span>
                    )}
                  </h3>
                  {videoManage && !addingVideo && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setAddingVideo(true)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Video
                    </Button>
                  )}
                </div>

                {/* Add video form */}
                {addingVideo && (
                  <form
                    onSubmit={handleAddVideo}
                    className="space-y-2 rounded-lg border bg-muted/30 p-3"
                  >
                    <Input
                      placeholder="Video URL (Loom, YouTube, Drive, etc.) *"
                      value={videoForm.videoUrl}
                      onChange={(e) => setVideoForm((p) => ({ ...p, videoUrl: e.target.value }))}
                      required
                      autoFocus
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Storage key (optional, defaults to URL)"
                      value={videoForm.storageKey}
                      onChange={(e) => setVideoForm((p) => ({ ...p, storageKey: e.target.value }))}
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        className="h-7 flex-1 text-xs"
                        disabled={createVideo.isPending}
                      >
                        {createVideo.isPending ? 'Adding...' : 'Add Video'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setAddingVideo(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {/* Video list */}
                {videos.length === 0 && !addingVideo && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No video proposals attached yet.
                  </p>
                )}
                {videos.length > 0 && (
                  <div className="space-y-2">
                    {videos.map((v) => (
                      <VideoRow key={v.id} video={v} canDelete={videoManage} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── Review Tab ────────────────────────────────────────── */}
              {showReviewTab && (
                <TabsContent
                  value="review"
                  className="mt-0 flex-1 space-y-5 overflow-y-auto px-6 pb-6"
                >
                  {/* Current review status */}
                  <div className="rounded-md border p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Review Status:</span>
                      {project.reviewStatus === ReviewStatus.PENDING && (
                        <Badge
                          variant="outline"
                          className="border-yellow-500/30 bg-yellow-500/20 text-yellow-400"
                        >
                          Pending
                        </Badge>
                      )}
                      {project.reviewStatus === ReviewStatus.APPROVED && (
                        <Badge
                          variant="outline"
                          className="border-green-500/30 bg-green-500/20 text-green-400"
                        >
                          Approved
                        </Badge>
                      )}
                      {project.reviewStatus === ReviewStatus.REJECTED && (
                        <Badge
                          variant="outline"
                          className="border-red-500/30 bg-red-500/20 text-red-400"
                        >
                          Rejected
                        </Badge>
                      )}
                    </div>
                    {project.reviewedBy && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Reviewed by {formatUserName(project.reviewedBy)} on{' '}
                        {formatDateTime(project.reviewedAt)}
                      </p>
                    )}
                    {project.reviewComments && (
                      <div className="mt-2 rounded-md bg-muted/50 p-2.5">
                        <p className="text-sm">{project.reviewComments}</p>
                      </div>
                    )}
                  </div>

                  {/* Review actions — only for lead/admin */}
                  {canReview(role) && project.reviewStatus === ReviewStatus.PENDING && (
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Review Decision</Label>
                      <Textarea
                        placeholder="Add review comments (optional)..."
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                        rows={3}
                        className="resize-none text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => handleReview(ReviewStatus.APPROVED)}
                          disabled={reviewProject.isPending}
                        >
                          <ThumbsUp className="mr-1.5 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleReview(ReviewStatus.REJECTED)}
                          disabled={reviewProject.isPending}
                        >
                          <ThumbsDown className="mr-1.5 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Read-only for non-reviewers */}
                  {!canReview(role) && (
                    <p className="text-sm text-muted-foreground">
                      {project.reviewStatus === ReviewStatus.PENDING
                        ? 'Waiting for lead/admin to review this submission.'
                        : project.reviewStatus === ReviewStatus.APPROVED
                          ? 'This submission has been approved. You can now submit the bid.'
                          : 'This submission was rejected. Please address the comments and resubmit.'}
                    </p>
                  )}

                  <Separator />

                  {/* Quick view: cover letter & video script */}
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Submitted Materials
                    </h3>
                    {project.coverLetter ? (
                      <div className="rounded-md bg-muted/30 p-3">
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">
                          Cover Letter
                        </p>
                        <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                          {project.coverLetter}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No cover letter written yet.</p>
                    )}
                    {project.videoScript && (
                      <div className="mt-2 rounded-md bg-muted/30 p-3">
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">
                          Video Script
                        </p>
                        <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                          {project.videoScript}
                        </p>
                      </div>
                    )}
                    {videos.length > 0 && (
                      <div className="mt-2">
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">
                          Attached Videos ({videos.length})
                        </p>
                        <div className="space-y-1">
                          {videos.map((v) => (
                            <a
                              key={v.id}
                              href={v.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Video className="h-3 w-3" />
                              {v.videoUrl.length > 50
                                ? v.videoUrl.slice(0, 50) + '...'
                                : v.videoUrl}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              {/* ── Won Details Tab ──────────────────────────────────── */}
              {showWonTab && (
                <TabsContent
                  value="won"
                  className="mt-0 flex-1 space-y-5 overflow-y-auto px-6 pb-6"
                >
                  {/* Won project fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <Label htmlFor="clientName" className="text-xs font-semibold">
                        Client Name
                      </Label>
                      <Input
                        id="clientName"
                        placeholder="Client or company name"
                        value={wonForm.clientName}
                        onChange={(e) => setWonForm((p) => ({ ...p, clientName: e.target.value }))}
                        disabled={!wonEditable}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contractValue" className="text-xs font-semibold">
                        Contract Value ($)
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="contractValue"
                          type="number"
                          min="0"
                          className="pl-7"
                          placeholder="0"
                          value={wonForm.contractValue}
                          onChange={(e) =>
                            setWonForm((p) => ({ ...p, contractValue: e.target.value }))
                          }
                          disabled={!wonEditable}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="currency" className="text-xs font-semibold">
                        Currency
                      </Label>
                      <Select
                        value={wonForm.contractCurrency}
                        onValueChange={(v) => setWonForm((p) => ({ ...p, contractCurrency: v }))}
                        disabled={!wonEditable}
                      >
                        <SelectTrigger id="currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="startDate" className="text-xs font-semibold">
                        Start Date
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={wonForm.startDate}
                        onChange={(e) => setWonForm((p) => ({ ...p, startDate: e.target.value }))}
                        disabled={!wonEditable}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="endDate" className="text-xs font-semibold">
                        End Date
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={wonForm.endDate}
                        onChange={(e) => setWonForm((p) => ({ ...p, endDate: e.target.value }))}
                        disabled={!wonEditable}
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label htmlFor="clientNotes" className="text-xs font-semibold">
                        Client Notes
                      </Label>
                      <Textarea
                        id="clientNotes"
                        rows={3}
                        placeholder="Notes about the client, project requirements, context..."
                        value={wonForm.clientNotes}
                        onChange={(e) => setWonForm((p) => ({ ...p, clientNotes: e.target.value }))}
                        disabled={!wonEditable}
                        className="resize-none"
                      />
                    </div>
                  </div>

                  {wonEditable && (
                    <Button
                      onClick={handleSaveWon}
                      disabled={updateProject.isPending}
                      className="w-full"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateProject.isPending ? 'Saving...' : 'Save Won Details'}
                    </Button>
                  )}

                  <Separator />

                  {/* Milestones */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        Milestones
                        {milestones.data && milestones.data.length > 0 && (
                          <span className="text-xs font-normal text-muted-foreground">
                            ({milestones.data.filter((m) => m.completed).length}/
                            {milestones.data.length} done)
                          </span>
                        )}
                      </h3>
                      {milestoneManage && !addingMilestone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setAddingMilestone(true)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add
                        </Button>
                      )}
                    </div>

                    {/* Add milestone form */}
                    {addingMilestone && (
                      <form
                        onSubmit={handleAddMilestone}
                        className="mb-3 space-y-2 rounded-lg border bg-muted/30 p-3"
                      >
                        <Input
                          placeholder="Milestone name *"
                          value={milestoneForm.name}
                          onChange={(e) =>
                            setMilestoneForm((p) => ({ ...p, name: e.target.value }))
                          }
                          required
                          autoFocus
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            className="h-8 flex-1 text-sm"
                            value={milestoneForm.dueDate}
                            onChange={(e) =>
                              setMilestoneForm((p) => ({ ...p, dueDate: e.target.value }))
                            }
                          />
                          <div className="relative flex-1">
                            <DollarSign className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="Amount"
                              className="h-8 pl-6 text-sm"
                              value={milestoneForm.amount}
                              onChange={(e) =>
                                setMilestoneForm((p) => ({ ...p, amount: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            className="h-7 flex-1 text-xs"
                            disabled={createMilestone.isPending}
                          >
                            {createMilestone.isPending ? 'Adding...' : 'Add Milestone'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setAddingMilestone(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}

                    {milestones.isLoading && <Skeleton className="h-10 w-full" />}
                    {milestones.data && milestones.data.length === 0 && !addingMilestone && (
                      <p className="py-2 text-sm text-muted-foreground">No milestones yet.</p>
                    )}
                    {milestones.data && milestones.data.length > 0 && (
                      <div>
                        {milestones.data.map((m) => (
                          <MilestoneRow
                            key={m.id}
                            milestone={m}
                            canManage={milestoneManage}
                            projectId={project.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
