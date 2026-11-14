import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { IMyProfileProps, IMyProfileStrings } from './IMyProfileProps';
import MyProfile from './MyProfile';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no ResizeObserver. The Fluent UI MessageBar and TabList need one.
class ResizeObserverStub {
  public observe(): void { /* not needed in tests */ }
  public unobserve(): void { /* not needed in tests */ }
  public disconnect(): void { /* not needed in tests */ }
}
(window as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub;

const act = (React as typeof React & {
  act: (callback: () => void | Promise<void>) => Promise<void>;
}).act;

const STRINGS: IMyProfileStrings = {
  ProfileTitle: 'My profile',
  ExpandButtonLabel: 'Expand to fullscreen',
  MailTabLabel: 'Mail',
  CalendarTabLabel: 'Calendar',
  LoadingProfileLabel: 'Loading profile',
  LoadingMailLabel: 'Loading mail',
  LoadingCalendarLabel: 'Loading calendar',
  NoMessagesMessage: 'You have no recent messages.',
  NoEventsMessage: 'You have no events in the next 7 days.',
  PermissionMessage: 'An administrator must approve the Microsoft Graph permissions.',
  GenericErrorMessage: 'Something went wrong. Try again.'
};

describe('MyProfile', () => {
  let container: HTMLDivElement;
  let root: Root;
  let getProfile: jest.Mock;
  let getMessages: jest.Mock;
  let getEvents: jest.Mock;
  let onRequestDisplayMode: jest.Mock;
  let props: IMyProfileProps;

  async function render(): Promise<void> {
    await act(async () => {
      root.render(<MyProfile {...props} />);
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

  // The Fluent UI TabList logs this development-only message when it unmounts
  // in jsdom. Drop that one message and keep every other console error.
  const consoleError: typeof console.error = console.error;
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      if (!/Keyborg instance .* is being disposed incorrectly/.test(String(args[0]))) {
        consoleError(...args);
      }
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    getProfile = jest.fn().mockResolvedValue({
      displayName: 'Megan Bowen',
      jobTitle: 'Manager',
      mail: 'megan@contoso.com'
    });
    getMessages = jest.fn().mockResolvedValue([
      {
        id: 'm1',
        subject: 'Q3 budget',
        from: 'Diego Siciliani',
        received: '2026-09-29T08:00:00Z',
        isRead: false
      }
    ]);
    getEvents = jest.fn().mockResolvedValue([
      {
        id: 'e1',
        subject: 'Team sync',
        start: '2026-10-02T09:00:00Z',
        end: '2026-10-02T09:30:00Z',
        location: 'Room 4'
      }
    ]);
    onRequestDisplayMode = jest.fn().mockResolvedValue(undefined);
    props = {
      service: { getProfile, getMessages, getEvents },
      initialView: undefined,
      locale: 'en-US',
      hostContext: {
        theme: 'light',
        displayMode: 'inline',
        availableDisplayModes: ['inline', 'fullscreen']
      },
      onRequestDisplayMode,
      onContentResize: jest.fn(),
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

  it('shows the profile', async () => {
    await render();

    expect(container.textContent).toContain('Megan Bowen');
    expect(container.textContent).toContain('Manager');
  });

  it('shows mail when no view is given', async () => {
    await render();

    expect(getMessages).toHaveBeenCalledTimes(1);
    expect(getEvents).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Q3 budget');
    expect(container.textContent).toContain('Diego Siciliani');
  });

  it('shows the calendar when the calendar view is given', async () => {
    props.initialView = 'calendar';

    await render();

    expect(getEvents).toHaveBeenCalledTimes(1);
    expect(getMessages).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Team sync');
    expect(container.textContent).toContain('Room 4');
  });

  it('loads the calendar when the user selects the Calendar tab', async () => {
    await render();
    await click('[data-view="calendar"]');

    expect(getEvents).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('Team sync');
    expect(container.textContent).not.toContain('Q3 budget');
  });

  it('switches view when the host sends a new view', async () => {
    await render();

    props = { ...props, initialView: 'calendar' };
    await render();

    expect(container.textContent).toContain('Team sync');
    expect(container.textContent).not.toContain('Q3 budget');
  });

  it('shows an empty message for an empty inbox', async () => {
    getMessages.mockResolvedValue([]);

    await render();

    expect(container.textContent).toContain('You have no recent messages.');
  });

  it('shows an empty message when there are no events', async () => {
    getEvents.mockResolvedValue([]);
    props.initialView = 'calendar';

    await render();

    expect(container.textContent).toContain('You have no events in the next 7 days.');
  });

  it('shows the approval message when a Graph permission is not approved', async () => {
    getMessages.mockRejectedValue({ statusCode: 403, message: 'Access is denied.' });

    await render();

    expect(container.textContent).toContain(STRINGS.PermissionMessage);
    expect(container.textContent).not.toContain('Access is denied.');
  });

  it('still shows the profile when the mail request fails', async () => {
    getMessages.mockRejectedValue(new Error('Network request failed'));

    await render();

    expect(container.textContent).toContain('Megan Bowen');
    expect(container.textContent).toContain('Network request failed');
  });

  it('requests fullscreen when the user selects the expand button', async () => {
    await render();
    await click('[aria-label="Expand to fullscreen"]');

    expect(onRequestDisplayMode).toHaveBeenCalledWith('fullscreen');
  });

  it('hides the expand button in fullscreen mode', async () => {
    props.hostContext = { ...props.hostContext, displayMode: 'fullscreen' };

    await render();

    expect(container.querySelector('[aria-label="Expand to fullscreen"]')).toBeNull();
  });
});
