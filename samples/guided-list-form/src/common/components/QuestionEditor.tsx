import * as React from 'react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import type { Answers, IWizardField } from '../models';
import type { ISkipRule } from '../logic/jsonProps';
import { questionParts, parseTemplateSegments, serializeTemplateSegments, tokenLabel, removeTokenBeforeIndex, mergeAdjacentText, type TemplateSegment } from '../logic/questionText';
import {
  choicesFor,
  draftsFromConfig,
  draftsToConfig,
  earlierFields,
  sampleAnswers,
  whenFieldsBefore,
  type IQuestionCondition,
  type IQuestionDraft
} from '../logic/questionEditorState';

const EDITOR_CSS = `
.qe-panel{display:flex;flex-direction:column;height:100%;background:#fff;color:#242424;font-family:"Segoe UI",Inter,"Source Sans Pro","Noto Sans",sans-serif;font-size:14px;line-height:20px}
.qe-head{padding:12px 20px 10px;border-bottom:1px solid #edebe9;position:relative;flex-shrink:0}
.qe-title{margin:0 36px 6px 0;font-size:20px;line-height:28px;font-weight:600}
.qe-desc{margin:0;font-size:12px;line-height:16px;color:#616161}
.qe-close{position:absolute;top:12px;right:10px;width:32px;height:32px;border:0;background:transparent;border-radius:4px;font-size:18px;color:#616161;cursor:pointer}
.qe-close:hover{background:#f5f5f5;color:#242424}
.qe-body{flex:1;overflow:auto;padding:8px 20px 16px}
.qe-foot{flex-shrink:0;padding:10px 20px 14px;border-top:1px solid #edebe9;background:#fff}
.qe-actions{display:flex;gap:8px}
.qe-compat{margin:10px 0 0;font-size:11px;line-height:16px;color:#707070}
.qe-btn{display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:5px 16px;border-radius:4px;border:1px solid #d1d1d1;background:#fff;font:inherit;font-weight:600;cursor:pointer}
.qe-btn:hover{background:#f5f5f5}
.qe-btn-primary{background:#0F6CBD;border-color:#0F6CBD;color:#fff}
.qe-btn-primary:hover{background:#0C5A9E;border-color:#0C5A9E}
.qe-card{border:1px solid #e0e0e0;border-radius:4px;margin:0 0 8px;background:#fff}
.qe-card.is-open{border-color:#d1d1d1;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.qe-card-h{display:flex;align-items:flex-start;gap:10px;width:100%;background:transparent;border:0;padding:8px 12px;text-align:left;cursor:pointer;font:inherit;color:inherit}
.qe-card-h:hover{background:#f5f5f5}
.qe-chev{width:12px;height:12px;margin-top:4px;flex-shrink:0;color:#616161}
.qe-card:not(.is-open) .qe-chev{transform:rotate(-90deg)}
.qe-name{font-weight:600}
.qe-type{font-size:12px;color:#616161}
.qe-meta{display:block;margin-top:2px;font-size:12px;line-height:16px;color:#616161}
.qe-card-body{padding:0 12px 10px 34px}
.qe-field{margin:0 0 8px}
.qe-label{display:block;font-weight:600;margin:0 0 6px}
.qe-hint{margin:4px 0 0;font-size:12px;line-height:16px;color:#616161}
.qe-input,.qe-select{width:100%;border:1px solid #8A8886;border-radius:4px;background:#fff;padding:5px 8px;min-height:32px;font:inherit;box-sizing:border-box}
.qe-textarea{resize:vertical;line-height:18px;min-height:48px}
.qe-select{appearance:auto}
.qe-editor{display:block;box-sizing:border-box;width:100%;min-height:36px;line-height:22px;padding:6px 10px;border:1px solid #8A8886;border-radius:4px;background:#fff;white-space:pre-wrap;overflow-wrap:break-word;word-break:normal;cursor:text}
.qe-text{display:inline;white-space:pre-wrap;overflow-wrap:break-word;border:0;padding:0;margin:0;font:inherit;font-size:inherit;line-height:inherit;background:transparent;color:inherit}
.qe-text:focus{outline:none}
.qe-text:empty{display:inline-block;min-width:1px;min-height:1em;vertical-align:baseline}
.qe-pill{display:inline-flex;align-items:center;vertical-align:baseline;background:#DEECF9;color:#0A4A83;border:0;border-radius:10px;padding:0 8px;margin:0;font-size:12px;font-weight:600;line-height:18px;white-space:nowrap;cursor:pointer}
.qe-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 0}
.qe-chip{border:1px solid #d1d1d1;background:#fff;border-radius:12px;min-height:24px;padding:0 10px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px}
.qe-chip:hover{background:#DEECF9;border-color:#B4D6FA;color:#0A4A83}
.qe-chip-plus{font-weight:700;line-height:1}
.qe-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:6px}
.qe-row .qe-select,.qe-row .qe-input{width:auto;flex:1 1 110px}
.qe-row .qe-op{flex:0 0 118px}
.qe-always{display:inline-flex;align-items:center;min-height:32px;padding:0 10px;border:1px solid #d1d1d1;border-radius:4px;background:#f3f2f1;color:#616161;font-size:13px}
.qe-link{border:0;background:transparent;color:#0F6CBD;padding:4px 0;font:inherit;font-weight:600;font-size:13px;cursor:pointer}
.qe-link:hover{text-decoration:underline;color:#0C5A9E}
.qe-remove{flex:0 0 24px;width:24px;height:24px;padding:0;border:0;border-radius:4px;background:transparent;color:#616161;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.qe-remove:hover{background:#f3f2f1;color:#242424}
.qe-remove:focus-visible{outline:2px solid #0F6CBD;outline-offset:1px}
.qe-preview{margin:8px 0 0;padding:6px 10px;background:#f3f2f1;border-radius:4px}
.qe-preview-label{display:block;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#616161;margin:0 0 2px}
.qe-preview-line{margin:0;font-size:13px;line-height:20px}
`;

