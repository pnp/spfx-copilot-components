import * as React from 'react';
import { devices, guides, myTickets, techMessage, techTime, ticket, updateConversation } from '../mockData/technology';
import type { Ticket } from '../mockData/technology';
import { Alert, Facts, Frame, Heading, input, Primary, Problem, Props, RecordList, SelectField } from './Frame';

export function Conversation(p: Props): React.ReactElement {
  const id = input(p, 'ticketId');
  const [status, filter] = React.useState(input(p, 'status', 'All'));
  const [body, edit] = React.useState(''); const [feedback, setFeedback] = React.useState('');
  const [error, errorTo] = React.useState(''); const [action, choose] = React.useState<'Resolve' | 'Reopen'>();
  let row: Ticket | undefined;
  try {
    if (['All', 'Open', 'Resolved'].indexOf(status) < 0) throw new Error('Unknown ticket status.');
    if (id) {
      row = ticket(p.session, id);
      if (status !== 'All' && row.status !== status) throw new Error('This ticket is not in the requested status. No other ticket was opened.');
    }
  } catch (e) { return <Problem p={p} route="my-requests" error={e}/>; }
  const all = myTickets(p.session); const list = all.filter(t => status === 'All' || status === t.status);
  const update = (operation: 'Reply' | 'Resolve' | 'Reopen'): void => {
    if (row) try {
      const next = updateConversation(p.session, row.id, row.revision, operation, body);
      if (status !== 'All') filter(next.status);
      edit(''); choose(undefined); errorTo(''); setFeedback(`${operation === 'Reply' ? 'Reply recorded' : `Ticket ${next.status.toLowerCase()}`} in this session. Revision ${next.revision}.`);
    } catch (e) { errorTo(techMessage(e)); }
  };
  return <Frame p={p} route="my-requests" stage={action ? 'review' : 'information'} scope={{ filters: { ticketId: row?.id, status: row?.status || status } }}>
    <Heading kicker="TechWeb / My requests" title={row ? row.title : 'My IT conversations'} lead={row ? `${row.id} · ${row.status}` : 'Your support requests in this session.'}/>
    {row ? <div className={p.mode === 'full' ? 'tw-split' : ''}><section><Facts rows={[['Queue', row.queue], ['Next step belongs to', row.next]]}/><ol className="tw-thread">{row.thread.map((post, i) => <li key={i}><b>{post.author}</b> · <small>{techTime(post.at)}</small><p>{post.body}</p></li>)}</ol>
      {action ? <div><p>{action === 'Resolve' ? 'Close this conversation as resolved?' : 'Return this conversation to its owning queue?'}</p><div className="tw-actions"><Primary onClick={() => update(action)}>Confirm {action.toLowerCase()}</Primary><button type="button" onClick={() => choose(undefined)}>Keep current status</button></div></div> :
        <>{row.status === 'Open' && <label className="tw-field">Reply to the service desk<textarea value={body} rows={2} maxLength={800} onChange={e => edit(e.currentTarget.value)}/></label>}<div className="tw-actions">{row.status === 'Open' && <Primary onClick={() => update('Reply')}>Send reply</Primary>}<button type="button" onClick={() => choose(row?.status === 'Open' ? 'Resolve' : 'Reopen')}>{row.status === 'Open' ? 'Resolve ticket' : 'Reopen ticket'}</button></div></>}
      <Alert message={error}/>{feedback && <p role="status">{feedback}</p>}</section>{p.mode === 'full' && <aside className="tw-panel"><p className="tw-kicker">Conversation context</p><h3>Linked evidence</h3><Facts rows={[['Device', devices(p.session).find(d => d.id === row?.deviceId)?.name || 'None linked'], ['Guide', guides.find(g => g.id === row?.guideId)?.title || 'None linked'], ['Impact', row.impact], ['Last update', techTime(row.updated)]]}/></aside>}</div> :
      <div className={p.mode === 'full' ? 'tw-split' : ''}><section><SelectField label="Ticket status" value={status} options={['All','Open','Resolved']} onChange={filter}/>{list.length ? <RecordList rows={list.map(t => ({ id: t.id, meta: `${t.id} · ${t.status}`, title: t.title, detail: `Next owner: ${t.next}`, icon: p.mode === 'full' ? 'chat' : undefined, open: () => p.navigate(23, { ticketId: t.id }) }))}/> : <p>No conversations match this status.</p>}</section>{p.mode === 'full' && <aside className="tw-panel"><p className="tw-kicker">Personal service history</p><h3>Your support picture</h3><Facts rows={[['Open conversations', all.filter(t => t.status === 'Open').length], ['Resolved conversations', all.filter(t => t.status === 'Resolved').length], ['Showing', `${list.length} in this view`]]}/><p>Open the conversation to see its next owner, reply or change its status.</p><div className="tw-actions"><Primary onClick={() => p.navigate(22)}>Get IT help</Primary></div></aside>}</div>}
  </Frame>;
}
