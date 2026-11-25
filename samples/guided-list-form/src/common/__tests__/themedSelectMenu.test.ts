import {
  MENU_COLOR,
  MENU_FONT_FAMILY,
  MENU_FONT_SIZE,
  MENU_GAP_PX,
  MENU_LINE_HEIGHT,
  MENU_MAX_HEIGHT_PX,
  MENU_MIN_HEIGHT_PX,
  menuTypeStyle,
  planMenuPosition,
  viewportFromWindow
} from '../logic/themedSelectMenu';

describe('planMenuPosition', () => {
  it('places the menu directly below the trigger with a 4px gap and the same width', () => {
    const plan = planMenuPosition({ top: 200, bottom: 236, left: 40, width: 300 }, { top: 8, bottom: 592 });
    expect(plan.flip).toBe(false);
    expect(plan.top).toBe(236 + MENU_GAP_PX);
    expect(plan.left).toBe(40);
    expect(plan.width).toBe(300);
    expect(plan.maxHeight).toBe(MENU_MAX_HEIGHT_PX);
  });

  it('flips above only when there is not enough room below', () => {
    const plan = planMenuPosition({ top: 500, bottom: 536, left: 20, width: 280 }, { top: 8, bottom: 592 });
    expect(592 - 536 - MENU_GAP_PX).toBeLessThan(MENU_MIN_HEIGHT_PX);
    expect(plan.flip).toBe(true);
    expect(plan.maxHeight).toBe(MENU_MAX_HEIGHT_PX);
    expect(plan.top).toBe(500 - MENU_GAP_PX - plan.maxHeight);
    expect(plan.top + plan.maxHeight + MENU_GAP_PX).toBe(500);
    expect(plan.width).toBe(280);
  });

  it('stays below and shrinks when both sides are tight but below has more room', () => {
    const plan = planMenuPosition({ top: 40, bottom: 80, left: 10, width: 200 }, { top: 8, bottom: 150 });
    expect(plan.flip).toBe(false);
    expect(plan.top).toBe(80 + MENU_GAP_PX);
    expect(plan.maxHeight).toBe(150 - 80 - MENU_GAP_PX);
  });

  it('uses viewport coordinates and does not add a scroll offset', () => {
    const viewport = { top: 8, bottom: 600 };
    const before = planMenuPosition({ top: 300, bottom: 336, left: 16, width: 320 }, viewport);
    const scrolled = 80;
    const after = planMenuPosition({ top: 300 - scrolled, bottom: 336 - scrolled, left: 16, width: 320 }, viewport);
    expect(before.flip).toBe(false);
    expect(after.flip).toBe(false);
    expect(before.top).toBe(336 + MENU_GAP_PX);
    expect(after.top).toBe(336 - scrolled + MENU_GAP_PX);
    expect(after.top).not.toBe(before.top);
    expect(after.top).not.toBe(before.top + scrolled);
    expect(after.top).not.toBe(before.top - 0 + scrolled + scrolled);
  });
});

describe('viewportFromWindow and menuTypeStyle', () => {
  it('reads innerHeight only and does not ask for a scroll offset', () => {
    expect(viewportFromWindow({ innerHeight: 700 })).toEqual({ top: 8, bottom: 692 });
    expect(viewportFromWindow(undefined).bottom).toBe(592);
  });

  it('sets an explicit card font, size, line-height, colour and box-sizing', () => {
    const style = menuTypeStyle();
    expect(style.fontFamily).toBe(MENU_FONT_FAMILY);
    expect(style.fontFamily).toContain('Segoe UI');
    expect(style.fontFamily).toContain('Segoe UI Web (West European)');
    expect(style.fontFamily).toContain('sans-serif');
    expect(style.fontSize).toBe(MENU_FONT_SIZE);
    expect(style.lineHeight).toBe(MENU_LINE_HEIGHT);
    expect(style.boxSizing).toBe('border-box');
    expect(style.color).toBe(MENU_COLOR);
  });
});
