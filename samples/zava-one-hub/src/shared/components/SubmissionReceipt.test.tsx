import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SubmissionReceipt } from './SubmissionReceipt';

function render(tone?: 'success' | 'neutral'): HTMLDivElement {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(
    <SubmissionReceipt eyebrow="Request recorded" title="Time-off request submitted"
      description="Your request is ready for manager review."
      details={[{ label: 'Reference', value: 'PTO-2026-902' }, { label: 'Status', value: 'Pending manager approval' }]}
      note="Session-only demo. No external submission."
      actions={<button type="button">View submitted requests</button>} tone={tone}>
      <p>Five working days</p>
    </SubmissionReceipt>
  );
  return container;
}

test('labels the receipt with its heading and announces the outcome', () => {
  const container = render();
  const section = container.querySelector('section');
  expect(section?.getAttribute('aria-labelledby')).toBe(container.querySelector('h3')?.id);
  expect(container.querySelector('[role="status"]')?.textContent).toContain('Time-off request submitted');
  expect(container.querySelector('[role="status"]')?.getAttribute('aria-atomic')).toBe('true');
});

test('preserves structured details, custom content, and the demo boundary', () => {
  const container = render();
  expect(Array.from(container.querySelectorAll('dt')).map((element) => element.textContent)).toEqual(['Reference', 'Status']);
  expect(Array.from(container.querySelectorAll('dd')).map((element) => element.textContent)).toEqual(['PTO-2026-902', 'Pending manager approval']);
  expect(container.textContent).toContain('Five working days');
  expect(container.textContent).toContain('Session-only demo. No external submission.');
});

test('keeps next actions outside the live announcement', () => {
  const container = render();
  expect(container.querySelector('[role="status"] button')).toBeNull();
  expect(container.querySelector('button')?.textContent).toBe('View submitted requests');
});

test('uses a distinct neutral treatment for recorded declines', () => {
  expect(render('neutral').querySelector('[role="status"] > div')?.className)
    .not.toBe(render('success').querySelector('[role="status"] > div')?.className);
});
