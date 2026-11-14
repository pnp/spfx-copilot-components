// Voiceover with the Web Speech API (speechSynthesis). Speaks sentence by sentence, because Chrome
// cuts off long utterances and pause()/resume() are unreliable there: "pause" cancels and remembers
// the sentence index, "resume" starts again at that sentence.

export type PlayerState = 'idle' | 'playing' | 'paused' | 'finished';

export interface IVoiceLike {
  name: string;
  lang: string;
  localService?: boolean;
  default?: boolean;
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
}

/** getVoices() is empty until 'voiceschanged' fired (Chrome/Edge); resolves after it or a timeout. */
export function waitForVoices(timeoutMs: number = 1500): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) {
    return Promise.resolve([]);
  }
  const synth: SpeechSynthesis = window.speechSynthesis;
  const now: SpeechSynthesisVoice[] = synth.getVoices();
  if (now.length > 0) {
    return Promise.resolve(now);
  }
  return new Promise<SpeechSynthesisVoice[]>((resolve: (voices: SpeechSynthesisVoice[]) => void) => {
    let timer: number = 0;
    const done = (): void => {
      synth.removeEventListener('voiceschanged', done);
      window.clearTimeout(timer);
      resolve(synth.getVoices());
    };
    timer = window.setTimeout(done, timeoutMs);
    synth.addEventListener('voiceschanged', done);
  });
}

function norm(tag: string): string {
  return tag.replace(/_/g, '-').toLowerCase();
}

const FEMALE: RegExp = /female|woman|frau|\b(katja|ingrid|hedda|zira|aria|jenny|sonia|libby|noora|selma|sofie|hoda|salma|nanami|amala|seraphina|elke|samantha|karen|moira|tessa|anna|helena|alva|satu|laila|kyoko)\b/i;
const MALE: RegExp = /\bmale\b|\bman\b|mann|\b(conrad|jonas|stefan|guy|ryan|harri|mattias|hamed|shakir|keita|killian|daniel|alex|fred|thomas|markus|yannick|oskar|onni|maged|otoya)\b/i;

function score(voice: IVoiceLike, hint: string | undefined): number {
  let s: number = 0;
  // Edge/WebView2 "Online (Natural)" voices sound far better than the legacy local ones.
  if (/natural|online|neural/i.test(voice.name)) {
    s += 2;
  }
  if (hint === 'female' && FEMALE.test(voice.name)) {
    s += 4;
  }
  if (hint === 'male' && MALE.test(voice.name)) {
    s += 4;
  }
  if (voice.default) {
    s += 1;
  }
  return s;
}

function best<T extends IVoiceLike>(voices: T[], hint: string | undefined): T | undefined {
  let winner: T | undefined;
  let top: number = -1;
  voices.forEach((v: T) => {
    const s: number = score(v, hint);
    if (s > top) {
      top = s;
      winner = v;
    }
  });
  return winner;
}

/**
 * Exact tag first (de-AT), then any voice of the primary language (de-*), else undefined.
 * `hint` is 'female' / 'male' or a voice name; a matching name of the same language wins outright.
 */
/** Dialects without voices of their own read best with their standard language's voices. */
const VOICE_FALLBACK: Record<string, string> = { gsw: 'de-CH', bar: 'de-AT', als: 'de-CH' };

export function pickVoice<T extends IVoiceLike>(voices: T[], tag: string, hint?: string): T | undefined {
  const fallback: string | undefined = VOICE_FALLBACK[norm(tag).split('-')[0]];
  if (fallback) {
    const own: T | undefined = pickVoiceFor(voices, tag, hint);
    return own || pickVoiceFor(voices, fallback, hint);
  }
  return pickVoiceFor(voices, tag, hint);
}

function pickVoiceFor<T extends IVoiceLike>(voices: T[], tag: string, hint?: string): T | undefined {
  const wanted: string = norm(tag);
  const primary: string = wanted.split('-')[0];
  const genderHint: string | undefined = hint === 'female' || hint === 'male' ? hint : undefined;
  const samePrimary: T[] = voices.filter((v: T) => norm(v.lang).split('-')[0] === primary);

  if (hint && !genderHint) {
    const byName: T | undefined = samePrimary.find((v: T) => v.name.toLowerCase().indexOf(hint.toLowerCase()) !== -1);
    if (byName) {
      return byName;
    }
  }
  const exact: T[] = samePrimary.filter((v: T) => norm(v.lang) === wanted);
  return best(exact.length > 0 ? exact : samePrimary, genderHint);
}

/**
 * A voice's name without the vendor and the language it repeats, for the card: "Microsoft Katja
 * Online (Natural) - German (Germany)" → "Katja", "Eddy (German (Germany))" → "Eddy",
 * "Google Deutsch" → "Google Deutsch" (nothing to strip but the vendor would leave too little).
 */
export function shortVoiceName(name: string): string {
  const short: string = name
    .replace(/\s+-\s+.*$/, '') // " - German (Germany)"
    .replace(/\s*\((?:[^()]|\([^()]*\))*\)\s*$/, '') // " (German (Germany))", " (Natural)"
    .replace(/\s+Online(?:\s+\(Natural\))?$/i, '')
    .replace(/^Microsoft\s+/, '')
    .trim();
  return short || name;
}

