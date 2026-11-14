import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { ZavaOneApp } from '../src/shared/components/ZavaOneApp';
import type { ZavaIntentKey, ZavaSurface, ZavaThemeName, ZavaWorkspaceMode } from '../src/shared/models/zavaOne';

const query = new URLSearchParams(window.location.search);
const intent = (query.get('intent') || 'workspace') as ZavaIntentKey;
const surface = (query.get('surface') || (intent === 'workspace' ? 'workspace' : 'copilotInline')) as ZavaSurface;
const theme = (query.get('theme') || 'light') as ZavaThemeName;
const workspaceMode = (query.get('mode') || 'combined') as ZavaWorkspaceMode;
const displayMode = query.get('displayMode') || (surface === 'workspace' ? 'fullscreen' : 'inline');
const primaryView = query.get('primaryView') || undefined;
const defaultScope = query.get('scope') || undefined;
const defaultFilter = query.get('filter') || undefined;
const defaultLocation = query.get('location') || undefined;
const density = query.get('density') || undefined;
const maxItemsValue = Number(query.get('maxItems'));
const maxItems = Number.isFinite(maxItemsValue) && maxItemsValue > 0 ? maxItemsValue : undefined;

document.body.dataset.theme = theme;

const container = document.getElementById('root');
if (!container) throw new Error('UX review root was not found.');

createRoot(container).render(
  <React.StrictMode>
    <ZavaOneApp
      intent={intent}
      surface={surface}
      displayMode={displayMode}
      workspaceMode={workspaceMode}
      hideWorkspaceHeader={query.get('hideWorkspaceHeader') === 'true'}
      theme={theme}
      targetDocument={document}
      currentUserName="Megan Bowen"
      primaryView={primaryView}
      layout={primaryView}
      defaultScope={defaultScope}
      defaultFilter={defaultFilter}
      defaultLocation={defaultLocation}
      density={density}
      maxItems={maxItems}
      requestFullscreen={async () => undefined}
      publishContext={async (snapshot) => {
        window.__zavaModelContext = snapshot;
      }}
      sendFollowUp={async (message) => {
        window.__zavaFollowUp = message;
      }}
    />
  </React.StrictMode>
);

declare global {
  interface Window {
    __zavaModelContext?: unknown;
    __zavaFollowUp?: string;
  }
}