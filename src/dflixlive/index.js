import { PROVIDER_NAME, DEFAULT_BASE_URL } from './constants.js';
import { searchTitles, getTitleDetails } from './api.js';
import { resolveMetadata } from '../common/tmdb.js';
import {
  titlesMatch,
  extractQuality,
  extractFileType
} from '../common/utils.js';

/**
 * DFLIX.live Stream Resolver for Nuvio
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
    const globalSettings = (typeof globalThis !== 'undefined' && globalThis.SCRAPER_SETTINGS) || {};
    const settings = { ...globalSettings, ...(userSettings || {}) };
    const baseUrl = settings.dflixBaseUrl || DEFAULT_BASE_URL;
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const customTmdbKey = settings.tmdbApiKey || null;

    const isTv = mediaType === 'tv' || mediaType === 'series' || mediaType === 'tvshow';

    // 1. Resolve media metadata (title and year)
    const meta = await resolveMetadata(tmdbId, mediaType, customTmdbKey);
    if (!meta || !meta.title) {
      console.log(`[DFLIX.live] Could not resolve metadata for TMDB ID: ${JSON.stringify(tmdbId)}`);
      return [];
    }

    const searchQuery = meta.title;
    console.log(`[DFLIX.live] Searching "${searchQuery}" (${meta.year || 'unknown year'}) [${mediaType}]`);

    // 2. Query DFLIX Search API
    const results = await searchTitles(cleanBase, searchQuery);
    if (!results || results.length === 0) {
      console.log(`[DFLIX.live] No search results for: ${searchQuery}`);
      return [];
    }

    // 3. Match candidate title
    const expectedKind = isTv ? 'tv' : 'movie';
    const matches = results.filter(r => {
      // Kind check (movie or tv)
      if (r.kind && r.kind !== expectedKind) return false;

      // Title similarity
      if (!titlesMatch(r.title, meta.title)) return false;

      // Year check if both available
      if (meta.year && r.year && Math.abs(r.year - meta.year) > 1) {
        return false;
      }

      return true;
    });

    if (matches.length === 0) return [];

    // Prioritize closest year match
    matches.sort((a, b) => {
      if (meta.year && a.year && b.year) {
        return Math.abs(a.year - meta.year) - Math.abs(b.year - meta.year);
      }
      return 0;
    });

    // 4. Fetch details for best match(es)
    const bestMatches = matches.slice(0, 2);
    const detailList = await Promise.all(
      bestMatches.map(m => getTitleDetails(cleanBase, m.id))
    );

    const streams = [];
    const seenUrls = new Set();

    for (const details of detailList) {
      if (!details || !Array.isArray(details.files)) continue;

      let relevantFiles = [];

      if (!isTv) {
        relevantFiles = details.files.filter(f => !f.season && !f.episode);
        // Fallback: if no files have null season/episode, take all files
        if (relevantFiles.length === 0) {
          relevantFiles = details.files;
        }
      } else {
        const targetSeason = season ? parseInt(season, 10) : 1;
        const targetEpisode = episode ? parseInt(episode, 10) : 1;

        relevantFiles = details.files.filter(f => {
          return Number(f.season) === targetSeason && Number(f.episode) === targetEpisode;
        });
      }

      for (const file of relevantFiles) {
        if (!file.streamUrl) continue;

        const fullStreamUrl = file.streamUrl.startsWith('http')
          ? file.streamUrl
          : `${cleanBase}${file.streamUrl}`;

        if (seenUrls.has(fullStreamUrl)) continue;
        seenUrls.add(fullStreamUrl);

        const quality = extractQuality(file.quality || fullStreamUrl);
        const container = (file.container || 'mp4').toUpperCase();
        const epLabel = isTv ? `S${file.season}E${file.episode} - ` : '';
        const fileType = extractFileType(fullStreamUrl, file.container);

        // Parse subtitles if provided by DFLIX
        const subtitles = [];
        if (Array.isArray(file.subtitles)) {
          for (const sub of file.subtitles) {
            if (sub && sub.url) {
              const subUrl = sub.url.startsWith('http') ? sub.url : `${cleanBase}${sub.url}`;
              subtitles.push({
                url: subUrl,
                language: sub.lang || 'en',
                name: sub.label || (sub.lang ? sub.lang.toUpperCase() : 'English')
              });
            }
          }
        }

        streams.push({
          name: PROVIDER_NAME,
          title: `[DFLIX.live] ${epLabel}${quality} [${container}]`,
          url: fullStreamUrl,
          quality: quality,
          type: fileType,
          provider: 'dflixlive',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
          },
          ...(subtitles.length > 0 ? { subtitles } : {})
        });
      }
    }

    console.log(`[DFLIX.live] Found ${streams.length} stream(s) for "${meta.title}"`);
    return streams;
  } catch (error) {
    console.log(`[DFLIX.live] Unexpected error in getStreams:`, error.message);
    return [];
  }
}

/**
 * Nuvio provider settings UI blueprint
 */
export async function onSettings() {
  return [
    { type: 'header', label: 'DFLIX.live Configuration' },
    {
      type: 'text',
      key: 'dflixBaseUrl',
      label: 'DFLIX.live Base URL',
      placeholder: DEFAULT_BASE_URL,
      defaultValue: DEFAULT_BASE_URL,
      description: 'Default: https://dflix.live'
    },
    { type: 'header', label: 'TMDB Settings' },
    {
      type: 'text',
      key: 'tmdbApiKey',
      label: 'Custom TMDB API Key (Optional)',
      placeholder: 'Enter your TMDB API Key',
      description: 'Leave blank to use built-in keys.'
    }
  ];
}


