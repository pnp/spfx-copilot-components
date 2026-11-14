import * as React from "react";
import styles from "./ui.module.scss";

export interface ITextareaProps {
  id: string;
  field: string;
  value: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
}

/** Scoped shadcn Textarea for a Description / Note column. */
export function Textarea(props: ITextareaProps): React.ReactElement {
  return (
    <textarea
      id={props.id}
      data-slot="textarea"
      data-field={props.field}
      className={`${styles.control} ${styles.textarea}`}
      value={props.value}
      disabled={props.disabled}
      required={props.required}
      aria-required={props.required ? true : undefined}
      aria-invalid={props.invalid ? true : undefined}
      aria-describedby={props.describedBy}
      rows={4}
      onChange={(event): void => props.onChange(event.currentTarget.value)}
    />
  );
}
