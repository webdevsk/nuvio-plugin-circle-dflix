/**
 * Comprehensive Test Runner for Nuvio BDIX Providers
 * Tests:
 * 1. CommonJS require() loader compatibility
 * 2. Sandboxed QuickJS / eval() loader compatibility
 * 3. Exact TMDB 603 (The Matrix) movie test (as executed by Nuvio provider test)
 * 4. Object TMDB ID test ({ id: 603 })
 * 5. TV Series with 'series' mediaType (Breaking Bad)
 * 6. Schema validation (name, title, url, quality, type, provider)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Test 1: Verify CommonJS export
const circleftpCJS = require('./providers/circleftp.js');
const dflixliveCJS = require('./providers/dflixlive.js');
const bdixCJS = require('./providers/bdix.js');

// Test 2: QuickJS sandbox loader (eval without module)
function loadProviderSandbox(filename) {
  const code = fs.readFileSync(path.join(__dirname, 'providers', filename), 'utf-8');
  const sandbox = {
    globalThis: {},
    console,
    fetch: globalThis.fetch,
    setTimeout,
    clearTimeout,
    AbortController: typeof AbortController !== 'undefined' ? AbortController : undefined,
    Promise,
    Object,
    Array,
    Set,
    Math,
    String,
    Number,
    parseInt,
    isNaN,
    encodeURIComponent,
    Error,
    TypeError,
    ReferenceError
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(code, context);
  return {
    getStreams: context.globalThis.getStreams,
    onSettings: context.globalThis.onSettings
  };
}

const circleftpSandbox = loadProviderSandbox('circleftp.js');
const dflixliveSandbox = loadProviderSandbox('dflixlive.js');
const bdixSandbox = loadProviderSandbox('bdix.js');

function validateStreamObject(stream, expectedProvider) {
  const issues = [];
  if (!stream || typeof stream !== 'object') {
    return ['Stream is not an object'];
  }
  if (typeof stream.name !== 'string' || !stream.name) issues.push('Missing/invalid "name"');
  if (typeof stream.title !== 'string' || !stream.title) issues.push('Missing/invalid "title"');
  if (typeof stream.url !== 'string' || !stream.url.startsWith('http')) issues.push('Missing/invalid "url"');
  if (typeof stream.quality !== 'string' || !stream.quality) issues.push('Missing/invalid "quality"');
  if (typeof stream.type !== 'string' || !stream.type) issues.push('Missing/invalid "type"');
  if (typeof stream.provider !== 'string' || !stream.provider) issues.push('Missing/invalid "provider"');
  if (expectedProvider && stream.provider !== expectedProvider) {
    issues.push(`Stream provider "${stream.provider}" does not match expected "${expectedProvider}"`);
  }

  if (stream.subtitles) {
    if (!Array.isArray(stream.subtitles)) {
      issues.push('"subtitles" must be an array');
    } else {
      for (const sub of stream.subtitles) {
        if (!sub.url || !sub.url.startsWith('http')) issues.push('Invalid subtitle url: ' + sub.url);
      }
    }
  }

  return issues;
}

async function runTest(label, fn, expectedProvider = null) {
  console.log(`\n========================================`);
  console.log(`▶ Testing: ${label}`);
  console.log(`========================================`);
  const start = Date.now();
  try {
    const streams = await fn();
    const duration = Date.now() - start;

    console.log(`⏱️ Duration: ${duration}ms | Found: ${streams.length} stream(s)`);

    if (streams.length === 0) {
      console.error(`✗ Error: 0 streams returned!`);
      return false;
    }

    let valid = true;
    for (let i = 0; i < streams.length; i++) {
      const s = streams[i];
      const issues = validateStreamObject(s, expectedProvider);
      if (issues.length > 0) {
        console.error(`✗ Stream #${i + 1} validation failed:`, issues);
        valid = false;
      }
    }

    if (valid) {
      console.log(`✓ All ${streams.length} stream(s) passed Nuvio specification schema!`);
      for (const sample of streams.slice(0, 2)) {
        console.log(`  - Title:    ${sample.title}`);
        console.log(`    Quality:  ${sample.quality}`);
        console.log(`    Type:     ${sample.type}`);
        console.log(`    Provider: ${sample.provider}`);
        console.log(`    URL:      ${sample.url.slice(0, 80)}...`);
      }
    }
    return valid;
  } catch (err) {
    console.error(`✗ Test failed with exception:`, err);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Nuvio BDIX Scraper Test Suite...\n');

  // Verify export bindings
  console.log('--- Verifying Export Bindings ---');
  console.log('CJS circleftp.getStreams:', typeof circleftpCJS.getStreams === 'function' ? '✓' : '✗');
  console.log('CJS dflixlive.getStreams:', typeof dflixliveCJS.getStreams === 'function' ? '✓' : '✗');
  console.log('CJS bdix.getStreams:     ', typeof bdixCJS.getStreams === 'function' ? '✓' : '✗');
  console.log('Sandbox circleftp.getStreams:', typeof circleftpSandbox.getStreams === 'function' ? '✓' : '✗');
  console.log('Sandbox dflixlive.getStreams:', typeof dflixliveSandbox.getStreams === 'function' ? '✓' : '✗');
  console.log('Sandbox bdix.getStreams:     ', typeof bdixSandbox.getStreams === 'function' ? '✓' : '✗');

  // Test 1: EXACT Nuvio Provider Test: TMDB 603 (movie) on BDIX
  await runTest('Nuvio Provider Test: TMDB 603 (movie) on BDIX Aggregator', async () => {
    return await bdixCJS.getStreams(603, 'movie');
  }, 'bdix');

  // Test 2: QuickJS Sandbox Test: TMDB 603 (movie) on BDIX
  await runTest('QuickJS Sandbox Test: TMDB 603 (movie) on BDIX Aggregator', async () => {
    return await bdixSandbox.getStreams(603, 'movie');
  }, 'bdix');

  // Test 3: Circle FTP: TMDB 603 (The Matrix)
  await runTest('Circle FTP: Movie TMDB 603 (The Matrix)', async () => {
    return await circleftpCJS.getStreams('603', 'movie');
  }, 'circleftp');

  // Test 4: DFLIX.live: TMDB 603 (The Matrix)
  await runTest('DFLIX.live: Movie TMDB 603 (The Matrix)', async () => {
    return await dflixliveCJS.getStreams('603', 'movie');
  }, 'dflixlive');

  // Test 5: Object ID input { id: 603 }
  await runTest('Object Input: { id: 603 } (Android TV signature)', async () => {
    return await bdixCJS.getStreams({ id: 603 }, 'movie');
  }, 'bdix');

  // Test 6: Series with 'series' mediaType (Breaking Bad S01E01 - TMDB 1396)
  await runTest("TV Series with 'series' mediaType: Breaking Bad S01E01", async () => {
    return await bdixCJS.getStreams('1396', 'series', 1, 1);
  }, 'bdix');

  console.log(`\n🎉 Test suite execution finished.\n`);
}

main().catch(console.error);
