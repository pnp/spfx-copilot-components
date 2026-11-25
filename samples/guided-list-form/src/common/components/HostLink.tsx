import * as React from 'react';
import { Copy16Regular } from '@fluentui/react-icons';
import type { HostKind } from '../models';
import { copyTextToClipboard } from '../logic/copyLink';

export interface IHostLinkProps {
  host: HostKind;
  href: string;
  openLabel: string;
  copyLabel: string;
  copiedLabel?: string;
  className?: string;
  testId?: string;
  /** Shown only on the page web part, next to the open-in-a-new-tab link. */
  openIcon?: React.ReactNode;
  /** Shown only in the Copilot host, next to the copy button. Defaults to a copy icon. */
  copyIcon?: React.ReactNode;
}

/**
 * In the page web part, a normal "open in a new tab" link. In the Copilot host,
 * a button that copies the URL (anchors and window.open do not navigate there).
 * The open/external icon is never used on the copy button.
 */
export function HostLink(props: IHostLinkProps): React.ReactElement | undefined {
  const href = (props.href || '').trim();
  const copiedLabel = props.copiedLabel || 'Link copied';
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  const copyIcon = props.copyIcon === undefined
    ? <span data-testid="wiz-host-copy-icon" aria-hidden="true"><Copy16Regular /></span>
    : props.copyIcon;

  React.useEffect(() => {
    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  if (!href) {
    return undefined;
  }

  if (props.host !== 'Copilot') {
    return (
      <a className={props.className} href={href} target="_blank" rel="noopener noreferrer" data-testid={props.testId}>
        {props.openLabel}
        {props.openIcon ? <span data-testid="wiz-host-open-icon" aria-hidden="true">{props.openIcon}</span> : undefined}
      </a>
    );
  }

  const onClick = (): void => {
    copyTextToClipboard(href)
      .then((ok) => {
        if (!ok) {
          return;
        }
        setCopied(true);
        if (timer.current) {
          window.clearTimeout(timer.current);
        }
        timer.current = window.setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => undefined);
  };

  return (
    <button type="button" className={props.className} data-testid={props.testId} onClick={onClick}>
      {copied ? copiedLabel : props.copyLabel}
      {copied ? undefined : copyIcon}
    </button>
  );
}
