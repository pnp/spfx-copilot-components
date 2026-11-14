import * as React from "react";
import styles from "./ui.module.scss";

export interface IBadgeProps {
  tone: "verified" | "missing" | "invalid" | "demo";
  children: React.ReactNode;
}

/** Scoped shadcn Badge for the library lookup status. */
export function Badge(props: IBadgeProps): React.ReactElement {
  const tone = props.tone === "verified" || props.tone === "demo" ? styles.badgeVerified : styles.badgeMissing;
  return (
    <span className={`${styles.badge} ${tone}`} data-slot="badge" data-library-status={props.tone}>
      {props.children}
    </span>
  );
}
