#!/usr/bin/env node
/**
 * `npm run capture:fixtures` — rewrites the SharePoint fixture the local tests
 * load, from what the tenant actually returns (todo.md 8.9 N4).
 * `npm run check:fixtures` — the same capture, compared with the committed
 * fixture instead of written; exits 1 on drift. Neither is part of
 * `npm run build` (R19: capture and verification are separate, and loop 1
 * stays offline).
 *
 * It runs the shipped store against the library in tenant.local.json over a
 * recording connection: initializeAsync() (content types, field links,
 * department choices), save() of one invoice and one expense report, then
 * getRecent() for their item shape. The two files are recycled at the end,
 * pass or fail. See tenant-tests/fixtures.mjs for what is kept and what is
 * scrubbed.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { COMPONENT_ROOT } from '../tenant-tests/config.mjs';
import { compileShippedOrExit, configOrExit, newRunId, signInOrExit } from '../tenant-tests/prepare.mjs';
import { createAdapter, shipped } from '../tenant-tests/stores/sharepoint.mjs';
import { FIXTURE_DOCUMENT_DATE, Recorder, buildFixture, classify, driftBetween, leaksIn } from '../tenant-tests/fixtures.mjs';

const COMMAND = process.argv.includes('--check') ? 'check:fixtures' : 'capture:fixtures';
const CHECK = COMMAND === 'check:fixtures';
const FIXTURE = join(
  COMPONENT_ROOT, 'src', 'copilotComponents', 'fileUploader', 'services', '__fixtures__', 'sharepoint-tenant.json'
);

const config = configOrExit(COMMAND);
compileShippedOrExit(COMMAND);
const identity = await signInOrExit(COMMAND, config);
const run = newRunId();

const adapter = await createAdapter(config);
const { formatReceiptNumber } = await shipped();
const log = [];
const store = adapter.createStore({ behaviors: [Recorder(log)] });

const files = {
  [`capture-${run}-invoice.pdf`]: 'captured-invoice.pdf',
  [`capture-${run}-expense-report.pdf`]: 'captured-expense-report.pdf'
};
const [invoiceName, expenseName] = Object.keys(files);

console.log(`\n${COMMAND} — ${config.sharepoint.siteUrl} / ${config.sharepoint.libraryName}, as ${identity}, run ${run}`);

let fixture;
try {
  await store.initializeAsync();
  const me = await adapter.sp.web.currentUser.select('Email', 'Title')();
  const owner = config.filingUsers[0] || me.Email;

  // Fixed content, so File.Length does not change between captures.
  const blob = () => new Blob(['%PDF-1.4\n% Document Intake fixture capture\n'], { type: 'application/pdf' });
  const draft = (name, kind, extra) => ({
    id: name,
    file: { name, sizeBytes: blob().size, contentType: 'application/pdf', blob: blob() },
    documentKind: kind,
    department: 'programs',
    documentDate: FIXTURE_DOCUMENT_DATE,
    amount: 1284.5,
    status: kind === 'invoice' ? 'received' : 'pendingReview',
    prefilled: [],
    ...extra
  });
  await store.save(
    [draft(invoiceName, 'invoice', { vendor: 'Capture Vendor Ltd' }), draft(expenseName, 'expenseReport', { owner })],
    new Date()
  );
  await store.getRecent({ period: '7d' }, new Date());

  const statusField = await adapter.sp.web.fields.getByInternalNameOrTitle('FilingStatus').select('Choices')();
  fixture = buildFixture({
    recorded: classify(log),
    statusChoices: statusField.Choices,
    ownFiles: files,
    formatReceiptNumber,
    source: {
      capturedBy: 'scripts/capture-tenant-fixtures.mjs',
      capturedOn: new Date().toISOString().slice(0, 10),
      pnpjs: createRequire(import.meta.url)('@pnp/sp/package.json').version
    }
  });

  const site = new URL(config.sharepoint.siteUrl);
  const leaks = leaksIn(fixture, [
    ['the tenant host', site.host],
    ['the tenant name', site.host.split('.')[0]],
    ['the site path', site.pathname.replace(/\/+$/, '')],
    ['the tenant id', config.tenantId],
    ['the client id', config.clientId],
    ['the report owner', owner],
    ['your email', me.Email],
    ['your name', me.Title],
    ['the run id', run],
    ...config.filingUsers.map(u => ['a filing user', u])
  ]);
  if (leaks.length > 0) {
    throw new Error(
      `Refusing to write the fixture. It still contains:\n  - ${leaks.join('\n  - ')}\n` +
        'Scrub (or drop) those paths in buildFixture(), tenant-tests/fixtures.mjs.'
    );
  }
} finally {
  for (const name of Object.keys(files)) {
    try {
      await adapter.recycleByFileName(name);
    } catch (e) {
      console.error(`Could not recycle ${name}; remove it by hand (${e.message}).`);
    }
  }
}

const text = JSON.stringify(fixture, null, 2) + '\n';
if (CHECK) {
  if (!existsSync(FIXTURE)) {
    console.error(`No committed fixture at ${FIXTURE}; run npm run capture:fixtures.`);
    process.exit(1);
  }
  const committed = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  const drift = driftBetween(committed, fixture);
  if (drift.length > 0) {
    console.error(`The tenant has drifted from the committed fixture (${committed.$source?.capturedBy}):\n  ${drift.join('\n  ')}`);
    console.error('If the tenant is right, npm run capture:fixtures and review the diff; if not, fix the tenant.');
    process.exit(1);
  }
  console.log('No drift: the tenant still returns what the committed fixture says.');
} else {
  writeFileSync(FIXTURE, text);
  console.log(`Wrote ${FIXTURE}. Review the diff, then run heft test: the local fakes now load it.`);
}
