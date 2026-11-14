import { describe, expect, it, vi, type Mock } from 'vitest';
import { Conversation } from './conversation';
import { englishStrings } from './strings';
import de from './strings/de';

function conversation(uiLang: string, requested: string, strings = englishStrings()): { c: Conversation; send: Mock } {
  const send: Mock = vi.fn(() => Promise.resolve({}));
  const c: Conversation = new Conversation({
    bridge: () => ({ sendFollowUpMessageAsync: send }),
    uiLang,
    strings,
    requested,
    title: 'Paris',
    announce: () => undefined
  });
  return { c, send };
}

const text = (send: Mock): string => JSON.stringify(send.mock.calls[0][0]);

describe('Conversation: requests name the language of the next card', () => {
  it('a translation is written in the target language, with its tag (Copilot then follows up in it)', async () => {
    const { c, send } = conversation('sv', 'sv');
    await c.translate('es');
    expect(text(send)).toContain('Traduce esta tarjeta');
    expect(text(send)).toContain('(es)');
    expect(text(send)).not.toContain('Översätt');
  });

  it('a translation from a card without its own labels has no contradicting “Answer in …”', async () => {
    const { c, send } = conversation('en', 'fa');
    await c.translate('fr');
    expect(text(send)).toContain('Traduisez');
    expect(text(send)).toContain('(fr)');
    expect(text(send)).not.toContain('Answer in');
  });

  it('“Tell me more” keeps the card’s language', async () => {
    const { c, send } = conversation('en', 'fa');
    await c.tellMore();
    expect(text(send)).toContain('Answer in');
  });

  it('a rewrite names the requested language', async () => {
    const { c, send } = conversation('de', 'de', de);
    await c.rewrite();
    expect(text(send)).toContain('(de)');
  });
});
