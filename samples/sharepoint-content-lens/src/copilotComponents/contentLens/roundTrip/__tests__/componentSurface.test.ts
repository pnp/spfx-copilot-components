import type { Root } from 'react-dom/client';

jest.mock('react-dom/client', () => ({ createRoot: jest.fn() }));
const { createRoot } = jest.requireMock<typeof import('react-dom/client')>('react-dom/client');
const { claimComponentSurface, releaseComponentSurface } = jest.requireActual<typeof import('../componentSurface')>('../componentSurface');
const mockedCreateRoot = createRoot as jest.MockedFunction<typeof createRoot>;

describe('component-owned React surface', () => {
  let order: string[];
  let roots: Root[];
  beforeEach(() => {
    order = [];
    roots = [];
    mockedCreateRoot.mockReset();
    mockedCreateRoot.mockImplementation(() => {
      const number = roots.length + 1;
      order.push(`create:${number}`);
      const root: Root = { render: jest.fn(), unmount: jest.fn(() => { order.push(`unmount:${number}`); }) };
      roots.push(root);
      return root;
    });
  });

  test('same-owner rendering reuses one root and releases exactly once', () => {
    const owner = {};
    const container = document.createElement('div');
    const release = jest.fn();
    const first = claimComponentSurface(owner, container, release);
    expect(claimComponentSurface(owner, container, release)).toBe(first);
    expect(mockedCreateRoot).toHaveBeenCalledTimes(1);
    releaseComponentSurface(owner, container);
    releaseComponentSurface(owner, container);
    expect(release).toHaveBeenCalledTimes(1);
    expect(first!.unmount).toHaveBeenCalledTimes(1);
  });

  test('transfer releases the old client before React cleanup and creates a fresh root', () => {
    const firstOwner = {};
    const nextOwner = {};
    const container = document.createElement('div');
    const first = claimComponentSurface(firstOwner, container, () => order.push('release:first'));
    const next = claimComponentSurface(nextOwner, container, () => order.push('release:next'));
    expect(next).not.toBe(first);
    expect(order).toEqual(['create:1', 'release:first', 'unmount:1', 'create:2']);
    expect(first!.unmount).toHaveBeenCalledTimes(1);
    expect(next!.unmount).not.toHaveBeenCalled();
  });

  test('stale renders and teardown cannot reclaim or unmount a replacement', () => {
    const firstOwner = {};
    const nextOwner = {};
    const container = document.createElement('div');
    claimComponentSurface(firstOwner, container, () => undefined);
    const next = claimComponentSurface(nextOwner, container, () => undefined);
    expect(claimComponentSurface(firstOwner, container, () => undefined)).toBeUndefined();
    releaseComponentSurface(firstOwner, container);
    expect(next!.unmount).not.toHaveBeenCalled();
    expect(claimComponentSurface(nextOwner, container, () => undefined)).toBe(next);
    expect(mockedCreateRoot).toHaveBeenCalledTimes(2);
  });

  test('an owner cannot claim two containers or migrate after release', () => {
    const owner = {};
    const firstContainer = document.createElement('div');
    const otherContainer = document.createElement('div');
    const first = claimComponentSurface(owner, firstContainer, () => undefined);
    expect(claimComponentSurface(owner, otherContainer, () => undefined)).toBeUndefined();
    releaseComponentSurface(owner, otherContainer);
    expect(first!.unmount).not.toHaveBeenCalled();
    releaseComponentSurface(owner, firstContainer);
    expect(claimComponentSurface(owner, firstContainer, () => undefined)).toBeUndefined();
    expect(claimComponentSurface(owner, otherContainer, () => undefined)).toBeUndefined();
    expect(mockedCreateRoot).toHaveBeenCalledTimes(1);
  });

  test('teardown before the first render prevents a late mount', () => {
    const owner = {};
    const container = document.createElement('div');
    releaseComponentSurface(owner, container);
    expect(claimComponentSurface(owner, container, () => undefined)).toBeUndefined();
    expect(mockedCreateRoot).not.toHaveBeenCalled();
  });

  test('different documents and containers keep independent roots', () => {
    const firstOwner = {};
    const secondOwner = {};
    const firstContainer = document.createElement('div');
    const secondContainer = document.implementation.createHTMLDocument().createElement('div');
    const first = claimComponentSurface(firstOwner, firstContainer, () => undefined);
    const second = claimComponentSurface(secondOwner, secondContainer, () => undefined);
    releaseComponentSurface(firstOwner, firstContainer);
    expect(first!.unmount).toHaveBeenCalledTimes(1);
    expect(second!.unmount).not.toHaveBeenCalled();
  });

  test('a throwing release callback cannot leave old React state alive', () => {
    const container = document.createElement('div');
    const first = claimComponentSurface({}, container, () => { throw new Error('cleanup failure'); });
    const next = claimComponentSurface({}, container, () => undefined);
    expect(first!.unmount).toHaveBeenCalledTimes(1);
    expect(next).not.toBe(first);
    expect(mockedCreateRoot).toHaveBeenCalledTimes(2);
  });

  test('reentrant teardown from the release callback cannot unmount twice', () => {
    const owner = {};
    const container = document.createElement('div');
    const release = jest.fn(() => releaseComponentSurface(owner, container));
    const first = claimComponentSurface(owner, container, release);
    const next = claimComponentSurface({}, container, () => undefined);
    expect(release).toHaveBeenCalledTimes(1);
    expect(first!.unmount).toHaveBeenCalledTimes(1);
    expect(next!.unmount).not.toHaveBeenCalled();
  });

  test('reentrant claims during transfer cannot create a competing root', () => {
    const container = document.createElement('div');
    const nestedOwner = {};
    let nested: Root | undefined;
    claimComponentSurface({}, container, () => { nested = claimComponentSurface(nestedOwner, container, () => undefined); });
    const nextOwner = {};
    const next = claimComponentSurface(nextOwner, container, () => undefined);
    expect(nested).toBeUndefined();
    expect(claimComponentSurface(nextOwner, container, () => undefined)).toBe(next);
    expect(mockedCreateRoot).toHaveBeenCalledTimes(2);
  });

  test('two module copies share ownership and old-owner release markers', () => {
    const container = document.createElement('div');
    const firstOwner = {};
    const nextOwner = {};
    const first = claimComponentSurface(firstOwner, container, () => undefined);
    let isolated!: typeof import('../componentSurface');
    jest.isolateModules(() => { isolated = jest.requireActual<typeof import('../componentSurface')>('../componentSurface'); });
    const next = isolated.claimComponentSurface(nextOwner, container, () => undefined);
    expect(next).not.toBe(first);
    expect(claimComponentSurface(firstOwner, container, () => undefined)).toBeUndefined();
    releaseComponentSurface(firstOwner, container);
    expect(next!.unmount).not.toHaveBeenCalled();
    isolated.releaseComponentSurface(nextOwner, container);
    expect(claimComponentSurface(nextOwner, document.createElement('div'), () => undefined)).toBeUndefined();
  });
});
