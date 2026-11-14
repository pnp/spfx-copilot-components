import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { ISPCopilotContainerDimensions } from '@microsoft/sp-copilot-component';

import HomeThemeProvider from '../../getMyHrDashboard/components/HomeThemeProvider';
import ZavaDashboardShell from '../../getMyHrDashboard/components/ZavaDashboardShell';
import { normalizeHomeProperties } from '../../getMyHrDashboard/normalizeHomeProperties';
import type { ZavaFamilyId } from '../models/families';
import type { IZavaUser } from '../models/zavaEmployee';
import { resolveCurrentUser } from '../services/CurrentUserService';
import { MockZavaEmployeeDataService } from '../services/MockZavaEmployeeDataService';

const fallbackUser: IZavaUser = new MockZavaEmployeeDataService().getEmployeeExperience().user;

export interface IZavaResolvedIntent {
  family: ZavaFamilyId;
  route: string;
  params: Record<string, string | number | boolean | string[]>;
}

export interface IZavaInlineHost {
  currentUser: IZavaUser;
  containerDimensions?: ISPCopilotContainerDimensions;
  onRequestFullscreen?: () => void;
}

abstract class ZavaIntentCopilotComponentBase<
  TProperties,
  TIntent extends IZavaResolvedIntent
> extends BaseCopilotComponent<TProperties> {
  private _signature?: string;
  private _propertiesVersion = 0;
  private _root: Root | undefined;

  protected abstract resolveIntent(properties: unknown): TIntent;
  protected abstract renderInline(intent: TIntent, host: IZavaInlineHost): React.ReactElement;

  protected render(): void {
    const intent = this.resolveIntent(this.properties);
    const signature = JSON.stringify({ route: intent.route, params: intent.params });
    if (signature !== this._signature) {
      this._signature = signature;
      this._propertiesVersion += 1;
    }

    const targetDocument = this.context.domElement.ownerDocument;
    const currentUser = resolveCurrentUser(
      this.context,
      fallbackUser,
      targetDocument.location.href
    );
    const canExpand = (this.hostContext.availableDisplayModes || []).indexOf('fullscreen') >= 0;
    const content = this.hostContext.displayMode === 'fullscreen' ? (
      <ZavaDashboardShell
        properties={normalizeHomeProperties({ view: 'summary' })}
        propertiesVersion={this._propertiesVersion}
        currentUser={currentUser}
        containerDimensions={this.hostContext.containerDimensions}
        initialFamily={intent.family}
        initialRoute={intent.route}
        initialParams={intent.params}
      />
    ) : React.cloneElement(this.renderInline(intent, {
      currentUser,
      containerDimensions: this.hostContext.containerDimensions,
      onRequestFullscreen: canExpand ? this._handleRequestFullscreen : undefined
    }), { key: this._propertiesVersion });

    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }
    this._root.render(
      <HomeThemeProvider theme={this.hostContext.theme} targetDocument={targetDocument}>
        {content}
      </HomeThemeProvider>
    );
  }

  protected onTeardown(reason: string | undefined): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
    return super.onTeardown(reason);
  }

  private _handleRequestFullscreen = (): void => {
    this.requestDisplayModeAsync('fullscreen').catch(() => undefined);
  };
}

export default ZavaIntentCopilotComponentBase;