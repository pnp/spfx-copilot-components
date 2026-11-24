import propertiesSchema from '../../copilotComponents/wizardForm/WizardFormCopilotComponentProperties';

// Node built-ins without @types/node (the SPFx tsconfig is browser-only).
declare const require: (id: string) => unknown;
const fs = require('fs') as { readFileSync(p: string, enc: string): string; readdirSync(p: string): string[]; statSync(p: string): { isDirectory(): boolean } };
const path = require('path') as { join(...parts: string[]): string };
const root = (process as unknown as { cwd(): string }).cwd();
const read = (p: string): string => fs.readFileSync(path.join(root, p), 'utf8').replace(/^\uFEFF/, '');
const readJson = (p: string): Record<string, unknown> => JSON.parse(read(p));
const readJsonc = (p: string): Record<string, unknown> => JSON.parse(read(p).replace(/^\s*\/\/.*$/gm, '').replace(/,\s*\/\/[^\n]*$/gm, ','));

const COPILOT_ID = '0d977123-b172-4614-b45d-ca982230b31f';

describe('solution package', () => {
  const pkg = readJson('config/package-solution.json') as { solution: Record<string, unknown>; paths: Record<string, string> };

  it('requests no API permissions and is not domain isolated', () => {
    expect(pkg.solution.webApiPermissionRequests === undefined || (pkg.solution.webApiPermissionRequests as unknown[]).length === 0).toBe(true);
    expect(pkg.solution.isDomainIsolated).toBe(false);
    expect(read('config/package-solution.json')).not.toMatch(/webApiPermissionRequests|Microsoft Graph/);
  });

  it('is version 1.4.6.1 with the sample publisher', () => {
    expect(pkg.solution.version).toBe('1.4.6.1');
    (pkg.solution.features as { version: string }[]).forEach((f) => expect(f.version).toBe('1.4.6.1'));
    expect((readJson('package.json') as { version: string }).version).toBe('1.4.6');
    expect((readJson('copilot/manifest.json') as { version: string }).version).toBe('1.4.6.1');
    const dev = pkg.solution.developer as Record<string, string>;
    expect(dev.name).toBe('Anand Vijayaragavan');
    expect(dev.websiteUrl).toBe('https://www.contoso.com');
    expect(pkg.paths.zippedPackage).toBe('solution/copilot-wizard-form.sppkg');
  });

  it('targets SPFx 1.24.0', () => {
    const p = readJson('package.json') as { dependencies: Record<string, string> };
    expect(p.dependencies['@microsoft/sp-core-library']).toBe('1.24.0');
    expect(p.dependencies['@microsoft/sp-copilot-component']).toBe('1.24.0');
  });
});

describe('web part manifest', () => {
  const raw = read('src/webparts/wizardForm/WizardFormWebPart.manifest.json');
  const manifest = readJsonc('src/webparts/wizardForm/WizardFormWebPart.manifest.json') as Record<string, unknown>;

  it('is a page web part only, theme-aware, no custom script', () => {
    expect(manifest.supportedHosts).toEqual(['SharePointWebPart']);
    expect(manifest.supportsThemeVariants).toBe(true);
    expect(manifest.requiresCustomScript).toBe(false);
    expect(raw).not.toMatch(/TeamsTab|TeamsPersonalApp|SharePointFullPage/);
  });

  it('lists Yes/No, number, currency and hyperlink as supported in the property pane note', () => {
    const loc = read('src/webparts/wizardForm/loc/en-us.js');
    expect(loc).toMatch(/Yes\/No/);
    expect(loc.toLowerCase()).toContain('number');
    expect(loc.toLowerCase()).toContain('currency');
    expect(loc.toLowerCase()).toContain('hyperlink');
    expect(loc).not.toMatch(/yes\/no columns aren.t supported/i);
  });

  it('ships neutral defaults: no list, review and animations on, no accent colour', () => {
    const entry = (manifest.preconfiguredEntries as Record<string, unknown>[])[0];
    expect(entry.properties).toMatchObject({ siteUrl: '', listName: '', fields: '', showReview: true, animations: true, accentColor: '' });
  });

  it('uses a custom SVG data-URI icon instead of the default Fluent tile', () => {
    const entry = (manifest.preconfiguredEntries as Record<string, unknown>[])[0];
    const icon = String(entry.iconImageUrl || '');
    expect(icon.startsWith('data:image/svg+xml;base64,')).toBe(true);
    expect(raw).not.toMatch(/officeFabricIconFontName/);
    const atobFn = (globalThis as unknown as { atob: (value: string) => string }).atob;
    const svg = atobFn(icon.slice('data:image/svg+xml;base64,'.length));
    expect(svg).toContain('#183A35');
    expect(svg).toContain('#0F7F72');
    expect(svg).toContain('#F2643D');
  });
});

