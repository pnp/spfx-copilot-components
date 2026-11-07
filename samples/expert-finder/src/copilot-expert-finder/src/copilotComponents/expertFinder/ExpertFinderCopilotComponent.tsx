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

export default class ExpertFinderCopilotComponent extends BaseCopilotComponent<IExpertFinderCopilotComponentProperties> {
  private _root: Root | undefined;
  private _service: IExpertService | undefined;
  private _photoService: GraphPhotoService | undefined;
  private _availabilityService: GraphAvailabilityService | undefined;
  private _meetingService: GraphMeetingService | undefined;
  private _isDemo: boolean = false;
  private _configurationError: string | undefined;
  private _introductionController: AbortController | undefined;
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

  private _introduceExpert = async (expert: Expert): Promise<void> => {
    if (this._disposed) throw new Error('The component is closed.');
    const contextText = buildIntroductionContext(expert, this._isDemo);
    const controller = new AbortController();
    this._introductionController = controller;
    const options = { timeout: 15000, signal: controller.signal };
    const bridge = this.context.copilotBridge;
    try {
      await bridge.updateModelContextAsync({ content: [createCopilotTextContent(contextText)] }, options);
      if (controller.signal.aborted || this._disposed) throw new Error('The component is closed.');
      const result = await bridge.sendFollowUpMessageAsync([createCopilotTextContent(introductionPrompt)], options);
      if (result.isError) throw new Error('The host rejected the draft request.');
    } catch {
      throw new Error('Copilot could not request the draft. Please try again in Microsoft 365 Copilot.');
    } finally {
      if (this._introductionController === controller) this._introductionController = undefined;
    }
  };

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
      onOpenLink: this._openLink,
      onIntroduceExpert: this._introduceExpert
    };
    if (!this._root) this._root = createRoot(this.context.domElement);
    this._root.render(React.createElement(ExpertFinder, props));
  }

  protected onTeardown(): Promise<void> {
    this._disposed = true;
    this._introductionController?.abort();
    this._introductionController = undefined;
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
