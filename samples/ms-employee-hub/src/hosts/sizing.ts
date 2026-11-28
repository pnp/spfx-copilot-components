export function watchSize(surface: HTMLElement, request: (width: number, height: number) => Promise<boolean>, rejected: () => void): { schedule: () => void; stop: () => void } {
  const doc = surface.ownerDocument;
  const win = doc.defaultView;
  if (!win) return { schedule: () => undefined, stop: () => undefined };
  let frame = 0, pending = false, measuring = false, alive = true;
  let observed: HTMLElement | undefined;
  const observers: { resize?: ResizeObserver } = {};
  const schedule = (): void => {
    if (!alive || frame) return;
    if (measuring) { pending = true; return; }
    frame = win.requestAnimationFrame(() => {
      frame = 0;
      if (!alive) return;
      const root = surface.querySelector<HTMLElement>('[data-layout]') || surface;
      if (root !== observed) { if (observed) observers.resize?.unobserve(observed); observed = root; observers.resize?.observe(root); }
      const rect = root.getBoundingClientRect();
      const shell=surface.getBoundingClientRect();
      const w = Math.ceil(Math.max(rect.width, root.scrollWidth, shell.width, surface.scrollWidth));
      const h = Math.ceil(Math.max(rect.height, root.scrollHeight, shell.height, surface.scrollHeight));
      if (w <= 0 || h <= 0) return;
      measuring = true;
      const done = (accepted: boolean): void => {
        measuring = false;
        if (!alive) return;
        if (!accepted) rejected();
        if (pending) { pending = false; schedule(); }
      };
      request(w, h).then(done, () => done(false));
    });
  };
  if (win.ResizeObserver) observers.resize = new win.ResizeObserver(schedule);
  const mutation = new win.MutationObserver(schedule);
  mutation.observe(surface, { subtree: true, childList: true, characterData: true, attributes: true });
  surface.addEventListener('load', schedule, true);
  win.addEventListener('resize', schedule);
  doc.fonts?.addEventListener('loadingdone', schedule);
  schedule();
  return { schedule, stop: () => {
    alive = false; mutation.disconnect(); observers.resize?.disconnect(); win.cancelAnimationFrame(frame);
    surface.removeEventListener('load', schedule, true); win.removeEventListener('resize', schedule);
    doc.fonts?.removeEventListener('loadingdone', schedule);
  } };
}
