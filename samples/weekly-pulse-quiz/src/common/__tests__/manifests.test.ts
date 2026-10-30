import propertiesSchema from '../../copilotComponents/weeklyPulseQuiz/WeeklyPulseQuizCopilotComponentProperties';

// Node built-ins without @types/node (the SPFx tsconfig is browser-only).
declare const require: (id: string) => unknown;
const fs = require('fs') as { readFileSync(p: string, enc: string): string };
const path = require('path') as { join(...parts: string[]): string };
const root = (process as unknown as { cwd(): string }).cwd();
const readJson = (p: string): Record<string, unknown> => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8').replace(/^\uFEFF/, ''));
const readJsonc = (p: string): Record<string, unknown> =>
  JSON.parse(fs.readFileSync(path.join(root, p), 'utf8').replace(/^\s*\/\/.*$/gm, ''));

describe('solution and Copilot manifests', () => {
  it('requests no API permissions', () => {
    const pkg = readJson('config/package-solution.json') as { solution: Record<string, unknown> };
    expect(pkg.solution.webApiPermissionRequests === undefined || (pkg.solution.webApiPermissionRequests as unknown[]).length === 0).toBe(true);
    expect(pkg.solution.version).toBe('1.0.0.0');
  });

  it('is a web part only, not a full-page app', () => {
    const raw = fs.readFileSync(path.join(root, 'src/webparts/weeklyPulseQuiz/WeeklyPulseQuizWebPart.manifest.json'), 'utf8');
    const hosts = /"supportedHosts"\s*:\s*\[([^\]]*)\]/.exec(raw);
    expect(hosts).not.toBeNull();
    expect((hosts as RegExpExecArray)[1].replace(/\s/g, '')).toBe('"SharePointWebPart"');
    expect(raw).not.toContain('SharePointFullPage');
  });

  it('declares one Copilot tool, show_weekly_quiz, with no required arguments', () => {
    const manifest = readJsonc('src/copilotComponents/weeklyPulseQuiz/WeeklyPulseQuizCopilotComponent.manifest.json');
    expect(JSON.stringify(manifest)).toContain('show_weekly_quiz');
    const schema = propertiesSchema as unknown as { type: string; required?: string[]; properties: Record<string, unknown> };
    expect(schema.type).toBe('object');
    expect(schema.required === undefined || schema.required.length === 0).toBe(true);
    expect(Object.keys(schema.properties).sort()).toEqual(['questionsListTitle', 'siteUrl']);
  });

  it('uses static tool discovery and the neutral Fluent accent colour for the app', () => {
    const agent = readJson('config/copilot-agent.json') as { agents: { toolDiscovery: string }[] };
    expect(agent.agents[0].toolDiscovery).toBe('static');
    const app = readJson('copilot/manifest.json');
    expect(app.manifestVersion).toBe('1.29');
    expect(app.accentColor).toBe('#0F6CBD');
  });

  it('wires the agent action id to the plugin namespace (like the Form app)', () => {
    const agent = readJson('copilot/declarativeAgent.json') as { actions: { id: string }[] };
    const plugin = readJson('copilot/ai-plugin.json') as { namespace: string };
    expect(agent.actions[0].id).toBe(plugin.namespace);
  });

  it('agent instructions never echo the answer in chat', () => {
    expect(fs.readFileSync(path.join(root, 'copilot/instruction.txt'), 'utf8')).toMatch(/never/i);
  });
});
