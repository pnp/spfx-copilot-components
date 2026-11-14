import { FluentProvider, webDarkTheme, webLightTheme } from '@fluentui/react-components';
import { EngineStore } from '@babylonjs/core/Engines/engineStore';
import { createDOMRenderer, RendererProvider } from '@griffel/react';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { getIntentDefinition, INTENT_CATALOG } from '../../src/shared/intents/intentCatalog';
import type { IntentName } from '../../src/shared/intents/intentCatalog';
import { IntentCanvasApp } from '../../src/shared/ui/IntentCanvasApp';

import './visualHarness.scss';

declare global {
  interface Window {
    __ZAVA_VISUAL_REVIEW__: {
      readonly intents: readonly string[];
      readonly engineCount: () => number;
      readonly renderIntent: (name: IntentName, dark?: boolean, fullscreen?: boolean) => void;
      readonly unmount: () => void;
    };
  }
}

const parameters = new URLSearchParams(window.location.search);
const requestedIntent = parameters.get('intent');
const intentName = INTENT_CATALOG.some((intent) => intent.name === requestedIntent)
  ? requestedIntent as IntentName
  : 'MyDeviceStatus';
const isDark = parameters.get('theme') === 'dark';
const isFullscreen = parameters.get('mode') === 'fullscreen';
const renderer = createDOMRenderer(document);
const root = document.getElementById('root');
if (!root) {
  throw new Error('Visual harness root element is missing.');
}
const reactRoot = createRoot(root);

function renderIntent(name: IntentName, dark = false, fullscreen = isFullscreen): void {
  const nextIntent = getIntentDefinition(name);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  reactRoot.render(
    <RendererProvider renderer={renderer} targetDocument={document}>
      <FluentProvider applyStylesToPortals targetDocument={document} theme={dark ? webDarkTheme : webLightTheme}>
        <div className="visual-harness" data-intent={nextIntent.name} data-mode={fullscreen ? 'fullscreen' : 'inline'}>
          <IntentCanvasApp
            key={nextIntent.name}
            intent={nextIntent}
            isDark={dark}
            isFullscreen={fullscreen}
            ownerWindow={window}
            properties={nextIntent.previewProperties}
            userName="Megan Bowen"
            onDisplayModeChange={(mode) => renderIntent(name, dark, mode === 'fullscreen')}
          />
        </div>
      </FluentProvider>
    </RendererProvider>
  );
}

window.__ZAVA_VISUAL_REVIEW__ = {
  intents: INTENT_CATALOG.map((entry) => entry.name),
  engineCount: () => EngineStore.Instances.length,
  renderIntent,
  unmount: () => reactRoot.unmount()
};

renderIntent(intentName, isDark, isFullscreen);