// Test-only: a permissive stand-in for the Microsoft-internal packages (@msinternal/*, 1P MSAL) that
// the SPFx runtime requires but that are not published on npm. Every property is another stub that is
// callable and constructible; nothing is a thenable, so awaiting a stub doesn't hang. Plain CommonJS:
// it is loaded by Node's own require from inside node_modules (see setup.ts).

'use strict';

function createStub(name) {
  const target = function stub() {
    /* no-op */
  };
  const cache = {};
  return new Proxy(target, {
    get(t, prop) {
      if (typeof prop === 'symbol') {
        return t[prop];
      }
      if (prop === 'then') {
        return undefined;
      }
      if (prop === '__esModule') {
        return true;
      }
      if (prop === 'prototype') {
        return t.prototype;
      }
      if (!(prop in cache)) {
        cache[prop] = createStub(`${name}.${prop}`);
      }
      return cache[prop];
    },
    apply() {
      return createStub(`${name}()`);
    },
    construct() {
      return createStub(`new ${name}`);
    }
  });
}

module.exports = createStub('msinternal');
