import * as React from 'react';
import { DestinationLine } from './DestinationLine';
import type { IDestination } from '../../logic/destination';
import { mount, query } from '../testHelpers';

const DEST: IDestination = { segments: ['Records', 'Finance', 'Invoices', 'Programs', '2026'] };

function render(node: React.ReactElement): HTMLElement {
  const h = mount();
  h.render(node);
  return h.container;
}

describe('DestinationLine', () => {
  it('short + resolved reads "Destination: <path>" and marks itself resolved', () => {
    const c = render(<DestinationLine destination={DEST} />);
    const el = query(c, '[data-destination]')!;
    expect(el.getAttribute('data-destination')).toBe('resolved');
    expect((el.textContent || '').trim()).toBe('Destination: Finance › Invoices › Programs');
  });

  it('short + resolved appends a trailing note', () => {
    const c = render(<DestinationLine destination={DEST} note="3 of 4 ready" />);
    expect((query(c, '[data-destination]')!.textContent || '').trim()).toBe(
      'Destination: Finance › Invoices › Programs · 3 of 4 ready'
    );
  });

  it('full + resolved reads the whole path with the file name appended', () => {
    const c = render(<DestinationLine destination={DEST} variant="full" fileName="INV-20417.pdf" />);
    expect((query(c, '[data-destination]')!.textContent || '').trim()).toBe(
      'Records / Finance / Invoices / Programs / 2026 / INV-20417.pdf'
    );
  });

  it('short + pending shows the caller\'s pending label and marks itself pending', () => {
    const c = render(<DestinationLine destination={undefined} pendingLabel="Destination set from kind and department" />);
    const el = query(c, '[data-destination]')!;
    expect(el.getAttribute('data-destination')).toBe('pending');
    expect((el.textContent || '').trim()).toBe('Destination set from kind and department');
  });

  it('full + pending renders nothing but still reports pending', () => {
    const c = render(<DestinationLine destination={undefined} variant="full" fileName="x.pdf" />);
    const el = query(c, '[data-destination]')!;
    expect(el.getAttribute('data-destination')).toBe('pending');
    expect((el.textContent || '').trim()).toBe('');
  });
});
