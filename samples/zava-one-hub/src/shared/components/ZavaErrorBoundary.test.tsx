import { ZavaErrorBoundary } from './ZavaErrorBoundary';

describe('Zava error boundary', () => {
  test('switches to the safe fallback state after a render error', () => {
    expect(ZavaErrorBoundary.getDerivedStateFromError()).toEqual({ hasError: true });
  });
});