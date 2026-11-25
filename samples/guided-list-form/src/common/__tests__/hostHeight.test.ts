import { FRAME_ECHO_MAX, FULLSCREEN_CHROME_OFFSET, PREFERRED_FILL, applyPlannedHeight, fullscreenWindowFill, hostContentHeight, isFillDisplayMode, isFrameEcho, lockDocumentHeight, parentHeightIfBounded, planHostHeight, shouldResendSizeRequest, sizeChangeRequest, windowMeasures } from '../logic/hostHeight';
import { COPILOT_INLINE_HEIGHT_PX } from '../logic/copilotStatus';

describe('host content height', () => {
  it('uses the same preferred fill as the Copilot inline height', () => {
    expect(PREFERRED_FILL).toBe(600);
    expect(COPILOT_INLINE_HEIGHT_PX).toBe(PREFERRED_FILL);
    expect(FRAME_ECHO_MAX).toBe(320);
  });

  it('prefers the host maximum over the current compact allocation', () => {
    expect(hostContentHeight({ containerHeight: 528, containerMaxHeight: 719 })).toBe(719);
    expect(hostContentHeight({ containerHeight: 900, containerMaxHeight: 719 })).toBe(719);
    expect(planHostHeight({ containerHeight: 528, containerMaxHeight: 719 })).toEqual({ height: 719, request: 719, source: 'host-max' });
  });

  it('does not copy the frame or parent height back, and keeps the preferred floor', () => {
    expect(hostContentHeight({ parentClientHeight: 719 })).toBe(PREFERRED_FILL);
    expect(hostContentHeight({ parentClientHeight: 719, containerMaxHeight: 640 })).toBe(640);
    expect(hostContentHeight({ containerHeight: 100 })).toBe(PREFERRED_FILL);
    expect(hostContentHeight({ containerHeight: 150 })).toBe(PREFERRED_FILL);
    expect(hostContentHeight({ containerHeight: 220 })).toBe(PREFERRED_FILL);
  });

  it('ignores a maxHeight that is only the default 150-220px widget frame', () => {
    expect(isFrameEcho(220, 220)).toBe(true);
    expect(isFrameEcho(150, 150)).toBe(true);
    expect(isFrameEcho(280, 220)).toBe(true);
    expect(isFrameEcho(719, 220)).toBe(false);
    expect(isFrameEcho(500, 200)).toBe(false);
    expect(planHostHeight({ displayMode: 'inline', containerHeight: 220, containerMaxHeight: 220 })).toEqual({ height: 600, request: 600, source: 'preferred' });
    expect(planHostHeight({ displayMode: 'inline', containerHeight: 200, containerMaxHeight: 280 })).toEqual({ height: 600, request: 600, source: 'preferred' });
  });

  it('never stays on a short fallback without asking the host for space', () => {
    expect(planHostHeight({})).toEqual({ height: 600, request: 600, source: 'preferred' });
    expect(planHostHeight({ displayMode: 'inline' })).toEqual({ height: 600, request: 600, source: 'preferred' });
  });

  it('asks an inline host for the preferred fill height only when the host gave less', () => {
    expect(planHostHeight({ displayMode: 'inline', containerHeight: 300, containerMaxHeight: 982 })).toEqual({ height: 982, request: 982, source: 'host-max' });
    expect(planHostHeight({ displayMode: 'inline', parentClientHeight: 900 }).height).toBe(600);
    expect(planHostHeight({ displayMode: 'inline', containerHeight: 300 })).toEqual({ height: 600, request: 600, source: 'preferred' });
    expect(planHostHeight({ displayMode: 'inline', containerHeight: 800 })).toEqual({ height: 800, request: undefined, source: 'preferred' });
    expect(planHostHeight({ displayMode: 'inline', containerHeight: 719, containerMaxHeight: 719 }).request).toBeUndefined();
    expect(planHostHeight({ displayMode: 'inline', containerMaxHeight: 500 })).toEqual({ height: 500, request: 500, source: 'host-max' });
  });

  it('fills fullscreen or other non-inline modes from the window or the host box, not the 150px widget frame', () => {
    expect(isFillDisplayMode('fullscreen')).toBe(true);
    expect(isFillDisplayMode('focus')).toBe(true);
    expect(isFillDisplayMode('inline')).toBe(false);
    expect(isFillDisplayMode(undefined)).toBe(false);
    expect(FULLSCREEN_CHROME_OFFSET).toBe(200);
    const sidePanel = planHostHeight({
      displayMode: 'fullscreen',
      window: { innerHeight: 150, visualViewportHeight: 150, outerHeight: 1180, screenAvailHeight: 1032 }
    });
    expect(sidePanel).toEqual({ height: 980, request: 980, source: 'fullscreen-window' });
    expect(planHostHeight({ displayMode: 'fullscreen', containerHeight: 150, window: { innerHeight: 150, outerHeight: 1180 } }).height).toBe(980);
    expect(planHostHeight({ displayMode: 'focus', containerHeight: 220, containerMaxHeight: 900 })).toEqual({ height: 900, request: 900, source: 'host-max' });
    expect(fullscreenWindowFill({ innerHeight: 150 })).toBeUndefined();
    expect(planHostHeight({ displayMode: 'fullscreen', window: { innerHeight: 150 } })).toEqual({ height: 600, request: 600, source: 'preferred' });
  });

  it('uses a real fixed fullscreen frame or the host maximum before the window estimate', () => {
    expect(planHostHeight({ displayMode: 'fullscreen', containerHeight: 982, window: { outerHeight: 1400 } })).toEqual({ height: 982, request: 982, source: 'fullscreen-frame' });
    expect(planHostHeight({ displayMode: 'fullscreen', containerHeight: 982, containerMaxHeight: 900 }).height).toBe(900);
    expect(planHostHeight({ displayMode: 'fullscreen', containerMaxHeight: 900, window: { outerHeight: 1400 } })).toEqual({ height: 900, request: 900, source: 'host-max' });
    expect(planHostHeight({ displayMode: 'fullscreen' })).toEqual({ height: 600, request: 600, source: 'preferred' });
  });

  it('requests the preferred 600px fill from a short inline host', () => {
    const inline = planHostHeight({ displayMode: 'inline', containerHeight: 150 });
    expect(inline).toEqual({ height: 600, request: 600, source: 'preferred' });
    expect(sizeChangeRequest(720, inline.request)).toEqual({ width: 720, height: 600 });
    expect(shouldResendSizeRequest({ alreadyRequested: '720x600', width: 720, planned: 600, containerHeight: 220 })).toBe(true);
    expect(shouldResendSizeRequest({ alreadyRequested: '720x600', width: 720, planned: 600, containerHeight: 600 })).toBe(false);
  });

  it('reads window measures from a Window-like object instead of the Window itself', () => {
    const view = {
      innerHeight: 150,
      outerHeight: 1180,
      visualViewport: { height: 150 },
      screen: { availHeight: 1032 }
    };
    expect(windowMeasures(view)).toEqual({ visualViewportHeight: 150, innerHeight: 150, outerHeight: 1180, screenAvailHeight: 1032 });
  });

  it('ignores a parent that is only as tall as this component', () => {
    expect(parentHeightIfBounded({ clientHeight: 360, heightStyle: 'auto', maxHeightStyle: 'none' }, 350)).toBeUndefined();
    expect(parentHeightIfBounded({ clientHeight: 528, heightStyle: '528px', maxHeightStyle: 'none' }, 330)).toBe(528);
    expect(parentHeightIfBounded({ clientHeight: 719, heightStyle: 'auto', maxHeightStyle: 'none' }, 330)).toBe(719);
  });

  it('requests a host resize only for a resolved height', () => {
    expect(sizeChangeRequest(1024, hostContentHeight({ containerHeight: 528 }))).toEqual({ width: 1024, height: 600 });
    expect(sizeChangeRequest(1024, hostContentHeight({ containerMaxHeight: 719 }))).toEqual({ width: 1024, height: 719 });
    expect(sizeChangeRequest(1024, undefined)).toBeUndefined();
    expect(sizeChangeRequest(0, 528)).toBeUndefined();
  });

  it('sets an explicit pixel box on the root from the plan, not from offsetHeight, and locks the document', () => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'offsetHeight', { value: 150, configurable: true });
    const plan = planHostHeight({ displayMode: 'inline', containerHeight: el.offsetHeight });
    applyPlannedHeight(el, plan, 'inline');
    expect(el.style.height).toBe('600px');
    expect(el.style.minHeight).toBe('600px');
    expect(el.style.overflow).toBe('hidden');
    expect(el.style.display).toBe('flex');
    expect(el.getAttribute('data-host-height')).toBe('inline:preferred:600');
    expect(el.style.height).not.toBe(`${el.offsetHeight}px`);
    lockDocumentHeight(document, plan.height);
    const css = document.head.querySelector('style[data-wizard-host-height]') as HTMLStyleElement;
    expect(css.textContent).toContain('height: 600px');
    expect(css.textContent).toContain('html, body');
  });
});
