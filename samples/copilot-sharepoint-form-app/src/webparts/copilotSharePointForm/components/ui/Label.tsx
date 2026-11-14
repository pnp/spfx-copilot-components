import * as React from "react";
import styles from "./ui.module.scss";

export interface ILabelProps {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}

/** Scoped shadcn Label. Colors come from Fluent UI tokens, not a global reset. */
export function Label(props: ILabelProps): React.ReactElement {
  return (
    <label className={styles.label} htmlFor={props.htmlFor}>
      <span>{props.children}</span>
      {props.required && <span className={`${styles.badge} ${styles.badgeRequired}`}>Required</span>}
    </label>
  );
}
