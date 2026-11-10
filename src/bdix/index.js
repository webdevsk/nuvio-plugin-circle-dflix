import { getStreams as getCircleStreams, onSettings as onCircleSettings } from '../circleftp/index.js';
import { getStreams as getDflixStreams, onSettings as onDflixSettings } from '../dflixlive/index.js';

export const PROVIDER_NAME = 'BDIX (Circle + DFLIX)';

/**
 * Aggregated BDIX Stream Resolver for Nuvio
 * Queries Circle FTP and DFLIX.live in parallel and aggregates streams.
 *
 * @param {string|number|object} tmdbId - TMDB ID, IMDB ID, or title string
 * @param {'movie'|'tv'|'series'} mediaType - 'movie', 'tv', or 'series'
 * @param {number|null} season - Season number (1-based, TV only)
 * @param {number|null} episode - Episode number (1-based, TV only)
 * @param {object} userSettings - Scraper settings
 * @returns {Promise<Array<Object>>} Array of Nuvio stream objects
 */
export async function getStreams(tmdbId, mediaType, season = null, episode = null, userSettings = {}) {
  try {
    console.log(`[BDIX Combined] Fetching streams from Circle FTP & DFLIX.live in parallel...`);

    // ES6-compatible allSettled reflection
    const reflect = p =>
      Promise.resolve(p).then(
        value => ({ status: 'fulfilled', value }),
        reason => ({ status: 'rejected', reason })
      );

    const [circleResult, dflixResult] = await Promise.all([
      reflect(getCircleStreams(tmdbId, mediaType, season, episode, userSettings)),
      reflect(getDflixStreams(tmdbId, mediaType, season, episode, userSettings))
    ]);

    const circleStreams = circleResult.status === 'fulfilled' && Array.isArray(circleResult.value)
      ? circleResult.value
      : [];

    const dflixStreams = dflixResult.status === 'fulfilled' && Array.isArray(dflixResult.value)
      ? dflixResult.value
      : [];

    const merged = [...dflixStreams, ...circleStreams];
    const seenUrls = new Set();
    const finalStreams = [];

    for (const stream of merged) {
      if (!stream.url || seenUrls.has(stream.url)) continue;
      seenUrls.add(stream.url);
      finalStreams.push({
        ...stream,
        provider: 'bdix',
        type: stream.type || 'mp4'
      });
    }

    console.log(`[BDIX Combined] Total aggregated streams: ${finalStreams.length} (${dflixStreams.length} DFLIX, ${circleStreams.length} CircleFTP)`);
    return finalStreams;
  } catch (err) {
    console.log(`[BDIX Combined] Error:`, err.message);
    return [];
  }
}

/**
 * Combined Settings UI blueprint
 */
export async function onSettings() {
  const circleSettings = await onCircleSettings();
  const dflixSettings = await onDflixSettings();
  return [
    { type: 'header', label: 'BDIX Aggregator' },
    ...dflixSettings,
    ...circleSettings
  ];
}


