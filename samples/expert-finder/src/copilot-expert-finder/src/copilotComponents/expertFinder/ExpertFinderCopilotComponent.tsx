import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BaseCopilotComponent, createCopilotTextContent } from '@microsoft/sp-copilot-component';
import ExpertFinder from './components/ExpertFinder';
import type { IExpertFinderProps } from './components/IExpertFinderProps';
import { propertiesSchema, type IExpertFinderCopilotComponentProperties } from './ExpertFinderCopilotComponentProperties';
import type { IExpertService } from './services/IExpertService';
import { createExpertService } from './services/createExpertService';
import { GraphPhotoService } from './services/GraphPhotoService';
import { GraphAvailabilityService } from './services/GraphAvailabilityService';
import { GraphMeetingService } from './services/GraphMeetingService';
import { normalizeSkill } from './utils/skills';
import type { Expert } from './models/Expert';
import { buildIntroductionContext, introductionPrompt } from './utils/introduction';
import type { AgendaRequest } from './models/MeetingAgenda';
import { buildAgendaHandoff } from './utils/meetingAgenda';

export default class ExpertFinderCopilotComponent extends BaseCopilotComponent<IExpertFinderCopilotComponentProperties> {
  private _root: Root | undefined;
  private _service: IExpertService | undefined;
  private _photoService: GraphPhotoService | undefined;
  private _availabilityService: GraphAvailabilityService | undefined;
  private _meetingService: GraphMeetingService | undefined;
  private _isDemo: boolean = false;
  private _configurationError: string | undefined;
  private _handoffController: AbortController | undefined;
  private _disposed = false;

  protected async onInit(): Promise<void> {
    try {
      const selection = await createExpertService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl);
      this._service = selection.service;
      this._isDemo = selection.isDemo;
      if (!selection.isDemo) {
        this._photoService = new GraphPhotoService(this.context.msGraphClientFactory);
        this._availabilityService = new GraphAvailabilityService(this.context.msGraphClientFactory);
        const user = this.context.pageContext.user;
        this._meetingService = new GraphMeetingService(this.context.msGraphClientFactory, {
          displayName: user.displayName, email: user.email, userPrincipalName: user.loginName
        });
      }
    } catch (error) {
      this._configurationError = error instanceof Error ? error.message : 'The expert data source could not be selected.';
    }
  }

  private _requestFullscreen = async (): Promise<void> => {
    const result = await this.requestDisplayModeAsync('fullscreen');
    if (result.mode !== 'fullscreen') throw new Error('Fullscreen is not available in this host.');
  };

  private _openLink = async (url: string): Promise<void> => {
    const result = await this.context.copilotBridge.openLinkAsync(url);
    if (result.isError) throw new Error('The host could not open this link.');
  };

  private _resizeInlineContent = (width: number, height: number): void => {
    if (this._disposed || this.hostContext.displayMode !== 'inline') return;
    this.requestSizeChangeAsync(width, height).catch(() => undefined);
  };

  private _sendHandoff = async (build: () => Promise<{ context: string; prompt: string }>): Promise<void> => {
    if (this._disposed) throw new Error('The component is closed.');
    if (this._handoffController) throw new Error('Another Copilot request is in progress.');
    const controller = new AbortController();
    this._handoffController = controller;
    const options = { timeout: 15000, signal: controller.signal };
    const bridge = this.context.copilotBridge;
    let sending = false;
    try {
      const handoff = await build();
      if (controller.signal.aborted || this._disposed) throw new Error('The component is closed.');
      await bridge.updateModelContextAsync({ content: [createCopilotTextContent(handoff.context)] }, options);
      if (controller.signal.aborted || this._disposed) throw new Error('The component is closed.');
      sending = true;
      const result = await bridge.sendFollowUpMessageAsync([createCopilotTextContent(handoff.prompt)], options);
      if (result.isError) throw new Error('The host rejected the Copilot request. Inspect the conversation before trying again.');
    } catch (error) {
      if (sending) throw new Error('The Copilot request could not be confirmed. Inspect the conversation before trying again.');
      throw error;
    } finally {
      if (this._handoffController === controller) this._handoffController = undefined;
    }
  };

  private _introduceExpert = (expert: Expert): Promise<void> => this._sendHandoff(async () => ({
    context: buildIntroductionContext(expert, this._isDemo), prompt: introductionPrompt
  }));

  private _prepareAgenda = (request: AgendaRequest): Promise<void> => this._sendHandoff(async () => {
    if (!this._meetingService) throw new Error('Agenda preparation is unavailable for demo profiles.');
    const meeting = await this._meetingService.readMeetingAgenda({ eventId: request.meeting.id, bookingId: request.meeting.bookingId });
    return buildAgendaHandoff(request, meeting);
  });

  protected render(): void {
    const input = propertiesSchema.safeParse(this.properties);
    const skill = input.success ? normalizeSkill(input.data.skill) : undefined;
    const props: IExpertFinderProps = {
      skill,
      inputError: skill ? undefined : 'Ask Copilot to find an expert in SPFx, Copilot, DB or Spanish.',
      service: this._service,
      photoService: this._photoService,
      availabilityService: this._availabilityService,
      meetingService: this._meetingService,
      isDemo: this._isDemo,
      configurationError: this._configurationError,
      hostContext: this.hostContext,
      targetDocument: this.context.domElement.ownerDocument,
      onRequestFullscreen: this._requestFullscreen,
      onContentResize: this._resizeInlineContent,
      onOpenLink: this._openLink,
      onIntroduceExpert: this._introduceExpert,
      onPrepareMeetingAgenda: this._prepareAgenda
    };
    if (!this._root) this._root = createRoot(this.context.domElement);
    this._root.render(React.createElement(ExpertFinder, props));
  }

  protected onTeardown(): Promise<void> {
    this._disposed = true;
    this._handoffController?.abort();
    this._handoffController = undefined;
    this._root?.unmount();
    this._root = undefined;
    this._photoService?.dispose();
    this._photoService = undefined;
    this._availabilityService?.dispose();
    this._availabilityService = undefined;
    this._meetingService?.dispose();
    this._meetingService = undefined;
    return Promise.resolve();
  }
}
