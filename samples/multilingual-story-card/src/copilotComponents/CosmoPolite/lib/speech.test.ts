import { beforeEach, describe, expect, it } from 'vitest';
import { pickVoice, SentencePlayer, shortVoiceName, type IVoiceLike, type PlayerState } from './speech';

const voices: IVoiceLike[] = [
  { name: 'Microsoft Hedda - German (Germany)', lang: 'de-DE' },
  { name: 'Microsoft Katja Online (Natural) - German (Germany)', lang: 'de-DE' },
  { name: 'Microsoft Conrad Online (Natural) - German (Germany)', lang: 'de-DE' },
  { name: 'Microsoft Ingrid Online (Natural) - German (Austria)', lang: 'de-AT' },
  { name: 'Microsoft Jonas Online (Natural) - German (Austria)', lang: 'de-AT' },
  { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Noora Online (Natural) - Finnish (Finland)', lang: 'fi_FI' }
];

describe('pickVoice', () => {
  it('prefers an exact tag match', () => {
    expect(pickVoice(voices, 'de-AT')?.lang).toBe('de-AT');
  });

  it('falls back to the primary language', () => {
    expect(pickVoice(voices, 'de-CH')?.lang).toBe('de-DE');
    expect(pickVoice(voices, 'fi')?.name).toContain('Noora');
  });

  it('prefers natural voices', () => {
    expect(pickVoice(voices, 'de-DE')?.name).toContain('Online (Natural)');
  });

  it('honours a gender hint', () => {
    expect(pickVoice(voices, 'de-AT', 'male')?.name).toContain('Jonas');
    expect(pickVoice(voices, 'de-AT', 'female')?.name).toContain('Ingrid');
    expect(pickVoice(voices, 'de-DE', 'male')?.name).toContain('Conrad');
  });

  it('honours a voice name hint within the language', () => {
    expect(pickVoice(voices, 'de', 'hedda')?.name).toContain('Hedda');
    expect(pickVoice(voices, 'de', 'zira')?.lang).toMatch(/^de/);
  });

  it('reads dialects with their standard language voices', () => {
    expect(pickVoice(voices, 'gsw')?.lang).toMatch(/^de/);
    expect(pickVoice([...voices, { name: 'Microsoft Leni Online (Natural) - German (Switzerland)', lang: 'de-CH' }], 'gsw')?.name).toContain('Leni');
    expect(pickVoice(voices, 'bar')?.lang).toBe('de-AT');
  });

  it('reads Portuguese and French with any voice of the language, never an English one', () => {
    const list: IVoiceLike[] = [
      { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
      { name: 'Microsoft Francisca Online (Natural) - Portuguese (Brazil)', lang: 'pt-BR' },
      { name: 'Microsoft Denise Online (Natural) - French (France)', lang: 'fr-FR' }
    ];
    expect(pickVoice(list, 'pt-PT')?.lang).toBe('pt-BR');
    expect(pickVoice(list, 'pt')?.lang).toBe('pt-BR');
    expect(pickVoice(list, 'fr-CA')?.lang).toBe('fr-FR');
    expect(pickVoice([list[0]], 'pt-BR')).toBeUndefined();
    expect(pickVoice([list[0]], 'fr')).toBeUndefined();
  });

  it('returns undefined without a voice for the language', () => {
    expect(pickVoice(voices, 'ja')).toBeUndefined();
    expect(pickVoice([], 'de')).toBeUndefined();
  });
});

// jsdom has no speech synthesis: a minimal fake that ends each utterance on demand.
// (No `extends EventTarget`: the tests compile to ES5, where native classes can't be subclassed.)
class FakeUtterance {
  public lang: string = '';
  public voice: unknown = undefined;
  public text: string;
  private _listeners: Record<string, Array<(e: Event) => void>> = {};
  public constructor(text: string) {
    this.text = text;
  }
  public addEventListener(type: string, listener: (e: Event) => void): void {
    (this._listeners[type] = this._listeners[type] || []).push(listener);
  }
  public dispatchEvent(e: Event): void {
    (this._listeners[e.type] || []).forEach((l: (e: Event) => void) => l(e));
  }
}

describe('SentencePlayer', () => {
  let spoken: FakeUtterance[];
  let cancels: number;

  beforeEach(() => {
    spoken = [];
    cancels = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w: any = window;
    w.SpeechSynthesisUtterance = FakeUtterance;
    w.speechSynthesis = {
      speak: (u: FakeUtterance) => spoken.push(u),
      cancel: () => {
        cancels++;
      },
      getVoices: () => []
    };
  });

  const end = (u: FakeUtterance): void => {
    u.dispatchEvent(new Event('end'));
  };

  it('speaks sentence by sentence and finishes', () => {
    const states: Array<[PlayerState, number]> = [];
    const player: SentencePlayer = new SentencePlayer({
      sentences: ['Eins.', 'Zwei.'],
      lang: 'de-AT',
      voice: undefined,
      onStateChange: (s: PlayerState, i: number) => states.push([s, i])
    });
    player.play();
    expect(spoken.map((u) => u.text)).toEqual(['Eins.']);
    expect(spoken[0].lang).toBe('de-AT');
    end(spoken[0]);
    expect(spoken.map((u) => u.text)).toEqual(['Eins.', 'Zwei.']);
    end(spoken[1]);
    expect(player.state).toBe('finished');
    expect(states[states.length - 1]).toEqual(['finished', 1]);
  });

  it('pauses by cancelling and resumes at the same sentence', () => {
    const player: SentencePlayer = new SentencePlayer({
      sentences: ['A.', 'B.', 'C.'],
      lang: 'en',
      voice: undefined,
      onStateChange: () => undefined
    });
    player.play();
    end(spoken[0]);
    player.pause();
    expect(player.state).toBe('paused');
    expect(player.index).toBe(1);
    // A late 'end' of the cancelled utterance must not advance the player.
    end(spoken[1]);
    expect(player.index).toBe(1);
    player.play();
    expect(spoken[spoken.length - 1].text).toBe('B.');
    expect(cancels).toBeGreaterThan(0);
  });

  it('starts at a persisted sentence index', () => {
    const player: SentencePlayer = new SentencePlayer({
      sentences: ['A.', 'B.', 'C.'],
      lang: 'en',
      voice: undefined,
      startIndex: 2,
      onStateChange: () => undefined
    });
    player.play();
    expect(spoken[0].text).toBe('C.');
  });

  it('stop resets to the beginning', () => {
    const player: SentencePlayer = new SentencePlayer({
      sentences: ['A.', 'B.'],
      lang: 'en',
      voice: undefined,
      onStateChange: () => undefined
    });
    player.play();
    end(spoken[0]);
    player.stop();
    expect(player.state).toBe('idle');
    expect(player.index).toBe(0);
  });

  it('asks the engine for the voice afresh before every sentence', () => {
    // Edge swaps its voice objects after the first sentence; the old object would be ignored.
    const picked = { name: 'Microsoft Francisca Online (Natural) - Portuguese (Brazil)', lang: 'pt-BR', voiceURI: 'francisca' };
    let list: unknown[] = [picked];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).speechSynthesis.getVoices = () => list;
    const player: SentencePlayer = new SentencePlayer({
      sentences: ['O título.', 'A primeira frase.', 'A segunda frase.'],
      lang: 'pt-BR',
      voice: picked as unknown as SpeechSynthesisVoice,
      onStateChange: () => undefined
    });
    player.play();
    expect(spoken[0].voice).toBe(picked);

    const replaced = { ...picked };
    list = [{ name: 'Microsoft Zira - English (United States)', lang: 'en-US', voiceURI: 'zira' }, replaced];
    end(spoken[0]);
    expect(spoken[1].voice).toBe(replaced);
    expect(spoken[1].lang).toBe('pt-BR');

    list = [];
    end(spoken[1]);
    expect(spoken[2].voice).toBe(picked); // gone from the list: keep the one we have
    expect(player.log.map((l) => [l.index, l.fresh])).toEqual([
      [0, true],
      [1, true],
      [2, false]
    ]);
  });
});

describe('shortVoiceName', () => {
  it('keeps the name a listener would recognise', () => {
    expect(shortVoiceName('Microsoft Katja Online (Natural) - German (Germany)')).toBe('Katja');
    expect(shortVoiceName('Microsoft Seraphina Mehrsprachig Online (Natural) - German (Germany)')).toBe('Seraphina Mehrsprachig');
    expect(shortVoiceName('Microsoft Hedda - German (Germany)')).toBe('Hedda');
    expect(shortVoiceName('Eddy (German (Germany))')).toBe('Eddy');
    expect(shortVoiceName('Anna')).toBe('Anna');
    expect(shortVoiceName('Google Deutsch')).toBe('Google Deutsch');
  });
});
