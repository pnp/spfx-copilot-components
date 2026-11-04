import type {
  ICopilotComponentHostContext
} from '@microsoft/sp-copilot-component';

export interface IPortfolioCarryoverReviewProps {
  /** Host context (theme and display mode) from Copilot. */
  hostContext: ICopilotComponentHostContext;

  /** Document used by Fluent UI to inject styles in the component iframe. */
  targetDocument: Document | undefined;
}
