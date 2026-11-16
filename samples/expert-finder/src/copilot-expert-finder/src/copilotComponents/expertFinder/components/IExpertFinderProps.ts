import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';
import type { Expert, ExpertSkill } from '../models/Expert';
import type { IExpertService } from '../services/IExpertService';
import type { GraphPhotoService } from '../services/GraphPhotoService';
import type { GraphAvailabilityService } from '../services/GraphAvailabilityService';
import type { GraphMeetingService } from '../services/GraphMeetingService';
import type { AgendaRequest } from '../models/MeetingAgenda';

export interface AgendaAction {
  pending: boolean;
  onRequest: (request: AgendaRequest) => Promise<void>;
}

export interface IntroductionAction {
  disabled?: boolean;
  pendingExpertId?: string;
  error?: { expertId: string; message: string };
  onRequest: (expert: Expert) => Promise<void>;
}

export interface IExpertFinderProps {
  skill?: ExpertSkill;
  inputError?: string;
  configurationError?: string;
  service?: IExpertService;
  photoService?: GraphPhotoService;
  availabilityService?: GraphAvailabilityService;
  meetingService?: GraphMeetingService;
  isDemo: boolean;
  hostContext: ICopilotComponentHostContext;
  targetDocument: Document;
  onRequestFullscreen: () => Promise<void>;
  onContentResize: (width: number, height: number) => void;
  onOpenLink: (url: string) => Promise<void>;
  onIntroduceExpert: (expert: Expert) => Promise<void>;
  onPrepareMeetingAgenda: (request: AgendaRequest) => Promise<void>;
}
