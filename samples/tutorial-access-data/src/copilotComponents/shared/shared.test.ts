import { webDarkTheme, webLightTheme } from '@fluentui/react-components';
import { toErrorMessage } from './LoadState';
import { resolveFluentTheme } from './ThemeProvider';

const FALLBACK: string = 'Something went wrong. Try again.';

describe('resolveFluentTheme', () => {
  it('returns the dark theme when the host theme is dark', () => {
    expect(resolveFluentTheme('dark')).toBe(webDarkTheme);
  });

  it('returns the light theme when the host theme is light', () => {
    expect(resolveFluentTheme('light')).toBe(webLightTheme);
  });

  it('returns the light theme when the host sends no theme', () => {
    expect(resolveFluentTheme(undefined)).toBe(webLightTheme);
  });
});

describe('toErrorMessage', () => {
  it('returns the message of an Error', () => {
    expect(toErrorMessage(new Error('Access denied'), FALLBACK)).toBe('Access denied');
  });

  it('returns the fallback for a value that is not an Error', () => {
    expect(toErrorMessage('boom', FALLBACK)).toBe(FALLBACK);
  });

  it('returns the fallback for an Error with an empty message', () => {
    expect(toErrorMessage(new Error(''), FALLBACK)).toBe(FALLBACK);
  });
});
