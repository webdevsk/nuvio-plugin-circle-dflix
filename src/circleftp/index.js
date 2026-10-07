import { PROVIDER_NAME, DEFAULT_API_URL } from './constants.js';
import { searchPosts, getPostDetail } from './api.js';
import { resolveMetadata } from '../common/tmdb.js';
import {
  titlesMatch,
  extractYear,
  extractQuality,
  extractEpisodeNumber,
  extractSeasonNumber
} from '../common/utils.js';

/**
 * Circle FTP Stream Resolver for Nuvio
 *
 * @param {string|number} tmdbId - TMDB ID, IMDB ID, or title string
 * @param {'movie'|'tv'} mediaType - 'movie' or 'tv'
 * @param {number|null} season - Season number (1-based, TV only)
 * @param {number|null} episode - Episode number (1-based, TV only)
 * @returns {Promise<Array<Object>>} Array of Nuvio stream objects
 */
export async function getStreams(tmdbId, mediaType, season = null, episode = null) {
  try {
    const settings = (typeof globalThis !== 'undefined' && globalThis.SCRAPER_SETTINGS) || {};
    const apiUrl = settings.circleApiUrl || DEFAULT_API_URL;
    const customTmdbKey = settings.tmdbApiKey || null;

    // 1. Resolve media metadata (title and release year)
    const meta = await resolveMetadata(tmdbId, mediaType, customTmdbKey);
    if (!meta || !meta.title) {
      console.log(`[CircleFTP] Could not resolve metadata for TMDB ID: ${tmdbId}`);
      return [];
    }

    const searchQuery = meta.title;
    console.log(`[CircleFTP] Searching "${searchQuery}" (${meta.year || 'unknown year'}) [${mediaType}]`);

    // 2. Query Circle FTP API
    const posts = await searchPosts(apiUrl, searchQuery);
    if (!posts || posts.length === 0) {
      console.log(`[CircleFTP] No posts found for query: ${searchQuery}`);
      return [];
    }

    const streams = [];
    const seenUrls = new Set();

    if (mediaType === 'movie') {
      // Filter movie candidates
      const matches = posts.filter(p => {
        if (p.type !== 'singleVideo') return false;
        const candidateTitle = p.name || p.title || '';
        if (!titlesMatch(candidateTitle, meta.title)) return false;

        // Year verification if available
        if (meta.year) {
          const candYear = extractYear(p.year || candidateTitle);
          if (candYear && Math.abs(candYear - meta.year) > 1) {
            return false;
          }
        }
        return true;
      });

      if (matches.length === 0) return [];

      // Fetch detail payloads concurrently
      const details = await Promise.all(
        matches.map(m => getPostDetail(apiUrl, m.id))
      );

      for (let i = 0; i < matches.length; i++) {
        const detail = details[i];
        if (!detail || !detail.content || typeof detail.content !== 'string') continue;

        const videoUrl = detail.content.trim();
        if (!videoUrl.startsWith('http') || seenUrls.has(videoUrl)) continue;
        seenUrls.add(videoUrl);

        const quality = extractQuality(matches[i].quality || detail.title || videoUrl);
        const releaseNote = matches[i].quality ? ` - ${matches[i].quality}` : '';

        streams.push({
          name: PROVIDER_NAME,
          title: `[CircleFTP] ${quality}${releaseNote}`,
          url: videoUrl,
          quality: quality,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
      }
    } else {
      // TV Series
      const targetSeason = season ? parseInt(season, 10) : 1;
      const targetEpisode = episode ? parseInt(episode, 10) : 1;

      const matches = posts.filter(p => {
        if (p.type !== 'series') return false;
        const candidateTitle = p.name || p.title || '';
        return titlesMatch(candidateTitle, meta.title);
      });

      if (matches.length === 0) return [];

      // Fetch series post details
      const details = await Promise.all(
        matches.map(m => getPostDetail(apiUrl, m.id))
      );

      for (let i = 0; i < matches.length; i++) {
        const detail = details[i];
        if (!detail || !Array.isArray(detail.content)) continue;

        // Find target season
        const seasonData = detail.content.find(s => {
          const sNum = extractSeasonNumber(s.seasonName);
          return sNum === targetSeason;
        });

        if (!seasonData || !Array.isArray(seasonData.episodes)) continue;

        // Find target episode
        const epData = seasonData.episodes.find(e => {
          const epNum = extractEpisodeNumber(e.title);
          return epNum === targetEpisode;
        });

        if (!epData || !epData.link || typeof epData.link !== 'string') continue;

        const videoUrl = epData.link.trim();
        if (!videoUrl.startsWith('http') || seenUrls.has(videoUrl)) continue;
        seenUrls.add(videoUrl);

        const quality = extractQuality(matches[i].quality || epData.title || videoUrl);

        streams.push({
          name: PROVIDER_NAME,
          title: `[CircleFTP] S${targetSeason}E${targetEpisode} - ${quality}`,
          url: videoUrl,
          quality: quality,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
      }
    }

    console.log(`[CircleFTP] Found ${streams.length} stream(s) for "${meta.title}"`);
    return streams;
  } catch (error) {
    console.log(`[CircleFTP] Unexpected error in getStreams:`, error.message);
    return [];
  }
}

/**
 * Nuvio provider settings UI blueprint
 */
export async function onSettings() {
  return [
    { type: 'header', label: 'Circle FTP Configuration' },
    {
      type: 'text',
      key: 'circleApiUrl',
      label: 'Circle FTP API Base URL',
      placeholder: DEFAULT_API_URL,
      defaultValue: DEFAULT_API_URL,
      description: 'Default: http://new.circleftp.net:5000/api'
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


