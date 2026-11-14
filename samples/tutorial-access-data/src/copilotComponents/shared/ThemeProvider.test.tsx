import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ThemeProvider } from './ThemeProvider';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const act = (React as typeof React & {
  act: (callback: () => void | Promise<void>) => Promise<void>;
}).act;

class ResizeObserverStub {
  public static instances: ResizeObserverStub[] = [];
  public observed: Element[] = [];
  public disconnected: boolean = false;

  public constructor(public readonly callback: () => void) {
    ResizeObserverStub.instances.push(this);
  }

  public observe(element: Element): void {
    this.observed.push(element);
  }

  public unobserve(): void { /* not needed in tests */ }

  public disconnect(): void {
    this.disconnected = true;
  }
}

describe('ThemeProvider', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ResizeObserverStub.instances = [];
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('reports the size of its content to onContentResize', async () => {
    const onContentResize: jest.Mock = jest.fn();

    await act(async () => {
      root.render(
        <ThemeProvider theme="light" targetDocument={document} onContentResize={onContentResize}>
          <p id="content">Hello</p>
        </ThemeProvider>
      );
    });
    const observer: ResizeObserverStub | undefined = ResizeObserverStub.instances.find(
      (instance) => instance.observed.some((element) => element.querySelector('#content'))
    );
    observer?.callback();

    expect(observer).toBeDefined();
    expect(onContentResize).toHaveBeenCalledWith(0, 0);
  });

  it('stops watching the content when it unmounts', async () => {
    await act(async () => {
      root.render(
        <ThemeProvider theme="light" targetDocument={document} onContentResize={jest.fn()}>
          <p id="content">Hello</p>
        </ThemeProvider>
      );
    });
    const observer: ResizeObserverStub | undefined = ResizeObserverStub.instances.find(
      (instance) => instance.observed.some((element) => element.querySelector('#content'))
    );

    await act(async () => {
      root.unmount();
    });

    expect(observer?.disconnected).toBe(true);
  });
});
