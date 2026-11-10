/**
 * Utility functions for BDIX scraping and Nuvio provider formatting.
 */

/**
 * Remove noise, punctuation, brackets, and parenthesized metadata from title.
 */
export function cleanTitle(title) {
  if (!title || typeof title !== 'string') return '';
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, '')          // remove (2009), (TV Series...), etc.
    .replace(/\[.*?\]/g, '')          // remove [Dual Audio], [1080p], etc.
    .replace(/[^a-z0-9\s]/g, ' ')     // replace punctuation with space
    .replace(/\s+/g, ' ')             // collapse spaces
    .trim();
}

/**
 * Check if a candidate title matches the searched query title.
 */
export function titlesMatch(candidate, query) {
  if (!candidate || !query) return false;
  const c = cleanTitle(candidate);
  const q = cleanTitle(query);

  if (c === q) return true;

  const cWords = c.split(' ').filter(Boolean);
  const qWords = q.split(' ').filter(Boolean);

  if (qWords.length === 0 || cWords.length === 0) return false;

  // Single-word search: must match exactly first word
  if (qWords.length === 1) {
    if (cWords[0] === qWords[0]) {
      // allow editions like "avatar extended", but not "avatar the last airbender"
      if (cWords.length === 1) return true;
      const allowedNext = ['extended', 'remastered', 'unrated', 'special', 'directors'];
      if (allowedNext.includes(cWords[1])) return true;
    }
    return false;
  }

  // Prefix match (e.g. "dune part two" matches "dune part two bonus")
  if (c.startsWith(q) || q.startsWith(c)) {
    return true;
  }

  // Check if all query words are in candidate
  const allInCandidate = qWords.every(w => cWords.includes(w));
  if (allInCandidate && Math.abs(cWords.length - qWords.length) <= 3) {
    return true;
  }

  return false;
}

/**
 * Extract 4-digit release year from a string or number.
 */
export function extractYear(str) {
  if (!str) return null;
  const m = String(str).match(/\b(19\d{2}|20\d{2})\b/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Normalize resolution label for Nuvio.
 */
export function extractQuality(str) {
  if (!str) return '1080p';
  const low = String(str).toLowerCase();
  if (low.includes('2160p') || low.includes('4k') || low.includes('uhd')) return '4K';
  if (low.includes('1080p') || low.includes('fhd')) return '1080p';
  if (low.includes('720p') || low.includes('hd')) return '720p';
  if (low.includes('480p')) return '480p';
  if (low.includes('360p')) return '360p';
  return '1080p';
}

/**
 * Extract episode number from an episode title or filename string.
 */
export function extractEpisodeNumber(title) {
  if (!title) return null;
  // Match S01E05, S1.E5, S1.Episode:5, Episode 5, Ep 5, E05
  let m = title.match(/S:?\d+[\.:\s]*E(?:pisode)?:?(\d+)/i);
  if (!m) m = title.match(/Episode[:\s]*(\d+)/i);
  if (!m) m = title.match(/\bEp[:\s]*(\d+)\b/i);
  if (!m) m = title.match(/\bE(\d+)\b/i);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Extract season number from seasonName or filename string.
 */
export function extractSeasonNumber(seasonName) {
  if (!seasonName) return null;
  const m = String(seasonName).match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

/**
 * Safe fetch with configurable timeout and abort controller.
 * Compatible with both Nuvio Mobile (Hermes) and NuvioTV (QuickJS) runtimes.
 */
export async function safeFetch(url, options = {}, timeoutMs = 10000) {
  const hasAbort = typeof AbortController !== 'undefined';
  const controller = hasAbort ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const fetchOptions = {
      ...options,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...(options.headers || {})
      },
      skipSizeCheck: true // Nuvio sandbox flag (ignored on TV if unsupported)
    };

    if (controller) {
      fetchOptions.signal = controller.signal;
    }

    // If no AbortController available (some TV runtimes), use Promise.race as fallback
    if (!controller) {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout')), timeoutMs)
      );
      return await Promise.race([fetch(url, fetchOptions), timeoutPromise]);
    }

    return await fetch(url, fetchOptions);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
