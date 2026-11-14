import * as React from "react";
import styles from "./ui.module.scss";

export interface ISelectProps {
  id: string;
  field: string;
  value: string;
  choices: string[];
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
}

/** Scoped shadcn Select for a Choice column. */
export function Select(props: ISelectProps): React.ReactElement {
  return (
    <select
      id={props.id}
      data-slot="select"
      data-field={props.field}
      className={styles.control}
      value={props.value}
      disabled={props.disabled}
      required={props.required}
      aria-required={props.required ? true : undefined}
      aria-invalid={props.invalid ? true : undefined}
      aria-describedby={props.describedBy}
      onChange={(event): void => props.onChange(event.currentTarget.value)}
    >
      <option value="">Select</option>
      {props.choices.map((choice) => (
        <option key={choice} value={choice}>{choice}</option>
      ))}
    </select>
  );
}
