// Molecule: read-aloud controls, [▶ Read aloud] [■ Stop]. Display only: the page's speech
// controller tells it the player state; the buttons report clicks.

import type { IActionRunner } from '../actions';
import { button } from '../atoms/button';
import { icon } from '../atoms/icon';

export interface IVoiceControlsLabels {
  readAloud: string;
  pause: string;
  resume: string;
  stop: string;
}

export interface IVoiceControlsState {
  /** Speaking right now. */
  playing: boolean;
  /** Playing or paused (something to stop). */
  active: boolean;
  /** Not playing, but there is a position to continue from. */
  resumable: boolean;
}

export interface IVoiceControls {
  /** Play/pause first (the main action), then stop. */
  elements: HTMLButtonElement[];
  update(state: IVoiceControlsState): void;
  /** Hide both buttons (e.g. nothing can read this language here). */
  setHidden(hidden: boolean): void;
}

export function voiceControls(runner: IActionRunner, labels: IVoiceControlsLabels, actions: { toggle(): void; stop(): void }): IVoiceControls {
  const play: HTMLButtonElement = button(runner, '', () => actions.toggle(), { variant: 'primary' });
  const stop: HTMLButtonElement = button(runner, [icon('■'), labels.stop], () => actions.stop());
  const update = (state: IVoiceControlsState): void => {
    const label: string = state.playing ? labels.pause : state.resumable ? labels.resume : labels.readAloud;
    play.replaceChildren(icon(state.playing ? '❚❚' : '▶'), label);
    stop.disabled = !state.active;
  };
  update({ playing: false, active: false, resumable: false });
  const setHidden = (hidden: boolean): void => {
    play.hidden = hidden;
    stop.hidden = hidden;
  };
  return { elements: [play, stop], update, setHidden };
}
