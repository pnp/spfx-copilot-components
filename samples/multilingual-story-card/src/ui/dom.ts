// Tiny DOM builder for every piece in src/ui. All text goes through text nodes, never innerHTML,
// so values coming from Copilot never need escaping.

// eslint-disable-next-line @rushstack/no-new-null -- DOM/JSON APIs use null
export type Child = Node | string | number | false | null | undefined;
export type Attrs = Record<string, string | number | boolean | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  // eslint-disable-next-line @rushstack/no-new-null -- h('div', null, ...) reads better
  attrs?: Attrs | null,
  ...children: Array<Child | Child[]>
): HTMLElementTagNameMap[K] {
  const el: HTMLElementTagNameMap[K] = document.createElement(tag);

  if (attrs) {
    Object.keys(attrs).forEach((key: string) => {
      const value: string | number | boolean | undefined = attrs[key];
      if (value === undefined || value === false) {
        return;
      }
      el.setAttribute(key === 'className' ? 'class' : key, value === true ? '' : String(value));
    });
  }

  append(el, children);
  return el;
}

export function append(parent: Node, children: Array<Child | Child[]>): void {
  children.forEach((child: Child | Child[]) => {
    if (Array.isArray(child)) {
      append(parent, child);
    } else if (child instanceof Node) {
      parent.appendChild(child);
    } else if (child !== undefined && child !== null && child !== false) {
      parent.appendChild(document.createTextNode(String(child)));
    }
  });
}

/** Display modes a template can switch between; pieces marked for one mode are hidden in the other. */
export type ShowIn = 'inline' | 'fullscreen';

/**
 * Marks an element as existing in one display mode only. The template hides it in the other mode
 * (display:none, so it also leaves the tab order); the piece itself never knows the mode.
 */
export function showIn<T extends HTMLElement>(mode: ShowIn, el: T): T {
  el.setAttribute('data-show', mode);
  return el;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API is often blocked inside sandboxed iframes; fall back to execCommand.
    const area: HTMLTextAreaElement = h('textarea', { 'aria-hidden': 'true' });
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok: boolean = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}
