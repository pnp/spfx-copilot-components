export type ZavaThemeName = 'light' | 'dark';
export type ZavaSurface = 'webPart' | 'copilotInline' | 'workspace';
export type ZavaWorkspaceMode = 'combined' | 'company' | 'personal';
export type ZavaWorkspaceTab = 'company' | 'personal';
export type ZavaOperation = 'information' | 'review' | 'submit' | 'education';

export type ZavaIntentKey = string;

export interface IZavaPerson {
  id: string;
  displayName: string;
  firstName: string;
  email: string;
  jobTitle: string;
  department: string;
  office: string;
  managerId?: string;
  photoUrl: string;
}

export interface IZavaNewsStory {
  id: string;
  title: string;
  summary: string;
  detail: string;
  category: string;
  region: string;
  publishedAt: string;
  expiresAt: string;
  imageUrl: string;
  imageAlt: string;
  authorId: string;
  featured: boolean;
}

export type LearningStatus = 'notStarted' | 'inProgress' | 'completed';

export interface IZavaLearningAssignment {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  durationMinutes: number;
  required: boolean;
  status: LearningStatus;
  progress: number;
  topics: string[];
}

export type VacationRequestStatus = 'pending' | 'approved' | 'declined';
export type VacationDecision = Exclude<VacationRequestStatus, 'pending'>;

export interface IVacationDecisionEvent {
  id: string;
  decision: VacationDecision;
  decidedAt: string;
  decidedBy: string;
  rationale?: string;
  reference: string;
}

export interface IVacationRequest {
  id: string;
  requesterId: string;
  startDate: string;
  endDate: string;
  workdays: number;
  requestedHours: number;
  submittedAt: string;
  status: VacationRequestStatus;
  leaveType: 'Annual leave' | 'Personal day' | 'Family leave';
  balanceBefore: number;
  projectedBalance: number;
  coverage: 'clear' | 'attention' | 'conflict';
  coverageNote: string;
  requesterNote: string;
  revision: number;
  history: IVacationDecisionEvent[];
}

export interface IZavaCapabilityDefinition {
  id: string;
  title: string;
  category: 'Company' | 'My work' | 'Growth' | 'Services' | 'Business' | 'Help';
  audience: string;
  outcome: string;
  operation: ZavaOperation;
  prompt: string;
  route: string;
}

export interface IZavaModelContextSnapshot {
  intent: ZavaIntentKey;
  surface: ZavaSurface;
  route: string;
  stage: string;
  summary: string;
  visibleIds: string[];
  selectedId?: string;
  filters?: Record<string, string>;
  nextActions: string[];
}

export interface IZavaHostActions {
  requestFullscreen?: () => Promise<void>;
  requestResize?: (height?: number) => Promise<void>;
  publishContext?: (snapshot: IZavaModelContextSnapshot) => Promise<void>;
  sendFollowUp?: (message: string) => Promise<void>;
}

export interface IZavaExperienceProps extends IZavaHostActions {
  intent: ZavaIntentKey;
  surface: ZavaSurface;
  displayMode?: string;
  containerHeight?: number;
  theme?: ZavaThemeName;
  targetDocument: Document;
  currentUserName: string;
  title?: string;
  primaryView?: string;
  defaultScope?: string;
  defaultFilter?: string;
  defaultLocation?: string;
  layout?: string;
  density?: string;
  maxItems?: number;
  showSource?: boolean;
  showImages?: boolean;
  allowActions?: boolean;
  showAgenda?: boolean;
  showTasks?: boolean;
  showMail?: boolean;
  showLearning?: boolean;
  showCompanyHighlights?: boolean;
  showPlanMyDay?: boolean;
  toolProperties?: Readonly<Record<string, unknown>>;
  workspaceMode?: ZavaWorkspaceMode;
  hideWorkspaceHeader?: boolean;
}