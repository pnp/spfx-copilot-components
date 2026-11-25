/**
 * Copy a URL or short string to the clipboard. Prefer the Clipboard API, then
 * execCommand('copy') for hosts (including some Copilot iframes) where the
 * async API is missing or rejected.
 */
export async function copyTextToClipboard(text: string, doc?: Document): Promise<boolean> {
  const value = (text || '').trim();
  if (!value) {
    return false;
  }
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
    try {
      await nav.clipboard.writeText(value);
      return true;
    } catch {
      // Permission or policy rejection: fall through to execCommand.
    }
  }
  return copyTextWithExecCommand(value, doc);
}

export function copyTextWithExecCommand(text: string, doc?: Document): boolean {
  const d = doc || (typeof document !== 'undefined' ? document : undefined);
  if (!d || !d.body) {
    return false;
  }
  const area = d.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.setAttribute('aria-hidden', 'true');
  area.style.position = 'fixed';
  area.style.top = '0px';
  area.style.left = '-9999px';
  area.style.opacity = '0';
  d.body.appendChild(area);
  area.focus();
  area.select();
  if (typeof area.setSelectionRange === 'function') {
    area.setSelectionRange(0, text.length);
  }
  let ok = false;
  try {
    ok = d.execCommand('copy');
  } catch {
    ok = false;
  }
  d.body.removeChild(area);
  return ok;
}
