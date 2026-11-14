import { watchContentSize } from './ContentSize';

type ResizeCallback = () => void;

class ResizeObserverStub {
  public static instances: ResizeObserverStub[] = [];
  public observed: Element[] = [];
  public disconnected: boolean = false;

  public constructor(public readonly callback: ResizeCallback) {
    ResizeObserverStub.instances.push(this);
  }

  public observe(element: Element): void {
    this.observed.push(element);
  }

  public disconnect(): void {
    this.disconnected = true;
  }
}

function elementWithSize(size: { width: number; height: number }): HTMLElement {
  const element: HTMLElement = document.createElement('div');
  element.getBoundingClientRect = () => ({ ...size }) as DOMRect;
  return element;
}

describe('watchContentSize', () => {
  const original: unknown = (window as unknown as { ResizeObserver: unknown }).ResizeObserver;

  beforeEach(() => {
    ResizeObserverStub.instances = [];
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
  });

  afterEach(() => {
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = original;
  });

  it('reports the rounded size of the element when it changes', () => {
    const size = { width: 400.2, height: 141.5 };
    const element: HTMLElement = elementWithSize(size);
    const onSize: jest.Mock = jest.fn();

    watchContentSize(element, onSize);
    ResizeObserverStub.instances[0].callback();
    size.height = 752.1;
    ResizeObserverStub.instances[0].callback();

    expect(ResizeObserverStub.instances[0].observed).toEqual([element]);
    expect(onSize.mock.calls).toEqual([
      [401, 142],
      [401, 753]
    ]);
  });

  it('does not report the same size twice', () => {
    const element: HTMLElement = elementWithSize({ width: 400, height: 142 });
    const onSize: jest.Mock = jest.fn();

    watchContentSize(element, onSize);
    ResizeObserverStub.instances[0].callback();
    ResizeObserverStub.instances[0].callback();

    expect(onSize).toHaveBeenCalledTimes(1);
  });

  it('stops watching when the returned function is called', () => {
    const element: HTMLElement = elementWithSize({ width: 400, height: 142 });

    const stop: () => void = watchContentSize(element, jest.fn());
    stop();

    expect(ResizeObserverStub.instances[0].disconnected).toBe(true);
  });

  it('does nothing when the browser has no ResizeObserver', () => {
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = undefined;
    const onSize: jest.Mock = jest.fn();

    const stop: () => void = watchContentSize(elementWithSize({ width: 1, height: 1 }), onSize);
    stop();

    expect(onSize).not.toHaveBeenCalled();
  });
});
