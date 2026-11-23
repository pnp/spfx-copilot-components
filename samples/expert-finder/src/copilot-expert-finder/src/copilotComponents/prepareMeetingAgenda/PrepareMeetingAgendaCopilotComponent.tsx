import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import { FluentProvider, teamsDarkTheme, teamsLightTheme } from '@fluentui/react-components';
import { GraphMeetingService } from '../expertFinder/services/GraphMeetingService';
import { normalizeAgenda } from '../expertFinder/utils/meetingAgenda';
import { propertiesSchema, type IPrepareMeetingAgendaProperties } from './PrepareMeetingAgendaCopilotComponentProperties';
import { MeetingAgendaReview } from './components/MeetingAgendaReview';

export default class PrepareMeetingAgendaCopilotComponent extends BaseCopilotComponent<IPrepareMeetingAgendaProperties> {
  private _root: Root | undefined;
  private _service: GraphMeetingService | undefined;
  private _inputKey: string | undefined;
  private _disposed = false;

  private _resizeInlineContent = (width: number, height: number): void => {
    if (this._disposed || this.hostContext.displayMode !== 'inline') return;
    this.requestSizeChangeAsync(width, height).catch(() => undefined);
  };

  private _openLink = async (url: string): Promise<void> => {
    const result = await this.context.copilotBridge.openLinkAsync(url);
    if (result.isError) throw new Error('Open the meeting from your Outlook calendar.');
  };

  protected render(): void {
    const input = propertiesSchema.safeParse(this.properties);
    let error = input.success ? '' : 'The agenda request is invalid. Use Prepare agenda with Copilot on the confirmed booking.';
    let agenda = '';
    if (input.success) {
      try { agenda = normalizeAgenda(input.data.agenda); }
      catch (problem) { error = problem instanceof Error ? problem.message : 'The agenda is invalid.'; }
    }
    const key = JSON.stringify(input.success ? input.data : null);
    if (this._inputKey !== key) {
      this._service?.dispose();
      const user = this.context.pageContext.user;
      this._service = new GraphMeetingService(this.context.msGraphClientFactory, {
        displayName: user.displayName, email: user.email, userPrincipalName: user.loginName
      });
      this._inputKey = key;
    }
    if (!this._root) this._root = createRoot(this.context.domElement);
    this._root.render(<FluentProvider targetDocument={this.context.domElement.ownerDocument}
      theme={this.hostContext.theme === 'dark' ? teamsDarkTheme : teamsLightTheme}>
      {error || !input.success || !this._service ? <p role="alert">{error}</p>
        : <MeetingAgendaReview key={key} input={{ ...input.data, agenda }} service={this._service} onOpenLink={this._openLink}
          inline={this.hostContext.displayMode === 'inline'} onContentResize={this._resizeInlineContent} />}
    </FluentProvider>);
  }

  protected onTeardown(): Promise<void> {
    this._disposed = true;
    this._service?.dispose(); this._root?.unmount(); this._root = undefined;
    return Promise.resolve();
  }
}
