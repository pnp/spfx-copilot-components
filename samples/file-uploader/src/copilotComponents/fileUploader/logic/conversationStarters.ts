import type { IFileUploaderCopilotComponentProperties } from '../FileUploaderCopilotComponentProperties';

/**
 * Capability-education gate (todo.md, between Phase 3 and Phase 4).
 *
 * The five starters the brief approved, as a typed catalog so the mapping to an
 * intent and the "yields a non-empty state on mock data" claim are testable.
 * `copilot/declarativeAgent.json` mirrors `title` / `text` verbatim; Phase 6
 * makes that JSON a generated artefact of this list (AGENTS.md R14).
 */

export type StarterOutcome = 'file' | 'recent' | 'prose';

export interface IConversationStarter {
  /** Short label on the starter chip in Copilot. */
  title: string;
  /** The exact prompt text — mirrored verbatim in copilot/declarativeAgent.json. */
  text: string;
  /**
   * Where the starter leads. `file` / `recent` invoke the component on that
   * intent; `prose` is answered by the agent from the kind -> required-fields
   * list and never invokes the component (README: the text-only intent). The
   * prose starter is the capability-education one: it tells a first-time user
   * what a record needs so they can then file one.
   */
  outcome: StarterOutcome;
  /** Properties Copilot is expected to extract from `text` — drives the non-empty-state check. */
  props: IFileUploaderCopilotComponentProperties;
}

export const CONVERSATION_STARTERS: IConversationStarter[] = [
  {
    title: 'File an invoice',
    text: 'File this invoice for the Programs team',
    outcome: 'file',
    props: { intent: 'file', documentKind: 'invoice', department: 'programs' }
  },
  {
    title: 'File expense reports',
    text: 'Upload these expense reports from last month',
    outcome: 'file',
    props: { intent: 'file', documentKind: 'expenseReport' }
  },
  {
    title: "This week's filings",
    text: 'What have I filed this week?',
    outcome: 'recent',
    props: { intent: 'recent', period: '7d' }
  },
  {
    title: 'Finance, still pending',
    text: 'Show recent filings for Finance that are still pending',
    outcome: 'recent',
    props: { intent: 'recent', department: 'finance', status: 'pendingReview' }
  },
  {
    title: 'What a report needs',
    text: 'What information does an expense report need before I file it?',
    outcome: 'prose',
    props: {}
  }
];
