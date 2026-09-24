import * as React from 'react';
import type { IAppProps } from './FileUploaderApp';
import { FilingInline } from './FilingInline';
import { RecentInline } from './RecentInline';

/**
 * Inline view. Routes the intent (AGENTS.md R7: the root selects on display
 * mode; intent routing lives here, inside the view).
 */
export const FileUploaderInline: React.FC<IAppProps> = props =>
  props.session.intent === 'recent' ? <RecentInline {...props} /> : <FilingInline {...props} />;
