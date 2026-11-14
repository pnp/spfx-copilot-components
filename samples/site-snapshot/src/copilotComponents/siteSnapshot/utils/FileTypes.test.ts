// Tests for file-type categorisation.

import { categorize } from './FileTypes';

describe('categorize', () => {
  it('maps common Office extensions to their category', () => {
    expect(categorize('report.docx')).toBe('Word');
    expect(categorize('budget.xlsx')).toBe('Excel');
    expect(categorize('deck.pptx')).toBe('PowerPoint');
    expect(categorize('guide.pdf')).toBe('PDF');
  });

  it('maps images and media', () => {
    expect(categorize('logo.PNG')).toBe('Images'); // case-insensitive
    expect(categorize('clip.mp4')).toBe('Media');
  });

  it('falls back to Other for unknown or missing extensions', () => {
    expect(categorize('data.xyz')).toBe('Other');
    expect(categorize('README')).toBe('Other');
  });
});
