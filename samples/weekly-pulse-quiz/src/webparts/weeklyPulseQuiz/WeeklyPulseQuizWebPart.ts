import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DisplayMode, Environment, EnvironmentType, Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneChoiceGroup,
  PropertyPaneLabel,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'WeeklyPulseQuizWebPartStrings';
import { normalizeHex, resolveBrandColors } from '../../common/brand';
import { WeeklyPulseApp } from '../../common/components/WeeklyPulseApp';
import { resolveListTitle, resolveSiteUrl, isUsableSiteUrl, resolveAllowedSharePointOrigin } from '../../common/logic/siteUrl';
import type { AnonymityMode, IPulseSettings } from '../../common/models';
import { DEFAULT_QUESTIONS_LIST, DEFAULT_RESPONSES_LIST, DEFAULT_SETTINGS, QUIZ_TIME_ZONE } from '../../common/models';
import { DemoPulseDataSource } from '../../common/services/DemoPulseDataSource';
import type { IPulseDataSource } from '../../common/services/IPulseDataSource';
import { SharePointPulseService } from '../../common/services/SharePointPulseService';
import { SpHttpAdapter } from '../../common/services/spHttpAdapter';
import type { IListSetup } from '../../common/setup/IListSetup';
import { ListSetupService } from '../../common/setup/ListSetupService';

export interface IWeeklyPulseQuizWebPartProps {
  questionsSiteUrl: string;
  questionsListTitle: string;
  responsesSiteUrl: string;
  responsesListTitle: string;
  anonymityMode: AnonymityMode;
  showCorrectAnswer: boolean;
  showJustification: boolean;
  animations: boolean;
  bannerTitle: string;
  introText: string;
  noQuizText: string;
  bannerColor: string;
  buttonColor: string;
  accentColor: string;
}

export default class WeeklyPulseQuizWebPart extends BaseClientSideWebPart<IWeeklyPulseQuizWebPartProps> {
  private _root: Root | undefined;
  private _theme: IReadonlyTheme | undefined;
  private _allowedOrigin: string = '';
  private _dataSource: IPulseDataSource | undefined;
  private _dataKey: string = '';
  private _listSetup: IListSetup | undefined;

  protected async onInit(): Promise<void> {
    this._allowedOrigin = resolveAllowedSharePointOrigin(this.context.pageContext.web.absoluteUrl);
    return super.onInit();
  }

  private _settings(): IPulseSettings {
    const p = this.properties;
    const questionsSiteUrl = resolveSiteUrl(p.questionsSiteUrl, this._allowedOrigin);
    return {
      questionsSiteUrl,
      questionsListTitle: resolveListTitle(p.questionsListTitle, DEFAULT_QUESTIONS_LIST),
      responsesSiteUrl: (p.responsesSiteUrl || '').trim() ? resolveSiteUrl(p.responsesSiteUrl, this._allowedOrigin) : questionsSiteUrl,
      responsesListTitle: resolveListTitle(p.responsesListTitle, DEFAULT_RESPONSES_LIST),
      anonymityMode: p.anonymityMode === 'Named' ? 'Named' : 'Anonymous',
      showCorrectAnswer: p.showCorrectAnswer !== false,
      showJustification: p.showJustification !== false,
      animations: p.animations !== false,
      bannerTitle: (p.bannerTitle || '').trim() || DEFAULT_SETTINGS.bannerTitle,
      introText: p.introText === undefined ? DEFAULT_SETTINGS.introText : p.introText.trim(),
      noQuizText: (p.noQuizText || '').trim() || DEFAULT_SETTINGS.noQuizText
    };
  }

  private get _useDemo(): boolean {
    return !this._allowedOrigin || Environment.type === EnvironmentType.Local || Environment.type === EnvironmentType.Test;
  }

  private _getDataSource(settings: IPulseSettings): IPulseDataSource {
    const useDemo = this._useDemo;
    const key = JSON.stringify([useDemo, settings.questionsSiteUrl, settings.questionsListTitle, settings.responsesSiteUrl, settings.responsesListTitle, settings.anonymityMode]);
    if (!this._dataSource || key !== this._dataKey) {
      this._dataKey = key;
      this._dataSource = useDemo
        ? new DemoPulseDataSource('quiz')
        : new SharePointPulseService(new SpHttpAdapter(this.context.spHttpClient), settings, 'WebPart');
      this._listSetup = useDemo ? undefined : this._createListSetup(settings);
    }
    return this._dataSource;
  }