describe('Copilot component and agent', () => {
  const manifest = readJsonc('src/copilotComponents/wizardForm/WizardFormCopilotComponent.manifest.json') as Record<string, unknown>;

  it('declares one UX tool, open_step_by_step_form, inline and full screen', () => {
    expect(manifest.id).toBe(COPILOT_ID);
    expect(manifest.componentType).toBe('CopilotComponent');
    expect(manifest.copilotType).toBe('Ux');
    const tools = manifest.tools as { name: string; propertiesSchema: { id: string } }[];
    expect(tools.map((t) => t.name)).toEqual(['open_step_by_step_form']);
    expect(tools[0].propertiesSchema.id).toBe('$../../../lib/copilotComponents/wizardForm/WizardFormCopilotComponentProperties.js:default;');
    expect((manifest.capabilities as Record<string, unknown>).availableDisplayModes).toEqual(['inline', 'fullscreen']);
  });

  it('has an all-optional plain object schema', () => {
    const schema = propertiesSchema as unknown as { type: string; required?: string[]; properties: Record<string, { type: string }> };
    expect(schema.type).toBe('object');
    expect(schema.required).toBeUndefined();
    expect(Object.keys(schema.properties).sort()).toEqual(['fieldExamples', 'fields', 'formTitle', 'highlightColor', 'listName', 'loadingMessage', 'prefill', 'siteUrl']);
    Object.keys(schema.properties).forEach((k) => expect(schema.properties[k].type).toBe('string'));
  });

  it('wires the agent to this component with static tool discovery', () => {
    const agent = readJson('config/copilot-agent.json') as Record<string, unknown>;
    expect(JSON.stringify(agent)).toContain(COPILOT_ID);
    expect(JSON.stringify(agent)).toContain('static');
  });

  it('uses the publisher@contoso.com contact email', () => {
    const plugin = readJson('copilot/ai-plugin.json') as Record<string, unknown>;
    expect(plugin.contact_email).toBe('publisher@contoso.com');
  });

  it('tells the model never to claim it submitted or to echo answers', () => {
    const instructions = read('copilot/instruction.txt').toLowerCase();
    expect(instructions).toContain('never');
    expect(instructions).toContain('submit');
    expect(instructions).toContain('has not been prefilled');
    expect(instructions).toContain("couldn't open");
    const tool = read('src/copilotComponents/wizardForm/WizardFormCopilotComponent.manifest.json').toLowerCase();
    const plugin = read('copilot/ai-plugin.json').toLowerCase();
    expect(tool).toContain('do not say the form was opened or prefilled unless the status message says so');
    expect(plugin).toContain('do not say the form was opened or prefilled unless the status message says so');
  });

  it('uses generic conversation starters and never mentions IT Requests', () => {
    const agent = readJson('copilot/declarativeAgent.json') as { conversation_starters: { title: string; text: string }[] };
    const starters = agent.conversation_starters;
    expect(starters.map((s) => s.text)).toEqual([
      'Open a list form',
      'Help me fill in a SharePoint list form',
      'Show me the guided form'
    ]);
    const body = JSON.stringify(agent);
    expect(body).not.toMatch(/IT Requests/i);
    starters.forEach((s) => {
      expect(`${s.title} ${s.text}`).not.toMatch(/IT Requests/i);
    });
  });

  it('tells the model to reuse siteUrl and listName from model context', () => {
    const instructions = read('copilot/instruction.txt').toLowerCase();
    expect(instructions).toContain('model context');
    expect(instructions).toContain('siteurl');
    expect(instructions).toContain('listname');
    expect(instructions).toContain('reopen the same list');
  });

  it('does not use IT Requests as a listName example, and tells the model never to invent a list', () => {
    const schema = read('src/copilotComponents/wizardForm/WizardFormCopilotComponentProperties.ts');
    expect(schema).not.toMatch(/IT Requests/);
    expect(schema).toMatch(/typed that exact list name/i);
    expect(schema).toMatch(/Omit if they did not name a list/i);
    const instructions = read('copilot/instruction.txt').toLowerCase();
    expect(instructions).toContain('call open_step_by_step_form with no arguments');
    expect(instructions).toContain('never invent');
    expect(instructions).toContain('show me the guided form');
    expect(instructions).toContain('never claim that the form is loading');
    expect(instructions).toContain('say only that the person can select their sharepoint site and list in the guided form');
    const plugin = read('copilot/ai-plugin.json').toLowerCase();
    const tool = read('src/copilotComponents/wizardForm/WizardFormCopilotComponent.manifest.json').toLowerCase();
    expect(plugin).toContain('call the tool with no arguments');
    expect(plugin).toContain('never invent a list name');
    expect(tool).toContain('call with no arguments');
    expect(tool).toContain('never invent a list name');
    expect(instructions).toContain('select their sharepoint site and list in the guided form');
  });

  it('is named Guided Form in user-facing manifests and does not say Typeform', () => {
    const files = [
      'copilot/manifest.json',
      'copilot/declarativeAgent.json',
      'copilot/ai-plugin.json',
      'copilot/instruction.txt',
      'config/package-solution.json',
      'config/copilot-agent.json',
      'src/webparts/wizardForm/WizardFormWebPart.manifest.json'
    ];
    files.forEach((p) => {
      const body = read(p);
      expect(body).toMatch(/Guided Form/);
      expect(body).not.toMatch(/Typeform/i);
      expect(body).not.toMatch(/Microsoft Forms/i);
    });
    const agent = readJson('copilot/declarativeAgent.json') as { name: string };
    expect(agent.name).toBe('Guided Form');
  });

  it('carries no leftover employer branding', () => {

    ['copilot/manifest.json', 'copilot/declarativeAgent.json', 'copilot/ai-plugin.json', 'copilot/instruction.txt', 'config/package-solution.json', 'src/webparts/wizardForm/WizardFormWebPart.manifest.json'].forEach((p) => {
      expect(read(p)).not.toMatch(/business sweden|business-sweden|#03274a/i);
    });
  });
});

describe('agent icons', () => {
  const readBytes = (p: string): number[] => {
    const file = (fs as unknown as { readFileSync(path: string): { length: number; [i: number]: number } }).readFileSync(path.join(root, p));
    const out: number[] = [];
    for (let i = 0; i < file.length; i++) {
      out.push(file[i]);
    }
    return out;
  };
  const u32 = (b: number[], i: number): number => ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
  const pngSize = (p: string): { width: number; height: number } => {
    const b = readBytes(p);
    expect(b.slice(0, 8)).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    return { width: u32(b, 16), height: u32(b, 20) };
  };

  it('ships color 192 and outline 32 PNGs that match the custom tile', () => {
    const icons = (readJson('copilot/manifest.json') as { icons: { color: string; outline: string }; accentColor: string }).icons;
    expect(icons.color).toBe('color.png');
    expect(icons.outline).toBe('outline.png');
    expect(pngSize('copilot/color.png')).toEqual({ width: 192, height: 192 });
    expect(pngSize('copilot/outline.png')).toEqual({ width: 32, height: 32 });
    expect((readJson('copilot/manifest.json') as { accentColor: string }).accentColor).toBe('#183A35');
  });
});
