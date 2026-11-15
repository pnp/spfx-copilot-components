import * as React from 'react';
import { tokens } from '@fluentui/react-components';

/** The card's icon as inline SVG: no asset request, and its colours follow the host theme tokens. */
export function ContentLensIcon({ size = 40 }: { size?: number }): React.ReactElement {
  return <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
    <rect x="1" y="1" width="38" height="38" rx="9" fill={tokens.colorBrandBackground2} stroke={tokens.colorBrandStroke2} />
    <path
      d="M9 13.5a3.5 3.5 0 0 1 3.5-3.5h9a3.5 3.5 0 0 1 3.5 3.5v5a3.5 3.5 0 0 1-3.5 3.5h-4.2L13 25.4c-.9.7-2 .05-2-1v-2.4h-.5A2.5 2.5 0 0 1 9 19.5Z"
      fill={tokens.colorNeutralBackground1}
      stroke={tokens.colorBrandForeground1}
      strokeWidth="1.8"
    />
    <circle cx="25.5" cy="24.5" r="6" fill={tokens.colorNeutralBackground1} stroke={tokens.colorBrandForeground1} strokeWidth="1.8" />
    <path d="M30 29l4 4" stroke={tokens.colorBrandForeground1} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M22.8 24.5h5.4" stroke="#ffb900" strokeWidth="2.4" strokeLinecap="round" />
  </svg>;
}
