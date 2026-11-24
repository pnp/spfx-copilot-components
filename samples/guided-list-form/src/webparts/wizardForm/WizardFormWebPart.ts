import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DisplayMode, Environment, EnvironmentType, Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  type IPropertyPaneDropdownOption,
  PropertyPaneButton,
  PropertyPaneButtonType,
  PropertyPaneDropdown,
  PropertyPaneLabel,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'WizardFormWebPartStrings';
import { WizardApp } from '../../common/components/WizardApp';
import { QuestionEditor } from '../../common/components/QuestionEditor';
import { normalizeHex } from '../../common/logic/color';
import { resolveWebPartConfig, type IResolvedConfig } from '../../common/logic/config';
import { firstNameFromDisplayName } from '../../common/logic/questionText';
import { isUsableSiteUrl, parseFieldList, resolveAllowedSharePointOrigin, resolveListTitle } from '../../common/logic/siteUrl';
import type { IFormSchema } from '../../common/models';
import { DemoListFormService } from '../../common/services/DemoListFormService';
import type { IListFormService } from '../../common/services/IListFormService';
import { listDropdownOptions, listsSiteUrl, loadCustomLists } from '../../common/services/lists';
import { SharePointListFormService } from '../../common/services/SharePointListFormService';
import { SpHttpAdapter } from '../../common/services/spHttpAdapter';
import { applyAccent, toFluentTheme } from '../../common/theme';

export interface IWizardFormWebPartProps {
  siteUrl: string;
  listName: string;
  fields: string;
  formTitle: string;
  introText: string;
  thankYouText: string;
  showReview: boolean;
  animations: boolean;
  accentColor: string;
  showGreeting: boolean;
  questionTexts: string;
  fieldExamples: string;
  skipLogic: string;
  answerChecks: string;
  loadingMessage: string;
  highlightColor: string;
  formHeight: 'auto' | '480' | '600' | '800';
}

export default class WizardFormWebPart extends BaseClientSideWebPart<IWizardFormWebPartProps> {
  private _root: Root | undefined;
  private _theme: IReadonlyTheme | undefined;
  private _allowedOrigin: string = '';
  private _service: IListFormService | undefined;
  private _serviceKey: string = '';
  private _editorRoot: Root | undefined;
  private _editorHost: HTMLElement | undefined;
  private _listOptions: IPropertyPaneDropdownOption[] = [];
  private _listsLoading: boolean = false;
  private _listsMessage: string = '';
  private _listLoadTimer: number | undefined;
  private _listLoadToken: number = 0;
  private _lastListQuery: string = '';

  protected async onInit(): Promise<void> {
    this._allowedOrigin = resolveAllowedSharePointOrigin(this.context.pageContext.web.absoluteUrl);
    if (!this.properties.formHeight) {
      this.properties.formHeight = 'auto';
    }
    return super.onInit();
  }

  private get _useDemo(): boolean {
    return !this._allowedOrigin || Environment.type === EnvironmentType.Local || Environment.type === EnvironmentType.Test;
  }

  private _config(): IResolvedConfig {
    return resolveWebPartConfig(this.properties, this._allowedOrigin, this.context.pageContext.web.absoluteUrl);
  }

  private _user(): { firstName: string; userId: string } {
    try {
      const user = this.context.pageContext && this.context.pageContext.user;
      return {
        firstName: firstNameFromDisplayName(user && user.displayName),
        userId: user && user.loginName ? String(user.loginName) : ''
      };
    } catch {
      return { firstName: '', userId: '' };
    }
  }

  /** One service per site/list/fields combination so the schema is only re-read when they change. */
  private _getService(config: IResolvedConfig): IListFormService | undefined {
    const demo = this._useDemo;
    if (!demo && !config.configured) {
      this._service = undefined;
      this._serviceKey = '';
      return undefined;
    }
    const key = JSON.stringify([demo, config.siteUrl, config.listTitle, config.fields]);
    if (!this._service || key !== this._serviceKey) {
      this._serviceKey = key;
      this._service = demo
        ? new DemoListFormService('request', 300, config.fields)
        : new SharePointListFormService(new SpHttpAdapter(this.context.spHttpClient), {
            siteUrl: config.siteUrl,
            listTitle: config.listTitle,
            fields: config.fields
          });
    }
    return this._service;
  }

