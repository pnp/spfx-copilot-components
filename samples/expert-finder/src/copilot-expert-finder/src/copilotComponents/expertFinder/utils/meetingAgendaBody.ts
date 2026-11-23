import { agendaBegin, agendaEnd, normalizeAgenda } from './meetingAgenda';

export interface AgendaBody { readonly contentType: string; readonly content: string; }

function htmlText(html: string): string {
  const template = document.createElement('template');
  // Template contents remain inert and are never inserted into the document.
  template.innerHTML = html.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/(?:p|div)>/gi, '\n');
  template.content.querySelectorAll('head, style, script, title').forEach(element => element.remove());
  return (template.content.textContent || '').replace(/\r\n?/g, '\n').trim();
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function inspectAgendaBody(body: AgendaBody): { agenda?: string; before: string; after: string; signature: string } {
  const html = body.contentType.toLowerCase() === 'html';
  if ((!html && body.contentType.toLowerCase() !== 'text') || new TextEncoder().encode(body.content).byteLength > 128 * 1024) {
    throw new Error('This meeting body cannot be safely updated. Review it in Outlook.');
  }
  const content = body.content;
  const visible = html ? htmlText(content) : content;
  const count = (marker: string): number => visible.split(marker).length - 1;
  let before = content;
  let after = '';
  let agenda: string | undefined;
  if (count(agendaBegin) || count(agendaEnd)) {
    if (count(agendaBegin) !== 1 || count(agendaEnd) !== 1) throw new Error('The meeting has ambiguous agenda sections. Review it in Outlook.');
    const begin = html ? /<(p|div)\b[^>]*>\s*--- ExpertFinder meeting agenda ---\s*<\/\1>/i.exec(content) : undefined;
    const end = html ? /<(p|div)\b[^>]*>\s*--- End of ExpertFinder meeting agenda ---\s*<\/\1>/i.exec(content) : undefined;
    const start = html ? begin?.index ?? -1 : content.indexOf(agendaBegin);
    const finish = html ? end?.index ?? -1 : content.indexOf(agendaEnd);
    if (start < 0 || finish <= start) throw new Error('The meeting agenda boundaries cannot be safely updated. Review it in Outlook.');
    const innerStart = start + (html ? begin?.[0].length || 0 : agendaBegin.length);
    const inner = content.slice(innerStart, finish);
    agenda = (html ? htmlText(inner) : inner.replace(/\r\n?/g, '\n').trim());
    before = content.slice(0, start);
    after = content.slice(finish + (html ? end?.[0].length || 0 : agendaEnd.length));
  }
  const outside = before + after;
  const template = document.createElement('template');
  if (html) template.innerHTML = outside;
  const links = html ? Array.from(template.content.querySelectorAll('a[href]')).map(element => element.getAttribute('href')) : [];
  // Exchange can reformat HTML/CSS while retaining the notes and meeting links.
  const text = (html ? htmlText(outside) : outside).replace(/\s+/g, ' ').trim();
  return { agenda, before, after, signature: JSON.stringify([text, links]) };
}

export function mergeAgendaBody(body: AgendaBody, value: string): AgendaBody {
  const agenda = normalizeAgenda(value);
  const current = inspectAgendaBody(body);
  const html = body.contentType.toLowerCase() === 'html';
  const section = html ? `<p>${agendaBegin}</p><pre>${escapeHtml(agenda)}</pre><p>${agendaEnd}</p>`
    : `${agendaBegin}\n${agenda}\n${agendaEnd}`;
  let content: string;
  if (current.agenda !== undefined) content = current.before + section + current.after;
  else if (html) {
    const closing = /<\/body\s*>/i.exec(body.content) || /<\/html\s*>/i.exec(body.content);
    const index = closing?.index ?? body.content.length;
    content = body.content.slice(0, index) + section + body.content.slice(index);
  } else content = body.content + '\n\n' + section;
  if (new TextEncoder().encode(content).byteLength > 128 * 1024) throw new Error('The meeting body is too long to update safely.');
  return { contentType: body.contentType, content };
}