export interface IQuestionEditorProps {
  fields: IWizardField[];
  questionTexts?: Record<string, string>;
  fieldExamples?: Record<string, string>;
  skipRules?: ISkipRule[];
  answerChecks?: Record<string, import('../logic/answerCheck').AnswerCheck>;
  firstName?: string;
  openName?: string;
  onSave(next: ReturnType<typeof draftsToConfig>): void;
  onCancel(): void;
}

export function QuestionEditor(props: IQuestionEditorProps): React.ReactElement {
  const [drafts, setDrafts] = React.useState(() => draftsFromConfig(props.fields, props.questionTexts, props.fieldExamples, props.skipRules, props.answerChecks));
  const [open, setOpen] = React.useState(props.openName || (props.fields[0] ? props.fields[0].internalName : ''));
  const samples = React.useMemo(() => sampleAnswers(props.fields), [props.fields]);

  const update = (name: string, patch: Partial<IQuestionDraft>): void => {
    setDrafts((list) => list.map((d) => (d.internalName === name ? { ...d, ...patch } : d)));
  };

  return (
    <FluentProvider theme={webLightTheme} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>{EDITOR_CSS}</style>
      <aside className="qe-panel" role="dialog" aria-labelledby="qe-title" data-testid="wiz-question-editor">
        <div className="qe-head">
          <h2 className="qe-title" id="qe-title">Customize questions</h2>
          <p className="qe-desc">One card per column. Open a card to change the question, add an example, or show it only for some answers.</p>
          <button type="button" className="qe-close" aria-label="Close" onClick={props.onCancel}>
            ×
          </button>
        </div>
        <div className="qe-body">
          {drafts.map((draft) => (
            <QuestionCard
              key={draft.internalName}
              draft={draft}
              fields={props.fields}
              samples={samples}
              firstName={props.firstName || 'Alex'}
              open={open === draft.internalName}
              onToggle={() => setOpen((cur) => (cur === draft.internalName ? '' : draft.internalName))}
              onChange={(patch) => update(draft.internalName, patch)}
            />
          ))}
        </div>
        <div className="qe-foot">
          <div className="qe-actions">
            <button
              type="button"
              className="qe-btn qe-btn-primary"
              data-testid="qe-save"
              onClick={() => props.onSave(draftsToConfig(drafts, props.fields))}
            >
              Save
            </button>
            <button type="button" className="qe-btn" data-testid="qe-cancel" onClick={props.onCancel}>
              Cancel
            </button>
          </div>
          <p className="qe-compat">Existing JSON settings are still read, so earlier configuration is kept.</p>
        </div>
      </aside>
    </FluentProvider>
  );
}

