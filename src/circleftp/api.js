import { safeFetch } from '../common/utils.js';

/**
 * Query Circle FTP search endpoint
 */
export async function searchPosts(apiUrl, query, timeoutMs = 6000) {
  try {
    const url = `${apiUrl.replace(/\/+$/, '')}/posts?searchTerm=${encodeURIComponent(query)}&order=desc`;
    const res = await safeFetch(url, {
      headers: { 'Accept': 'application/json' }
    }, timeoutMs);

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.posts) ? data.posts : [];
  } catch (err) {
    console.log(`[CircleFTP] Search failed for "${query}":`, err.message);
    return [];
  }
}

/**
 * Fetch detailed post content (direct video link or series episodes)
 */
export async function getPostDetail(apiUrl, id, timeoutMs = 6000) {
  try {
    const url = `${apiUrl.replace(/\/+$/, '')}/posts/${id}`;
    const res = await safeFetch(url, {
      headers: { 'Accept': 'application/json' }
    }, timeoutMs);

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.log(`[CircleFTP] Detail fetch failed for id ${id}:`, err.message);
    return null;
  }
}
