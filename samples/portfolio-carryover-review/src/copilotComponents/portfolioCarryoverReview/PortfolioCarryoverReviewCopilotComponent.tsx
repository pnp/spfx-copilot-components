import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';

import PortfolioCarryoverReview from './components/PortfolioCarryoverReview';
import type { IPortfolioCarryoverReviewProps } from './components/IPortfolioCarryoverReviewProps';
import type { IPortfolioCarryoverReviewCopilotComponentProperties } from './PortfolioCarryoverReviewCopilotComponentProperties';

export default class PortfolioCarryoverReviewCopilotComponent extends BaseCopilotComponent<IPortfolioCarryoverReviewCopilotComponentProperties> {
  private _root: Root | undefined;

  protected render(): void {
    const props: IPortfolioCarryoverReviewProps = {
      hostContext: this.hostContext,
      targetDocument: this.context.domElement.ownerDocument
    };

    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }

    this._root.render(React.createElement(PortfolioCarryoverReview, props));
  }

  protected async onTeardown(): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
  }
}
