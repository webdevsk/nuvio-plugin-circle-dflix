/**
 * TMDB Metadata Resolver with multi-host rotation, multi-key rotation, and Cinemeta fallback.
 */

import { safeFetch } from './utils.js';

export const DEFAULT_TMDB_KEYS = [
  '1865f43a0549ca50d341dd9ab8b29f49',
  '439c478a771f35c05022f9feabcca01c',
  'b8a6a683a48e77c8e96bf71b3e5cb5b2',
  '8265bd1679663a7ea12ac168da84d2e8'
];

// Dual-host support: api.tmdb.org (Cloudflare CDN, bypasses many ISP DNS blocks) and api.themoviedb.org
const TMDB_BASES = [
  'https://api.tmdb.org/3',
  'https://api.themoviedb.org/3'
];

/**
 * Resolves TMDB ID, IMDB ID, or title object to media metadata:
 * { title, year, imdbId }
 */
export async function resolveMetadata(tmdbId, mediaType, customApiKey = null) {
  let rawId = tmdbId;
  let fallbackTitle = '';
  let fallbackYear = null;
  let fallbackImdbId = null;

  // 1. Unwrap if tmdbId is an object (common on Android TV / NuvioTV)
  if (typeof rawId === 'object' && rawId !== null) {
    fallbackTitle = rawId.title || rawId.name || '';
    fallbackYear = parseInt(rawId.year || rawId.release_date || '', 10) || null;
    fallbackImdbId = rawId.imdbId || rawId.imdb_id || null;
    rawId = rawId.id || rawId.tmdbId || rawId.tmdb_id || rawId.imdbId || rawId.imdb_id || fallbackTitle;

    // If an explicit title was provided in the object, use it directly
    if (fallbackTitle && isNaN(String(fallbackTitle))) {
      return {
        title: fallbackTitle,
        year: fallbackYear,
        imdbId: fallbackImdbId
      };
    }
  }

  let idStr = String(rawId || '').trim();

  // Strip prefix like "tmdb:"
  if (idStr.toLowerCase().startsWith('tmdb:')) {
    idStr = idStr.slice(5).trim();
  }

  // Handle "tt1234567:1:1"
  if (idStr.startsWith('tt') && idStr.includes(':')) {
    idStr = idStr.split(':')[0].trim();
  }

  const isImdb = idStr.startsWith('tt');

  // If passed directly as a title string rather than numeric ID or 'tt...'
  if (isNaN(idStr) && !isImdb) {
    return {
      title: fallbackTitle || idStr,
      year: fallbackYear,
      imdbId: fallbackImdbId
    };
  }

  const isTv = mediaType === 'tv' || mediaType === 'series' || mediaType === 'tvshow';
  const type = isTv ? 'tv' : 'movie';
  const keys = customApiKey ? [customApiKey, ...DEFAULT_TMDB_KEYS] : DEFAULT_TMDB_KEYS;

  // 2. Query TMDB across multiple hosts and API keys
  for (const host of TMDB_BASES) {
    for (const apiKey of keys) {
      try {
        const endpoint = isImdb
          ? `${host}/find/${idStr}?api_key=${apiKey}&external_source=imdb_id`
          : `${host}/${type}/${idStr}?api_key=${apiKey}&append_to_response=external_ids`;

        const res = await safeFetch(endpoint, {
          headers: { 'Accept': 'application/json' }
        }, 5000);

        if (!res || !res.ok) continue;

        const data = await res.json();

        if (isImdb) {
          const item = isTv
            ? (data.tv_results?.[0] || data.tv_episode_results?.[0])
            : (data.movie_results?.[0]);

          if (item) {
            const rawDate = item.release_date || item.first_air_date || '';
            return {
              title: item.title || item.name || item.original_title || item.original_name || fallbackTitle,
              year: parseInt(rawDate.slice(0, 4), 10) || fallbackYear,
              imdbId: idStr
            };
          }
        } else {
          const rawDate = data.release_date || data.first_air_date || '';
          return {
            title: data.title || data.name || data.original_title || data.original_name || fallbackTitle,
            year: parseInt(rawDate.slice(0, 4), 10) || fallbackYear,
            imdbId: data.external_ids?.imdb_id || data.imdb_id || fallbackImdbId
          };
        }
      } catch {
        // Try next key or host
      }
    }
  }

  // 3. Cinemeta fallback for IMDB IDs (if TMDB is completely blocked)
  const targetImdb = isImdb ? idStr : fallbackImdbId;
  if (targetImdb) {
    try {
      const cinemetaType = isTv ? 'series' : 'movie';
      const cinemetaRes = await safeFetch(`https://v3-cinemeta.strem.io/meta/${cinemetaType}/${targetImdb}.json`, {
        headers: { 'Accept': 'application/json' }
      }, 5000);

      if (cinemetaRes && cinemetaRes.ok) {
        const metaData = await cinemetaRes.json();
        if (metaData && metaData.meta) {
          return {
            title: metaData.meta.name || fallbackTitle,
            year: parseInt(metaData.meta.year || '', 10) || fallbackYear,
            imdbId: targetImdb
          };
        }
      }
    } catch {
      // Continue to fallback
    }
  }

  // 4. Ultimate fallback if all lookups fail
  return {
    title: fallbackTitle || idStr,
    year: fallbackYear,
    imdbId: targetImdb || null
  };
}
