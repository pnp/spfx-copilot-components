// What the card says to Copilot: follow-up prompts sent as the user ("Tell me more", "Translate",
// "Rewrite in …") and the model context that keeps the chosen look for the next card.

import { createCopilotTextContent } from '@microsoft/sp-copilot-component';

import { displayName, samePrimary } from './language';
import { englishStrings, format, loadStringTable, matchLanguage, type IStringTable, type IUiStrings } from './strings';

/** The part of the Copilot bridge the card talks to. */
export interface IConversationBridge {
  sendFollowUpMessageAsync(content: ReturnType<typeof createCopilotTextContent>[]): Promise<{ isError?: boolean } | undefined>;
  updateModelContextAsync?(context: { content: ReturnType<typeof createCopilotTextContent>[]; structuredContent: Record<string, unknown> }): Promise<unknown>;
}

/**
 * The target language as the request names it. "Swiss German" alone is read as Swiss Standard
 * German by the model; the dialect's own name makes the request unambiguous.
 */
export function targetName(target: string, lang: string): string {
  const name: string = displayName(target, lang);
  return target.toLowerCase() === 'gsw' && name !== 'Schwiizerdütsch' ? `${name} (Schwiizerdütsch)` : name;
}

export interface IModelContextRecord {
  text: string;
  structured: Record<string, unknown>;
  sent: string;
  result?: string;
}

export interface IConversationOptions {
  bridge(): IConversationBridge | undefined;
  /** Chrome language and its strings. */
  uiLang: string;
  strings: IUiStrings;
  /** Language the user wrote in. */
  requested: string;
  title: string;
  announce(text: string): void;
}

export class Conversation {
  /** The last context this card gave the model (diagnostics: "what does the model know?"). */
  public modelContext: IModelContextRecord | undefined;
  private readonly _o: IConversationOptions;

  public constructor(options: IConversationOptions) {
    this._o = options;
  }

  public tellMore(): Promise<boolean> {
    return this._send(this._promptIn((s: IUiStrings) => format(s.tellMorePrompt, this._o.title)));
  }

  /**
   * The request is written IN the target language ("Traduce esta tarjeta a Español (es)."): it is the
   * user's latest message, so the agent sets that language for the new card (instructions: language
   * = the latest message; a translation's language is its target), and Copilot's own suggested
   * follow-ups come in it too instead of in the language the card was in. The tag in brackets makes
   * it unambiguous. Every target in the menu has a label set; otherwise English.
   */
  public async translate(target: string): Promise<boolean> {
    const lang: string = matchLanguage(target) || 'en';
    const table: IStringTable = await loadStringTable(matchLanguage(target) || 'en');
    return this._send(format(table.strings.translatePrompt, `${targetName(target, lang)} (${target})`));
  }

  public rewrite(): Promise<boolean> {
    return this._send(
      this._promptIn((s: IUiStrings, lang: string) => format(s.rewritePrompt, `${targetName(this._o.requested, lang)} (${this._o.requested})`), false)
    );
  }

  /** Tell the model the current look (on build and on every switch), so the next card keeps it. */
  public reportLook(look: { design: string; layout: string; theme: string }): void {
    const bridge: IConversationBridge | undefined = this._o.bridge();
    if (!bridge || typeof bridge.updateModelContextAsync !== 'function') {
      return;
    }
    const text: string =
      `The user's preferred CosmoPolite card look is design "${look.design}" and layout "${look.layout}". ` +
      'Pass them as design and layout in the next CosmoPoliteTool call unless the user asks for a different look.';
    const structured: Record<string, unknown> = { ...look, language: this._o.requested, title: this._o.title };
    const record: IModelContextRecord = { text, structured, sent: new Date().toISOString() };
    this.modelContext = record;
    bridge.updateModelContextAsync({ content: [createCopilotTextContent(text)], structuredContent: structured }).then(
      () => {
        record.result = 'accepted';
      },
      (error: unknown) => {
        record.result = `rejected: ${error instanceof Error ? error.message : String(error)}`;
      }
    );
  }

  /**
   * Follow-up prompts are sent as the user: they should be in the user's language. If no UI table
   * fits that language (English chrome), use English and say which language to answer in, so the
   * per-turn language doesn't flip by accident.
   */
  private _promptIn(build: (strings: IUiStrings, lang: string) => string, keepLanguage: boolean = true): string {
    if (samePrimary(this._o.uiLang, this._o.requested)) {
      return build(this._o.strings, this._o.uiLang);
    }
    // A translation or rewrite names its own target language: no "Answer in …" that would contradict it.
    const english: string = build(englishStrings(), 'en');
    return keepLanguage ? `${english} Answer in ${displayName(this._o.requested, 'en')}.` : english;
  }

  /** Resolves false when the host rejected the message (the button then shows no ✓). */
  private async _send(text: string): Promise<boolean> {
    const bridge: IConversationBridge | undefined = this._o.bridge();
    if (!bridge) {
      throw new Error('No Copilot bridge'); // the action runner announces the failure
    }
    const result = await bridge.sendFollowUpMessageAsync([createCopilotTextContent(text)]);
    this._o.announce(result?.isError ? this._o.strings.sendFailed : this._o.strings.sent);
    return !result?.isError;
  }
}
