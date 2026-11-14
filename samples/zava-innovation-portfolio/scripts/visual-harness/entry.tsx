import * as React from 'react';
import { createRoot } from 'react-dom/client';
import InnovationApp from '../../src/shared/PremiumInnovationApp';
import InnovationThemeProvider from '../../src/shared/InnovationThemeProvider';
import { getIntent, type InnovationIntentKey } from '../../src/shared/catalog';
import type { IInnovationProperties } from '../../src/shared/catalog';
import type { IVisibleState } from '../../src/shared/InnovationContext';

const params=new URLSearchParams(window.location.search);
const intent=(params.get('intent')||'SubmitInnovationIdea') as InnovationIntentKey;
const mode=params.get('mode')==='fullscreen'?'fullscreen':'inline';
const theme=params.get('theme')==='dark'?'dark':'light';
const properties:IInnovationProperties={
  ideaId:params.get('ideaId')||undefined,message:params.get('message')||undefined,
  region:params.get('region')||undefined,theme:params.get('strategicTheme')||undefined,
  query:params.get('query')||undefined,amount:params.has('amount')?Number(params.get('amount')):undefined
};
const root=document.getElementById('root');
if(!root)throw new Error('Visual harness root element is missing.');
function Harness():React.ReactElement{
  const [activeMode,setMode]=React.useState(mode);
  const [activeTheme,setTheme]=React.useState(theme);
  const [context,setContext]=React.useState<IVisibleState>();
  return <><div hidden={!params.has('test')}><button onClick={()=>setMode(value=>value==='inline'?'fullscreen':'inline')}>Harness mode</button><button onClick={()=>setTheme(value=>value==='light'?'dark':'light')}>Harness theme</button><output hidden data-model-context>{JSON.stringify(context)}</output></div><div data-harness-root><InnovationThemeProvider theme={activeTheme} targetDocument={document}><InnovationApp definition={getIntent(intent)} properties={properties} currentUserName={getIntent(intent).role} displayMode={activeMode} onRequestFullscreen={()=>setMode('fullscreen')} onVisibleState={setContext}/></InnovationThemeProvider></div></>;
}
createRoot(root).render(<Harness/>);
