import * as React from 'react';
import type { SurfaceProps } from '../types';
import { canReview, devices, guides, myTickets, serviceHealth } from '../mockData/technology';
import { TechIcon } from './Art';

type Destination = { id: number; title: string; tasks: Array<[number, string]> };
const destinations: Destination[] = [
  { id: 0, title: 'My day', tasks: [] },
  { id: 23, title: 'My requests', tasks: [[23, 'Conversations'], [21, 'Troubleshooting guides'], [22, 'New IT ticket']] },
  { id: 19, title: 'Devices & apps', tasks: [[19, 'Device passport'], [24, 'Equipment catalog'], [28, 'App access']] },
  { id: 20, title: 'Service health', tasks: [[20, 'Service status']] },
  { id: 26, title: 'Manager view', tasks: [[26, 'Performance'], [27, 'Request flow'], [25, 'Equipment decisions']] }
];
type Match = { title: string; kind: string; open: () => void };
function find(p: SurfaceProps, query: string, nav: Destination[]): Match[] {
  const rows: Match[] = [];
  nav.forEach(d => d.tasks.forEach(([id, title]) => rows.push({ title, kind: d.title, open: () => p.navigate(id) })));
  devices(p.session).forEach(d => rows.push({ title: d.name, kind: 'Assigned device', open: () => p.navigate(19, { deviceId: d.id }) }));
  myTickets(p.session).forEach(t => rows.push({ title: `${t.id} · ${t.title}`, kind: 'My conversation', open: () => p.navigate(23, { ticketId: t.id }) }));
  guides.forEach(g => rows.push({ title: g.title, kind: 'Guide', open: () => p.navigate(21, { guideId: g.id }) }));
  serviceHealth(p.session).forEach(s => rows.push({ title: `${s.label} · ${s.site}`, kind: 'Service status', open: () => p.navigate(20, { serviceId: s.id, officeId: s.office }) }));
  return rows.filter(r => `${r.title} ${r.kind}`.toLowerCase().indexOf(query.trim().toLowerCase()) >= 0);
}
export function WorkspaceNav({ p }: { p: SurfaceProps }): React.ReactElement {
  const nav = destinations.filter(d => d.id !== 26 || canReview(p.session));
  const current = nav.find(d => d.id === p.id || d.tasks.some(([id]) => id === p.id));
  const [opened, open] = React.useState(false); const [query, edit] = React.useState(''); const [searched, search] = React.useState('');
  const results = searched ? find(p, searched, nav) : [];
  const listId = React.useId();
  return <header className="tw-workmast" data-workspace-navigation="true">
    <nav className="tw-worknav" aria-label="TechWeb sections" data-open={opened ? 'yes' : 'no'}>
      <button type="button" className="tw-mobilemenu" aria-expanded={opened} aria-controls={listId} onClick={() => open(!opened)}><TechIcon name="menu"/>Explore TechWeb <strong>{current?.title || 'Sections'}</strong></button>
      <div id={listId} className="tw-navlinks">{nav.map(d => <button key={d.id} type="button" aria-current={d.id === current?.id ? 'location' : undefined} onClick={() => { open(false); if (p.id !== d.id || Object.keys(p.inputs).length) p.navigate(d.id); }}>{d.title}</button>)}</div>
    </nav>
    <form className="tw-searchbox" role="search" aria-label="TechWeb" onSubmit={e => { e.preventDefault(); search(query.trim()); }}>
      <TechIcon name="search"/><input type="search" aria-label="Search help, devices and requests" placeholder="Find help, devices, and requests" maxLength={100} value={query} onChange={e => { edit(e.currentTarget.value); if (searched) search(''); }}/><button type="submit">Search</button>
    </form>
    {searched && <section className="tw-searchresults" aria-label="Search results"><div><strong role="status">{results.length ? `${results.length} ${results.length === 1 ? 'match' : 'matches'} in TechWeb` : 'No matches in your service workspace.'}</strong><button type="button" onClick={() => { search(''); edit(''); }}>Clear search</button></div>
      <ul>{results.map(r => <li key={`${r.kind}:${r.title}`}><button type="button" onClick={r.open}><span>{r.kind}</span>{r.title}<TechIcon name="arrow"/></button></li>)}</ul></section>}
    {p.id !== 0 && current && current.tasks.length > 1 && <nav className="tw-subroutes" aria-label={`${current.title} tasks`}>{current.tasks.map(([id, title]) => <button type="button" key={id} aria-current={id === p.id ? 'page' : undefined} onClick={() => p.navigate(id)}>{title}</button>)}</nav>}
  </header>;
}
