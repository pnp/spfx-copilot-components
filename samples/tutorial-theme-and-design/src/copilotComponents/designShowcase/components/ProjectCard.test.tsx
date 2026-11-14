import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { PROJECTS, type IProject } from '../mockData';
import { ProjectCard, formatDueDate, type IProjectCardProps } from './ProjectCard';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const act = (React as typeof React & {
  act: (callback: () => void | Promise<void>) => Promise<void>;
}).act;

const PROJECT: IProject = PROJECTS[0];

describe('formatDueDate', () => {
  it('formats the date for the locale', () => {
    expect(formatDueDate('2026-10-15', 'en-US')).toBe('Oct 15, 2026');
  });

  it('does not shift the day in a time zone behind UTC', () => {
    expect(formatDueDate('2026-01-01', 'en-US')).toBe('Jan 1, 2026');
  });

  it('uses the default locale when the locale is not valid', () => {
    expect(formatDueDate('2026-10-15', 'not_a_locale')).toContain('2026');
  });

  it('uses the default locale when there is no locale', () => {
    expect(formatDueDate('2026-10-15', undefined)).toContain('2026');
  });
});

describe('ProjectCard', () => {
  let container: HTMLDivElement;
  let root: Root;
  let onSelect: jest.Mock;
  let props: IProjectCardProps;

  async function render(): Promise<HTMLButtonElement> {
    await act(async () => {
      root.render(
        <FluentProvider theme={webLightTheme}>
          <ProjectCard {...props} />
        </FluentProvider>
      );
    });
    return container.querySelector('button') as HTMLButtonElement;
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    onSelect = jest.fn();
    props = {
      project: PROJECT,
      statusLabel: 'On track',
      dueDateText: 'Due Oct 15, 2026',
      selected: false,
      canHover: true,
      onSelect
    };
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('shows the title, the owner, the status label and the due date', async () => {
    const card: HTMLButtonElement = await render();

    expect(card.textContent).toContain(PROJECT.title);
    expect(card.textContent).toContain(PROJECT.owner);
    expect(card.textContent).toContain('On track');
    expect(card.textContent).toContain('Due Oct 15, 2026');
  });

  it('is a button that is not pressed when the project is not selected', async () => {
    const card: HTMLButtonElement = await render();

    expect(card.getAttribute('type')).toBe('button');
    expect(card.getAttribute('data-project-id')).toBe(PROJECT.id);
    expect(card.getAttribute('aria-pressed')).toBe('false');
  });

  it('is pressed when the project is selected', async () => {
    props.selected = true;

    const card: HTMLButtonElement = await render();

    expect(card.getAttribute('aria-pressed')).toBe('true');
  });

  it('calls onSelect with the project id when the user selects the card', async () => {
    const card: HTMLButtonElement = await render();

    await act(async () => {
      card.click();
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(PROJECT.id);
  });

  it('marks the card as hover capable when the device can hover', async () => {
    const card: HTMLButtonElement = await render();

    expect(card.getAttribute('data-hover')).toBe('true');
  });

  it('marks the card as not hover capable when the device cannot hover', async () => {
    props.canHover = false;

    const card: HTMLButtonElement = await render();

    expect(card.getAttribute('data-hover')).toBe('false');
  });

  it('hides the decorative icon from assistive technology', async () => {
    const card: HTMLButtonElement = await render();
    const icon: SVGElement = card.querySelector('svg') as SVGElement;

    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });
});
