import * as React from 'react';
import { AppProviders } from './AppProviders';
import {
  MAX_DETAILS_LENGTH,
  RENDER_ERROR_DETAIL,
  RENDER_ERROR_LOG_PREFIX,
  RENDER_ERROR_TITLE
} from './RenderErrorBoundary';
import { clickButton, IHarness, layoutOf, mount, query, textOf } from './testHelpers';

/**
 * todo.md 8.5 E1 and its amendment — an error thrown after the first render
 * must not blank the canvas, and the fallback must keep, show and log what it
 * caught. The boundary lives in `AppProviders`, so this drives it the way both
 * roots reach it rather than mounting the boundary directly.
 */

/** What the child throws while rendering; `undefined` means "render normally". */
let throwValue: unknown;

const Child: React.FC = () => {
  if (throwValue !== undefined) {
    throw throwValue;
  }
  return <section data-layout="child-recovered">Filing</section>;
};

describe('RenderErrorBoundary', () => {
  let screen: IHarness;
  let consoleError: jest.SpyInstance;

  const show = (theme: 'light' | 'dark' = 'light'): void => {
    screen.render(
      <AppProviders theme={theme} targetDocument={document} remountKey={1}>
        <Child />
      </AppProviders>
    );
  };

  beforeEach(() => {
    throwValue = new Error('exploded while rendering');
    // React logs every error it hands to a boundary, and the boundary logs the
    // component stack on top; the assertions below are on the rendered fallback
    // and on our own call, not on React's noise.
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    screen = mount();
  });

  afterEach(() => {
    screen.unmount();
    consoleError.mockRestore();
  });

  it('renders the fallback instead of nothing when a child throws while rendering', () => {
    show();

    expect(layoutOf(screen.container)).toBe('render-error');
    expect(screen.container.textContent).toContain(RENDER_ERROR_TITLE);
    expect(screen.container.textContent).toContain(RENDER_ERROR_DETAIL);
    expect(query(screen.container, '[data-action="retry-render"]')).toBeDefined();
  });

  it('keeps the fallback themed inside the providers', () => {
    show('dark');

    const fallback = query(screen.container, '[data-layout="render-error"]');
    expect(fallback && fallback.getAttribute('data-theme')).toBe('dark');
  });

  it('says nothing about whether a save completed (R25)', () => {
    show();

    const text: string = screen.container.textContent || '';
    expect(text).not.toMatch(/saved|filed|not saved/i);
  });

  it('shows the caught message on a details line', () => {
    throwValue = new Error('boom');
    show();

    expect(textOf(screen.container, '[data-role="render-error-details"]')).toBe('Details: boom');
  });

  it('shows a thrown non-Error as text', () => {
    throwValue = 'the library said no';
    show();

    expect(textOf(screen.container, '[data-role="render-error-details"]')).toBe('Details: the library said no');
  });

  it('cuts an over-long message to 300 characters and an ellipsis', () => {
    throwValue = new Error('x'.repeat(400));
    show();

    const shown: string = textOf(screen.container, '[data-role="render-error-details"]');
    expect(shown).toBe('Details: ' + 'x'.repeat(MAX_DETAILS_LENGTH) + '…');
  });

  it('omits the details line when there is no message to show', () => {
    throwValue = new Error('');
    show();

    expect(layoutOf(screen.container)).toBe('render-error');
    expect(query(screen.container, '[data-role="render-error-details"]')).toBeUndefined();
  });

  it('logs the error and the component stack with a searchable prefix', () => {
    throwValue = new Error('boom');
    show();

    const ours = consoleError.mock.calls.filter(call => call[0] === RENDER_ERROR_LOG_PREFIX);
    expect(ours.length).toBe(1);
    expect((ours[0][1] as Error).message).toBe('boom');
    // The stack is React's, not ours — assert it arrived and names the tree the
    // boundary sits in. Not the throwing child: React 17 builds each frame by
    // calling the component, and this one throws every time it is called, so it
    // has no frame of its own.
    expect(typeof ours[0][2]).toBe('string');
    expect(String(ours[0][2])).toContain('AppProviders');
  });

  it('remounts the app when "Try again" is clicked, clearing the details line', () => {
    throwValue = new Error('boom');
    show();
    expect(layoutOf(screen.container)).toBe('render-error');

    throwValue = undefined;
    clickButton(screen.container, 'retry-render');

    expect(layoutOf(screen.container)).toBe('child-recovered');
    expect(query(screen.container, '[data-role="render-error-details"]')).toBeUndefined();
  });

  it('returns to the fallback if the retry throws again', () => {
    show();

    clickButton(screen.container, 'retry-render');

    expect(layoutOf(screen.container)).toBe('render-error');
  });

  it('stays out of the way while nothing throws', () => {
    throwValue = undefined;
    show();

    expect(layoutOf(screen.container)).toBe('child-recovered');
    expect(consoleError).not.toHaveBeenCalled();
  });
});
