jest.mock('./CatalogCapabilityExperience', () => ({}));
jest.mock('./CompanyCapabilityExperiences', () => ({}));
jest.mock('./CompanyWorkspaceHome', () => ({ CompanyWorkspaceHome: () => null }));
jest.mock('./FocusedCapabilityExperiences', () => ({ PersonalWorkspaceHome: () => null }));
jest.mock('./PersonalDetailExperiences', () => ({}));
jest.mock('./PersonalWorkflowExperiences', () => ({}));

import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ZavaWorkspaceMode } from '../models/zavaOne';
import { ZavaOneWorkspace } from './ZavaOneExperiences';

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
});

afterAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: undefined });
});

describe.each<ZavaWorkspaceMode>(['combined', 'company', 'personal'])('%s workspace header', (mode) => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function render(hideWorkspaceHeader?: boolean): void {
    act(() => root.render(
      <ZavaOneWorkspace
        intent="workspace"
        surface="workspace"
        workspaceMode={mode}
        hideWorkspaceHeader={hideWorkspaceHeader}
        targetDocument={document}
        currentUserName="Megan Bowen"
      />
    ));
  }

  test('preserves the branded header by default outside Teams', () => {
    render();
    const header = container.querySelector('main > header');
    expect(header?.textContent).toContain('Zava One');
    expect(header?.textContent).toContain('Demo data');
    expect(header?.querySelector('img')).not.toBeNull();
  });

  test('hides the header in Teams without losing navigation or workspace controls', () => {
    render(true);
    expect(container.querySelector('main > header')).toBeNull();
    expect(container.textContent).not.toContain('Demo data');
    expect(container.querySelector('nav[aria-label="Zava workspace"]') !== null).toBe(mode === 'combined');

    const workspaceName = mode === 'personal' ? 'Personal' : 'Company';
    const controls = container.querySelector(`[role="group"][aria-label="${workspaceName} workspace controls"]`);
    expect(controls).not.toBeNull();
    expect(controls?.querySelector(`[aria-label="Personalize ${workspaceName} workspace"]`)).not.toBeNull();
    const editButton = controls?.querySelector('button');
    expect(editButton?.getAttribute('aria-pressed')).toBe('false');
    act(() => editButton?.click());
    expect(editButton?.getAttribute('aria-pressed')).toBe('true');
    expect(editButton?.getAttribute('aria-label')).toBe(`Done editing ${workspaceName} workspace layout`);
  });
});
