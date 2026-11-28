import * as React from 'react';
import type { SurfaceProps } from '../types';
import { useHubVisibleScope } from '../../hosts/VisibleScope';
import type { HubVisibleScope } from '../../hosts/VisibleScope';

type Stage = HubVisibleScope['stage'];
export function useStage(entry: number, stage: Stage, route?: string): void {
  const scope = React.useMemo((): HubVisibleScope => ({entry, stage, ...(route ? {route} : {})}), [entry, stage, route]);
  useHubVisibleScope(scope);
}
export function valueOf(p: SurfaceProps, field: string, fallback: string): string {
  return p.inputs[field] === undefined ? fallback : String(p.inputs[field]);
}
export function Task({p, slug, label, title, lead, stage = 'information', scope, children}: React.PropsWithChildren<{
  p: SurfaceProps; slug: string; label: string; title: string; lead: string; stage?: Stage; scope?: Pick<HubVisibleScope,'filters'|'progress'>
}>): React.ReactElement {
  useHubVisibleScope({entry:p.id,stage,...scope});
  const headline = React.useId();
  const heading = React.useRef<HTMLHeadingElement>(null);
  const previous = React.useRef(stage);
  React.useLayoutEffect(() => {
    if (previous.current !== stage && (stage === 'review' || stage === 'draft')) heading.current?.focus();
    previous.current = stage;
  }, [stage]);
  return <section className="hrw-task" aria-labelledby={headline} data-hr-book={slug} data-layout={`hr-${slug}-${p.mode}-${stage}`}>
    <header className="hrw-task-title"><span className="hrw-kicker">HRweb <span aria-hidden="true">/</span> {label}</span>
      <h2 id={headline} ref={heading} tabIndex={-1}>{title}</h2>{(p.mode === 'full' || stage === 'denied') && <p>{lead}</p>}</header>
    {children}
  </section>;
}
export function Detail({p, label, children}: React.PropsWithChildren<{p: SurfaceProps; label: string}>): React.ReactElement {
  return p.mode === 'inline' ? <details className="hrw-detail"><summary>{label}</summary><div>{children}</div></details> : <>{children}</>;
}
export function ErrorNote({children}: React.PropsWithChildren<{}>): React.ReactElement {
  return <p className="hrw-error" role="alert">{children}</p>;
}
export function Source({children}: React.PropsWithChildren<{}>): React.ReactElement {
  return <p className="hrw-source">{children}</p>;
}
export function Field({label, children}: React.PropsWithChildren<{label: string}>): React.ReactElement {
  return <label className="hrw-field"><span>{label}</span>{children}</label>;
}
export function Choices({label, value, items, onChange}: {label: string; value: string; items: ReadonlyArray<readonly [string, string]>; onChange: (value: string) => void}): React.ReactElement {
  return <div role="group" aria-label={label} className="hrw-segments">{items.map(([id, name]) =>
    <button type="button" key={id} aria-pressed={id === value} onClick={() => onChange(id)}>{name}</button>)}</div>;
}
export function Action({children, onClick, secondary = false, disabled = false}: React.PropsWithChildren<{
  onClick: () => void; secondary?: boolean; disabled?: boolean
}>): React.ReactElement {
  return <button type="button" className={secondary ? 'hrw-secondary' : 'hrw-primary'} disabled={disabled} onClick={onClick}>{children}</button>;
}
export function options(items: ReadonlyArray<readonly [string, string]>, current: string): React.ReactNode {
  return <>{!items.some(([key]) => key === current) && <option value={current}>Unavailable selection</option>}
    {items.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</>;
}
export function Receipt({title, reference, children}: React.PropsWithChildren<{title: string; reference: string}>): React.ReactElement {
  const ref = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => { ref.current?.focus(); }, []);
  return <div className="hrw-receipt"><span className="hrw-kicker">Session receipt</span>
    <h3 ref={ref} tabIndex={-1}>{title}</h3><strong>{reference}</strong><p>{children}</p></div>;
}
export function PrivacyPanel({title, revealLabel, compact = false, children}: {
  title: string; revealLabel: string; compact?: boolean; children: () => React.ReactNode
}): React.ReactElement {
  const [shown, show] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const id = React.useId();
  React.useLayoutEffect(() => {
    const doc = ref.current?.ownerDocument;
    const win = doc?.defaultView;
    const mask = (): void => show(false);
    const visibility = (): void => { if (doc?.visibilityState !== 'visible') mask(); };
    win?.addEventListener('blur', mask);
    win?.addEventListener('pagehide', mask);
    doc?.addEventListener('visibilitychange', visibility);
    return () => {
      win?.removeEventListener('blur', mask); win?.removeEventListener('pagehide', mask);
      doc?.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  return <div className="hrw-private" ref={ref} onBlur={e => {
    if (!e.relatedTarget || !('nodeType' in e.relatedTarget) || !e.currentTarget.contains(e.relatedTarget as Node)) show(false);
  }}>
    {!compact && <><span className="hrw-kicker">Private on this screen</span><h3>{title}</h3></>}
    <button className="hrw-secondary" type="button" aria-expanded={shown} aria-controls={id} onClick={() => show(!shown)}>{shown ? 'Hide values' : revealLabel}</button>
    <div id={id}>{shown ? children() : <p className="hrw-masked">{!compact && <span className="hrw-mask-rule" aria-hidden="true">••••••</span>}Values hidden. Reveal only when you have privacy.</p>}</div>
  </div>;
}