interface ICardProps {
  draft: IQuestionDraft;
  fields: IWizardField[];
  samples: Answers;
  firstName: string;
  open: boolean;
  onToggle(): void;
  onChange(patch: Partial<IQuestionDraft>): void;
}

function caretAtStart(el: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || !sel.isCollapsed) {
    return false;
  }
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) {
    return false;
  }
  const probe = document.createRange();
  probe.selectNodeContents(el);
  probe.collapse(true);
  return range.compareBoundaryPoints(Range.START_TO_START, probe) === 0;
}

function flattenPlainText(el: HTMLElement): string {
  const text = el.textContent || '';
  if (el.childNodes.length > 1 || (el.firstChild && el.firstChild.nodeType !== Node.TEXT_NODE)) {
    el.textContent = text;
  }
  return el.textContent || '';
}

function EditableText(props: { text: string; onChange(text: string): void; onBackspaceAtStart(): boolean }): React.ReactElement {
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.textContent !== props.text) {
      el.textContent = props.text;
    }
  }, [props.text]);
  return (
    <span
      ref={ref}
      className="qe-text"
      contentEditable={true}
      role="textbox"
      aria-label="Question text"
      suppressContentEditableWarning={true}
      onInput={() => {
        if (ref.current) {
          props.onChange(flattenPlainText(ref.current));
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        const pasted = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || !ref.current) {
          return;
        }
        sel.deleteFromDocument();
        sel.getRangeAt(0).insertNode(document.createTextNode(pasted));
        sel.collapseToEnd();
        props.onChange(flattenPlainText(ref.current));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Backspace' && !e.nativeEvent.isComposing && caretAtStart(e.currentTarget)) {
          if (props.onBackspaceAtStart()) {
            e.preventDefault();
          }
        }
      }}
    />
  );
}

function QuestionTextEditor(props: { value: string; fields: IWizardField[]; onChange(value: string): void }): React.ReactElement {
  const parts: TemplateSegment[] = parseTemplateSegments(props.value);
  const shown: TemplateSegment[] = parts.length > 0 ? parts : [{ type: 'text', text: '' }];
  const commit = (next: TemplateSegment[]): void => {
    props.onChange(serializeTemplateSegments(next));
  };
  const setTextAt = (index: number, text: string): void => {
    const next = shown.map((part, i) => (i === index && part.type === 'text' ? { type: 'text' as const, text } : part));
    commit(next);
  };
  const removeToken = (index: number): void => {
    commit(mergeAdjacentText(shown.filter((_, i) => i !== index)));
  };
  const focusEnd = (root: HTMLElement): void => {
    const spans = root.querySelectorAll('.qe-text');
    const last = spans[spans.length - 1] as HTMLElement | undefined;
    if (!last) {
      return;
    }
    last.focus();
    const range = document.createRange();
    range.selectNodeContents(last);
    range.collapse(false);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };
  return (
    <div
      className="qe-editor"
      data-testid="qe-question"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          focusEnd(e.currentTarget);
        }
      }}
    >
      {shown.map((part, i) =>
        part.type === 'token' ? (
          <button type="button" className="qe-pill" key={`t-${i}-${part.name}`} onClick={() => removeToken(i)} title="Remove">
            {tokenLabel(part.name, props.fields)}
          </button>
        ) : (
          <EditableText
            key={`s-${i}`}
            text={part.text}
            onChange={(text) => setTextAt(i, text)}
            onBackspaceAtStart={() => {
              const next = removeTokenBeforeIndex(shown, i);
              if (!next) {
                return false;
              }
              commit(next);
              return true;
            }}
          />
        )
      )}
    </div>
  );
}

