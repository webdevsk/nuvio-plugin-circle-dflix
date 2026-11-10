/**
 * Test runner for Nuvio BDIX Providers
 * Runs end-to-end tests using the bundled IIFE files in providers/
 * Simulates NuvioTV's QuickJS eval() context by executing scripts and reading globalThis.
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadProvider(filename) {
  const code = fs.readFileSync(path.join(__dirname, 'providers', filename), 'utf-8');
  const context = vm.createContext({
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
    ReferenceError,
  });
  vm.runInContext(code, context);
  return {
    getStreams: context.globalThis.getStreams,
    onSettings: context.globalThis.onSettings,
  };
}

const circleftp = loadProvider('circleftp.js');
const dflixlive = loadProvider('dflixlive.js');
const bdix = loadProvider('bdix.js');

function validateStreamObject(stream, providerName) {
  const issues = [];
  if (!stream || typeof stream !== 'object') {
    return ['Stream is not an object'];
  }
  if (typeof stream.name !== 'string' || !stream.name) issues.push('Missing/invalid "name"');
  if (typeof stream.title !== 'string' || !stream.title) issues.push('Missing/invalid "title"');
  if (typeof stream.url !== 'string' || !stream.url.startsWith('http')) issues.push('Missing/invalid "url"');
  if (typeof stream.quality !== 'string' || !stream.quality) issues.push('Missing/invalid "quality"');

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

async function runTest(label, fn) {
  console.log(`\n========================================`);
  console.log(`▶ Testing: ${label}`);
  console.log(`========================================`);
  const start = Date.now();
  try {
    const streams = await fn();
    const duration = Date.now() - start;

    console.log(`⏱️ Duration: ${duration}ms | Found: ${streams.length} stream(s)`);

    if (streams.length === 0) {
      console.log(`⚠️ Warning: No streams returned.`);
      return false;
    }

    let valid = true;
    for (let i = 0; i < streams.length; i++) {
      const s = streams[i];
      const issues = validateStreamObject(s);
      if (issues.length > 0) {
        console.error(`✗ Stream #${i + 1} validation failed:`, issues);
        valid = false;
      }
    }

    if (valid) {
      console.log(`✓ All ${streams.length} streams passed Nuvio specification schema!`);
      // Print first 2 streams as samples
      console.log(`\nSample Stream(s):`);
      for (const sample of streams.slice(0, 2)) {
        console.log(`  - Title:   ${sample.title}`);
        console.log(`    Quality: ${sample.quality}`);
        console.log(`    URL:     ${sample.url.slice(0, 80)}...`);
        if (sample.subtitles && sample.subtitles.length > 0) {
          console.log(`    Subs:    ${sample.subtitles.length} subtitle(s)`);
        }
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

  // Test 1: Circle FTP Movie (Avatar - TMDB 19995)
  await runTest('Circle FTP: Movie (Avatar)', async () => {
    return await circleftp.getStreams('19995', 'movie');
  });

  // Test 2: Circle FTP TV Series (Breaking Bad S01E01 - TMDB 1396)
  await runTest('Circle FTP: Series (Breaking Bad S01E01)', async () => {
    return await circleftp.getStreams('1396', 'tv', 1, 1);
  });

  // Test 3: DFLIX.live Movie (Avatar - TMDB 19995)
  await runTest('DFLIX.live: Movie (Avatar)', async () => {
    return await dflixlive.getStreams('19995', 'movie');
  });

  // Test 4: DFLIX.live TV Series (Breaking Bad S01E01 - TMDB 1396)
  await runTest('DFLIX.live: Series (Breaking Bad S01E01)', async () => {
    return await dflixlive.getStreams('1396', 'tv', 1, 1);
  });

  // Test 5: BDIX Combined Aggregator (Oppenheimer - TMDB 872585)
  await runTest('BDIX Aggregator: Movie (Oppenheimer)', async () => {
    return await bdix.getStreams('872585', 'movie');
  });

  console.log(`\n🎉 Test suite execution finished.\n`);
}

main().catch(console.error);
