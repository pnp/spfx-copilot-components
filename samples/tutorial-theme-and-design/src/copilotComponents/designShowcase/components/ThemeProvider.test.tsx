import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { makeStyles, tokens, webDarkTheme, webLightTheme } from '@fluentui/react-components';
import { ThemeProvider, resolveFluentTheme } from './ThemeProvider';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const act = (React as typeof React & {
  act: (callback: () => void | Promise<void>) => Promise<void>;
}).act;

const useProbeStyles = makeStyles({
  root: { color: tokens.colorNeutralForeground1 }
});

function Probe(): React.ReactElement {
  const styles = useProbeStyles();
  return <div className={styles.root}>probe</div>;
}

function countStyles(target: Document): number {
  return target.head.querySelectorAll('style').length;
}

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

describe('ThemeProvider', () => {
  it('inserts styles into the target document and not into the parent document', async () => {
    const frame: HTMLIFrameElement = document.createElement('iframe');
    document.body.appendChild(frame);
    const frameDocument: Document = frame.contentDocument as Document;
    const host: HTMLDivElement = frameDocument.createElement('div');
    frameDocument.body.appendChild(host);
    const parentStyleCount: number = countStyles(document);
    const root: Root = createRoot(host);

    await act(async () => {
      root.render(
        <ThemeProvider theme="dark" targetDocument={frameDocument}>
          <Probe />
        </ThemeProvider>
      );
    });

    expect(host.textContent).toBe('probe');
    expect(countStyles(frameDocument)).toBeGreaterThan(0);
    expect(countStyles(document)).toBe(parentStyleCount);

    await act(async () => {
      root.unmount();
    });
    frame.remove();
  });
});
