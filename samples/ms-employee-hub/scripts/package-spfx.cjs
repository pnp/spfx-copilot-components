const {execFileSync} = require('node:child_process');
const {copyFile, mkdir, mkdtemp, rm, symlink, unlink} = require('node:fs/promises');
const path = require('node:path');

// The SPFx rig embeds every visible file under teams/. Run its unmodified package phase
// against the real build outputs, with only the generated agent ZIP in its teams input.
async function packageSolution(root, production, flags) {
  const temp = path.join(root, 'temp');
  await mkdir(temp, {recursive: true});
  const stage = await mkdtemp(path.join(temp, 'spfx-package-'));
  const links = [];
  try {
    await mkdir(path.join(stage, 'config'));
    await mkdir(path.join(stage, 'teams'));
    await mkdir(path.join(root, 'sharepoint'), {recursive: true});
    for (const file of ['package.json', 'config/rig.json', 'config/package-solution.json', 'teams/employee-hub.zip'])
      await copyFile(path.join(root, file), path.join(stage, file));
    for (const dir of ['node_modules', 'sharepoint', 'review', production ? 'release' : 'dist']) {
      const link = path.join(stage, dir);
      await symlink(path.join(root, dir), link, process.platform === 'win32' ? 'junction' : 'dir');
      links.push(link);
    }
    const heft = path.join(root, 'node_modules', '@rushstack', 'heft', 'bin', 'heft');
    execFileSync(process.execPath, [heft, 'package-solution', ...(production ? ['--production'] : []), ...flags], {cwd: stage, stdio: 'inherit'});
  } finally {
    for (const link of links) await unlink(link);
    await rm(stage, {recursive: true, force: true});
  }
}

module.exports = class IsolatedSolutionPackage {
  apply(task, config) {
    task.hooks.run.tapPromise('isolated-solution-package', () => {
      const flags = ['--pretty-print-xml', '--no-spppkg'].filter(name => task.parameters.getFlagParameter(name).value);
      return packageSolution(config.buildFolderPath, task.parameters.production, flags);
    });
  }
};
