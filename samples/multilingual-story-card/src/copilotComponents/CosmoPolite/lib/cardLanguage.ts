// The card's languages, resolved once per card: what the user wrote in (the agent's tag), what the
// text is really written in, and the chrome language with its string table. Kept apart because they
// differ in practice: an "en" tag on German text, English text for a Finnish question.

import { reconcileLanguage, type IReconciledLanguage } from './detect';
import { resolveUiLanguage, type IResolvedLanguage } from './language';
import { loadStringTable, type IStringTable, type IUiStrings, type LanguageSource } from './strings';

export interface ICardLanguage {
  /** The agent's tag checked against the text. */
  reconciled: IReconciledLanguage;
  /** Language the user wrote in (agent tag), or the UI fallback. */
  requested: string;
  /** Language the text is really written in. */
  content: string;
  /** Chrome language and where it came from. */
  ui: IResolvedLanguage;
  strings: IUiStrings;
  /** The chrome table was reviewed by a native speaker. */
  reviewed: boolean;
  /** Where the language could come from, best first (for diagnostics). */
  candidates: Array<[LanguageSource, unknown]>;
}

/**
 * Agent (tool input, per turn) > hostContext.locale > SharePoint UI culture > browser > English.
 * `host` lists the candidates after the agent's; the string table loads before the first render,
 * so the chrome never flashes in English.
 */
export async function resolveCardLanguage(tag: string | undefined, text: string, host: Array<[LanguageSource, unknown]>): Promise<ICardLanguage> {
  const reconciled: IReconciledLanguage = reconcileLanguage(tag, text);
  const candidates: Array<[LanguageSource, unknown]> = [['agent', reconciled.requested], ...host];
  const ui: IResolvedLanguage = resolveUiLanguage(candidates);
  const table: IStringTable = await loadStringTable(ui.lang);
  const requested: string = reconciled.requested || ui.lang;
  return {
    reconciled,
    requested,
    content: reconciled.content || requested,
    ui,
    strings: table.strings,
    reviewed: table.reviewed,
    candidates
  };
}
