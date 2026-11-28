const fs = require('node:fs');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://local.invalid' });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.IS_REACT_ACT_ENVIRONMENT = true;
const React = require('react');
const { createRoot } = require('react-dom/client');
const scopes = [];
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = (mod, file) => {
    mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      fileName: file, compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true }
    }).outputText, file);
  };
}
require.extensions['.scss'] = mod => { mod.exports = { tech: 'tech-test' }; };
const service = require('../src/shared/mockData/technology.ts');
const Tech = require('../src/shared/tech/Tech.tsx').default;
const { ScopeReporter } = require('../src/hosts/VisibleScope.tsx');
const report = data => { scopes.push(data); };
function session(id = 'fixture-employee', reviewer = false, memory = new Map(), instant = '2026-03-08T19:30:00Z') {
  return { now: new Date(instant), actor: { id, displayName: 'Alex Lane', reviewer, planner: false, commercial: false }, memory };
}
function mount(id, s = session(), inputs = {}) {
  const el = document.createElement('div'); document.body.appendChild(el);
  const root = createRoot(el);
  let props = { id, session: s, inputs, mode: 'inline', navigate: (next, args = {}) => draw({ id: next, inputs: args }) };
  function draw(patch = {}) { props = { ...props, ...patch }; React.act(() => { root.render(React.createElement(ScopeReporter.Provider, { value: report }, React.createElement(Tech, props))); }); }
  draw();
  return {
    el, draw,
    text: () => el.textContent,
    click(label) {
      const b = Array.from(el.querySelectorAll('button')).find(b => b.textContent.trim() === label || b.getAttribute('aria-label') === label);
      if (!b) throw new Error(`Missing button: ${label}`);
      React.act(() => b.click());
    },
    field(label, value) {
      const entry = Array.from(el.querySelectorAll('label')).find(l => l.firstChild?.textContent === label);
      const control = entry?.querySelector('textarea,select,input');
      if (!control) throw new Error(`Missing field: ${label}`);
      React.act(() => {
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(control), 'value').set.call(control, value);
        control.dispatchEvent(new dom.window.Event(control.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
      });
    },
    close() { React.act(() => root.unmount()); el.remove(); }
  };
}
module.exports = { service, scopes, session, mount };
