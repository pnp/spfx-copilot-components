import * as React from 'react';
import type { SurfaceProps } from '../types';
import Home from './Home';
import { Benefits, Learning } from './LearningBenefits';
import { Pay, Vesting } from './Rewards';
import { Balance, TimeRequest } from './Leave';
import { Coverage, Review } from './Reviews';
import Support from './Support';
import styles from './Hr.module.scss';

const bodies: Record<number, (p: SurfaceProps) => React.ReactElement> = {
  0: Home, 10: Learning, 11: Benefits, 12: Pay, 13: Vesting, 14: Balance, 15: TimeRequest, 16: Coverage, 17: Review, 18: Support
};
const sections = [
  {label: 'Home', id: 0, routes: [0]}, {label: 'Benefits', id: 11, routes: [11,14,15]},
  {label: 'Career', id: 10, routes: [10]}, {label: 'Workplace resources', id: 18, routes: [16,17,18]},
  {label: 'Pay, stock, & rewards', id: 12, routes: [12,13]}
];
export default function HR(p: SurfaceProps): React.ReactElement {
  const prefix = React.useId();
  const tabs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const active = Math.max(0, sections.findIndex(s => s.routes.indexOf(p.id) >= 0));
  const [focused, focus] = React.useState(active);
  React.useEffect(() => focus(active), [active]);
  function move(e: React.KeyboardEvent, i: number): void {
    const n = sections.length;
    const next = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i + n - 1) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (next >= 0) { e.preventDefault(); focus(next); tabs.current[next]?.focus(); }
  }
  const Body = bodies[p.id];
  // Host expansions reuse the same activation; changing the input scope starts a new one.
  const instance = React.useRef({memory: p.session.memory, generation: 0});
  if (instance.current.memory !== p.session.memory) instance.current = {memory: p.session.memory, generation: instance.current.generation + 1};
  const key = JSON.stringify([instance.current.generation, p.id, p.session.actor.id, Object.keys(p.inputs).sort().map(k => [k, p.inputs[k]])]);
  return <div className={`${styles.root} hrw`} data-hr-mode={p.mode}>
    {p.mode === 'full' && <nav aria-label="HRweb sections" className="hrw-nav">
      <div className="hrw-tabbar" role="tablist" aria-label="HRweb sections">{sections.map((s, i) => <button key={s.id}
        ref={el => { tabs.current[i] = el; }} type="button" role="tab" aria-selected={i === active} aria-controls={`${prefix}-panel`}
        id={`${prefix}-section-${i}`} tabIndex={i === focused ? 0 : -1} onKeyDown={e => move(e, i)} onClick={() => { if (p.id !== s.id) p.navigate(s.id); }}>{s.label}</button>)}</div>
      <label className="hrw-compact-nav"><span id={`${prefix}-nav-label`}>HRweb section</span><select aria-labelledby={`${prefix}-nav-label`} value={sections[active].id} onChange={e => p.navigate(Number(e.target.value))}>
        {sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
    </nav>}
    <div id={`${prefix}-panel`} role={p.mode === 'full' ? 'tabpanel' : undefined} aria-label={p.mode === 'full' ? sections[active].label : undefined}>
      {Body ? <Body key={key} {...p}/> : <p role="status">This HRweb task is unavailable.</p>}
    </div>
  </div>;
}