  public render(): void {
    const config = this._config();
    const service = this._getService(config);
    const isEdit = this.displayMode === DisplayMode.Edit;
    const user = this._user();
    const element = React.createElement(WizardApp, {
      service,
      listTitle: config.listTitle,
      host: 'WebPart',
      theme: applyAccent(toFluentTheme(this._theme), config.accentColor),
      accentColor: config.accentColor,
      texts: config.texts,
      showReview: config.showReview,
      animations: config.animations,
      notices: isEdit ? config.notices : [],
      emptyState: {
        title: strings.EmptyTitle,
        body: isEdit ? strings.EmptyBodyEdit : strings.EmptyBodyView
      },
      idPrefix: `wizard-${this.context.instanceId}`,
      targetDocument: this.domElement.ownerDocument,
      showGreeting: config.showGreeting,
      firstName: user.firstName,
      userId: user.userId,
      instanceId: this.context.instanceId,
      siteUrl: config.siteUrl,
      allowedOrigin: this._allowedOrigin,
      questionTexts: config.questionTexts,
      fieldExamples: config.fieldExamples,
      skipRules: config.skipRules,
      answerChecks: config.answerChecks,
      loadingMessage: config.loadingMessage,
      highlightColor: config.highlightColor,
      formHeight: this.properties.formHeight || 'auto'
    });
    if (!this._root) {
      this._root = createRoot(this.domElement);
    }
    this._root.render(element);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    this._theme = currentTheme;
    if (this._root) {
      this.render();
    }
  }

  protected onDispose(): void {
    if (this._listLoadTimer !== undefined) {
      window.clearTimeout(this._listLoadTimer);
    }
    this._closeQuestionEditor();
    this._root?.unmount();
    this._root = undefined;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.4');
  }

  protected get disableReactivePropertyChanges(): boolean {
    // Typing a site URL or JSON field letter by letter should not reload the form until Apply.
    return true;
  }

  private _validateUrl = (value: string): string => {
    const v = (value || '').trim();
    const ok = !v || isUsableSiteUrl(v, this._allowedOrigin);
    if (ok) {
      this._scheduleListLoad(v);
    }
    return ok ? '' : strings.InvalidUrl;
  };

  private _validateFields = (value: string): string => {
    const raw = (value || '').split(/[,;\n]/).map((t) => t.trim()).filter(Boolean);
    return raw.length === parseFieldList(value).length ? '' : strings.InvalidFields;
  };

  private _validateColor = (value: string): string => {
    const v = (value || '').trim();
    return !v || normalizeHex(v) ? '' : strings.InvalidColor;
  };



  private _scheduleListLoad(siteUrl: string): void {
    const query = (siteUrl || '').trim();
    if (query === this._lastListQuery && this._listOptions.length > 0 && !this._listsLoading) {
      return;
    }
    if (this._listLoadTimer !== undefined) {
      window.clearTimeout(this._listLoadTimer);
    }
    this._listLoadTimer = window.setTimeout(() => {
      this._listLoadTimer = undefined;
      this._loadLists(query).catch(() => undefined);
    }, 400);
  }

