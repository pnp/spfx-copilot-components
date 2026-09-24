import * as React from 'react';
import { Field, makeStyles, tokens } from '@fluentui/react-components';
import type { FieldKey } from '../../models/sources';

const useStyles = makeStyles({
  field: { marginBottom: '12px' },
  prefilled: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground1,
    marginTop: '4px'
  }
});

export interface IFieldShellProps {
  name: FieldKey | string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  /** Marks the value as coming from the user's prompt rather than from them. */
  prefilled?: boolean;
  children: React.ReactNode;
}

/**
 * One form field: label, required marker, validation message, hint, and the
 * "from your prompt" marker. Copilot pre-fills; the marker tells the user so
 * they can correct it before anything is saved (R25).
 */
export const FieldShell: React.FC<IFieldShellProps> = props => {
  const styles = useStyles();
  return (
    <div className={styles.field} data-field={props.name} data-invalid={props.error ? 'true' : 'false'}>
      <Field
        label={props.label}
        required={props.required}
        validationState={props.error ? 'error' : 'none'}
        validationMessage={props.error}
        hint={props.hint}
      >
        {props.children as React.ReactElement}
      </Field>
      {props.prefilled ? (
        <div className={styles.prefilled} data-prefilled={props.name}>
          Pre-filled from your prompt · change if wrong
        </div>
      ) : undefined}
    </div>
  );
};