export interface ISentencePlayerOptions {
  sentences: string[];
  lang: string;
  voice: SpeechSynthesisVoice | undefined;
  startIndex?: number;
  onStateChange: (state: PlayerState, index: number) => void;
  /** Word boundary inside the current sentence (not fired by every voice). */
  onBoundary?: (index: number, charIndex: number, charLength: number) => void;
  onError?: (error: string) => void;
}

/** One sentence handed to the engine, for diagnostics ("which voice read this?"). */
export interface ISpokenLog {
  index: number;
  voice: string | undefined;
  lang: string;
  /** The voice object came from the current getVoices() list (not the one picked at the start). */
  fresh: boolean;
}

const LOG_SIZE: number = 20;

/**
 * The same voice from the engine's current list. Edge replaces its voice objects (voiceschanged)
 * once the online voices have warmed up, often right after the first sentence; an old object is then
 * ignored and the engine falls back to its default voice for the language, which is English when no
 * local voice for that language is installed. So every sentence asks for the voice afresh.
 */
export function currentVoice(voice: SpeechSynthesisVoice): { voice: SpeechSynthesisVoice; fresh: boolean } {
  const list: SpeechSynthesisVoice[] = isSpeechSupported() ? window.speechSynthesis.getVoices() || [] : [];
  const match: SpeechSynthesisVoice | undefined =
    (voice.voiceURI ? list.find((v: SpeechSynthesisVoice) => v.voiceURI === voice.voiceURI) : undefined) ||
    list.find((v: SpeechSynthesisVoice) => v.name === voice.name && v.lang === voice.lang);
  return match ? { voice: match, fresh: true } : { voice, fresh: false };
}

export class SentencePlayer {
  public state: PlayerState = 'idle';
  public index: number;
  /** The last sentences handed to the engine, newest last. */
  public readonly log: ISpokenLog[] = [];
  private readonly _opts: ISentencePlayerOptions;
  // Generation counter: events of a cancelled utterance must not advance the player.
  private _generation: number = 0;
  // Chrome may garbage-collect an unreferenced utterance and never fire 'end'; keep a reference.
  private _current: SpeechSynthesisUtterance | undefined;

  public constructor(options: ISentencePlayerOptions) {
    this._opts = options;
    this.index = Math.min(Math.max(options.startIndex || 0, 0), Math.max(options.sentences.length - 1, 0));
  }

  public play(): void {
    if (!isSpeechSupported() || this._opts.sentences.length === 0) {
      return;
    }
    if (this.state === 'finished') {
      this.index = 0;
    }
    window.speechSynthesis.cancel();
    this._speak(++this._generation);
  }

  /** Cancel and remember the sentence; play() resumes at it. */
  public pause(): void {
    if (this.state !== 'playing') {
      return;
    }
    this._generation++;
    window.speechSynthesis.cancel();
    this._set('paused');
  }

  public stop(): void {
    this._generation++;
    if (isSpeechSupported()) {
      window.speechSynthesis.cancel();
    }
    this.index = 0;
    this._set('idle');
  }

  /** Teardown: silence without a state change callback. */
  public dispose(): void {
    this._generation++;
    if (isSpeechSupported()) {
      window.speechSynthesis.cancel();
    }
    this._current = undefined;
  }

  private _speak(generation: number): void {
    const text: string = this._opts.sentences[this.index];
    const utterance: SpeechSynthesisUtterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this._opts.lang;
    let voiceName: string | undefined;
    let fresh: boolean = false;
    if (this._opts.voice) {
      const current: { voice: SpeechSynthesisVoice; fresh: boolean } = currentVoice(this._opts.voice);
      utterance.voice = current.voice;
      voiceName = current.voice.name;
      fresh = current.fresh;
    }
    this.log.push({ index: this.index, voice: voiceName, lang: utterance.lang, fresh });
    if (this.log.length > LOG_SIZE) {
      this.log.shift();
    }
    utterance.addEventListener('boundary', (e: SpeechSynthesisEvent) => {
      if (generation === this._generation && e.name === 'word' && this._opts.onBoundary) {
        this._opts.onBoundary(this.index, e.charIndex, e.charLength || 0);
      }
    });
    utterance.addEventListener('end', () => {
      if (generation !== this._generation) {
        return;
      }
      if (this.index < this._opts.sentences.length - 1) {
        this.index++;
        this._set('playing');
        this._speak(generation);
      } else {
        this._current = undefined;
        this._set('finished');
      }
    });
    utterance.addEventListener('error', (e: SpeechSynthesisErrorEvent) => {
      // 'interrupted'/'canceled' are our own cancel() calls.
      if (generation !== this._generation || e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      this._generation++;
      this._set('idle');
      if (this._opts.onError) {
        this._opts.onError(e.error);
      }
    });
    this._current = utterance;
    this._set('playing');
    window.speechSynthesis.speak(utterance);
  }

  private _set(state: PlayerState): void {
    this.state = state;
    this._opts.onStateChange(state, this.index);
  }
}
