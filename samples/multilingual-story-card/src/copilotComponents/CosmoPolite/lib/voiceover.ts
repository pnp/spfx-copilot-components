// The read-aloud controller: voice loading, the sentence player, live-region announcements and the
// resume position. The display is shared: the play/stop buttons are the voiceControls molecule,
// the sentence and word marks belong to the story organism. The component only hands it the texts
// (index-aligned with the story's parts) and where to persist the position.

import type { IActionRunner } from '../../../ui/actions';
import { note } from '../../../ui/atoms/note';
import { voiceControls, type IVoiceControls } from '../../../ui/molecules/voiceControls';
import type { IStory } from '../../../ui/organisms/story';
import { displayName } from './language';
import { isSpeechSupported, pickVoice, SentencePlayer, shortVoiceName, waitForVoices, type PlayerState } from './speech';

/** Whether this browser has a voice for the text's language: unknown until the voice list is in. */
export type VoiceAvailability = 'checking' | 'available' | 'none';
import { format, type IUiStrings } from './strings/types';

export interface IVoiceoverOptions {
  /** Headline first, then one entry per sentence: the same order as story.parts. */
  texts: string[];
  /** Marks the part being read. */
  story: Pick<IStory, 'setCurrent' | 'highlightWord' | 'clearWord'>;
  /** Language of the text (voice choice and utterance lang). */
  lang: string;
  /** UI language, for language names in announcements. */
  uiLang: string;
  /** 'female' / 'male' or a voice name. */
  voiceHint: string | undefined;
  /** Sentence index to resume at (from a previous iframe). */
  resumeAt: number | undefined;
  strings: IUiStrings;
  runner: IActionRunner;
  announce(text: string): void;
  /** Called with the sentence to resume at, or undefined when playback is over. */
  onPosition(index: number | undefined): void;
  /** Called when it becomes known (or changes) whether a voice for the language exists. */
  onAvailability?(state: VoiceAvailability): void;
}

export class Voiceover {
  /** Empty when speech is unavailable or there is nothing to read. */
  public readonly controls: HTMLElement[] = [];
  private readonly _opts: IVoiceoverOptions;
  private _view: IVoiceControls | undefined;
  private _voices: SpeechSynthesisVoice[] = [];
  private _voicesLoaded: boolean = false;
  private _player: SentencePlayer | undefined;
  private _lastState: PlayerState = 'idle';
  private _resumeAt: number | undefined;
  private _availability: VoiceAvailability = 'checking';
  /** The voice the last playback started with (diagnostics). */
  private _chosen: SpeechSynthesisVoice | undefined;

  private _choosing: boolean = false;
  /** Which voice reads ("Katja · de-DE"), next to the buttons; hidden while there is none. */
  private _voiceLabel: HTMLElement | undefined;

  // Edge/WebView2 deliver their online voices (e.g. Greek "Athina", "Nestoras") after the local ones,
  // through 'voiceschanged': keep the list current for the card's whole life, not just at start.
  private _onVoicesChanged = (): void => {
    this._voices = window.speechSynthesis.getVoices();
    this._voicesLoaded = true;
    this._checkAvailability();
  };

