import * as React from 'react';
import { createRoot } from 'react-dom/client';
import ProcurementThemeProvider from '../src/shared/ProcurementThemeProvider';
import ProcurementApp from '../src/shared/ProcurementApp';
import { INTENTS, type IProcurementProperties } from '../src/shared/catalog';
import type { IProcurementSnapshot } from '../src/shared/modelContext';

interface IHarness {
  contexts: IProcurementSnapshot[];
  followUps: { message: string; snapshot: IProcurementSnapshot }[];
  acknowledgement: 'accept' | 'reject' | 'throw';
}
declare global { interface Window { procurementHarness: IHarness; } }
const params = new URLSearchParams(location.search);
const definition = INTENTS.find(intent => intent.key === (params.get('intent') || 'CompareSupplierBids'));
if (!definition) throw new Error('The visual harness requires a registered procurement intent.');
const theme = params.get('theme') || 'light';
const properties: IProcurementProperties = {
  eventId: params.get('eventId') || 'ZPC-RFP-31', invoiceId: params.get('invoiceId') || 'ZPC-8831',
  ...(params.has('supplierId') ? { supplierId: params.get('supplierId') || '' } : {}),
  ...(params.has('region') ? { region: params.get('region') || '' } : {}),
  ...(params.has('category') ? { category: params.get('category') || '' } : {}),
  ...(params.has('period') ? { period: params.get('period') || '' } : {})
};
document.documentElement.style.colorScheme = theme;
const harness: IHarness = { contexts: [], followUps: [], acknowledgement: 'accept' };
window.procurementHarness = harness;
function Harness(): React.ReactElement {
  const [mode, setMode] = React.useState(params.get('mode') || 'fullscreen');
  const update = React.useCallback(async (snapshot: IProcurementSnapshot): Promise<void> => { harness.contexts.push(snapshot); }, []);
  const send = React.useCallback(async (message: string, snapshot: IProcurementSnapshot): Promise<boolean> => {
    harness.contexts.push(snapshot);
    if (harness.acknowledgement === 'throw') throw new Error('Harness bridge unavailable');
    if (harness.acknowledgement === 'reject') return false;
    harness.followUps.push({ message, snapshot });
    return true;
  }, []);
  if (!definition) throw new Error('No registered intent.');
  return <ProcurementThemeProvider theme={theme} targetDocument={document}><ProcurementApp definition={definition} properties={properties}
    currentUserName="Grady Archie" displayMode={mode} onRequestFullscreen={async () => { setMode('fullscreen'); }}
    onUpdateModelContext={update} onSendFollowUp={send} /></ProcurementThemeProvider>;
}
const element = document.getElementById('root');
if (!element) throw new Error('Missing visual harness root.');
createRoot(element).render(<Harness />);