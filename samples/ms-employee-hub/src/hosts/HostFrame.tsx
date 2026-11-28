import * as React from 'react';
import { createDOMRenderer, RendererProvider } from '@griffel/react';
import { FluentProvider, IdPrefixProvider, webDarkTheme, webLightTheme } from '@fluentui/react-components';
import HubApp from '../shared/HubApp';
import { catalog, isWorkspace } from '../shared/catalog';
import type { HubSession, Workspace } from '../shared/types';
import { newSession } from '../shared/mockData/session';
import { ScopeReporter, type HubVisibleScope } from './VisibleScope';
import { BridgeQueue, snapshot, type BridgePort } from './bridge';
import type { ParsedInputs } from './fields';
import { watchSize } from './sizing';

export interface HostFrameProps {
  entry: number; mode: 'inline' | 'full'; document: Document; prefix: string; dark: boolean;
  parsed: ParsedInputs; landing?: Workspace; fixed?: boolean; displayName?: string;
  port?: BridgePort; expand?: () => Promise<boolean>; resize?: (width: number, height: number) => Promise<boolean>;
}
export default function HostFrame(props: HostFrameProps): React.ReactElement {
  const [memory] = React.useState(() => new Map<string, unknown>());
  const signature = JSON.stringify([props.entry, props.landing, props.fixed, props.parsed]);
  return <Activation key={signature} {...props} memory={memory}/>;
}
function Activation(props: HostFrameProps & {memory: HubSession['memory']}): React.ReactElement {
  const [session] = React.useState(() => ({...newSession(), memory:props.memory, clock:() => new Date()}));
  const { entry, parsed, port, resize, document: doc } = props;
  const [detail, setDetail] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [sizeFailed, setSizeFailed] = React.useState(false);
  const [trackTicket, setTrackTicket] = React.useState<string>();
  const mode = !port && detail ? 'full' : props.mode;
  const el = React.useRef<HTMLDivElement>(null);
  const retrySize = React.useRef<() => void>();
  const alive = React.useRef(true);
  const renderer = React.useMemo(() => createDOMRenderer(doc), [doc]);
  const queue = React.useMemo(() => port ? new BridgeQueue(port) : undefined, [port]);
  const scope = React.useRef<HubVisibleScope>();
  const capture = React.useCallback(() => snapshot(scope.current || {
    entry, stage: !parsed.ok ? 'unavailable' : entry === 30 ? 'selection' : [4, 6, 15, 18, 22, 24, 28].indexOf(entry) >= 0 ? 'draft' : 'information',
    route: entry === 30 ? `${props.landing || 'company'}/home` : undefined
  }, mode), [entry, mode, parsed.ok, props.landing]);
  const publish = React.useCallback((): void => {
    if (queue && (scope.current || !parsed.ok)) queue.passive(capture()).catch(() => { if (alive.current) setNotice('Copilot context was not updated. You can still use this view.'); });
  }, [queue, capture, parsed.ok]);
  const report = React.useCallback((next: HubVisibleScope): void => {
    scope.current = next;
    setTrackTicket(port && next.entry === 22 && next.stage === 'receipt' && next.receipt && /^IT-\d{1,12}$/.test(next.receipt) ? next.receipt : undefined);
    publish();
  }, [publish, port]);
  React.useLayoutEffect(() => { alive.current = true; return () => { alive.current = false; queue?.dispose(); }; }, [queue]);
  React.useEffect(() => { publish(); }, [publish]);
  React.useLayoutEffect(() => {
    if (!resize || !el.current) return;
    const observer = watchSize(el.current, resize, () => setSizeFailed(true));
    retrySize.current = observer.schedule;
    return () => { retrySize.current = undefined; observer.stop(); };
  }, [resize]);
  React.useLayoutEffect(() => { retrySize.current?.(); }, [mode, props.dark, entry]);
  const discuss = queue ? (intent: string): void => {
    if (sending) return;
    setSending(true);
    queue.discuss(capture(), intent).then(outcome => {
      if (!alive.current || outcome === 'busy') return;
      setSending(false);
      setNotice(outcome === 'sent' ? 'Sent to Copilot.' : outcome === 'not-published' ? 'Context could not be shared. No message was sent; you can retry.'
        : outcome === 'rejected' ? 'Copilot declined this message. You can retry.' : 'Delivery is unknown. Check the conversation before retrying.');
    }).catch(() => { if (alive.current) { setSending(false); setNotice('Could not share the visible context.'); } });
  } : undefined;
  const expand = props.expand;
  const expandView = !port ? (): void => setDetail(true) : !expand ? undefined : (): void => {
    expand().then(accepted => { if (alive.current && !accepted) setNotice('Full screen is unavailable. You can keep working here.'); })
      .catch(() => { if (alive.current) setNotice('Full screen is unavailable. You can keep working here.'); });
  };
  const appProps = {
    entry, mode, inputs: parsed.ok ? parsed.inputs : undefined, fixed: props.fixed, dark: props.dark, rehearsalSession: session,
    landing: props.landing || (parsed.ok && isWorkspace(parsed.inputs.landing) ? parsed.inputs.landing : undefined),
    displayName: props.displayName, onExpand: mode === 'inline' ? expandView : undefined, onDiscuss: sending ? undefined : discuss
  };
  return <RendererProvider renderer={renderer} targetDocument={doc}>
    <IdPrefixProvider value={props.prefix}>
      <FluentProvider theme={props.dark ? webDarkTheme : webLightTheme} targetDocument={doc}>
        <div ref={el} data-hub-theme={props.dark ? 'dark' : 'light'}>
          {!port && detail && <button type="button" onClick={() => setDetail(false)}>Back to page view</button>}
          <ScopeReporter.Provider value={report}>
            {parsed.ok ? <HubApp {...appProps} /> : <section role="alert"><h2>{catalog.find(c => c.id === entry)?.title}</h2><p>The {parsed.field} input is not supported. Correct the setting or open this task without it.</p></section>}
          </ScopeReporter.Provider>
          {trackTicket && <button type="button" disabled={sending} onClick={() => discuss?.('track-ticket')}>Ask Copilot to track {trackTicket}</button>}
          {notice && <p role="status">{notice}</p>}
          {sizeFailed && <p role="status">Automatic resizing was not accepted. <button type="button" onClick={() => { setSizeFailed(false); retrySize.current?.(); }}>Retry sizing</button></p>}
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  </RendererProvider>;
}
