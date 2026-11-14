import * as ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';

/**
 * Local test helpers. No third-party test libraries (AGENTS.md §4.1) — views
 * are rendered with ReactDOM into a detached div and asserted on `data-*`
 * attributes and textContent.
 */

export interface IHarness {
  container: HTMLElement;
  render: (element: React.ReactElement) => void;
  unmount: () => void;
}

export function mount(): IHarness {
  const container: HTMLElement = document.createElement('div');
  document.body.appendChild(container);
  return {
    container,
    render: (element: React.ReactElement): void => {
      act(() => {
        ReactDOM.render(element, container);
      });
    },
    unmount: (): void => {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };
}

export function layoutOf(container: HTMLElement): string | undefined {
  const el: Element | null = container.querySelector('[data-layout]');
  return el ? el.getAttribute('data-layout') || undefined : undefined;
}

export function query(container: HTMLElement, selector: string): HTMLElement | undefined {
  return (container.querySelector(selector) as HTMLElement) || undefined;
}

export function queryAll(container: HTMLElement, selector: string): HTMLElement[] {
  return Array.prototype.slice.call(container.querySelectorAll(selector)) as HTMLElement[];
}

export function textOf(container: HTMLElement, selector: string): string {
  const el = query(container, selector);
  return el ? (el.textContent || '').trim() : '';
}

export function clickButton(container: HTMLElement, action: string): void {
  const el = query(container, '[data-action="' + action + '"]');
  if (!el) {
    throw new Error('No control with data-action="' + action + '". Present: ' +
      queryAll(container, '[data-action]').map(e => e.getAttribute('data-action')).join(', '));
  }
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

/** Sets a controlled input's value the way a user would — native setter + input event. */
export function setInputValue(container: HTMLElement, name: string, value: string): void {
  const el = query(container, '[data-input="' + name + '"]') as HTMLInputElement | undefined;
  if (!el) {
    throw new Error('No input named "' + name + '"');
  }
  const proto: object = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value');
  act(() => {
    if (setter && setter.set) {
      setter.set.call(el, value);
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

/** Drives the hidden file input, which is how files actually enter the component. */
export function chooseFiles(container: HTMLElement, files: { name: string; size: number; type?: string }[]): void {
  const input = query(container, '[data-file-input]') as HTMLInputElement | undefined;
  if (!input) {
    throw new Error('No file input rendered');
  }
  const list = files.map(f => ({ name: f.name, size: f.size, type: f.type || '' }));
  Object.defineProperty(input, 'files', { configurable: true, value: list });
  act(() => {
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

/** Lets queued promise callbacks run — for the async confirm/save path. */
export async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

// --- shared app harness -----------------------------------------------------

import * as React from 'react';
import { FileUploaderApp, IAppProps } from './FileUploaderApp';
import { createSession, ISession } from '../models/session';
import { FilingController } from '../logic/filingController';
import { RecentController } from '../logic/recentController';
import { MockDocumentStoreService, IMockDocumentStoreOptions } from '../services/MockDocumentStoreService';
import type { IFileUploaderCopilotComponentProperties } from '../FileUploaderCopilotComponentProperties';

export interface IScreenOptions extends IMockDocumentStoreOptions {
  width?: number;
  theme?: 'light' | 'dark';
  displayMode?: 'inline' | 'fullscreen';
  /** Spy for the inline -> fullscreen request (2+ files, or "give each its own details"). */
  onRequestFullscreen?: () => Promise<void>;
  /** The host's open-link call, when the test gives the host one (8.8 L9). */
  openLink?: (url: string) => Promise<boolean>;
  /** Fixed clock — every test injects one (AGENTS.md R35). */
  now: Date;
}

export interface IScreen extends IHarness {
  session: ISession;
  store: MockDocumentStoreService;
  controller: FilingController;
  recent: RecentController;
  repaint: () => void;
}

/** Mounts the real component tree with both controllers wired to one session. */
export function renderApp(
  props: IFileUploaderCopilotComponentProperties,
  options: IScreenOptions
): IScreen {
  const h = mount();
  const session: ISession = createSession(props, 1);
  const { width, theme, displayMode, now, onRequestFullscreen, openLink, ...storeOptions } = options;
  const store = new MockDocumentStoreService({ latencyMs: 0, ...storeOptions });
  const refs: { filing?: FilingController; recent?: RecentController } = {};

  const repaint = (): void => {
    const appProps: IAppProps = {
      host: {
        theme: theme || 'light',
        displayMode: displayMode || 'inline',
        canFullscreen: true,
        width
      },
      session,
      store,
      controller: refs.filing as FilingController,
      recent: refs.recent as RecentController,
      now: () => now,
      refresh: repaint,
      requestFullscreen: onRequestFullscreen || (() => Promise.resolve()),
      openLink,
      targetDocument: document,
      remountKey: 1
    };
    h.render(React.createElement(FileUploaderApp, appProps));
  };

  refs.filing = new FilingController(session, store, () => now, () => repaint(), props);
  refs.recent = new RecentController(session, store, () => now, () => repaint());
  repaint();
  return { ...h, session, store, controller: refs.filing, recent: refs.recent, repaint };
}

/**
 * Renders the same screen as if the store were the live SharePoint one, so a
 * test can assert live-mode copy without a tenant (8.7 G2). `isSampleData` is
 * `readonly` on the interface — that is the point of it; only a test reaches
 * past the declaration, and only to prove the two branches differ.
 */
export function setLiveMode(screen: IScreen): void {
  (screen.store as unknown as { isSampleData: boolean }).isSampleData = false;
  screen.repaint();
}

