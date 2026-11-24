import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { webLightTheme, type Theme } from '@fluentui/react-components';
import { Environment, EnvironmentType } from '@microsoft/sp-core-library';
import { ThemeProvider, type IReadonlyTheme } from '@microsoft/sp-component-base';
import { BaseCopilotComponent, createCopilotTextContent, type ICopilotComponentHostContext, type SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';

import { WizardApp } from '../../common/components/WizardApp';
import { resolveCopilotConfig, submittedFollowUp } from '../../common/logic/config';
import {
  listModelContext,
  pickedListFollowUp,
  statusChannel,
  writesModelContext,
  type CopilotStatusKind
} from '../../common/logic/copilotStatus';
import { applyPlannedHeight, lockDocumentHeight, planHostHeight, positivePixels, shouldResendSizeRequest, sizeChangeRequest, unlockDocumentHeight, windowMeasures } from '../../common/logic/hostHeight';
import { firstNameFromDisplayName } from '../../common/logic/questionText';
import { resolveAllowedSharePointOrigin } from '../../common/logic/siteUrl';
import type { ISubmitResult } from '../../common/models';
import { DemoListFormService, demoScenarioFromListTitle } from '../../common/services/DemoListFormService';
import type { IListFormService } from '../../common/services/IListFormService';
import { SpHttpAdapter } from '../../common/services/spHttpAdapter';
import { createDemoSiteDirectory, createSiteDirectory, type ISiteDirectory } from '../../common/services/sites';
import { SharePointListFormService } from '../../common/services/SharePointListFormService';
import { toFluentTheme } from '../../common/theme';
import type { IWizardFormCopilotComponentProperties } from './WizardFormCopilotComponentProperties';

/**
 * Guided Form in Microsoft 365 Copilot (tool: open_step_by_step_form).
 * Same wizard core as the page web part. Copilot supplies the list and optional prefill;
 * the person answers, reviews and submits. Chosen or opened status goes to model context
 * (with siteUrl and listName) so a remount can reopen the same list. Chat follow-ups are
 * reserved for submit and save failures, and those results also refresh model context
 * so a prior opened status cannot linger. Answers never go back to the chat.
 */
export default class WizardFormCopilotComponent extends BaseCopilotComponent<IWizardFormCopilotComponentProperties> {
  private _root: Root | undefined;
  private _theme: Theme = webLightTheme;
  private _allowedOrigin: string = '';
  private _service: IListFormService | undefined;
  private _serviceKey: string = '';
  private _sizeRequestKey: string | undefined;
  private _sizeAttempts: number = 0;
  private _heightTimer: number | undefined;
  private _heightRaf: number | undefined;
  private _picked: { siteUrl: string; listTitle: string } | undefined;
  private _lastStatus: string = '';
  private _directoryCache: ISiteDirectory | undefined;
  private _directoryKey: string = '';

  protected async onInit(): Promise<void> {
    this._applyHostTheme();
    this._allowedOrigin = resolveAllowedSharePointOrigin(this._currentWebUrl());
    this._applyHostHeight();
    this._scheduleHostHeight();
    window.addEventListener('resize', this._onWindowResize);
  }

  protected onHostContextChanged(_diff: Partial<ICopilotComponentHostContext>): void {
    this._sizeAttempts = 0;
    this._applyHostHeight();
    this._scheduleHostHeight();
  }

  private get _useDemo(): boolean {
    return !this._allowedOrigin || Environment.type === EnvironmentType.Local || Environment.type === EnvironmentType.Test;
  }

  protected render(): void {
    const properties = {
      ...(this.properties || {}),
      siteUrl: this._picked?.siteUrl || (this.properties && this.properties.siteUrl),
      listName: this._picked?.listTitle || (this.properties && this.properties.listName)
    };
    const config = resolveCopilotConfig(properties, this._allowedOrigin, this._currentWebUrl());
    const demo = this._useDemo;
    let service: IListFormService | undefined;
    if (config.configured) {
      const key = JSON.stringify([demo, config.siteUrl, config.listTitle, config.fields]);
      if (!this._service || key !== this._serviceKey) {
        this._serviceKey = key;
        this._service = demo
          ? new DemoListFormService(demoScenarioFromListTitle(config.listTitle), 300, config.fields)
          : new SharePointListFormService(new SpHttpAdapter(this.context.spHttpClient), {
              siteUrl: config.siteUrl,
              listTitle: config.listTitle,
              fields: config.fields
            });
      }
      service = this._service;
    }
    const fullscreen = this._displayMode() === 'fullscreen';
    const user = this._user();
    const directory = this._directory(demo);
    const element = React.createElement(WizardApp, {
      service,
      listTitle: config.listTitle,
      host: 'Copilot',
      inline: !fullscreen,
      theme: this._theme,
      texts: config.texts,
      showReview: config.showReview,
      animations: config.animations,
      prefill: config.prefill,
      notices: config.notices,
      emptyState: {
        title: 'Which SharePoint list?',
        body: 'Select your SharePoint site and list in the guided form, or tell me the name of the list you want to add an item to.'
      },
      idPrefix: `wizard-${this.context.instanceId}`,
      targetDocument: this.context.domElement.ownerDocument,
      onExpand: fullscreen ? undefined : this._expand,
      onSubmitted: this._handleSubmitted,
      showGreeting: config.showGreeting,
      firstName: user.firstName,
      userId: user.userId,
      instanceId: this.context.instanceId,
      siteUrl: config.siteUrl,
      allowedOrigin: this._allowedOrigin,
      fieldExamples: config.fieldExamples,
      loadingMessage: config.loadingMessage,
      highlightColor: config.highlightColor,
      directory,
      onPickList: (siteUrl, listTitle) => this._onPickList(siteUrl, listTitle),
      onStatus: (message, kind, errorKind) => this._sendStatus(message, kind, errorKind),
      onHostLayout: () => this._scheduleHostHeight(),
      listChosenInForm: !!this._picked
    });

    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }
    this._root.render(element);
    this._applyHostHeight();
    this._scheduleHostHeight();
  }

  protected async onTeardown(): Promise<void> {
    window.removeEventListener('resize', this._onWindowResize);
    this._cancelHostHeight();
    if (this.context && this.context.domElement) {
      unlockDocumentHeight(this.context.domElement.ownerDocument);
    }
    this._root?.unmount();
    this._root = undefined;
  }

  private _displayMode(): 'inline' | 'fullscreen' {
    const host = this.hostContext;
    return host && host.displayMode === 'fullscreen' ? 'fullscreen' : 'inline';
  }

  private readonly _expand = (): void => {
    this.requestDisplayModeAsync('fullscreen' as SPCopilotDisplayMode).catch((error: unknown) => {
      console.error('[WizardForm] Couldn\u2019t open full screen.', error);
    });
  };

  private readonly _onWindowResize = (): void => {
    this._sizeAttempts = 0;
    this._applyHostHeight();
    this._scheduleHostHeight();
  };

  private _cancelHostHeight(): void {
    const view = this._view();
    if (this._heightRaf !== undefined && view) {
      view.cancelAnimationFrame(this._heightRaf);
    }
    if (this._heightTimer !== undefined && view) {
      view.clearTimeout(this._heightTimer);
    }
    this._heightRaf = undefined;
    this._heightTimer = undefined;
  }

  /** Re-apply after paint and once more shortly after, so a request made before host context or first layout is retried. */
  private _scheduleHostHeight(): void {
    const view = this._view();
    if (!view) {
      return;
    }
    this._sizeAttempts = 0;
    this._cancelHostHeight();
    this._heightRaf = view.requestAnimationFrame(() => {
      this._applyHostHeight();
      this._heightTimer = view.setTimeout(() => this._applyHostHeight(), 80);
    });
  }

  private _view(): Window | undefined {
    const element = this.context && this.context.domElement;
    return (element && element.ownerDocument && element.ownerDocument.defaultView) || (typeof window !== 'undefined' ? window : undefined);
  }

  private _applyHostHeight(): void {
    const element = this.context && this.context.domElement;
    if (!element) {
      return;
    }
    const view = this._view();
    const dims = this.hostContext && this.hostContext.containerDimensions;
    const displayMode = this.hostContext && this.hostContext.displayMode ? String(this.hostContext.displayMode) : this._displayMode();
    const plan = planHostHeight({
      displayMode,
      containerHeight: dims && dims.height,
      containerMaxHeight: dims && dims.maxHeight,
      window: windowMeasures(view && {
        innerHeight: view.innerHeight,
        outerHeight: view.outerHeight,
        visualViewport: view.visualViewport ? { height: view.visualViewport.height } : undefined,
        screen: view.screen ? { availHeight: view.screen.availHeight } : undefined
      })
    });
    applyPlannedHeight(element, plan, displayMode);
    lockDocumentHeight(element.ownerDocument, plan.height);
    const width = positivePixels(dims && dims.width) || positivePixels(dims && dims.maxWidth) || positivePixels(element.clientWidth) || (view ? positivePixels(view.innerWidth) : undefined) || 720;
    const wanted = plan.request || (shouldResendSizeRequest({ alreadyRequested: this._sizeRequestKey, width, planned: plan.height, containerHeight: dims && dims.height }) ? plan.height : undefined);
    const size = sizeChangeRequest(width, wanted);
    if (!size) {
      return;
    }
    const key = `${size.width}x${size.height}`;
    const stillShort = shouldResendSizeRequest({ alreadyRequested: key, width, planned: size.height, containerHeight: dims && dims.height });
    if (key === this._sizeRequestKey && !stillShort) {
      return;
    }
    if (key === this._sizeRequestKey && this._sizeAttempts >= 5) {
      return;
    }
    this._sizeRequestKey = key;
    this._sizeAttempts += 1;
    this.requestSizeChangeAsync(size.width, size.height)
      .then((accepted) => {
        if (!accepted) {
          this._sizeRequestKey = undefined;
        }
      })
      .catch((error: unknown) => {
        this._sizeRequestKey = undefined;
        console.error('[WizardForm] Couldn\u2019t resize the Copilot canvas.', error);
      });
  }

  /** Status only: the answers stay in SharePoint and are never sent back to the model. */
  private readonly _handleSubmitted = (result: ISubmitResult, listTitle: string): void => {
    if (result.demo) {
      return;
    }
    this._sendStatus(submittedFollowUp(listTitle), 'submitted');
  };


  private _directory(isDemo: boolean): ISiteDirectory | undefined {
    if (!isDemo && !this._allowedOrigin) {
      this._directoryCache = undefined;
      this._directoryKey = '';
      return undefined;
    }
    const key = isDemo ? 'demo' : `${this._allowedOrigin}|${this._currentWebUrl()}|${this._currentWebTitle()}`;
    if (this._directoryCache && this._directoryKey === key) {
      return this._directoryCache;
    }
    this._directoryKey = key;
    this._directoryCache = isDemo
      ? createDemoSiteDirectory()
      : createSiteDirectory(new SpHttpAdapter(this.context.spHttpClient), this._allowedOrigin, this._currentWebUrl(), this._currentWebTitle());
    return this._directoryCache;
  }

  private _onPickList(siteUrl: string, listTitle: string): void {
    this._picked = { siteUrl, listTitle };
    this._sendStatus(pickedListFollowUp(listTitle), 'chosen');
    this.render();
  }

  private _sendStatus(message: string, kind: CopilotStatusKind, errorKind?: string): void {
    const text = (message || '').trim();
    if (!text || text === this._lastStatus || this._useDemo || !this.context.copilotBridge) {
      return;
    }
    this._lastStatus = text;
    if (statusChannel(kind) === 'followUp') {
      this._sendFollowUp(text);
    }
    if (!writesModelContext(kind)) {
      return;
    }
    const siteUrl = (this._picked && this._picked.siteUrl) || (this.properties && this.properties.siteUrl) || '';
    const listName = (this._picked && this._picked.listTitle) || (this.properties && this.properties.listName) || '';
    this.context.copilotBridge.updateModelContextAsync({
      content: [createCopilotTextContent(text)],
      structuredContent: listModelContext({ siteUrl, listName, status: kind, errorKind })
    }).catch((error: unknown) => {
      console.error('[WizardForm] Couldn\u2019t update the model context.', error);
    });
  }

  private _sendFollowUp(text: string): void {
    this.context.copilotBridge.sendFollowUpMessageAsync([createCopilotTextContent(text)]).catch((error: unknown) => {
      console.error('[WizardForm] Couldn\u2019t send the status message.', error);
    });
  }

  private _applyHostTheme(): void {
    try {
      const provider: ThemeProvider = this.context.serviceScope.consume(ThemeProvider.serviceKey);
      const theme: IReadonlyTheme | undefined = provider.tryGetTheme();
      if (theme) {
        this._theme = toFluentTheme(theme);
      }
    } catch (error) {
      console.error('[WizardForm] Couldn\u2019t read the host theme.', error);
    }
  }

  private _user(): { firstName: string; userId: string } {
    try {
      const page = this.context.pageContext;
      const user = page && page.user;
      return {
        firstName: firstNameFromDisplayName(user && user.displayName),
        userId: user && user.loginName ? String(user.loginName) : ''
      };
    } catch {
      return { firstName: '', userId: '' };
    }
  }

  private _currentWebUrl(): string {
    try {
      const web = this.context.pageContext && this.context.pageContext.web;
      return web && web.absoluteUrl ? web.absoluteUrl.trim().replace(/\/+$/, '') : '';
    } catch {
      return '';
    }
  }

  private _currentWebTitle(): string {
    try {
      const web = this.context.pageContext && this.context.pageContext.web;
      return web && typeof web.title === 'string' ? web.title.trim() : '';
    } catch {
      return '';
    }
  }
}