  private async _loadLists(siteUrl: string): Promise<void> {
    const query = (siteUrl || '').trim();
    const token = ++this._listLoadToken;
    const refresh = (): void => {
      if (this.context.propertyPane && this.context.propertyPane.isPropertyPaneOpen()) {
        this.context.propertyPane.refresh();
      }
    };
    if (this._useDemo) {
      this._lastListQuery = query;
      this._listsLoading = false;
      this._listOptions = listDropdownOptions(
        [
          { title: 'IT Requests', id: 'demo-1' },
          { title: 'Equipment Issues', id: 'demo-2' }
        ],
        this.properties.listName
      );
      this._listsMessage = '';
      refresh();
      return;
    }
    const resolved = listsSiteUrl(query, this._allowedOrigin, this.context.pageContext.web.absoluteUrl);
    if (!resolved.siteUrl) {
      this._lastListQuery = query;
      this._listsLoading = false;
      this._listOptions = listDropdownOptions([], this.properties.listName);
      this._listsMessage = strings.ListsInvalidSite;
      refresh();
      return;
    }
    this._listsLoading = true;
    this._listsMessage = strings.ListsLoading;
    refresh();
    try {
      const lists = await loadCustomLists(new SpHttpAdapter(this.context.spHttpClient), resolved.siteUrl);
      if (token !== this._listLoadToken) {
        return;
      }
      this._lastListQuery = query;
      this._listOptions = listDropdownOptions(lists, this.properties.listName);
      this._listsMessage = lists.length === 0 ? strings.ListsEmpty : '';
    } catch {
      if (token !== this._listLoadToken) {
        return;
      }
      this._lastListQuery = query;
      this._listOptions = listDropdownOptions([], this.properties.listName);
      this._listsMessage = strings.ListsError;
    } finally {
      if (token === this._listLoadToken) {
        this._listsLoading = false;
        refresh();
      }
    }
  }

