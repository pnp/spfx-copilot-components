import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';
import { PROJECTS } from '../mockData';
import DesignShowcase from './DesignShowcase';
import type { IDesignShowcaseProps, IDesignShowcaseStrings } from './IDesignShowcaseProps';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const act = (React as typeof React & {
  act: (callback: () => void | Promise<void>) => Promise<void>;
}).act;

const STRINGS: IDesignShowcaseStrings = {
  Title: 'Projects',
  ExpandButtonLabel: 'Expand to fullscreen',
  ViewAllLabel: 'View all {0} projects',
  DetailsTitle: 'Project details',
  NoSelectionMessage: 'Select a project to see its details.',
  OwnerLabel: 'Owner',
  DueLabel: 'Due',
  StatusOnTrack: 'On track',
  StatusAtRisk: 'At risk',
  StatusBlocked: 'Blocked',
  StatusDone: 'Done'
};

const INLINE: ICopilotComponentHostContext = {
  theme: 'light',
  displayMode: 'inline',
  availableDisplayModes: ['inline', 'fullscreen']
};

const FULLSCREEN: ICopilotComponentHostContext = {
  theme: 'light',
  displayMode: 'fullscreen',
  availableDisplayModes: ['inline', 'fullscreen']
};

const EXPAND: string = '[aria-label="Expand to fullscreen"]';
const VIEW_ALL: string = '[data-action="view-all"]';
const DETAILS: string = '[data-region="details"]';

describe('DesignShowcase', () => {
  let container: HTMLDivElement;
  let root: Root;
  let onRequestDisplayMode: jest.Mock;
  let props: IDesignShowcaseProps;

  async function render(hostContext: ICopilotComponentHostContext): Promise<void> {
    props = { ...props, hostContext };
    await act(async () => {
      root.render(<DesignShowcase {...props} />);
    });
  }

  async function click(selector: string): Promise<void> {
    const element = container.querySelector<HTMLElement>(selector);
    if (!element) {
      throw new Error(`No element matches ${selector}`);
    }
    await act(async () => {
      element.click();
    });
  }

  function text(selector: string): string {
    return container.querySelector(selector)?.textContent ?? '';
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    onRequestDisplayMode = jest.fn().mockResolvedValue(undefined);
    props = {
      projects: PROJECTS,
      locale: 'en-US',
      hostContext: INLINE,
      onRequestDisplayMode,
      targetDocument: document,
      strings: STRINGS
    };
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('shows the inline view with no expand control for an empty host context', async () => {
    await render({});

    expect(container.querySelector('[data-view="inline"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-project-id]').length).toBe(4);
    expect(container.querySelector(EXPAND)).toBeNull();
    expect(container.querySelector(VIEW_ALL)).toBeNull();
  });

  it('shows the first four projects and a view-all button in the inline view', async () => {
    await render(INLINE);

    expect(container.querySelectorAll('[data-project-id]').length).toBe(4);
    expect(container.querySelector('[data-project-id="p4"]')).not.toBeNull();
    expect(container.querySelector('[data-project-id="p5"]')).toBeNull();
    expect(text(VIEW_ALL)).toBe('View all 8 projects');
  });

  it('requests fullscreen when the user selects the expand button', async () => {
    await render(INLINE);
    await click(EXPAND);

    expect(onRequestDisplayMode).toHaveBeenCalledTimes(1);
    expect(onRequestDisplayMode).toHaveBeenCalledWith('fullscreen');
  });

  it('requests fullscreen when the user selects the view-all button', async () => {
    await render(INLINE);
    await click(VIEW_ALL);

    expect(onRequestDisplayMode).toHaveBeenCalledWith('fullscreen');
  });

  it('stays in the inline view until the host changes the display mode', async () => {
    await render(INLINE);
    await click(EXPAND);

    expect(container.querySelector('[data-view="inline"]')).not.toBeNull();
  });

  it('keeps the view on screen when the host rejects the request', async () => {
    const consoleError: jest.SpyInstance = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    onRequestDisplayMode.mockRejectedValue(new Error('denied'));

    await render(INLINE);
    await click(EXPAND);

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll('[data-project-id]').length).toBe(4);
    consoleError.mockRestore();
  });

  it('shows every project and no expand control in the fullscreen view', async () => {
    await render(FULLSCREEN);

    expect(container.querySelector('[data-view="fullscreen"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-project-id]').length).toBe(8);
    expect(container.querySelector(EXPAND)).toBeNull();
    expect(container.querySelector(VIEW_ALL)).toBeNull();
    expect(text(DETAILS)).toContain('Select a project to see its details.');
  });

  it('keeps the inline selection when the host switches to fullscreen', async () => {
    await render(INLINE);
    await click('[data-project-id="p2"]');
    await render({ ...FULLSCREEN });

    expect(
      container.querySelector('[data-project-id="p2"]')?.getAttribute('aria-pressed')
    ).toBe('true');
    expect(text(DETAILS)).toContain('Adele Vance');
    expect(text(DETAILS)).toContain(PROJECTS[1].summary);
    expect(text(DETAILS)).toContain('At risk');
    expect(text(DETAILS)).toContain('Oct 30, 2026');
  });

  it('shows the newly selected project in the detail pane', async () => {
    await render(FULLSCREEN);
    await click('[data-project-id="p3"]');
    await click('[data-project-id="p7"]');

    expect(text(DETAILS)).toContain('Joni Sherman');
    expect(text(DETAILS)).not.toContain('Alex Wilber');
    expect(
      container.querySelector('[data-project-id="p3"]')?.getAttribute('aria-pressed')
    ).toBe('false');
  });

  it('places the detail pane next to the grid in a wide container', async () => {
    await render({ ...FULLSCREEN, containerDimensions: { width: 1200 } });

    expect(container.querySelector('[data-layout="wide"]')).not.toBeNull();
  });

  it('stacks the detail pane in a narrow container', async () => {
    await render({ ...FULLSCREEN, containerDimensions: { width: 500 } });

    expect(container.querySelector('[data-layout="stacked"]')).not.toBeNull();
  });

  it('stacks the detail pane on the mobile platform', async () => {
    await render({ ...FULLSCREEN, platform: 'mobile', containerDimensions: { width: 1200 } });

    expect(container.querySelector('[data-layout="stacked"]')).not.toBeNull();
  });

  it('marks every card as not hover capable when the device cannot hover', async () => {
    await render({ ...INLINE, deviceCapabilities: { touch: true, hover: false } });

    expect(container.querySelectorAll('[data-hover="false"]').length).toBe(4);
    expect(container.querySelectorAll('[data-hover="true"]').length).toBe(0);
  });

  it('inserts every style into the target document', async () => {
    const frame: HTMLIFrameElement = document.createElement('iframe');
    document.body.appendChild(frame);
    const frameDocument: Document = frame.contentDocument as Document;
    const host: HTMLDivElement = frameDocument.createElement('div');
    frameDocument.body.appendChild(host);
    const parentStyleCount: number = document.head.querySelectorAll('style').length;
    const frameRoot: Root = createRoot(host);

    await act(async () => {
      frameRoot.render(
        <DesignShowcase {...props} hostContext={FULLSCREEN} targetDocument={frameDocument} />
      );
    });

    expect(host.querySelectorAll('[data-project-id]').length).toBe(8);
    expect(frameDocument.head.querySelectorAll('style').length).toBeGreaterThan(0);
    expect(document.head.querySelectorAll('style').length).toBe(parentStyleCount);

    await act(async () => {
      frameRoot.unmount();
    });
    frame.remove();
  });
});