  private _onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden' && this._player) {
      this._player.pause();
    }
  };

  public constructor(options: IVoiceoverOptions) {
    this._opts = options;
    this._resumeAt = options.resumeAt;
    if (!isSpeechSupported() || options.texts.length === 0) {
      return;
    }
    const t: IUiStrings = options.strings;
    this._view = voiceControls(
      options.runner,
      { readAloud: t.readAloud, pause: t.pause, resume: t.resume, stop: t.stop },
      { toggle: () => this.toggle(), stop: () => this._player?.stop() }
    );
    this._voiceLabel = note('', { tag: 'span' });
    this._voiceLabel.hidden = true;
    this.controls.push(...this._view.elements, this._voiceLabel);
    document.addEventListener('visibilitychange', this._onVisibilityChange);
    window.speechSynthesis.addEventListener('voiceschanged', this._onVoicesChanged);
    // The buttons only show when a voice can read this language. Chrome fills the list after a
    // moment, Edge often has it already; until then the buttons stay hidden.
    const now: SpeechSynthesisVoice[] = window.speechSynthesis.getVoices() || [];
    if (now.length > 0) {
      this._voices = now;
      this._voicesLoaded = true;
    }
    this._checkAvailability();
    waitForVoices(2000)
      .then((voices: SpeechSynthesisVoice[]) => {
        this._voices = voices;
        this._voicesLoaded = true;
        this._checkAvailability();
      })
      .catch(() => undefined);
    this._updateUi();
  }

  public get availability(): VoiceAvailability {
    return this._availability;
  }

  /** 'none' only once the voice list is in; a later voiceschanged with a match brings the buttons back. */
  private _checkAvailability(): void {
    const voice: SpeechSynthesisVoice | undefined = pickVoice(this._voices, this._opts.lang, this._opts.voiceHint);
    const next: VoiceAvailability = voice ? 'available' : this._voicesLoaded ? 'none' : 'checking';
    // Once playback started, the label shows the voice actually reading; before that, the one that would.
    this._showVoice(this._chosen || voice);
    if (next === this._availability && next !== 'checking') {
      return;
    }
    this._availability = next;
    this._view?.setHidden(next !== 'available');
    this._opts.onAvailability?.(next);
  }

  public get playing(): boolean {
    return !!this._player && this._player.state === 'playing';
  }

  public toggle(): void {
    if (this._player) {
      if (this._player.state === 'playing') {
        this._player.pause();
      } else {
        this._player.play();
      }
      return;
    }
    if (this._choosing) {
      return;
    }
    this._choosing = true;
    this._chooseVoice()
      .then((voice: SpeechSynthesisVoice | undefined) => {
        if (!voice) {
          // Never read with a voice of another language: an English voice spells Greek or Arabic
          // text out letter by letter. Say that no voice is installed instead.
          this._opts.announce(format(this._opts.strings.noVoice, displayName(this._opts.lang, this._opts.uiLang)));
          return;
        }
        this._start(voice);
      })
      .catch(() => undefined)
      .then(() => {
        this._choosing = false;
      })
      .catch(() => undefined);
  }

  /** A voice for the text's language: from the current list, or after the online voices arrived. */
  private async _chooseVoice(): Promise<SpeechSynthesisVoice | undefined> {
    const pick = (): SpeechSynthesisVoice | undefined => pickVoice(this._voices, this._opts.lang, this._opts.voiceHint);
    this._voices = window.speechSynthesis.getVoices();
    let voice: SpeechSynthesisVoice | undefined = pick();
    if (!voice) {
      await nextVoicesChange(1500);
      this._voices = window.speechSynthesis.getVoices();
      voice = pick();
    }
    return voice;
  }

  /** Edge swaps in its online voices after a moment: the label follows the current pick. */
  private _showVoice(voice: SpeechSynthesisVoice | undefined): void {
    if (!this._voiceLabel) {
      return;
    }
    this._voiceLabel.textContent = voice ? `${shortVoiceName(voice.name)} · ${voice.lang.replace('_', '-')}` : '';
    this._voiceLabel.hidden = !voice;
    // The full name ("… Online (Natural) - German (Germany)") on hover.
    this._voiceLabel.title = voice ? voice.name : '';
  }

  private _start(voice: SpeechSynthesisVoice): void {
    this._chosen = voice;
    this._showVoice(voice);
    this._player = new SentencePlayer({
      sentences: this._opts.texts,
      // The voice's own tag (e.g. el-GR): engines read best when lang and voice agree.
      lang: voice.lang,
      voice,
      startIndex: this._resumeAt,
      onStateChange: (state: PlayerState, index: number) => this._onState(state, index),
      onBoundary: (index: number, charIndex: number, charLength: number) => this._opts.story.highlightWord(index, charIndex, charLength),
      onError: (error: string) => this._opts.announce(`${this._opts.strings.speechUnavailable} (${error})`)
    });
    this._player.play();
  }

  public stop(): void {
    this._player?.stop();
  }

  /** Silence without announcements (teardown); safe to call twice. */
  public dispose(): void {
    if (this._player) {
      this._player.dispose();
    }
    this._opts.story.clearWord();
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    if (isSpeechSupported()) {
      window.speechSynthesis.removeEventListener('voiceschanged', this._onVoicesChanged);
    }
  }

  public diagnostics(): Record<string, unknown> {
    const primary: string = this._opts.lang.toLowerCase().split('-')[0];
    const describe = (v: SpeechSynthesisVoice): string => `${v.name} (${v.lang}${v.localService ? ', local' : ', online'})`;
    return {
      loaded: this._voicesLoaded,
      count: this._voices.length,
      language: this._opts.lang,
      availability: this._availability,
      // Every voice that could read this language, and the one the last playback started with.
      candidates: this._voices.filter((v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace('_', '-').split('-')[0] === primary).map(describe),
      chosen: this._chosen ? describe(this._chosen) : undefined,
      player: this._player?.state,
      // Per sentence: which voice the engine was given (fresh = from its current list).
      spoken: this._player?.log
    };
  }

  private _onState(state: PlayerState, index: number): void {
    // Persist the position: the host may replace the iframe mid-playback.
    this._resumeAt = state === 'finished' || state === 'idle' ? undefined : index;
    this._opts.onPosition(this._resumeAt);
    this._updateUi();
    if (state !== this._lastState) {
      const t: IUiStrings = this._opts.strings;
      const message: Record<PlayerState, string> = { playing: t.reading, paused: t.paused, idle: t.stopped, finished: t.finished };
      this._opts.announce(message[state]);
    }
    this._lastState = state;
  }

  private _updateUi(): void {
    const state: PlayerState = this._player ? this._player.state : 'idle';
    const index: number = this._player ? this._player.index : -1;
    const active: boolean = state === 'playing' || state === 'paused';
    this._opts.story.setCurrent(active ? index : undefined);
    if (state !== 'playing') {
      this._opts.story.clearWord();
    }
    this._view?.update({
      playing: state === 'playing',
      active,
      resumable: state === 'paused' || (state === 'idle' && this._resumeAt !== undefined)
    });
  }
}

/** Resolves on the next 'voiceschanged' (new voices arrived) or after `ms`, whichever comes first. */
function nextVoicesChange(ms: number): Promise<void> {
  return new Promise<void>((resolve: () => void) => {
    const synth: SpeechSynthesis = window.speechSynthesis;
    let timer: number = 0;
    const done = (): void => {
      synth.removeEventListener('voiceschanged', done);
      window.clearTimeout(timer);
      resolve();
    };
    timer = window.setTimeout(done, ms);
    synth.addEventListener('voiceschanged', done);
  });
}
