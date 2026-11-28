import * as React from 'react';
import type { SurfaceProps } from '../types';
import { caseCategories, channels, checkCase, commandId, submitCase } from '../mockData/people';
import type { CaseDraft } from '../mockData/people';
import { Action, Detail, ErrorNote, Field, options, Receipt, Source, Task, valueOf } from './Frame';

export default function Support(p: SurfaceProps): React.ReactElement {
  const [draft, setDraft] = React.useState<CaseDraft>({category: valueOf(p, 'category', 'benefits'), channel: 'adviser', subject: '', body: ''});
  const [review, setReview] = React.useState('');
  const [receipt, save] = React.useState('');
  const [fault, fail] = React.useState('');
  const update = (patch: Partial<CaseDraft>): void => { setDraft(d => ({...d, ...patch})); fail(''); };
  const stage = receipt ? 'receipt' : review ? 'review' : 'draft';
  const topic = Object.prototype.hasOwnProperty.call(caseCategories, draft.category) ? caseCategories[draft.category as keyof typeof caseCategories] : 'Choose a category';
  return <Task p={p} slug="hr-support" label="Workplace resources" title="Ask HR privately." lead="Choose the right recipient, then review what you want to share." stage={stage}>
    {receipt ? <Receipt title="Private case created in this session" reference={receipt}>No message was sent. The private draft has been cleared.</Receipt> :
      <div className="hrw-columns"><div className="hrw-paper">{p.mode === 'full' && <span className="hrw-kicker">{review ? '02 / Check your message' : '01 / Private draft'}</span>}
        {review ? <><h3>Review the recipient.</h3><dl className="hrw-lines"><div><dt>Confidential channel</dt><dd>{channels[draft.channel as keyof typeof channels]}</dd></div>
          <div><dt>Category</dt><dd>{topic}</dd></div></dl>
          <h4>{draft.subject.trim()}</h4><p className="hrw-private-text">{draft.body.trim()}</p>
          <div className="hrw-actions"><Action onClick={() => { const result = submitCase(p.session, draft, review);
            if (result.ok) { save(result.value.id); update({subject: '', body: ''}); setReview(''); } else fail(result.message);
          }}>Confirm private case</Action><Action secondary onClick={() => setReview('')}>Edit message</Action></div></> :
          <>{p.mode === 'full' && <h3>What would you like to ask?</h3>}<Detail p={p} label={`To: ${channels[draft.channel as keyof typeof channels]} · ${topic}`}><div className="hrw-tools"><Field label="Category"><select value={draft.category} onChange={e => update({category: e.target.value})}>
            {options(Object.keys(caseCategories).map(k => [k, caseCategories[k as keyof typeof caseCategories]]), draft.category)}</select></Field>
            <Field label="Confidential channel"><select value={draft.channel} onChange={e => update({channel: e.target.value})}>
              {options(Object.keys(channels).map(k => [k, channels[k as keyof typeof channels]]), draft.channel)}</select></Field></div></Detail>
            <Field label="Subject"><input type="text" autoComplete="off" maxLength={100} value={draft.subject} onChange={e => update({subject: e.target.value})}/></Field>
            <Field label="Private question"><textarea autoComplete="off" rows={p.mode === 'inline' ? 2 : 4} maxLength={1200} value={draft.body} onChange={e => update({body: e.target.value})}/></Field>
            <p className="hrw-caption">Use fictional details. Do not enter medical, banking or identifying information.</p>
            <Action onClick={() => { const problem = checkCase(draft); fail(problem || ''); if (!problem) setReview(commandId(p.session)); }}>Review recipient & message</Action></>}
        {fault && <ErrorNote>{fault}</ErrorNote>}</div>{p.mode === 'full' && <aside className="hrw-aside hrw-lilac"><span className="hrw-kicker">Before you send</span>
          <h3>Where your question goes.</h3>
          <dl className="hrw-delivery-card"><div><dt>Recipient</dt><dd>{channels[draft.channel as keyof typeof channels]}</dd></div>
            <div><dt>Topic</dt><dd>{topic}</dd></div>
            <div><dt>Delivery</dt><dd>Local rehearsal only</dd></div></dl>
          <p>Only confirmation creates a receipt. It records the category and channel, never your subject or message.</p>
          <Action secondary onClick={() => p.navigate(11)}>Browse benefits instead</Action></aside>}</div>}
    <Source>People support · Local confidential intake · No external delivery</Source>
  </Task>;
}
