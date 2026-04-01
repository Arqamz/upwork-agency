// ─── Enums (matching Prisma schema) ──────────────────────────────────────────

export enum ProjectStage {
  DISCOVERED = 'DISCOVERED',
  SCRIPTED = 'SCRIPTED',
  SCRIPT_REVIEW = 'SCRIPT_REVIEW',
  VIDEO_DRAFT = 'VIDEO_DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ASSIGNED = 'ASSIGNED',
  BID_SUBMITTED = 'BID_SUBMITTED',
  VIEWED = 'VIEWED',
  MESSAGED = 'MESSAGED',
  INTERVIEW = 'INTERVIEW',
  WON = 'WON',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  LOST = 'LOST',
  CANCELLED = 'CANCELLED',
}

export enum PricingType {
  HOURLY = 'HOURLY',
  FIXED = 'FIXED',
}

export enum MeetingType {
  INTERVIEW = 'INTERVIEW',
  CLIENT_CHECKIN = 'CLIENT_CHECKIN',
}

export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
  FINALISED = 'FINALISED',
}

export enum QAStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEEDS_CHANGES = 'NEEDS_CHANGES',
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ChatSenderType {
  CLIENT = 'CLIENT',
  AGENCY = 'AGENCY',
}

export enum ProjectLinkType {
  GITHUB = 'GITHUB',
  VERCEL = 'VERCEL',
  STAGING = 'STAGING',
  DOCS = 'DOCS',
  OTHER = 'OTHER',
}

export enum ExperimentStatus {
  DRAFT = 'DRAFT',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ─── Identity & Access ───────────────────────────────────────────────────────

export interface Role {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  roleId: string;
  role?: Role;
  teamId?: string;
  team?: Team;
  organizations?: UserOrganization[];
  createdAt: string;
  updatedAt: string;
}

// ─── Organizations (Multi-tenant) ────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  members?: UserOrganization[];
  createdAt: string;
  updatedAt: string;
}

export interface UserOrganization {
  id: string;
  userId: string;
  user?: User;
  organizationId: string;
  organization?: Organization;
  createdAt: string;
}

// ─── Niches (Org-scoped) ─────────────────────────────────────────────────────

export interface Niche {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  organizationId?: string;
  organization?: Organization;
  createdAt: string;
  updatedAt: string;
}

// ─── Projects (Full Pipeline — Core Entity) ──────────────────────────────────

export interface Project {
  id: string;

  // Job Discovery
  title: string;
  jobUrl?: string;
  jobDescription?: string;
  pricingType: PricingType;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  fixedPrice?: number;

  // Pipeline Stage
  stage: ProjectStage;
  sortOrder: number;

  // Script / Bid Materials
  coverLetter?: string;
  videoScript?: string;
  upworkAccount?: string;
  bidAmount?: number;
  suggestedBidAmount?: number;
  bidSubmittedAt?: string;

  // Script Review (Lead -> Bidder)
  scriptReviewStatus?: ReviewStatus;
  scriptReviewComments?: string;
  scriptReviewedById?: string;
  scriptReviewedBy?: User;
  scriptReviewedAt?: string;

  // Video Review (Lead -> Closer)
  reviewStatus?: ReviewStatus;
  reviewComments?: string;
  reviewedById?: string;
  reviewedBy?: User;
  reviewedAt?: string;

  // Org Scoping
  organizationId: string;
  organization?: Organization;
  nicheId?: string;
  niche?: Niche;
  teamId?: string;
  team?: Team;

  // Assignments
  discoveredById?: string;
  discoveredBy?: User;
  lastEditedById?: string;
  lastEditedBy?: User;
  assignedCloserId?: string;
  assignedCloser?: User;
  assignedPMId?: string;
  assignedPM?: User;

  // Won Project Fields
  clientName?: string;
  clientNotes?: string;
  developerNotes?: string;
  contractValue?: number;
  contractCurrency?: string;
  startDate?: string;
  endDate?: string;

  // Extension metadata
  importedFromExtension?: boolean;
  upworkSkills?: string[];

  // Relations
  milestones?: Milestone[];
  tasks?: Task[];
  meetings?: Meeting[];
  videoProposals?: VideoProposal[];
  chatMessages?: ChatMessage[];
  links?: ProjectLink[];
  experimentAssignments?: ExperimentAssignment[];

  // Counts (from _count includes)
  _count?: {
    tasks?: number;
    meetings?: number;
    milestones?: number;
    videoProposals?: number;
  };

  // Enriched by findAll — per-status task counts
  taskStatusCounts?: Record<string, number>;
  urgentTaskCount?: number;

  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  dueDate?: string;
  amount?: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Video Proposals (attached to Project) ───────────────────────────────────

export interface VideoProposal {
  id: string;
  projectId: string;
  project?: Project;
  videoUrl: string;
  storageKey: string;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Meetings (attached to Project) ──────────────────────────────────────────

export interface Meeting {
  id: string;
  projectId: string;
  project?: Project;
  closerId?: string;
  closer?: User;
  type: MeetingType;
  scheduledAt: string;
  completedAt?: string;
  status: MeetingStatus;
  notes?: string;
  meetingUrl?: string;
  fathomUrl?: string;
  loomUrl?: string;
  driveUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Project Links ───────────────────────────────────────────────────────────

export interface ProjectLink {
  id: string;
  projectId: string;
  label: string;
  url: string;
  type: ProjectLinkType;
  addedById?: string;
  addedBy?: User;
  createdAt: string;
  updatedAt: string;
}

// ─── Upwork Accounts ─────────────────────────────────────────────────────────

export interface UpworkAccount {
  id: string;
  userId: string;
  accountName: string;
  profileUrl?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Chat Messages (Synced from Upwork Extension) ───────────────────────────

export interface ChatMessage {
  id: string;
  projectId: string;
  senderName: string;
  senderType: ChatSenderType;
  content: string;
  sentAt: string;
  upworkRoomId?: string;
  syncedById?: string;
  syncedBy?: User;
  createdAt: string;
}

export interface SyncChatsPayload {
  upworkRoomId?: string;
  messages: {
    senderName: string;
    senderType: ChatSenderType;
    content: string;
    sentAt: string;
  }[];
}

export interface SyncChatsResponse {
  synced: number;
  total: number;
}

export interface ChatLatestResponse {
  latestSentAt: string | null;
  count: number;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  projectId: string;
  project?: Project;
  assigneeId?: string;
  assignee?: User;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number;
  isUrgent?: boolean;
  estimatedHours?: number;
  completedAt?: string;
  qaReview?: QAReview;
  createdAt: string;
  updatedAt: string;
}

// ─── QA Reviews ───────────────────────────────────────────────────────────────

export interface QAReview {
  id: string;
  taskId: string;
  task?: Task;
  reviewerId: string;
  reviewer?: User;
  status: QAStatus;
  score?: number;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  actor?: User;
  organizationId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Experiments ──────────────────────────────────────────────────────────────

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  hypothesis?: string;
  status: ExperimentStatus;
  targetEntity: string;
  variants: unknown[];
  startDate?: string;
  endDate?: string;
  assignments?: ExperimentAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentAssignment {
  id: string;
  experimentId: string;
  experiment?: Experiment;
  projectId?: string;
  project?: Project;
  variant: string;
  outcome?: string;
  assignedAt: string;
  createdAt: string;
}

// ─── Pipeline Counts ──────────────────────────────────────────────────────────

export interface PipelineCount {
  stage: ProjectStage;
  count: number;
}

// ─── Generic Response ─────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
