import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestFullHeight, type IFullHeightRequest } from './host';

// jsdom has no layout: set the iframe height and the content height by hand.
function layout(iframe: number, content: number): void {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: iframe });
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: content });
}

describe('requestFullHeight', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const run = (iframe: number, content: number): { asked: IFullHeightRequest[]; request: ReturnType<typeof vi.fn> } => {
    vi.useFakeTimers();
    layout(iframe, content);
    const asked: IFullHeightRequest[] = [];
    const request = vi.fn(() => Promise.resolve());
    requestFullHeight({ containerDimensions: { maxHeight: 900 } } as never, () => true, request, (a: IFullHeightRequest) => asked.push(a));
    vi.advanceTimersByTime(500);
    return { asked, request };
  };

  it('asks for the panel height when the card is shorter', () => {
    const { asked, request } = run(400, 400);
    expect(request).toHaveBeenCalledWith(expect.any(Number), 900);
    expect(asked[0]).toMatchObject({ target: 900, source: 'containerDimensions', before: 400 });
  });

  it('asks nothing when the card is already taller than the panel (auto-resize covers it)', () => {
    const { asked, request } = run(400, 2400);
    expect(request).not.toHaveBeenCalled();
    expect(asked).toEqual([]);
  });

  it('asks nothing when the iframe already has the height', () => {
    const { request } = run(900, 900);
    expect(request).not.toHaveBeenCalled();
  });
});
