/**
 * One look for the source of a finding, on the SharePoint page and in the findings list:
 * amber and round for Copilot, blue and square for checks without AI. Shape repeats what colour says.
 */
export type MarkSource = 'copilot' | 'check';

export const markSource = (note: { noAI: boolean }): MarkSource => note.noAI ? 'check' : 'copilot';

/** Border and text colour; both have a contrast of more than 6:1 on white. */
export const markInk: Record<MarkSource, string> = { copilot: '#8a4b00', check: '#005a9e' };

/** Red, green and blue of the highlight; the caller adds the opacity. */
export const markFill: Record<MarkSource, string> = { copilot: '255,191,71', check: '0,120,212' };

/** The light that runs around the frame of a newly selected block; it is brighter than the frame it runs on. */
export const markLight: Record<MarkSource, string> = { copilot: '#ffd27a', check: '#8cc8ff' };

/** Corner radius of a number tag of the given height. */
export const markRadius = (source: MarkSource, height: number): number =>
  source === 'copilot' ? height / 2 : height / 5.5;
