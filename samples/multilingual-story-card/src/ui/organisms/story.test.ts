import { afterEach, describe, expect, it } from 'vitest';
import { story, type IStory } from './story';

const URDU: string = 'جیسیکا والش نے 2019 میں &Walsh قائم کیا، Sagmeister & Walsh کے بعد۔';

function make(sentences: string[], dir: 'ltr' | 'rtl'): IStory {
  return story({ id: 't', title: dir === 'rtl' ? 'جیسیکا والش اور &Walsh' : 'Title', sentences, lang: dir === 'rtl' ? 'ur' : 'en', titleDir: dir, textDir: dir, joiner: ' ' });
}

describe('story: Latin names inside right-to-left text', () => {
  it('makes each Latin run its own left-to-right island, without changing the text', () => {
    const s: IStory = make([URDU], 'rtl');
    const islands: string[] = Array.from(s.body.querySelectorAll('span[dir="ltr"]')).map((e: Element) => e.textContent || '');
    expect(islands).toEqual(['&Walsh', 'Sagmeister & Walsh']);
    expect(s.body.textContent).toBe(URDU);
    expect(s.headline.querySelector('span[dir="ltr"]')?.textContent).toBe('&Walsh');
  });

  it('leaves trailing sentence punctuation on the right-to-left side', () => {
    const s: IStory = make(['یہ کمپنی Microsoft.'], 'rtl');
    expect(s.body.querySelector('span[dir="ltr"]')?.textContent).toBe('Microsoft');
  });

  it('leaves left-to-right text as plain text', () => {
    const s: IStory = make(['Founded &Walsh in 2019.'], 'ltr');
    expect(s.body.querySelector('span[dir]')).toBeNull();
  });
});

describe('story: word highlight across the islands', () => {
  const g: Record<string, unknown> = globalThis as unknown as Record<string, unknown>;
  const w: Record<string, unknown> = window as unknown as Record<string, unknown>;
  let saved: unknown;

  afterEach(() => {
    g.CSS = saved;
    delete w.Highlight;
  });

  it('marks the spoken word by its offset in the whole sentence', () => {
    let marked: string = '';
    // jsdom has no CSS Custom Highlight API: a registry that records the marked text.
    saved = g.CSS;
    g.CSS = { highlights: { set: (_n: string, h: { range: Range }) => (marked = h.range.toString()), delete: () => undefined } };
    w.Highlight = function (this: { range: Range }, range: Range) {
      this.range = range;
    };
    const s: IStory = make([URDU], 'rtl');
    // part 0 is the headline; part 1 the sentence. Offsets come from the speech engine (whole text).
    const at: number = URDU.indexOf('Sagmeister');
    s.highlightWord(1, at, 'Sagmeister'.length);
    expect(marked).toBe('Sagmeister');
    s.highlightWord(1, URDU.indexOf('قائم'), 0);
    expect(marked).toBe('قائم');
  });
});
