import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadScreenshotEvidence(root) {
  const matrices = [
    { name: 'publication-capture-matrix.json', count: 12, source: 'local-ux-review', publication: true },
    { name: 'teams-capture-matrix.json', count: 3, source: 'user-provided-authenticated-teams', publication: true },
    { name: 'gallery-capture-matrix.json', count: 39, source: 'local-ux-review', publication: false }
  ];
  const publication = [];
  const gallery = [];
  const paths = new Set();

  for (const matrix of matrices) {
    const evidence = JSON.parse(readFileSync(resolve(root, 'ux-review/evidence', matrix.name), 'utf8'));
    assert.equal(evidence.captures.length, matrix.count, `${matrix.name}: incorrect capture count`);
    for (const record of evidence.captures) {
      assert.ok(!paths.has(record.path), `Duplicate screenshot evidence: ${record.path}`);
      paths.add(record.path);
      assert.equal(record.source, matrix.source, `${record.path}: incorrect capture provenance`);
      const bytes = readFileSync(resolve(root, record.path));
      assert.ok(bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
        `${record.path}: not a PNG`);
      assert.equal(bytes.length, record.bytes, `${record.path}: stale byte count`);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256, `${record.path}: stale image hash`);
      assert.equal(bytes.readUInt32BE(16), record.width, `${record.path}: stale width`);
      assert.equal(bytes.readUInt32BE(20), record.height, `${record.path}: stale height`);
      assert.ok(record.width >= 640 && record.height >= 200, `${record.path}: collapsed image`);

      if (matrix.source === 'local-ux-review') {
        assert.equal(record.runtimeErrors, 0, `${record.path}: runtime errors during capture`);
        assert.equal(record.geometry.brokenImages, 0, `${record.path}: broken images during capture`);
        assert.equal(record.geometry.viewportWidth, record.viewport.width, `${record.path}: wrong viewport`);
        assert.ok(record.geometry.documentWidth <= record.viewport.width + 2, `${record.path}: document overflow`);
        assert.ok(record.geometry.scrollWidth <= record.geometry.width + 2, `${record.path}: horizontally clipped content`);
        assert.ok(Math.abs(record.width - record.geometry.width) <= 1 && Math.abs(record.height - record.geometry.height) <= 1,
          `${record.path}: image bounds do not match rendered content`);
      } else {
        assert.equal(record.captureMode, 'viewport', `${record.path}: Teams screenshots must be labelled as viewport captures`);
        assert.equal(record.pixelsMatchSource, true, `${record.path}: retained Teams pixels were not verified`);
        assert.ok(['combined', 'company', 'personal'].includes(record.mode), `${record.path}: unknown Teams app`);
        assert.deepEqual(record.crop, { x: 4, y: 4, width: record.sourceWidth - 8, height: record.sourceHeight - 8 },
          `${record.path}: unexpected Teams crop`);
        assert.equal(record.width, record.crop.width, `${record.path}: Teams screenshot was resized`);
        assert.equal(record.height, record.crop.height, `${record.path}: Teams screenshot was resized`);
        assert.match(record.sourceSha256, /^[a-f0-9]{64}$/, `${record.path}: missing original snapshot hash`);
      }
      (matrix.publication ? publication : gallery).push(record);
    }
  }
  return { publication, gallery };
}
