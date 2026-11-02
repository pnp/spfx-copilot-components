import * as React from 'react';
import { createRoot } from 'react-dom/client';
import RevenueApp, { type IModelContextSnapshot } from '../../src/shared/RevenueApp';
import RevenueThemeProvider from '../../src/shared/RevenueThemeProvider';
import { getIntent, type RevenueIntentKey, type IRevenueProperties } from '../../src/shared/catalog';

interface IHarnessOptions { readonly mode?: string; readonly theme?: string; readonly properties?: IRevenueProperties; }
declare global {
  interface Window {
    revenueHarness: { render: (options: IHarnessOptions) => void; context?: IModelContextSnapshot; followUps: { message: string; context: IModelContextSnapshot }[] };
  }
}

const params = new URLSearchParams(window.location.search);
const intentKey = (params.get('intent') || 'MapBuyingCommittee') as RevenueIntentKey;
const requestedMapMetric = params.get('mapMetric');
if (requestedMapMetric !== null && requestedMapMetric !== 'opportunity' && requestedMapMetric !== 'spend') throw new Error(`Unsupported mapMetric: ${requestedMapMetric}`);
let displayMode = params.get('mode') === 'fullscreen' ? 'fullscreen' : 'inline';
let theme = params.get('theme') === 'dark' ? 'dark' : 'light';
let properties: IRevenueProperties = {
  accountId: params.get('accountId') || undefined, opportunityId: params.get('opportunityId') || undefined,
  meetingId: params.get('meetingId') || undefined, proposalId: params.get('proposalId') || undefined,
  exceptionId: params.get('exceptionId') || undefined, selectedId: params.get('selectedId') || undefined,
  requestId: params.get('requestId') || undefined,
  countryId: params.get('countryId') || undefined,
  mapMetric: requestedMapMetric === 'opportunity' || requestedMapMetric === 'spend' ? requestedMapMetric : undefined,
  period: params.get('period') || undefined, region: params.get('region') || undefined, query: params.get('query') || undefined,
  quantity: params.has('quantity') ? Number(params.get('quantity')) : undefined,
  termMonths: params.has('termMonths') ? Number(params.get('termMonths')) : undefined,
  discount: params.has('discount') ? Number(params.get('discount')) : undefined,
  services: params.has('services') ? Number(params.get('services')) : undefined,
  probability: params.has('probability') ? Number(params.get('probability')) : undefined,
  ramp: params.get('ramp')?.split(',').map(Number)
};
const element = document.getElementById('root');
if (element) {
  const root = createRoot(element);
  const render = (options: IHarnessOptions): void => {
    displayMode = options.mode || displayMode;
    theme = options.theme || theme;
    properties = options.properties || properties;
    root.render(
    <RevenueThemeProvider theme={theme} targetDocument={document}>
      <RevenueApp
        definition={getIntent(intentKey)}
        properties={properties}
        currentUserName="Megan Bowen"
        displayMode={displayMode}
        onRequestFullscreen={displayMode === 'inline' ? async () => render({ mode: 'fullscreen' }) : undefined}
        onUpdateModelContext={async context => { window.revenueHarness.context = context; }}
        onSendFollowUp={async (message, context) => {
          window.revenueHarness.context = context;
          window.revenueHarness.followUps.push({ message, context });
          return true;
        }}
      />
    </RevenueThemeProvider>
    );
  };
  window.revenueHarness = { render, followUps: [] };
  render({});
}