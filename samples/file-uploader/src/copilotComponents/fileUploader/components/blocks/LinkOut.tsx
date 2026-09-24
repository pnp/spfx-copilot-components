import * as React from 'react';
import { Button, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import { useSharedStyles } from './useSharedStyles';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
    marginTop: '12px'
  },
  // One click selects the whole URL, so copying it by hand is one keystroke.
  url: { userSelect: 'all' },
  buttons: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    ...shorthands.gap('8px')
  },
  narrowButtons: {
    '> button': { flexGrow: 1 }
  },
  statusFailed: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200
  }
});

const OPEN_FAILED: string = "Couldn't open the link here. Select it above to copy it.";

/**
 * The URL with a break opportunity after every `/` past the host, so it wraps
 * between path segments (`…/2026/` / `hf6.png`) rather than inside a file name
 * (`…/hf6.pn` / `g`). `overflow-wrap: anywhere` on the path style still breaks a
 * single segment too long for the line. `textContent` stays the exact URL.
 */
export function withPathBreaks(url: string): React.ReactNode[] {
  const parts: string[] = url.split('/');
  const out: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    const last: boolean = i === parts.length - 1;
    out.push(part + (last ? '' : '/'));
    // parts[0..1] are "https:" and "" — no break inside the scheme's "//".
    if (!last && i >= 2) {
      out.push(<wbr key={i} />);
    }
  });
  return out;
}

export interface ILinkOutProps {
  url: string;
  /** Text of the open button, e.g. "Open in SharePoint". */
  openLabel: string;
  /** `data-action` of the open button. */
  openAction: string;
  /**
   * The host's open-link call (`copilotBridge.openLinkAsync`), when it offers
   * one. Resolves false when the host refused. Absent → no open button at all.
   */
  openLink?: (url: string) => Promise<boolean>;
  narrow?: boolean;
  /** Button height class — 36px inline, 38px full screen (AGENTS.md §4). */
  buttonClassName?: string;
}

/**
 * A link out of the canvas that never pretends (todo.md 8.8 L9, L10). The
 * host's iframe swallows an `<a target="_blank">` without a word, so there is
 * no anchor here (R23). The URL is always on screen as selectable text; **Open**
 * goes through the host, which puts its own link check in front (L9, proven).
 * There is no Copy button: the canvas never grants clipboard write, so it could
 * only fail (L10). If the host refuses to open, the line under the button says
 * so rather than claiming what did not happen (R25, R26).
 */
export const LinkOut: React.FC<ILinkOutProps> = props => {
  const s = useSharedStyles();
  const styles = useStyles();
  const { url, openLink } = props;
  const [refused, setRefused] = React.useState<boolean>(false);
  const mounted = React.useRef<boolean>(true);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  React.useEffect(() => setRefused(false), [url]);

  const settle = (didRefuse: boolean): void => {
    if (mounted.current) {
      setRefused(didRefuse);
    }
  };

  const open = (): void => {
    if (!openLink) {
      return;
    }
    // Success says nothing: the host acknowledging is not the page opening.
    openLink(url).then(
      accepted => settle(!accepted),
      () => settle(true)
    );
  };

  return (
    <div className={styles.root} data-link-out={props.openAction}>
      <span className={mergeClasses(s.path, styles.url)} data-link-url="true">
        {withPathBreaks(url)}
      </span>
      {openLink ? (
        <div className={mergeClasses(styles.buttons, props.narrow && styles.narrowButtons)}>
          <Button appearance="secondary" className={props.buttonClassName} data-action={props.openAction} onClick={open}>
            {props.openLabel}
          </Button>
        </div>
      ) : undefined}
      <span
        className={styles.statusFailed}
        aria-live="polite"
        data-link-status={refused ? 'open-failed' : 'idle'}
      >
        {refused ? OPEN_FAILED : ''}
      </span>
    </div>
  );
};
