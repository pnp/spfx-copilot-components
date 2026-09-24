import * as React from 'react';
import { Button, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type { IDroppedFile } from '../../models/filing';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    ...shorthands.gap('8px', '12px')
  },
  hint: { color: tokens.colorNeutralForeground2, fontSize: tokens.fontSizeBase200 },
  button: { minHeight: '36px' },
  input: { display: 'none' }
});

export interface IFilePickerProps {
  multiple?: boolean;
  onFiles: (files: IDroppedFile[]) => void;
  buttonLabel: string;
  /** Accepted types and limits, beside the button. */
  hint: string;
  /** The stage's main action (inline, nothing chosen yet). */
  primary?: boolean;
}

/**
 * Reads name, size and type, and keeps a reference to the `File` itself so the
 * live store has something to upload. The mock still never reads the bytes, so
 * the sample stays offline by default (R10) — a `File` reference held in memory
 * is not a network call. Nothing downstream renders from `blob`.
 */
export function toChosenFiles(list: ArrayLike<File> | undefined): IDroppedFile[] {
  const out: IDroppedFile[] = [];
  if (!list) {
    return out;
  }
  for (let i = 0; i < list.length; i++) {
    const f: File = list[i];
    out.push({ name: f.name, sizeBytes: f.size, contentType: f.type || '', blob: f });
  }
  return out;
}

/**
 * The one way files enter the component: a button over the browser's file
 * dialog. There is no drop zone and no drag handler on purpose (todo.md 8.8
 * L10): in Copilot the host takes a drag for the whole chat surface, iframe
 * included, and a dragged file becomes a chat attachment instead. A drop target
 * that only works in the Workbench is a control the user cannot use (R23), so
 * nothing here invites one.
 */
export const FilePicker: React.FC<IFilePickerProps> = props => {
  const styles = useStyles();
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className={styles.root} data-file-picker="true">
      <Button
        appearance={props.primary ? 'primary' : 'secondary'}
        className={styles.button}
        data-action="choose-files"
        onClick={() => inputRef.current && inputRef.current.click()}
      >
        {props.buttonLabel}
      </Button>
      <span className={styles.hint}>{props.hint}</span>
      <input
        ref={inputRef}
        className={styles.input}
        type="file"
        multiple={props.multiple}
        data-file-input="true"
        aria-label={props.buttonLabel}
        onChange={e => props.onFiles(toChosenFiles(e.target.files || undefined))}
      />
    </div>
  );
};
