import { createRoot, type Root } from 'react-dom/client';

// Every component bundle in the document gets the same Symbol.for keys, so all copies of this module agree on who
// owns a container. The state, including the React root, is stored on the container element itself.
const surfaceKey = Symbol.for('content-lens.component-surface.v1');
const ownerKey = Symbol.for('content-lens.component-surface-owner.v1');
const releasedOwners = new WeakSet<object>();

interface OwnerState { container: Element; released: boolean; }
interface SurfaceState {
  owner?: object;
  root?: Root;
  onRelease?: () => void;
  transferring: boolean;
}
type SurfaceContainer = Element & { [surfaceKey]?: SurfaceState };
type SurfaceOwner = object & { [ownerKey]?: OwnerState };

function surfaceFor(container: Element): SurfaceState {
  const target = container as SurfaceContainer;
  let state = target[surfaceKey];
  if (!state) {
    state = { transferring: false };
    Object.defineProperty(target, surfaceKey, { value: state });
  }
  return state;
}

function markReleased(owner: object, container: Element): void {
  releasedOwners.add(owner);
  const target = owner as SurfaceOwner;
  const state = target[ownerKey];
  if (state) state.released = true;
  else Object.defineProperty(target, ownerKey, { value: { container, released: true } });
}

/** Clears ownership before it calls the release callback, so a late or reentrant cleanup finds nothing to release. */
function disposeSurface(state: SurfaceState, container: Element): void {
  const owner = state.owner;
  const root = state.root;
  const onRelease = state.onRelease;
  state.owner = undefined;
  state.root = undefined;
  state.onRelease = undefined;
  if (owner) markReleased(owner, container);
  try {
    // Detach the review client first: React cleanup may abort its old signal.
    // The old React root is unmounted even when the callback throws.
    try {
      onRelease?.();
    } catch {
      // Continue releasing the old surface.
    }
  } finally {
    root?.unmount();
  }
}

/**
 * Claims the container for an owner and returns its React root, or undefined when the owner may not render there.
 * A new owner gets a fresh React root, so its hooks start from its own restored state instead of the prior
 * component's. Re-renders by the current owner reuse its root.
 */
export function claimComponentSurface(owner: object, container: Element, onRelease: () => void): Root | undefined {
  const target = owner as SurfaceOwner;
  const previousClaim = target[ownerKey];
  const released = releasedOwners.has(owner) || previousClaim?.released;
  if (released || (previousClaim && previousClaim.container !== container)) return undefined;
  const state = surfaceFor(container);
  if (state.transferring) return undefined;
  if (state.owner === owner) {
    state.onRelease = onRelease;
    return state.root;
  }
  // An owner claims a container once. The claim is stored on the owner itself, so an owner that another bundle
  // replaced stays out even when the releasedOwners set of its own module does not list it.
  if (previousClaim) return undefined;
  state.transferring = true;
  try {
    disposeSurface(state, container);
    if (releasedOwners.has(owner) || target[ownerKey]?.released) return undefined;
    const root = createRoot(container);
    Object.defineProperty(target, ownerKey, { value: { container, released: false } });
    state.owner = owner;
    state.root = root;
    state.onRelease = onRelease;
    return root;
  } finally {
    state.transferring = false;
  }
}

/**
 * Releases the owner's claim; a second call has no effect. An owner that another one has replaced is only marked
 * released, so its teardown leaves the replacement root mounted.
 */
export function releaseComponentSurface(owner: object, container: Element): void {
  const previousClaim = (owner as SurfaceOwner)[ownerKey];
  if (previousClaim && previousClaim.container !== container) return;
  const state = surfaceFor(container);
  if (state.owner !== owner) {
    markReleased(owner, container);
    return;
  }
  state.transferring = true;
  try {
    disposeSurface(state, container);
  } finally {
    state.transferring = false;
  }
}
