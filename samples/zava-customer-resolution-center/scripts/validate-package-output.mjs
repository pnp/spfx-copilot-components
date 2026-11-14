import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import unzipper from "unzipper";
const root = path.resolve(import.meta.dirname, "..");
const packageConfig = JSON.parse(
  fs.readFileSync(path.join(root, "config", "package-solution.json"), "utf8"),
);
const packagePath = path.join(
  root,
  "sharepoint",
  packageConfig.paths.zippedPackage,
);
if (!fs.existsSync(packagePath))
  throw new Error(`Package missing: ${packagePath}`);
const archive = await unzipper.Open.file(packagePath);
const js = archive.files.filter((entry) =>
  /ClientSideAssets\/.*\.js$/i.test(entry.path),
);
const agents = archive.files.filter((entry) =>
  /ClientSideAssets\/.*\.zip$/i.test(entry.path),
);
const media = archive.files.filter((entry) =>
  /ClientSideAssets\/.*\.(?:jpg|jpeg|png|webp)$/i.test(entry.path),
);
const stale = js.filter((entry) => !/_[a-f0-9]{8,}\.js$/i.test(entry.path));
const assert = (value, message) => {
  if (!value) throw new Error(message);
};
assert(
  packageConfig.solution.version === "1.0.0.3",
  `Expected SPFx solution version 1.0.0.3, received ${packageConfig.solution.version}.`,
);
assert(
  packageConfig.solution.features?.[0]?.version === "1.0.0.3",
  `Expected SPFx feature version 1.0.0.3, received ${packageConfig.solution.features?.[0]?.version}.`,
);
assert(
  js.length === 1,
  `Expected one shared production JS file, received ${js.length}.`,
);
assert(
  stale.length === 0,
  `Stale JS found: ${stale.map((item) => item.path).join(", ")}`,
);
assert(
  agents.length === 1 &&
    agents[0].path.endsWith("/zava-customer-resolution.zip"),
  `Expected one current agent ZIP, found ${agents.map((item) => item.path).join(", ")}`,
);
assert(
  media.length === 5,
  `Expected five packaged persona assets, received ${media.length}.`,
);
const hashes = await Promise.all(
  media.map(async (entry) =>
    crypto
      .createHash("sha256")
      .update(await entry.buffer())
      .digest("hex"),
  ),
);
const expected = new Set(
  JSON.parse(
    fs.readFileSync(path.join(root, "assets", "asset-provenance.json"), "utf8"),
  ).assets.map((item) => item.sha256),
);
assert(
  new Set(hashes).size === media.length,
  "Duplicate packaged media found.",
);
assert(
  hashes.every((hash) => expected.has(hash)),
  "Packaged media does not match provenance.",
);
const sizes = js.map((entry) => entry.uncompressedSize || 0);
const report = {
  spfxSolutionVersion: packageConfig.solution.version,
  packageBytes: fs.statSync(packagePath).size,
  productionJavaScriptFiles: js.length,
  totalJavaScriptBytes: sizes.reduce((sum, size) => sum + size, 0),
  largestJavaScriptBytes: Math.max(...sizes),
  embeddedAgentPackages: agents.length,
  packagedMedia: media.length,
  duplicateMedia: 0,
  staleJavaScript: 0,
  sharedBundle: true,
};
if (report.packageBytes > 10 * 1024 * 1024) report.packageInvestigation = true;
if (report.largestJavaScriptBytes > 1024 * 1024)
  report.javascriptInvestigation = true;
console.log(JSON.stringify(report));
