import * as React from 'react';
import { canReview, devices, eligibleOrders, guides, myTickets, serviceHealth, techDate } from '../mockData/technology';
import { DeviceArt, TechIcon } from './Art';
import { Frame, Heading, Primary, Props, RecordList } from './Frame';

export function Home(p: Props): React.ReactElement {
  const inventory = devices(p.session); const device = inventory[0];
  const conversations = myTickets(p.session).filter(t => t.status === 'Open');
  const notice = serviceHealth(p.session).find(r => r.incident);
  const decisions = canReview(p.session) ? eligibleOrders(p.session) : undefined;
  const help = (): void => p.navigate(22, device ? { deviceId: device.id } : {});
  const hour = p.session.now.getHours();
  const salutation = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  if (p.mode === 'inline') return <Frame p={p} route="service-home" stage="information"><Heading kicker="Employee technology desk" title="More flow. Less friction." lead={`Active conversations: ${conversations.length}. Assigned devices: ${inventory.length}.`}/><div className="tw-actions"><Primary onClick={help}>Get IT help</Primary><button type="button" onClick={() => p.navigate(23)}>All my requests</button></div></Frame>;
  const shortcuts = [
    { title: 'Something not working?', detail: 'Start a support request', icon: 'chat', open: help },
    { title: 'My devices', detail: 'Devices and accessories', icon: 'device', open: () => p.navigate(19) },
    { title: 'Request app access', detail: 'Apps, tools and permissions', icon: 'apps', open: () => p.navigate(28) },
    { title: 'Try a quick fix', detail: 'Step-by-step guides', icon: 'book', open: () => p.navigate(21) }
  ] as const;
  return <Frame p={p} route="service-home" stage="information">
    <div className="tw-edition"><span>Employee technology desk</span><time dateTime={p.session.now.toISOString()}>{techDate(p.session.now.toISOString())}</time></div>
    <div className="tw-welcome">
      <div className="tw-welcomecopy"><p className="tw-kicker">{salutation}{p.session.actor.displayName ? `, ${p.session.actor.displayName}` : ''}</p>
        <h1 data-tech-heading tabIndex={-1}>More flow.<br/><em>Less friction.</em></h1>
        <p className="tw-deck">Your technology should open doors.<br/>Let’s keep your work moving.</p>
        <div className="tw-welcomeactions"><Primary onClick={help}><TechIcon name="plus"/>Get IT help</Primary><button className="tw-textlink" type="button" onClick={() => p.navigate(23)}>All my requests <TechIcon name="arrow"/></button></div>
        <dl className="tw-inbrief"><div><dt>{conversations.length === 1 ? 'Open conversation' : 'Open conversations'}</dt><dd>{conversations.length}</dd></div><div><dt>{inventory.length === 1 ? 'Assigned device' : 'Assigned devices'}</dt><dd>{inventory.length}</dd></div></dl>
      </div>
      <div className="tw-collage"><div className="tw-swoop" aria-hidden="true"/><div className="tw-coverphoto" aria-hidden="true"><span>Behind the technology.<b>People helping people.</b></span></div>
        <span className="tw-sticky">A little help.<b>More possibility.</b></span>
        <div className="tw-sticker"><i><TechIcon name="shield"/></i><div><small>Your workspace</small><strong>{device?.name || 'Your device desk'}</strong><span>{device?.posture || 'View assigned equipment'}</span></div></div>
      </div>
    </div>
    {notice && <button className="tw-notice tw-campusnotice" type="button" onClick={() => p.navigate(20, { serviceId: notice.id, officeId: notice.office })}><TechIcon name="bell"/><span><b>A note for your campus day</b><small>{notice.label} · {notice.site}. {notice.event}</small></span><span className="tw-noticego">View service update <TechIcon name="arrow"/></span></button>}
    <div className="tw-shortcuts">{shortcuts.map(s => <button key={s.title} type="button" onClick={s.open} aria-label={s.title}><TechIcon name={s.icon}/><span><b>{s.title}</b><small>{s.detail}</small></span><TechIcon name="launch"/></button>)}</div>
    <div className="tw-daygrid"><section><p className="tw-kicker">Active conversations</p><div className="tw-sectionhead"><h2>Right where you left off.</h2><button className="tw-textlink" type="button" onClick={() => p.navigate(23)}>View requests <TechIcon name="arrow"/></button></div>
      {conversations.length ? <RecordList rows={conversations.slice(0, 3).map(t => ({ id: t.id, meta: `${t.id} / ${t.category} support`, title: t.title, detail: `Next owner: ${t.next}`, badge: t.status, icon: 'chat', open: () => p.navigate(23, { ticketId: t.id }) }))}/> : <p>No open tickets need attention.</p>}
    </section><aside className="tw-devicefeature"><p className="tw-kicker">Your everyday companion</p><h2>A little care.<br/>A lot of good work.</h2>
      {device ? <><DeviceArt type={device.type}/><div className="tw-devicecaption"><div><strong>{device.name}</strong><small>{device.alias}</small></div><span className="tw-statuspill">{device.posture}</span></div></> : <p>No devices are assigned in this session.</p>}
      <div className="tw-actions"><button type="button" className="tw-textlink" onClick={() => p.navigate(19)}>Your device details <TechIcon name="arrow"/></button><button type="button" className="tw-textlink" onClick={() => p.navigate(24)}>Order equipment</button></div>
    </aside></div>
    <section className="tw-resources"><p className="tw-kicker">Small answers. Useful momentum.</p><h2>A good place to start.</h2><div className="tw-guidecards">{guides.map(g => <button key={g.id} type="button" onClick={() => p.navigate(21, { guideId: g.id })}><TechIcon name="book"/><small>{g.type} / {g.steps.length} steps</small><strong>{g.title}</strong><span>Open guide <TechIcon name="arrow"/></span></button>)}</div></section>
    {decisions && <section className="tw-reviewfeature"><div><p className="tw-kicker">Decisions &amp; delivery</p><h2>Help your team<br/>keep its momentum.</h2><p>{decisions.length} equipment {decisions.length === 1 ? 'request is' : 'requests are'} waiting for your review. Use the service picture to decide where to look next.</p><div className="tw-actions"><Primary onClick={() => p.navigate(26)}>Support performance</Primary><button type="button" className="tw-textlink" onClick={() => p.navigate(25)}>Review equipment <TechIcon name="arrow"/></button></div></div>
      <div className="tw-craftphoto" aria-hidden="true"/><div className="tw-decisionpaper" aria-hidden="true"><strong>{decisions.length}</strong><span>decisions<br/>awaiting review</span></div>
    </section>}
  </Frame>;
}