  /** "Set up lists": SharePoint REST through SPHttpClient, same tenant only, no API permissions. */
  private _createListSetup(settings: IPulseSettings): IListSetup | undefined {
    try {
      return new ListSetupService(
        new SpHttpAdapter(this.context.spHttpClient),
        {
          questionsSiteUrl: settings.questionsSiteUrl,
          questionsListTitle: settings.questionsListTitle,
          responsesSiteUrl: settings.responsesSiteUrl,
          responsesListTitle: settings.responsesListTitle,
          anonymityMode: settings.anonymityMode,
          tenantId: this.context.pageContext.aadInfo?.tenantId?.toString() || '',
          responsesSiteExplicit: !!(this.properties.responsesSiteUrl || '').trim() && settings.responsesSiteUrl !== settings.questionsSiteUrl
        },
        this._allowedOrigin
      );
    } catch {
      return undefined;
    }
  }

  public render(): void {
    const settings = this._settings();
    const colors = resolveBrandColors(this._theme, {
      bannerColor: this.properties.bannerColor,
      buttonColor: this.properties.buttonColor,
      accentColor: this.properties.accentColor
    });
    const dataSource = this._getDataSource(settings);
    const element = React.createElement(WeeklyPulseApp, {
      dataSource,
      listSetup: this._listSetup,
      settings,
      colors,
      host: 'WebPart',
      isEditMode: this.displayMode === DisplayMode.Edit,
      targetDocument: this.domElement.ownerDocument
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
    this._root?.unmount();
    this._root = undefined;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  private _validateUrl = (value: string): string => {
    const v = (value || '').trim();
    return !v || isUsableSiteUrl(v, this._allowedOrigin) ? '' : strings.InvalidUrl;
  };

  private _validateColor = (value: string): string => {
    const v = (value || '').trim();
    return !v || normalizeHex(v) ? '' : strings.InvalidColor;
  };

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.DataGroupName,
              groupFields: [
                PropertyPaneTextField('questionsSiteUrl', {
                  label: strings.QuestionsSiteUrlLabel,
                  description: strings.QuestionsSiteUrlDescription,
                  onGetErrorMessage: this._validateUrl,
                  deferredValidationTime: 500
                }),
                PropertyPaneTextField('questionsListTitle', { label: strings.QuestionsListTitleLabel }),
                PropertyPaneTextField('responsesSiteUrl', {
                  label: strings.ResponsesSiteUrlLabel,
                  description: strings.ResponsesSiteUrlDescription,
                  onGetErrorMessage: this._validateUrl,
                  deferredValidationTime: 500
                }),
                PropertyPaneTextField('responsesListTitle', { label: strings.ResponsesListTitleLabel })
              ]
            },
            {
              groupName: strings.BehaviourGroupName,
              groupFields: [
                PropertyPaneChoiceGroup('anonymityMode', {
                  label: strings.AnonymityModeLabel,
                  options: [
                    { key: 'Anonymous', text: strings.AnonymousOption },
                    { key: 'Named', text: strings.NamedOption }
                  ]
                }),
                PropertyPaneToggle('showCorrectAnswer', { label: strings.ShowCorrectAnswerLabel, onText: strings.OnText, offText: strings.OffText }),
                PropertyPaneToggle('showJustification', { label: strings.ShowJustificationLabel, onText: strings.OnText, offText: strings.OffText }),
                PropertyPaneToggle('animations', { label: strings.AnimationsLabel, onText: strings.OnText, offText: strings.OffText }),
                PropertyPaneLabel('weekNote', { text: strings.WeekNote.replace('{0}', QUIZ_TIME_ZONE) })
              ]
            },
            {
              groupName: strings.TextGroupName,
              groupFields: [
                PropertyPaneTextField('bannerTitle', { label: strings.BannerTitleLabel }),
                PropertyPaneTextField('introText', { label: strings.IntroTextLabel, multiline: true }),
                PropertyPaneTextField('noQuizText', { label: strings.NoQuizTextLabel, multiline: true })
              ]
            },
            {
              groupName: strings.BrandGroupName,
              groupFields: [
                PropertyPaneTextField('bannerColor', { label: strings.BannerColorLabel, description: strings.ColorDescription, onGetErrorMessage: this._validateColor }),
                PropertyPaneTextField('buttonColor', { label: strings.ButtonColorLabel, onGetErrorMessage: this._validateColor }),
                PropertyPaneTextField('accentColor', { label: strings.AccentColorLabel, onGetErrorMessage: this._validateColor })
              ]
            }
          ]
        }
      ]
    };
  }
}
