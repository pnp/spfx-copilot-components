import * as React from 'react';
import { workspaceNames } from '../catalog';
import type { FiscalCut, Market, Period } from '../mockData/commercial';

export function SelectField(props: { label: string; value: string; change: (v: string) => void; children: React.ReactNode }): React.ReactElement {
  return <label className="slt-field"><span>{props.label}</span><select value={props.value} onChange={e => props.change(e.currentTarget.value)}>{props.children}</select></label>;
}
export function PeriodFilter({ value, change }: { value: Period; change: (p: Period) => void }): React.ReactElement {
  return <SelectField label="Fiscal window" value={value} change={p => change(p as Period)}><option value="current-quarter">This quarter</option><option value="previous-quarter">Previous quarter</option></SelectField>;
}
export function MarketFilter({ value, change, markets }: { value: string; change: (p: string) => void; markets: readonly Market[] }): React.ReactElement {
  return <SelectField label="Reporting market" value={value} change={change}>{markets.map(m => <option value={m.id} key={m.id}>{m.name}</option>)}</SelectField>;
}
export function Stamp({ cut, unit }: { cut: FiscalCut; unit: string }): React.ReactElement {
  return <p className="slt-stamp">Illustrative data <span> / </span>{cut.label}<span> / </span>Cut {cut.asOf} UTC<span> / </span>{unit}</p>;
}
export function Heading({ section, children }: { section: string; children: React.ReactNode }): React.ReactElement {
  return <header className="slt-heading"><p className="slt-over">{workspaceNames.business} <span>/</span> {section}</p><h2>{children}</h2></header>;
}
export function Keys({ n, children }: { n: string; children: React.ReactNode }): React.ReactElement {
  return <p className="slt-index"><span>{n}</span> {children}</p>;
}
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export function printDate(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return isFinite(date.getTime()) ? dateFormat.format(date) : 'Not set';
}
export function Folio({ desk, edition, asOf }: { desk: string; edition: string; asOf: string }): React.ReactElement {
  return <div className="slt-folio"><span><i aria-hidden="true"/>{desk}</span><span>{edition}<b aria-hidden="true">/</b><time dateTime={asOf}>{printDate(asOf)}</time></span></div>;
}
// The plot gets the host column's actual width, not the browser viewport or a scaled-down SVG font.
export function usePlotWidth(): [React.RefObject<HTMLDivElement>, number] {
  const ref = React.useRef<HTMLDivElement>(null), [width, setWidth] = React.useState(560);
  React.useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const resize = (): void => { const w = Math.round(node.getBoundingClientRect().width); if (w > 0) setWidth(w); };
    resize();
    const win = node.ownerDocument.defaultView;
    if (!win) return;
    if (win.ResizeObserver) {
      const observer = new win.ResizeObserver(resize); observer.observe(node);
      return () => observer.disconnect();
    }
    win.addEventListener('resize', resize); return () => win.removeEventListener('resize', resize);
  }, []);
  return [ref, width];
}
export function graphKey(e: React.KeyboardEvent<SVGElement>, select: () => void): void {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
}
