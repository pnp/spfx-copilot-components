import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Version } from '@microsoft/sp-core-library';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';
import {
  type IPropertyPaneField,
  type IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import {
  getConfigurationDefault,
  getWebPartConfiguration,
  type IZavaTopActionDefinition,
  type IZavaWebPartConfigurationDefinition,
  type ZavaWebPartProperty
} from '../catalog/webPartConfigurations';
import { getCapabilityByIntent } from '../catalog/capabilities';
import type {
  ITopActions,
  ITopActionsDropdownProps,
  ITopActionsField,
  TopActionsFieldType
} from '@microsoft/sp-top-actions';
import { ZavaOneApp } from '../components/ZavaOneApp';
import type { ZavaIntentKey, ZavaWorkspaceMode } from '../models/zavaOne';

export interface IZavaOneWebPartProperties {
  title?: string;
  primaryView?: string;
  scope?: string;
  filter?: string;
  location?: string;
  density?: string;
  showSource?: boolean;
  showImages?: boolean;
  // Kept for compatibility with pages created before catalog-driven configuration.
  defaultScope?: string;
  layout?: string;
  maxItems?: number;
  allowActions?: boolean;
  showAgenda?: boolean;
  showTasks?: boolean;
  showMail?: boolean;
  showLearning?: boolean;
  showCompanyHighlights?: boolean;
  showPlanMyDay?: boolean;
}

export abstract class ZavaOneWebPartBase<TProperties extends IZavaOneWebPartProperties>
  extends BaseClientSideWebPart<TProperties> {
  protected abstract readonly intent: ZavaIntentKey;
  protected readonly workspaceMode: ZavaWorkspaceMode | undefined = undefined;
  private _root: Root | undefined;
  private _isDarkTheme: boolean = false;
  private _effectiveProperties: IZavaOneWebPartProperties & Record<string, unknown> = {};

  private _getProperties(): IZavaOneWebPartProperties & Record<string, unknown> {
    const hostProperties = this.properties as (IZavaOneWebPartProperties & Record<string, unknown>) | undefined;
    if (hostProperties) this._effectiveProperties = hostProperties;
    return this._effectiveProperties;
  }

  protected async onInit(): Promise<void> {
    try {
      await super.onInit();
      const definition = this._getConfiguration();
      const properties = this._getProperties();
      if (definition) {
        Object.keys(definition.defaults).forEach((property) => {
          if (properties[property] === undefined) {
            properties[property] = getConfigurationDefault(definition, property as ZavaWebPartProperty);
          }
        });
      }
      if (this.intent === 'workspace' && this.workspaceMode !== 'combined') {
        properties.primaryView = this.workspaceMode;
      }
    } catch (error) {
      throw this._lifecycleError('initialization', error);
    }
  }

  public render(): void {
    try {
      if (!this._root) {
        this._root = createRoot(this.domElement);
      }

      const definition = this._getConfiguration();
      const properties = this._getProperties();
      const primaryView = properties.primaryView || properties.layout || definition?.defaults.primaryView;
      const scope = properties.scope || properties.defaultScope || definition?.defaults.scope;
      const filter = properties.filter || definition?.defaults.filter;
      const location = properties.location || definition?.defaults.location;
      const configurationKey = JSON.stringify({
        primaryView,
        scope,
        density: properties.density,
        maxItems: properties.maxItems,
        showSource: properties.showSource,
        showImages: properties.showImages,
        allowActions: properties.allowActions,
        showAgenda: properties.showAgenda,
        showTasks: properties.showTasks,
        showMail: properties.showMail,
        showLearning: properties.showLearning,
        showCompanyHighlights: properties.showCompanyHighlights,
        showPlanMyDay: properties.showPlanMyDay
      });
      this._root.render(React.createElement(ZavaOneApp, {
        key: configurationKey,
        intent: this.intent,
        surface: this.intent === 'workspace' ? 'workspace' : 'webPart',
        workspaceMode: this.workspaceMode,
        hideWorkspaceHeader: this.intent === 'workspace' && !!this.context.sdks.microsoftTeams,
        targetDocument: this.domElement.ownerDocument,
        theme: this._isDarkTheme ? 'dark' : 'light',
        currentUserName: this.context.pageContext.user.displayName || 'Megan Bowen',
        title: properties.title,
        primaryView,
        defaultScope: scope || filter || location,
        defaultFilter: filter,
        defaultLocation: location,
        layout: primaryView,
        density: properties.density || definition?.defaults.density,
        maxItems: properties.maxItems || definition?.defaults.maxItems,
        showSource: properties.showSource ?? definition?.defaults.showSource,
        showImages: properties.showImages ?? definition?.defaults.showImages,
        allowActions: properties.allowActions ?? definition?.defaults.allowActions,
        showAgenda: properties.showAgenda ?? definition?.defaults.showAgenda,
        showTasks: properties.showTasks ?? definition?.defaults.showTasks,
        showMail: properties.showMail ?? definition?.defaults.showMail,
        showLearning: properties.showLearning ?? definition?.defaults.showLearning,
        showCompanyHighlights: properties.showCompanyHighlights ?? definition?.defaults.showCompanyHighlights,
        showPlanMyDay: properties.showPlanMyDay ?? definition?.defaults.showPlanMyDay
      }));
    } catch (error) {
      throw this._lifecycleError('render', error);
    }
  }

  private _lifecycleError(phase: string, error: unknown): Error {
    if (error instanceof Error) return error;
    let detail = String(error);
    try {
      detail = JSON.stringify(error) || detail;
    } catch {
      // Preserve the string fallback for non-serializable host errors.
    }
    return new Error(`Zava One ${this.intent} ${phase} failed: ${detail}`);
  }

  public getTopActionsConfiguration(): ITopActions | undefined {
    const definition = this._getConfiguration();
    if (!definition) {
      return undefined;
    }

    const topActions: ITopActionsField[] = definition.topActions
      .filter((action) => !(this.intent === 'workspace' && this.workspaceMode !== 'combined' && action.property === 'primaryView'))
      .map<ITopActionsField>((action) => this._createTopAction(action, definition));
    topActions.push({
      type: 11 as TopActionsFieldType,
      targetProperty: 'advancedSettings',
      title: 'Open all settings',
      properties: {
        text: 'Advanced settings',
        icon: 'Settings',
        description: 'Open all settings for this Zava One web part.',
        ariaLabel: 'Open advanced settings'
      }
    });

    return {
      topActions,
      onExecute: (actionName: string, updatedValue: unknown): void => {
        if (actionName === 'advancedSettings') {
          this.context.propertyPane.open();
          return;
        }
        if (!this._isKnownSetting(actionName, definition)) {
          return;
        }
        const properties = this._getProperties();
        properties[actionName] = updatedValue;
        this.context.propertyPane.refresh();
        this.render();
      }
    };
  }

  protected onThemeChanged(theme: IReadonlyTheme | undefined): void {
    this._isDarkTheme = !!theme?.isInverted;
    this.render();
  }

  protected onDispose(): void {
    this._root?.unmount();
    this._root = undefined;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const capabilityTitle = this.intent === 'workspace' ? 'Zava One workspace' : getCapabilityByIntent(this.intent)?.title || 'Zava One feature';
    const quickFields = this._getQuickFields();
    const advancedFields = this._getAdvancedFields();
    return {
      pages: [{
        header: { description: `Configure ${capabilityTitle} for this SharePoint page. Quick settings are also available from the toolbar above the web part.` },
        groups: [
          { groupName: 'Content and default view', groupFields: quickFields },
          { groupName: 'Display and behavior', groupFields: advancedFields }
        ].filter((group) => group.groupFields.length > 0)
      }]
    };
  }

  private _getQuickFields(): IPropertyPaneField<unknown>[] {
    const definition = this._getConfiguration();
    const fields: IPropertyPaneField<unknown>[] = [
      PropertyPaneTextField('title', { label: 'Web part title', placeholder: 'Use the default title' })
    ];
    if (!definition) return fields;

    definition.topActions
      .filter((action) => !(this.intent === 'workspace' && this.workspaceMode !== 'combined' && action.property === 'primaryView'))
      .forEach((action) => fields.push(PropertyPaneDropdown(action.property, {
        label: action.label,
        options: action.options.map((item) => ({ key: item.key, text: item.text }))
      })));
    return fields;
  }

  private _getAdvancedFields(): IPropertyPaneField<unknown>[] {
    const definition = this._getConfiguration();
    if (!definition) return [];
    const fields: IPropertyPaneField<unknown>[] = [];
    definition.advanced
      .filter((property) => !definition.topActions.some((action) => action.property === property))
      .filter((property) => !(this.intent === 'workspace' && this.workspaceMode === 'company' && property.indexOf('show') === 0 && property !== 'showSource'))
      .forEach((property) => fields.push(this._createAdvancedField(property, definition)));
    return fields;
  }

  private _getConfiguration(): IZavaWebPartConfigurationDefinition | undefined {
    return getWebPartConfiguration(this.intent);
  }

  private _createTopAction(
    action: IZavaTopActionDefinition,
    definition: IZavaWebPartConfigurationDefinition
  ): ITopActionsField<ITopActionsDropdownProps> {
    const selected = this._getProperties()[action.property] ?? getConfigurationDefault(definition, action.property);
    return {
      type: 10 as TopActionsFieldType,
      targetProperty: action.property,
      title: action.label,
      properties: {
        options: action.options.map((item) => ({
          key: item.key,
          text: item.text,
          checked: item.key === selected,
          ariaLabel: `${action.label}: ${item.text}`
        }))
      }
    };
  }

  private _createAdvancedField(
    property: ZavaWebPartProperty,
    definition: IZavaWebPartConfigurationDefinition
  ): IPropertyPaneField<unknown> {
    switch (property) {
      case 'maxItems':
        return PropertyPaneSlider(property, { label: definition.itemLabel, min: definition.minItems, max: definition.maxItems, step: 1 });
      case 'allowActions':
        return PropertyPaneToggle(property, { label: 'Allow demo actions', onText: 'Enabled', offText: 'Read only' });
      case 'showSource':
        return PropertyPaneToggle(property, { label: 'Show source and freshness', onText: 'Visible', offText: 'Hidden' });
      case 'showImages':
        return PropertyPaneToggle(property, { label: 'Show images', onText: 'Visible', offText: 'Hidden' });
      case 'showAgenda':
        return PropertyPaneToggle(property, { label: 'Show agenda', onText: 'Visible', offText: 'Hidden' });
      case 'showTasks':
        return PropertyPaneToggle(property, { label: 'Show tasks', onText: 'Visible', offText: 'Hidden' });
      case 'showMail':
        return PropertyPaneToggle(property, { label: 'Show important mail', onText: 'Visible', offText: 'Hidden' });
      case 'showLearning':
        return PropertyPaneToggle(property, { label: 'Show required learning', onText: 'Visible', offText: 'Hidden' });
      case 'showCompanyHighlights':
        return PropertyPaneToggle(property, { label: 'Show company highlights', onText: 'Visible', offText: 'Hidden' });
      case 'showPlanMyDay':
        return PropertyPaneToggle(property, { label: 'Show Plan My Day', onText: 'Visible', offText: 'Hidden' });
      case 'location':
        return PropertyPaneDropdown(property, { label: 'Default location', options: [
          { key: 'Helsinki', text: 'Helsinki' }, { key: 'Redmond', text: 'Redmond' }, { key: 'Singapore', text: 'Singapore' }
        ] });
      case 'filter':
        return PropertyPaneDropdown(property, { label: 'Default filter', options: [
          { key: 'All', text: 'All' }, { key: 'EMEA', text: 'EMEA' }, { key: 'Americas', text: 'Americas' }, { key: 'Asia', text: 'Asia' }
        ] });
      case 'density':
        return PropertyPaneDropdown(property, { label: 'Density', options: [
          { key: 'comfortable', text: 'Comfortable' }, { key: 'compact', text: 'Compact' }
        ] });
      default:
        return PropertyPaneTextField(property, { label: 'Default value' });
    }
  }

  private _isKnownSetting(actionName: string, definition: IZavaWebPartConfigurationDefinition): boolean {
    return definition.topActions.some((action) => action.property === actionName);
  }
}

export abstract class ZavaOneWorkspaceWebPartBase<TProperties extends IZavaOneWebPartProperties>
  extends ZavaOneWebPartBase<TProperties> {
  protected readonly intent: ZavaIntentKey = 'workspace';
  protected abstract readonly workspaceMode: ZavaWorkspaceMode;
}