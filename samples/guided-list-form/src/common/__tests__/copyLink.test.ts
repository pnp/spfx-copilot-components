import { copyTextToClipboard, copyTextWithExecCommand } from '../logic/copyLink';

describe('copyTextToClipboard', () => {
  const originalClipboard = (navigator as unknown as { clipboard?: Clipboard }).clipboard;

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard
    });
  });

  it('uses navigator.clipboard.writeText when it is available', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await expect(copyTextToClipboard('https://fabrikam.sharepoint.com/sites/it/Lists/ITRequests/DispForm.aspx?ID=12')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('https://fabrikam.sharepoint.com/sites/it/Lists/ITRequests/DispForm.aspx?ID=12');
  });

  it('falls back to execCommand when the Clipboard API rejects', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const exec = jest.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: exec });
    await expect(copyTextToClipboard('https://fabrikam.sharepoint.com/sites/it/Lists/ITRequests/NewForm.aspx')).resolves.toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
    exec.mockRestore();
  });

  it('returns false for an empty string', async () => {
    const writeText = jest.fn();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await expect(copyTextToClipboard('   ')).resolves.toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });
});

describe('copyTextWithExecCommand', () => {
  it('writes the text into a temporary textarea and copies it', () => {
    const exec = jest.fn().mockImplementation(() => {
      const area = document.querySelector('textarea');
      expect(area).not.toBeNull();
      expect((area as HTMLTextAreaElement).value).toBe('https://example.com/item');
      return true;
    });
    Object.defineProperty(document, 'execCommand', { configurable: true, value: exec });
    expect(copyTextWithExecCommand('https://example.com/item')).toBe(true);
    expect(document.querySelector('textarea')).toBeNull();
    expect(exec).toHaveBeenCalledWith('copy');
  });
});
