#!/usr/bin/env node

/**
 * Build script for Nuvio BDIX Providers
 * Bundles ES modules from src/ into standalone providers/ compatible with Hermes & React Native.
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
      format: 'cjs',
      platform: 'neutral',
      target: 'es2020', // Native async/await for both Hermes (mobile) and QuickJS (TV)
      minify: false,
      sourcemap: false,
      banner: {
        js: `/**\n * ${provider.name} - Nuvio Provider (BDIX)\n * Generated: ${new Date().toISOString()}\n */`
      },
      footer: {
        js: `\nif (typeof globalThis !== 'undefined' && typeof module !== 'undefined' && module.exports) {\n  globalThis.getStreams = module.exports.getStreams;\n  globalThis.onSettings = module.exports.onSettings;\n}`
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
