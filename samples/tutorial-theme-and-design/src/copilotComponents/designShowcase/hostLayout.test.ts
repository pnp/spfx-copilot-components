import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';
import { NARROW_WIDTH, resolveHostLayout, type IHostLayout } from './hostLayout';

const INLINE: ICopilotComponentHostContext = {
  displayMode: 'inline',
  availableDisplayModes: ['inline', 'fullscreen']
};

describe('resolveHostLayout', () => {
  it('uses safe defaults when the host sends an empty context', () => {
    const layout: IHostLayout = resolveHostLayout({}, undefined);

    expect(layout).toEqual({
      isFullscreen: false,
      canExpand: false,
      width: undefined,
      isNarrow: false,
      canHover: true
    });
  });

  it('treats a missing display mode as inline', () => {
    expect(resolveHostLayout({ theme: 'dark' }, undefined).isFullscreen).toBe(false);
  });

  it('reports fullscreen when the host display mode is fullscreen', () => {
    expect(resolveHostLayout({ displayMode: 'fullscreen' }, undefined).isFullscreen).toBe(true);
  });

  it('can expand from inline when the host supports fullscreen', () => {
    expect(resolveHostLayout(INLINE, undefined).canExpand).toBe(true);
  });

  it('cannot expand when the host does not list its display modes', () => {
    expect(resolveHostLayout({ displayMode: 'inline' }, undefined).canExpand).toBe(false);
  });

  it('cannot expand when the host does not support fullscreen', () => {
    const layout: IHostLayout = resolveHostLayout(
      { displayMode: 'inline', availableDisplayModes: ['inline'] },
      undefined
    );

    expect(layout.canExpand).toBe(false);
  });

  it('cannot expand when the component is already fullscreen', () => {
    const layout: IHostLayout = resolveHostLayout(
      { displayMode: 'fullscreen', availableDisplayModes: ['inline', 'fullscreen'] },
      undefined
    );

    expect(layout.canExpand).toBe(false);
  });

  it('uses the measured width before the width the host reports', () => {
    const layout: IHostLayout = resolveHostLayout({ containerDimensions: { width: 900 } }, 400);

    expect(layout.width).toBe(400);
  });

  it('uses the width the host reports when nothing is measured yet', () => {
    const layout: IHostLayout = resolveHostLayout(
      { containerDimensions: { width: 900 } },
      undefined
    );

    expect(layout.width).toBe(900);
  });

  it('does not treat the maximum width as the width', () => {
    const layout: IHostLayout = resolveHostLayout(
      { containerDimensions: { maxWidth: 400 } },
      undefined
    );

    expect(layout.width).toBeUndefined();
    expect(layout.isNarrow).toBe(false);
  });

  it('is narrow below the narrow width', () => {
    expect(resolveHostLayout({}, NARROW_WIDTH - 1).isNarrow).toBe(true);
  });

  it('is not narrow at the narrow width', () => {
    expect(resolveHostLayout({}, NARROW_WIDTH).isNarrow).toBe(false);
  });

  it('is narrow on the mobile platform at any width', () => {
    expect(resolveHostLayout({ platform: 'mobile' }, 1200).isNarrow).toBe(true);
  });

  it('cannot hover when the device reports no hover', () => {
    const layout: IHostLayout = resolveHostLayout(
      { deviceCapabilities: { touch: true, hover: false } },
      undefined
    );

    expect(layout.canHover).toBe(false);
  });

  it('cannot hover on the mobile platform', () => {
    expect(resolveHostLayout({ platform: 'mobile' }, undefined).canHover).toBe(false);
  });
});
