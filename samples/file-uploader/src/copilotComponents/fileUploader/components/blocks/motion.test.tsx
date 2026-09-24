import * as React from 'react';
import { useReducedMotion } from './motion';
import { Banner } from './Banner';
import { mount, query } from '../testHelpers';

function stubMatchMedia(matches: boolean): void {
  // useReducedMotion only reads `.matches`; the rest of MediaQueryList is unused here.
  (window as unknown as { matchMedia: (q: string) => { matches: boolean; media: string } }).matchMedia = (
    media: string
  ) => ({ matches, media });
}

const Probe: React.FC = () => <span data-reduced-motion={String(useReducedMotion())} />;

describe('useReducedMotion (R15 — the matchMedia half of the guard)', () => {
  const original = window.matchMedia;
  afterEach(() => {
    (window as unknown as { matchMedia: typeof window.matchMedia }).matchMedia = original;
  });

  it('is false when the viewer expresses no preference', () => {
    stubMatchMedia(false);
    const h = mount();
    h.render(<Probe />);
    expect(query(h.container, '[data-reduced-motion]')!.getAttribute('data-reduced-motion')).toBe('false');
    h.unmount();
  });

  it('is true when prefers-reduced-motion: reduce is set', () => {
    stubMatchMedia(true);
    const h = mount();
    h.render(<Probe />);
    expect(query(h.container, '[data-reduced-motion]')!.getAttribute('data-reduced-motion')).toBe('true');
    h.unmount();
  });

  it('a Banner still renders its settled content under reduced motion', () => {
    stubMatchMedia(true);
    const h = mount();
    h.render(<Banner tone="success" title="Filed." detail="Receipt #F-1" />);
    const banner = query(h.container, '[data-banner="success"]')!;
    expect(banner.getAttribute('role')).toBe('status');
    expect((banner.textContent || '').trim()).toBe('Filed. Receipt #F-1');
    h.unmount();
  });
});
