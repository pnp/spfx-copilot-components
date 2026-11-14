import * as React from "react";
import styles from "./entrance.module.scss";

export interface IFadeSlideUpProps {
  delay?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * React Bits-style fade and slide-up on first paint.
 * Motion is skipped when the reader prefers reduced motion.
 */
export function FadeSlideUp(props: IFadeSlideUpProps): React.ReactElement {
  const className = [styles.enter, props.delay ? styles.delay : "", props.className || ""].filter((name) => name.length > 0).join(" ");
  return (
    <div className={className} data-react-bits="fade-slide">
      {props.children}
    </div>
  );
}
