import * as React from "react";
import styles from "./ui.module.scss";

export interface IInputProps {
  id: string;
  field: string;
  value: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onChange: (value: string) => void;
}

/** Scoped shadcn Input for a single-line Title / Text column. */
export function Input(props: IInputProps): React.ReactElement {
  return (
    <input
      id={props.id}
      data-slot="input"
      data-field={props.field}
      className={styles.control}
      type="text"
      value={props.value}
      disabled={props.disabled}
      required={props.required}
      aria-required={props.required ? true : undefined}
      aria-invalid={props.invalid ? true : undefined}
      aria-describedby={props.describedBy}
      placeholder={props.placeholder}
      onKeyDown={props.onKeyDown}
      onChange={(event): void => props.onChange(event.currentTarget.value)}
    />
  );
}