  protected onPropertyPaneConfigurationStart(): void {
    this._scheduleListLoad(this.properties.siteUrl);
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: unknown, newValue: unknown): void {
    if (propertyPath === 'siteUrl' && oldValue !== newValue) {
      this._scheduleListLoad(typeof newValue === 'string' ? newValue : '');
    }
    if (propertyPath === 'listName' && typeof newValue === 'string' && !resolveListTitle(newValue)) {
      this.properties.listName = '';
    }
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const options: IPropertyPaneDropdownOption[] = listDropdownOptions(
      this._listOptions.map((o) => ({ title: String(o.key), id: String(o.key) })),
      this.properties.listName
    ).map((o) => ({ key: o.key, text: o.text }));
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.ListGroupName,
              groupFields: [
                PropertyPaneTextField('siteUrl', {
                  label: strings.SiteUrlLabel,
                  description: strings.SiteUrlDescription,
                  onGetErrorMessage: this._validateUrl,
                  deferredValidationTime: 500
                }),
                PropertyPaneDropdown('listName', {
                  label: strings.ListNameLabel,
                  options,
                  disabled: this._listsLoading,
                  ariaLabel: strings.ListPlaceholder
                }),
                PropertyPaneLabel('listHelp', { text: this._listsMessage || strings.ListNameDescription }),
                PropertyPaneTextField('fields', {
                  label: strings.FieldsLabel,
                  description: strings.FieldsDescription,
                  multiline: true,
                  rows: 3,
                  onGetErrorMessage: this._validateFields,
                  deferredValidationTime: 500
                }),
                PropertyPaneLabel('supportedNote', { text: strings.SupportedNote })
              ]
            },
            {
              groupName: strings.TextGroupName,
              groupFields: [
                PropertyPaneTextField('formTitle', { label: strings.FormTitleLabel, description: strings.FormTitleDescription }),
                PropertyPaneTextField('introText', { label: strings.IntroTextLabel, multiline: true }),
                PropertyPaneTextField('thankYouText', { label: strings.ThankYouTextLabel }),
                PropertyPaneToggle('showGreeting', {
                  label: strings.ShowGreetingLabel,
                  onText: strings.ShowGreetingOn,
                  offText: strings.ShowGreetingOff
                })
              ]
            },
            {
              groupName: strings.LogicGroupName,
              groupFields: [
                PropertyPaneLabel('customizeHelp', { text: strings.CustomizeQuestionsDescription }),
                PropertyPaneButton('customizeQuestions', {
                  text: strings.CustomizeQuestionsLabel,
                  buttonType: PropertyPaneButtonType.Normal,
                  onClick: () => {
                    this._openQuestionEditor();
                  }
                })
              ]
            },
            {
              groupName: strings.BehaviourGroupName,
              groupFields: [
                PropertyPaneToggle('showReview', { label: strings.ShowReviewLabel, onText: strings.OnText, offText: strings.OffText }),
                PropertyPaneToggle('animations', { label: strings.AnimationsLabel, onText: strings.OnText, offText: strings.OffText }),
                PropertyPaneLabel('motionNote', { text: strings.MotionNote }),
                PropertyPaneDropdown('formHeight', {
                  label: strings.FormHeightLabel,
                  options: [
                    { key: 'auto', text: strings.FormHeightAuto },
                    { key: '480', text: strings.FormHeight480 },
                    { key: '600', text: strings.FormHeight600 },
                    { key: '800', text: strings.FormHeight800 }
                  ]
                }),
                PropertyPaneLabel('formHeightHelp', { text: strings.FormHeightDescription }),
                PropertyPaneTextField('accentColor', {
                  label: strings.AccentColorLabel,
                  description: strings.AccentColorDescription,
                  onGetErrorMessage: this._validateColor
                }),
                PropertyPaneTextField('highlightColor', {
                  label: strings.HighlightColorLabel,
                  description: strings.HighlightColorDescription,
                  onGetErrorMessage: this._validateColor
                }),
                PropertyPaneTextField('loadingMessage', {
                  label: strings.LoadingMessageLabel,
                  description: strings.LoadingMessageDescription
                })
              ]
            }
          ]
        }
      ]
    };
  }


  private _closeQuestionEditor(): void {
    this._editorRoot?.unmount();
    this._editorRoot = undefined;
    if (this._editorHost && this._editorHost.parentNode) {
      this._editorHost.parentNode.removeChild(this._editorHost);
    }
    this._editorHost = undefined;
  }

  private _openQuestionEditor(): void {
    const config = this._config();
    const service = this._getService(config);
    if (!service) {
      window.alert(strings.CustomizeQuestionsNeedList);
      return;
    }
    service.loadSchema().then((schema: IFormSchema) => {
      if (schema.fields.length === 0) {
          window.alert(strings.CustomizeQuestionsNeedList);
        return;
      }
      this._mountQuestionEditor(schema, config);
    }).catch(() => {
      window.alert(strings.CustomizeQuestionsNeedList);
    });
  }

  private _mountQuestionEditor(schema: IFormSchema, config: IResolvedConfig): void {
    this._closeQuestionEditor();
    const doc = this.domElement.ownerDocument || document;
    const host = doc.createElement('div');
    host.setAttribute('data-testid', 'qe-host');
    host.style.position = 'fixed';
    host.style.inset = '0';
    host.style.zIndex = '1000';
    const overlay = doc.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.40)';
    const shell = doc.createElement('div');
    shell.style.position = 'absolute';
    shell.style.top = '0';
    shell.style.right = '0';
    shell.style.width = '460px';
    shell.style.maxWidth = '100%';
    shell.style.height = '100%';
    shell.style.boxShadow = '-4px 0 16px rgba(0,0,0,0.22)';
    host.appendChild(overlay);
    host.appendChild(shell);
    overlay.addEventListener('click', () => this._closeQuestionEditor());
    doc.body.appendChild(host);
    this._editorHost = host;
    this._editorRoot = createRoot(shell);
    const user = this._user();
    this._editorRoot.render(
      React.createElement(QuestionEditor, {
        fields: schema.fields,
        questionTexts: config.questionTexts,
        fieldExamples: config.fieldExamples,
        skipRules: config.skipRules,
        answerChecks: config.answerChecks,
        firstName: user.firstName || 'Alex',
        onSave: (next) => {
          this.properties.questionTexts = JSON.stringify(next.questionTexts);
          this.properties.fieldExamples = JSON.stringify(next.fieldExamples);
          this.properties.skipLogic = JSON.stringify(next.skipLogic);
          this.properties.answerChecks = JSON.stringify(next.answerChecks);
          this._closeQuestionEditor();
          this.render();
          if (this.context.propertyPane.isPropertyPaneOpen()) {
            this.context.propertyPane.refresh();
          }
        },
        onCancel: () => this._closeQuestionEditor()
      })
    );
  }
}
