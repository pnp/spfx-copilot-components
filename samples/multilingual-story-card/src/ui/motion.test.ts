import { afterEach, describe, expect, it, vi } from 'vitest';
import { withViewTransition } from './motion';

// jsdom has neither layout nor the View Transitions API: both are set by hand.
function setup(innerHeight: number, screenHeight: number): ReturnType<typeof vi.fn> {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: innerHeight });
  Object.defineProperty(window.screen, 'height', { configurable: true, value: screenHeight });
  const start = vi.fn((update: () => void) => update());
  (document as unknown as { startViewTransition?: unknown }).startViewTransition = start;
  return start;
}

describe('withViewTransition', () => {
  afterEach(() => {
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition;
  });

  it('animates when the frame fits on the screen', () => {
    const start = setup(900, 1080);
    const update = vi.fn();
    withViewTransition(update);
    expect(start).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('switches instantly when the frame is taller than the screen (snapshots could crash the renderer)', () => {
    const start = setup(4200, 1080);
    const update = vi.fn();
    withViewTransition(update);
    expect(start).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('switches instantly without the API', () => {
    setup(900, 1080);
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition;
    const update = vi.fn();
    withViewTransition(update);
    expect(update).toHaveBeenCalledTimes(1);
  });
});
