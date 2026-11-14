import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';

import DesignShowcase from './components/DesignShowcase';
import type { IDesignShowcaseProps } from './components/IDesignShowcaseProps';
import type { IDesignShowcaseCopilotComponentProperties } from './DesignShowcaseCopilotComponentProperties';
import { PROJECTS } from './mockData';

import * as strings from 'DesignShowcaseCopilotComponentStrings';

/**
 * SPFx Copilot Component that shows how to follow the host theme and
 * how to lay out the inline and the fullscreen display modes.
 *
 * The component uses bundled mock records. It makes no network calls
 * and requests no API permissions.
 *
 * Lifecycle:
 *  1. `render()` — mounts the React tree into `this.context.domElement`.
 *     The framework calls it again each time the host context changes,
 *     so the tree always gets the current theme, display mode, size,
 *     and device.
 *  2. `onTeardown()` — unmounts React before the host tears down the iframe.
 */
export default class DesignShowcaseCopilotComponent extends BaseCopilotComponent<IDesignShowcaseCopilotComponentProperties> {
  private _root: Root | undefined;

  protected render(): void {
    const props: IDesignShowcaseProps = {
      projects: PROJECTS,
      locale: this.context.pageContext.cultureInfo.currentUICultureName,
      // Pass the host context as it is now. Do not keep a copy.
      hostContext: this.hostContext,
      onRequestDisplayMode: async (mode: SPCopilotDisplayMode): Promise<void> => {
        await this.requestDisplayModeAsync(mode);
      },
      // The component runs in an iframe. Styles must go to its document.
      targetDocument: this.context.domElement.ownerDocument,
      strings
    };

    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }

    this._root.render(React.createElement(DesignShowcase, props));
  }

  protected async onTeardown(): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
  }
}
