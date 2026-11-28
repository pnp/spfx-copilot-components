import * as React from 'react';
import type { SurfaceProps } from '../types';
import { useHubVisibleScope } from '../../hosts/VisibleScope';
import { techDate, TechError, techMessage } from '../mockData/technology';
import styles from './Tech.module.scss';
import { WorkspaceNav } from './WorkspaceNav';
import { TechIcon } from './Art';

export type Props = SurfaceProps;
export type Stage = 'information' | 'selection' | 'draft' | 'review' | 'receipt' | 'denied' | 'unavailable';
type Scope = NonNullable<Parameters<typeof useHubVisibleScope>[0]>;
export function input(p: Props, key: string, fallback = ''): string { return p.inputs[key] === undefined ? fallback : String(p.inputs[key]); }
export function Frame({ p, route, stage, scope, children }: { p: Props; route: string; stage: Stage; scope?: Partial<Scope>; children: React.ReactNode }): React.ReactElement {
  const nextScope: Scope = { ...scope, entry: p.id || 30, route: p.id ? undefined : 'tech/home', stage };
  const signature = JSON.stringify(nextScope);
  const stable = React.useRef({ signature, scope: nextScope });
  if (stable.current.signature !== signature) stable.current = { signature, scope: nextScope };
  useHubVisibleScope(stable.current.scope);
  const ref = React.useRef<HTMLElement>(null);
  const prior = React.useRef(stage);
  React.useEffect(() => {
    if (prior.current !== stage) ref.current?.querySelector<HTMLElement>('[data-tech-heading]')?.focus();
    prior.current = stage;
  }, [stage]);
  return <section ref={ref} className={styles.tech} data-layout={`tech-${route}-${p.mode}-${stage}`} data-tech-mode={p.mode}>
    {p.mode === 'full' && <WorkspaceNav p={p}/>}
    {children}
    <footer className="tw-source">TechWeb · Synthetic service records · {techDate(p.session.now.toISOString())}</footer>
  </section>;
}
export function ProcessPath({ labels, step }: { labels: string[]; step: number }): React.ReactElement {
  return <ol className="tw-process" aria-label="Request progress">{labels.map((label, index) => <li key={label} data-state={index < step ? 'done' : index === step ? 'current' : 'next'} aria-current={index === step ? 'step' : undefined}><span aria-hidden="true">{index < step ? '✓' : `0${index + 1}`}</span>{label}</li>)}</ol>;
}
export function Heading({ kicker, title, lead }: { kicker: string; title: string; lead?: string }): React.ReactElement {
  return <header className="tw-heading"><p className="tw-kicker">{kicker}</p><h2 data-tech-heading tabIndex={-1}>{title}</h2>{lead && <p>{lead}</p>}</header>;
}
export function Problem({ p, route, error }: { p: Props; route: string; error: unknown }): React.ReactElement {
  const denied = (error as TechError)?.code === 'denied' || (error as TechError)?.code === 'self';
  return <Frame p={p} route={route} stage={denied ? 'denied' : 'unavailable'}><Heading kicker="TechWeb / Service desk" title={denied ? 'Access restricted' : 'Unable to open this view'} lead={techMessage(error)}/><button type="button" onClick={() => p.navigate(0)}>Back to TechWeb</button></Frame>;
}
export function SelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly (string | { value: string; label: string })[]; onChange: (value: string) => void }): React.ReactElement {
  const values = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  return <label className="tw-field">{label}<select value={value} onChange={e => onChange(e.currentTarget.value)}>
    {!values.some(o => o.value === value) && <option value={value}>Unavailable selection</option>}
    {values.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select></label>;
}
export function Primary({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }): React.ReactElement {
  return <button type="button" className="tw-primary" onClick={onClick} disabled={disabled}>{children}</button>;
}
export function RecordChoices({label, value, rows, choose}: {label: string; value: string; rows: Array<{id: string; title: string; detail?: string; art?: React.ReactNode}>; choose: (id: string) => void}): React.ReactElement {
  return <ul className="tw-choices" aria-label={label}>{rows.map(row => <li key={row.id}><button type="button" aria-pressed={row.id === value} onClick={() => choose(row.id)}>
    {row.art && <i aria-hidden="true">{row.art}</i>}<span><strong>{row.title}</strong>{row.detail && <small>{row.detail}</small>}</span></button></li>)}</ul>;
}
export function Alert({ message }: { message: string }): React.ReactElement {
  return message ? <p className="tw-alert" role="alert">{message}</p> : <></>;
}
export interface RecordLink { id: string; meta: string; title: string; detail: string; open: () => void; badge?: string; icon?: 'chat' | 'device'; }
export function RecordList({ rows }: { rows: RecordLink[] }): React.ReactElement {
  return <ul className="tw-records">{rows.map(row => <li key={row.id}><button type="button" className={`tw-listrow${row.icon ? ' tw-withicon' : ''}`} onClick={row.open}>
    {row.icon && <i className="tw-rowicon"><TechIcon name={row.icon}/></i>}
    <span className="tw-rowcopy"><span className="tw-rowmeta">{row.meta}</span>{' '}<strong>{row.title}</strong>{' '}<span className="tw-rowdetail">{row.detail}</span></span>
    {row.badge && <span className="tw-statuspill">{row.badge}</span>}
    <span className="tw-rowarrow" aria-hidden="true">→</span>
  </button></li>)}</ul>;
}
export function Facts({ rows }: { rows: ReadonlyArray<readonly [string, React.ReactNode]> }): React.ReactElement {
  return <dl className="tw-facts">{rows.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>;
}
export function ContextOptions({ compact, title, children }: { compact: boolean; title: string; children: React.ReactNode }): React.ReactElement {
  return compact ? <details className="tw-options"><summary>{title}</summary>{children}</details> : <>{children}</>;
}
