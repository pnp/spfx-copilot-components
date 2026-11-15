import * as React from 'react';
import { Button, Popover, PopoverSurface, PopoverTrigger, makeStyles, tokens } from '@fluentui/react-components';
import { Info16Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  button: { minWidth: '24px', width: '24px', height: '24px', padding: 0, color: tokens.colorNeutralForeground2 },
  // The surface renders inline in the card, so it needs a stacking level above the fields that follow the button.
  surface: {
    zIndex: 1,
    maxWidth: '320px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '12px',
    lineHeight: '16px',
    '& p': { margin: 0 },
    '& ul': { margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }
  }
});

/** A small ⓘ button whose explanation opens on click or Enter, so it works with touch and keyboard, unlike a hover tooltip. */
export function InfoPopover({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  const local = useStyles();
  return <Popover inline withArrow size="small" positioning="above-start">
    <PopoverTrigger disableButtonEnhancement>
      <Button appearance="transparent" size="small" className={local.button} icon={<Info16Regular />} aria-label={label}
        data-testid="info" />
    </PopoverTrigger>
    <PopoverSurface className={local.surface}>{children}</PopoverSurface>
  </Popover>;
}
