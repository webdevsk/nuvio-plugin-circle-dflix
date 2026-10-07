import { safeFetch } from '../common/utils.js';

/**
 * Search dflix.live for movie or TV show title
 */
export async function searchTitles(baseUrl, query, timeoutMs = 6000) {
  try {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/api/search?q=${encodeURIComponent(query)}`;
    const res = await safeFetch(url, {
      headers: { 'Accept': 'application/json' }
    }, timeoutMs);

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch (err) {
    console.log(`[DFLIX.live] Search failed for "${query}":`, err.message);
    return [];
  }
}

/**
 * Fetch media details and playable file list from dflix.live
 */
export async function getTitleDetails(baseUrl, id, timeoutMs = 6000) {
  try {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/api/title/${id}`;
    const res = await safeFetch(url, {
      headers: { 'Accept': 'application/json' }
    }, timeoutMs);

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.log(`[DFLIX.live] Details fetch failed for id ${id}:`, err.message);
    return null;
  }
}
