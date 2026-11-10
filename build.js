#!/usr/bin/env node

/**
 * Build script for Nuvio BDIX Providers
 * Bundles ES modules from src/ into standalone providers/ for NuvioTV (QuickJS runtime).
 * Output is IIFE format — no CommonJS module dependency, registers directly on globalThis.
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const outDir = path.join(__dirname, 'providers');

const PROVIDERS = [
  { name: 'circleftp', entry: path.join(srcDir, 'circleftp', 'index.js') },
  { name: 'dflixlive', entry: path.join(srcDir, 'dflixlive', 'index.js') },
  { name: 'bdix', entry: path.join(srcDir, 'bdix', 'index.js') }
];

async function buildProvider(provider) {
  const outFile = path.join(outDir, `${provider.name}.js`);

  try {
    await esbuild.build({
      entryPoints: [provider.entry],
      bundle: true,
      outfile: outFile,
      format: 'iife',
      globalName: '__NuvioProvider__',
      platform: 'neutral',
      target: 'es2016', // Lowers async/await to generators for Hermes & QuickJS compatibility
      minify: false,
      sourcemap: false,
      banner: {
        js: `/**\n * ${provider.name} - Nuvio Provider (BDIX / NuvioTV)\n * Generated: ${new Date().toISOString()}\n */`
      },
      footer: {
        js: [
          '',
          '// Universal export for CommonJS (Nuvio) and global (QuickJS / TV sandboxes)',
          'if (typeof module !== "undefined" && module.exports) {',
          '  module.exports = {',
          '    getStreams: typeof __NuvioProvider__ !== "undefined" ? __NuvioProvider__.getStreams : undefined,',
          '    onSettings: typeof __NuvioProvider__ !== "undefined" ? __NuvioProvider__.onSettings : undefined',
          '  };',
          '}',
          'if (typeof globalThis !== "undefined" && typeof __NuvioProvider__ !== "undefined") {',
          '  globalThis.getStreams = __NuvioProvider__.getStreams;',
          '  globalThis.onSettings = __NuvioProvider__.onSettings;',
          '}',
          'if (typeof global !== "undefined" && typeof __NuvioProvider__ !== "undefined") {',
          '  global.getStreams = __NuvioProvider__.getStreams;',
          '  global.onSettings = __NuvioProvider__.onSettings;',
          '}',
          'if (typeof self !== "undefined" && typeof __NuvioProvider__ !== "undefined") {',
          '  self.getStreams = __NuvioProvider__.getStreams;',
          '  self.onSettings = __NuvioProvider__.onSettings;',
          '}'
        ].join('\n')
      },
      logLevel: 'info'
    });

    const stats = fs.statSync(outFile);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`✓ providers/${provider.name}.js (${sizeKB} KB)`);
    return true;
  } catch (err) {
    console.error(`✗ Failed to build ${provider.name}:`, err.message);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`\n📦 Building Nuvio BDIX Providers...\n`);

  let count = 0;
  for (const p of PROVIDERS) {
    if (fs.existsSync(p.entry)) {
      const ok = await buildProvider(p);
      if (ok) count++;
    } else {
      console.warn(`⚠️ Entry not found: ${p.entry}`);
    }
  }

  console.log(`\n🎉 Successfully built ${count} provider(s) into providers/\n`);
}

main().catch(err => {
  console.error('Build process failed:', err);
  process.exit(1);
});
