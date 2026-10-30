import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';

import { resolveBrandColors } from '../../common/brand';
import { WeeklyPulseApp } from '../../common/components/WeeklyPulseApp';
import { settingsFromConfigRow } from '../../common/logic/config';
import { resolveAllowedSharePointOrigin, resolveListTitle, resolveSiteUrl } from '../../common/logic/siteUrl';
import type { IPulseSettings } from '../../common/models';
import { DEFAULT_SETTINGS } from '../../common/models';
import { DemoPulseDataSource } from '../../common/services/DemoPulseDataSource';
import type { IPulseDataSource } from '../../common/services/IPulseDataSource';
import { SharePointPulseService } from '../../common/services/SharePointPulseService';
import { SpHttpAdapter } from '../../common/services/spHttpAdapter';
import type { IWeeklyPulseQuizCopilotComponentProperties } from './WeeklyPulseQuizCopilotComponentProperties';

/**
 * Weekly Pulse Quiz in Microsoft 365 Copilot (tool: show_weekly_quiz).
 * Settings come from the one-row "Weekly Pulse Config" list (created by the setup script);
 * built-in defaults apply when it is missing. Uses the same UI and logic as the web part,
 * with an inline "Why?" panel instead of a dialog. Answers are never posted into the chat.
 */
export default class WeeklyPulseQuizCopilotComponent extends BaseCopilotComponent<IWeeklyPulseQuizCopilotComponentProperties> {
  private _root: Root | undefined;
  private _settings: IPulseSettings = DEFAULT_SETTINGS;
  private _dataSource: IPulseDataSource | undefined;

  protected async onInit(): Promise<void> {
    const allowedOrigin = resolveAllowedSharePointOrigin(this.context.pageContext.web.absoluteUrl);
    if (!allowedOrigin) {
      this._dataSource = new DemoPulseDataSource('quiz');
      return;
    }
    const args = this.properties || {};
    const questionsSiteUrl = resolveSiteUrl(args.siteUrl, allowedOrigin);
    const bootstrap: IPulseSettings = { ...DEFAULT_SETTINGS, questionsSiteUrl, responsesSiteUrl: questionsSiteUrl };
    const http = new SpHttpAdapter(this.context.spHttpClient);
    const configReader = new SharePointPulseService(http, bootstrap, 'Copilot');
    const row = await configReader.loadConfigRow(questionsSiteUrl);
    const fromConfig = settingsFromConfigRow(row, questionsSiteUrl, allowedOrigin);
    this._settings = {
      ...fromConfig,
      questionsListTitle: resolveListTitle(args.questionsListTitle, fromConfig.questionsListTitle)
    };
    this._dataSource = new SharePointPulseService(http, this._settings, 'Copilot');
  }

  protected render(): void {
    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }
    this._root.render(
      React.createElement(WeeklyPulseApp, {
        dataSource: this._dataSource || new DemoPulseDataSource('quiz'),
        settings: this._settings,
        colors: resolveBrandColors(undefined),
        host: 'Copilot',
        targetDocument: this.context.domElement.ownerDocument
      })
    );
  }

  protected async onTeardown(): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
  }
}
