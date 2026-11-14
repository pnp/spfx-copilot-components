// What a control does when it is used. Pieces never run actions themselves: the page passes a
// runner that knows how to report failure (e.g. announce it in the page's live region).

/** An action may report failure by returning false (e.g. the host rejected a follow-up). */
export type Action = () => void | boolean | Promise<void | boolean>;

export interface IActionRunner {
  /** Runs an action; a rejection is reported by the runner. Resolves true when it succeeded. */
  run(action: Action): Promise<boolean>;
}