function QuestionCard(props: ICardProps): React.ReactElement {
  const { draft, fields, firstName } = props;
  const field = fields.filter((f) => f.internalName === draft.internalName)[0];
  const earlier = earlierFields(fields, draft.internalName);
  const preview = field
    ? questionParts(draft.questionText, field, fields, props.samples, firstName)
        .map((part) => part.text)
        .join('')
    : draft.questionText;
  const whenOptions = whenFieldsBefore(fields, draft.internalName);
  const always = draft.conditions.length === 0;
  const kindLabel = kindName(draft.kind);
  const conditionBits = draft.conditions
    .map((c) => {
      const when = fields.filter((f) => f.internalName === c.when)[0];
      const label = (when && when.title) || c.when;
      const values = (c.values || []).filter((v) => !!v && String(v).trim());
      if (!label) {
        return '';
      }
      if (c.op === 'answered') {
        return `${label} is answered`;
      }
      if (!values.length) {
        return '';
      }
      const opLabel = c.op === 'any' ? 'is any of' : c.op === 'not' ? 'is not' : 'is';
      return `${label} ${opLabel} ${values.join(', ')}`;
    })
    .filter(Boolean);
  const summary = conditionBits.length === 0
    ? `${preview} · Always show`
    : `${preview} · When ${conditionBits.join('; ')}`;

  const insert = (token: string): void => {
    const parts = parseTemplateSegments(draft.questionText);
    const last = parts[parts.length - 1];
    if (!last || last.type !== 'text' || !/ $/.test(last.text)) {
      if (last && last.type === 'text') {
        last.text += last.text && !/ $/.test(last.text) && !/[,:?]$/.test(last.text) ? ' ' : '';
      } else if (!last) {
        parts.push({ type: 'text', text: '' });
      }
    }
    parts.push({ type: 'token', name: token });
    const tail = parts[parts.length - 1];
    if (tail && tail.type === 'token') {
      parts.push({ type: 'text', text: '' });
    }
    props.onChange({ questionText: serializeTemplateSegments(parts) });
  };

  const addCondition = (): void => {
    const first = whenOptions[0];
    if (!first) {
      return;
    }
    const values = choicesFor(first);
    props.onChange({
      conditions: draft.conditions.concat([{ when: first.internalName, op: 'is', values: values[0] ? [values[0]] : [] }])
    });
  };

  const setCondition = (index: number, patch: Partial<IQuestionCondition>): void => {
    const next = draft.conditions.map((c, i) => (i === index ? { ...c, ...patch } : c));
    props.onChange({ conditions: next });
  };

  const removeCondition = (index: number): void => {
    props.onChange({ conditions: draft.conditions.filter((_, i) => i !== index) });
  };

  return (
    <article className={props.open ? 'qe-card is-open' : 'qe-card'} data-card={draft.internalName} data-testid="qe-card">
      <button type="button" className="qe-card-h" onClick={props.onToggle} aria-expanded={props.open}>
        <svg className="qe-chev" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.2 4.2 6 8l3.8-3.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span>
          <span className="qe-name">{draft.title}</span>
          <span className="qe-type"> {kindLabel}</span>
          <span className="qe-meta">{summary}</span>
        </span>
      </button>
      {props.open ? (
        <div className="qe-card-body">
          <div className="qe-field">
            <label className="qe-label">Question text</label>
            <QuestionTextEditor
              value={draft.questionText}
              fields={fields}
              onChange={(questionText) => props.onChange({ questionText })}
            />
            {earlier.length > 0 ? (
              <div data-testid="qe-personalize">
                <div className="qe-label">Personalize with an answer</div>
                <p className="qe-hint">{"Add a reply from an earlier question, for example: Thanks, {First name}."}</p>
                <div className="qe-chips" data-testid="qe-chips">
                  <button type="button" className="qe-chip" onClick={() => insert('firstName')}>
                    <span className="qe-chip-plus" aria-hidden="true">+</span>
                    First name
                  </button>
                  {earlier.map((f) => (
                    <button type="button" className="qe-chip" key={f.internalName} onClick={() => insert(f.internalName)}>
                      <span className="qe-chip-plus" aria-hidden="true">+</span>
                      {f.title}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="qe-field">
            <label className="qe-label" htmlFor={`qe-ex-${draft.internalName}`}>
              Example answer
            </label>
            <textarea
              id={`qe-ex-${draft.internalName}`}
              className="qe-input qe-textarea"
              value={draft.example}
              placeholder="Optional"
              rows={2}
              data-testid="qe-example"
              onChange={(e) => props.onChange({ example: e.target.value })}
            />
            <p className="qe-hint">The field description in SharePoint is shown as the guide text.</p>
          </div>
          <div className="qe-field">
            <label className="qe-label" htmlFor={`qe-check-${draft.internalName}`}>
              Check answer as
            </label>
            <select
              id={`qe-check-${draft.internalName}`}
              className="qe-input qe-select"
              value={draft.answerCheck || 'none'}
              data-testid="qe-answer-check"
              onChange={(e) => props.onChange({ answerCheck: e.target.value as typeof draft.answerCheck })}
            >
              <option value="none">None</option>
              <option value="email">Email</option>
              <option value="url">Web link</option>
              <option value="phone">Phone</option>
            </select>
          </div>
          <div className="qe-field">
            <div className="qe-label">Show only when</div>
            {always ? (
              <div className="qe-row">
                <span className="qe-always">Always show</span>
              </div>
            ) : (
              draft.conditions.map((c, i) => {
                const whenField = fields.filter((f) => f.internalName === c.when)[0];
                const options = whenField ? choicesFor(whenField) : [];
                return (
                  <div className="qe-row" key={i} data-testid="qe-condition">
                    <select
                      className="qe-input qe-select"
                      aria-label="Column"
                      value={c.when}
                      onChange={(e) => {
                        const next = fields.filter((f) => f.internalName === e.target.value)[0];
                        const vals = next ? choicesFor(next) : [];
                        setCondition(i, { when: e.target.value, values: vals[0] ? [vals[0]] : [] });
                      }}
                    >
                      {whenOptions.map((f) => (
                        <option key={f.internalName} value={f.internalName}>
                          {f.title}
                        </option>
                      ))}
                    </select>
                    <select
                      className="qe-input qe-select qe-op"
                      aria-label="Operator"
                      value={c.op}
                      onChange={(e) => {
                        const op = e.target.value as typeof c.op;
                        const patch: Partial<typeof c> = { op };
                        if (op === 'answered') {
                          patch.values = [];
                        } else if ((op === 'is' || op === 'not') && !(c.values && c.values[0]) && options[0]) {
                          patch.values = [options[0]];
                        }
                        setCondition(i, patch);
                      }}
                    >
                      <option value="is">is</option>
                      <option value="not">is not</option>
                      <option value="any">is any of</option>
                      <option value="answered">is answered</option>
                    </select>
                    {c.op === 'answered' ? null : options.length > 0 && (c.op === 'is' || c.op === 'not') ? (
                      <select
                        className="qe-input qe-select"
                        aria-label="Value"
                        value={c.values[0] || ''}
                        onChange={(e) => setCondition(i, { values: e.target.value ? [e.target.value] : [] })}
                      >
                        {options.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    ) : options.length > 0 && c.op === 'any' ? (
                      <select
                        className="qe-input qe-select"
                        aria-label="Values"
                        multiple={true}
                        value={c.values}
                        onChange={(e) =>
                          setCondition(i, { values: Array.from(e.target.selectedOptions).map((o) => o.value) })
                        }
                      >
                        {options.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="qe-input"
                        aria-label="Value"
                        value={c.values[0] || ''}
                        onChange={(e) => setCondition(i, { values: e.target.value ? [e.target.value] : [] })}
                      />
                    )}
                    <button
                      type="button"
                      className="qe-remove"
                      aria-label="Remove condition"
                      data-testid="qe-remove-condition"
                      onClick={() => removeCondition(i)}
                    >
                      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                        <path d="M3 3l6 6M9 3 3 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
            {whenOptions.length > 0 ? (
              <button type="button" className="qe-link" onClick={addCondition} data-testid="qe-add-condition">
                Add condition
              </button>
            ) : (
              <p className="qe-hint">Skip logic needs an earlier choice or Yes/No question.</p>
            )}
          </div>
          <div className="qe-preview">
            <span className="qe-preview-label">Preview</span>
            <p className="qe-preview-line" data-testid="qe-preview">
              {preview}
            </p>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function kindName(kind: IWizardField['kind']): string {
  switch (kind) {
    case 'text':
      return 'Single line of text';
    case 'note':
      return 'Multiple lines of text';
    case 'choice':
      return 'Choice';
    case 'multichoice':
      return 'Choice (multiple)';
    case 'date':
      return 'Date';
    case 'datetime':
      return 'Date and time';
    case 'yesno':
      return 'Yes/No';
    case 'number':
      return 'Number';
    case 'currency':
      return 'Currency';
    case 'hyperlink':
      return 'Hyperlink';
    default:
      return kind;
  }
}
