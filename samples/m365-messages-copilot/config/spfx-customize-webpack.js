
'use strict';

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

module.exports = function (webpackConfig) {
  webpackConfig.module.rules.push({
    test: /\.mjs$/,
    resolve: {
      fullySpecified: false
    }
  });

  const sandboxProxyPath = path.resolve(
    __dirname,
    '..',
    'src',
    'assets',
    'sandbox_proxy.js'
  );

  webpackConfig.plugins.push({
    apply(compiler) {
      compiler.hooks.thisCompilation.tap('EmitMcpSandboxProxy', (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: 'EmitMcpSandboxProxy',
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
          },
          () => {
            const content = fs.readFileSync(sandboxProxyPath, 'utf-8');
            compilation.emitAsset(
              'sandbox_proxy.js',
              new webpack.sources.RawSource(content)
            );
          }
        );
      });
    }
  });
};