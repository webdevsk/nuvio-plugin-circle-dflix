/**
 * bdix - Nuvio Provider (BDIX)
 * Generated: 2026-11-10T12:31:50.859Z
 */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/bdix/index.js
var index_exports = {};
__export(index_exports, {
  PROVIDER_NAME: () => PROVIDER_NAME3,
  getStreams: () => getStreams3,
  onSettings: () => onSettings3
});
module.exports = __toCommonJS(index_exports);

// src/circleftp/constants.js
var PROVIDER_NAME = "CircleFTP";
var DEFAULT_API_URL = "http://new.circleftp.net:5000/api";

// src/common/utils.js
function cleanTitle(title) {
  if (!title || typeof title !== "string") return "";
  return title.toLowerCase().replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function titlesMatch(candidate, query) {
  if (!candidate || !query) return false;
  const c = cleanTitle(candidate);
  const q = cleanTitle(query);
  if (c === q) return true;
  const cWords = c.split(" ").filter(Boolean);
  const qWords = q.split(" ").filter(Boolean);
  if (qWords.length === 0 || cWords.length === 0) return false;
  if (qWords.length === 1) {
    if (cWords[0] === qWords[0]) {
      if (cWords.length === 1) return true;
      const allowedNext = ["extended", "remastered", "unrated", "special", "directors"];
      if (allowedNext.includes(cWords[1])) return true;
    }
    return false;
  }
  if (c.startsWith(q) || q.startsWith(c)) {
    return true;
  }
  const allInCandidate = qWords.every((w) => cWords.includes(w));
  if (allInCandidate && Math.abs(cWords.length - qWords.length) <= 3) {
    return true;
  }
  return false;
}
function extractYear(str) {
  if (!str) return null;
  const m = String(str).match(/\b(19\d{2}|20\d{2})\b/);
  return m ? parseInt(m[1], 10) : null;
}
function extractQuality(str) {
  if (!str) return "1080p";
  const low = String(str).toLowerCase();
  if (low.includes("2160p") || low.includes("4k") || low.includes("uhd")) return "4K";
  if (low.includes("1080p") || low.includes("fhd")) return "1080p";
  if (low.includes("720p") || low.includes("hd")) return "720p";
  if (low.includes("480p")) return "480p";
  if (low.includes("360p")) return "360p";
  return "1080p";
}
function extractEpisodeNumber(title) {
  if (!title) return null;
  let m = title.match(/S:?\d+[\.:\s]*E(?:pisode)?:?(\d+)/i);
  if (!m) m = title.match(/Episode[:\s]*(\d+)/i);
  if (!m) m = title.match(/\bEp[:\s]*(\d+)\b/i);
  if (!m) m = title.match(/\bE(\d+)\b/i);
  return m ? parseInt(m[1], 10) : null;
}
function extractSeasonNumber(seasonName) {
  if (!seasonName) return null;
  const m = String(seasonName).match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}
async function safeFetch(url, options = {}, timeoutMs = 1e4) {
  const hasAbort = typeof AbortController !== "undefined";
  const controller = hasAbort ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const fetchOptions = {
      ...options,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ...options.headers || {}
      },
      skipSizeCheck: true
      // Nuvio sandbox flag (ignored on TV if unsupported)
    };
    if (controller) {
      fetchOptions.signal = controller.signal;
    }
    if (!controller) {
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Fetch timeout")), timeoutMs)
      );
      return await Promise.race([fetch(url, fetchOptions), timeoutPromise]);
    }
    return await fetch(url, fetchOptions);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// src/circleftp/api.js
async function searchPosts(apiUrl, query, timeoutMs = 1e4) {
  try {
    const url = `${apiUrl.replace(/\/+$/, "")}/posts?searchTerm=${encodeURIComponent(query)}&order=desc`;
    const res = await safeFetch(url, {
      headers: { "Accept": "application/json" }
    }, timeoutMs);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.posts) ? data.posts : [];
  } catch (err) {
    console.log(`[CircleFTP] Search failed for "${query}":`, err.message);
    return [];
  }
}
async function getPostDetail(apiUrl, id, timeoutMs = 1e4) {
  try {
    const url = `${apiUrl.replace(/\/+$/, "")}/posts/${id}`;
    const res = await safeFetch(url, {
      headers: { "Accept": "application/json" }
    }, timeoutMs);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.log(`[CircleFTP] Detail fetch failed for id ${id}:`, err.message);
    return null;
  }
}

// src/common/tmdb.js
var DEFAULT_TMDB_KEYS = [
  "1865f43a0549ca50d341dd9ab8b29f49",
  "439c478a771f35c05022f9feabcca01c",
  "b8a6a683a48e77c8e96bf71b3e5cb5b2",
  "8265bd1679663a7ea12ac168da84d2e8"
];
async function resolveMetadata(tmdbId, mediaType, customApiKey = null) {
  if (typeof tmdbId === "object" && tmdbId !== null) {
    return {
      title: tmdbId.title || tmdbId.name || "",
      year: parseInt(tmdbId.year || "", 10) || null,
      imdbId: tmdbId.imdbId || tmdbId.imdb_id || null
    };
  }
  const idStr = String(tmdbId || "").trim();
  if (isNaN(idStr) && !idStr.startsWith("tt")) {
    return {
      title: idStr,
      year: null,
      imdbId: null
    };
  }
  const type = mediaType === "tv" ? "tv" : "movie";
  const keys = customApiKey ? [customApiKey, ...DEFAULT_TMDB_KEYS] : DEFAULT_TMDB_KEYS;
  const isImdb = idStr.startsWith("tt");
  for (const apiKey of keys) {
    try {
      const endpoint = isImdb ? `https://api.themoviedb.org/3/find/${idStr}?api_key=${apiKey}&external_source=imdb_id` : `https://api.themoviedb.org/3/${type}/${idStr}?api_key=${apiKey}&append_to_response=external_ids`;
      const res = await safeFetch(endpoint, {
        headers: { "Accept": "application/json" }
      }, 8e3);
      if (!res.ok) continue;
      const data = await res.json();
      if (isImdb) {
        const item = type === "tv" ? data.tv_results?.[0] || data.tv_episode_results?.[0] : data.movie_results?.[0];
        if (item) {
          const rawDate = item.release_date || item.first_air_date || "";
          return {
            title: item.title || item.name || item.original_title || item.original_name,
            year: parseInt(rawDate.slice(0, 4), 10) || null,
            imdbId: idStr
          };
        }
      } else {
        const rawDate = data.release_date || data.first_air_date || "";
        return {
          title: data.title || data.name || data.original_title || data.original_name,
          year: parseInt(rawDate.slice(0, 4), 10) || null,
          imdbId: data.external_ids?.imdb_id || data.imdb_id || null
        };
      }
    } catch {
    }
  }
  return {
    title: idStr,
    year: null,
    imdbId: isImdb ? idStr : null
  };
}

// src/circleftp/index.js
async function getStreams(tmdbId, mediaType, season = null, episode = null) {
  try {
    const settings = typeof globalThis !== "undefined" && globalThis.SCRAPER_SETTINGS || {};
    const apiUrl = settings.circleApiUrl || DEFAULT_API_URL;
    const customTmdbKey = settings.tmdbApiKey || null;
    const meta = await resolveMetadata(tmdbId, mediaType, customTmdbKey);
    if (!meta || !meta.title) {
      console.log(`[CircleFTP] Could not resolve metadata for TMDB ID: ${tmdbId}`);
      return [];
    }
    const searchQuery = meta.title;
    console.log(`[CircleFTP] Searching "${searchQuery}" (${meta.year || "unknown year"}) [${mediaType}]`);
    const posts = await searchPosts(apiUrl, searchQuery);
    if (!posts || posts.length === 0) {
      console.log(`[CircleFTP] No posts found for query: ${searchQuery}`);
      return [];
    }
    const streams = [];
    const seenUrls = /* @__PURE__ */ new Set();
    if (mediaType === "movie") {
      const matches = posts.filter((p) => {
        if (p.type !== "singleVideo") return false;
        const candidateTitle = p.name || p.title || "";
        if (!titlesMatch(candidateTitle, meta.title)) return false;
        if (meta.year) {
          const candYear = extractYear(p.year || candidateTitle);
          if (candYear && Math.abs(candYear - meta.year) > 1) {
            return false;
          }
        }
        return true;
      });
      if (matches.length === 0) return [];
      const details = await Promise.all(
        matches.map((m) => getPostDetail(apiUrl, m.id))
      );
      for (let i = 0; i < matches.length; i++) {
        const detail = details[i];
        if (!detail || !detail.content || typeof detail.content !== "string") continue;
        const videoUrl = detail.content.trim();
        if (!videoUrl.startsWith("http") || seenUrls.has(videoUrl)) continue;
        seenUrls.add(videoUrl);
        const quality = extractQuality(matches[i].quality || detail.title || videoUrl);
        const releaseNote = matches[i].quality ? ` - ${matches[i].quality}` : "";
        streams.push({
          name: PROVIDER_NAME,
          title: `[CircleFTP] ${quality}${releaseNote}`,
          url: videoUrl,
          quality,
          headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"
          }
        });
      }
    } else {
      const targetSeason = season ? parseInt(season, 10) : 1;
      const targetEpisode = episode ? parseInt(episode, 10) : 1;
      const matches = posts.filter((p) => {
        if (p.type !== "series") return false;
        const candidateTitle = p.name || p.title || "";
        return titlesMatch(candidateTitle, meta.title);
      });
      if (matches.length === 0) return [];
      const details = await Promise.all(
        matches.map((m) => getPostDetail(apiUrl, m.id))
      );
      for (let i = 0; i < matches.length; i++) {
        const detail = details[i];
        if (!detail || !Array.isArray(detail.content)) continue;
        const seasonData = detail.content.find((s) => {
          const sNum = extractSeasonNumber(s.seasonName);
          return sNum === targetSeason;
        });
        if (!seasonData || !Array.isArray(seasonData.episodes)) continue;
        const epData = seasonData.episodes.find((e) => {
          const epNum = extractEpisodeNumber(e.title);
          return epNum === targetEpisode;
        });
        if (!epData || !epData.link || typeof epData.link !== "string") continue;
        const videoUrl = epData.link.trim();
        if (!videoUrl.startsWith("http") || seenUrls.has(videoUrl)) continue;
        seenUrls.add(videoUrl);
        const quality = extractQuality(matches[i].quality || epData.title || videoUrl);
        streams.push({
          name: PROVIDER_NAME,
          title: `[CircleFTP] S${targetSeason}E${targetEpisode} - ${quality}`,
          url: videoUrl,
          quality,
          headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"
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
async function onSettings() {
  return [
    { type: "header", label: "Circle FTP Configuration" },
    {
      type: "text",
      key: "circleApiUrl",
      label: "Circle FTP API Base URL",
      placeholder: DEFAULT_API_URL,
      defaultValue: DEFAULT_API_URL,
      description: "Default: http://new.circleftp.net:5000/api"
    },
    { type: "header", label: "TMDB Settings" },
    {
      type: "text",
      key: "tmdbApiKey",
      label: "Custom TMDB API Key (Optional)",
      placeholder: "Enter your TMDB API Key",
      description: "Leave blank to use built-in keys."
    }
  ];
}

// src/dflixlive/constants.js
var PROVIDER_NAME2 = "DFLIX.live";
var DEFAULT_BASE_URL = "https://dflix.live";

// src/dflixlive/api.js
async function searchTitles(baseUrl, query, timeoutMs = 1e4) {
  try {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const url = `${cleanBase}/api/search?q=${encodeURIComponent(query)}`;
    const res = await safeFetch(url, {
      headers: { "Accept": "application/json" }
    }, timeoutMs);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch (err) {
    console.log(`[DFLIX.live] Search failed for "${query}":`, err.message);
    return [];
  }
}
async function getTitleDetails(baseUrl, id, timeoutMs = 1e4) {
  try {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const url = `${cleanBase}/api/title/${id}`;
    const res = await safeFetch(url, {
      headers: { "Accept": "application/json" }
    }, timeoutMs);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.log(`[DFLIX.live] Details fetch failed for id ${id}:`, err.message);
    return null;
  }
}

// src/dflixlive/index.js
async function getStreams2(tmdbId, mediaType, season = null, episode = null) {
  try {
    const settings = typeof globalThis !== "undefined" && globalThis.SCRAPER_SETTINGS || {};
    const baseUrl = settings.dflixBaseUrl || DEFAULT_BASE_URL;
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const customTmdbKey = settings.tmdbApiKey || null;
    const meta = await resolveMetadata(tmdbId, mediaType, customTmdbKey);
    if (!meta || !meta.title) {
      console.log(`[DFLIX.live] Could not resolve metadata for TMDB ID: ${tmdbId}`);
      return [];
    }
    const searchQuery = meta.title;
    console.log(`[DFLIX.live] Searching "${searchQuery}" (${meta.year || "unknown year"}) [${mediaType}]`);
    const results = await searchTitles(cleanBase, searchQuery);
    if (!results || results.length === 0) {
      console.log(`[DFLIX.live] No search results for: ${searchQuery}`);
      return [];
    }
    const expectedKind = mediaType === "tv" ? "tv" : "movie";
    const matches = results.filter((r) => {
      if (r.kind && r.kind !== expectedKind) return false;
      if (!titlesMatch(r.title, meta.title)) return false;
      if (meta.year && r.year && Math.abs(r.year - meta.year) > 1) {
        return false;
      }
      return true;
    });
    if (matches.length === 0) return [];
    matches.sort((a, b) => {
      if (meta.year && a.year && b.year) {
        return Math.abs(a.year - meta.year) - Math.abs(b.year - meta.year);
      }
      return 0;
    });
    const bestMatches = matches.slice(0, 2);
    const detailList = await Promise.all(
      bestMatches.map((m) => getTitleDetails(cleanBase, m.id))
    );
    const streams = [];
    const seenUrls = /* @__PURE__ */ new Set();
    for (const details of detailList) {
      if (!details || !Array.isArray(details.files)) continue;
      let relevantFiles = [];
      if (mediaType === "movie") {
        relevantFiles = details.files.filter((f) => !f.season && !f.episode);
        if (relevantFiles.length === 0) {
          relevantFiles = details.files;
        }
      } else {
        const targetSeason = season ? parseInt(season, 10) : 1;
        const targetEpisode = episode ? parseInt(episode, 10) : 1;
        relevantFiles = details.files.filter((f) => {
          return Number(f.season) === targetSeason && Number(f.episode) === targetEpisode;
        });
      }
      for (const file of relevantFiles) {
        if (!file.streamUrl) continue;
        const fullStreamUrl = file.streamUrl.startsWith("http") ? file.streamUrl : `${cleanBase}${file.streamUrl}`;
        if (seenUrls.has(fullStreamUrl)) continue;
        seenUrls.add(fullStreamUrl);
        const quality = extractQuality(file.quality || fullStreamUrl);
        const container = (file.container || "mp4").toUpperCase();
        const epLabel = mediaType === "tv" ? `S${file.season}E${file.episode} - ` : "";
        const subtitles = [];
        if (Array.isArray(file.subtitles)) {
          for (const sub of file.subtitles) {
            if (sub && sub.url) {
              const subUrl = sub.url.startsWith("http") ? sub.url : `${cleanBase}${sub.url}`;
              subtitles.push({
                url: subUrl,
                language: sub.lang || "en",
                name: sub.label || (sub.lang ? sub.lang.toUpperCase() : "English")
              });
            }
          }
        }
        streams.push({
          name: PROVIDER_NAME2,
          title: `[DFLIX.live] ${epLabel}${quality} [${container}]`,
          url: fullStreamUrl,
          quality,
          headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"
          },
          ...subtitles.length > 0 ? { subtitles } : {}
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
async function onSettings2() {
  return [
    { type: "header", label: "DFLIX.live Configuration" },
    {
      type: "text",
      key: "dflixBaseUrl",
      label: "DFLIX.live Base URL",
      placeholder: DEFAULT_BASE_URL,
      defaultValue: DEFAULT_BASE_URL,
      description: "Default: https://dflix.live"
    },
    { type: "header", label: "TMDB Settings" },
    {
      type: "text",
      key: "tmdbApiKey",
      label: "Custom TMDB API Key (Optional)",
      placeholder: "Enter your TMDB API Key",
      description: "Leave blank to use built-in keys."
    }
  ];
}

// src/bdix/index.js
var PROVIDER_NAME3 = "BDIX (Circle + DFLIX)";
async function getStreams3(tmdbId, mediaType, season = null, episode = null) {
  try {
    console.log(`[BDIX Combined] Fetching streams from Circle FTP & DFLIX.live in parallel...`);
    const [circleResult, dflixResult] = await Promise.allSettled([
      getStreams(tmdbId, mediaType, season, episode),
      getStreams2(tmdbId, mediaType, season, episode)
    ]);
    const circleStreams = circleResult.status === "fulfilled" && Array.isArray(circleResult.value) ? circleResult.value : [];
    const dflixStreams = dflixResult.status === "fulfilled" && Array.isArray(dflixResult.value) ? dflixResult.value : [];
    const merged = [...dflixStreams, ...circleStreams];
    const seenUrls = /* @__PURE__ */ new Set();
    const finalStreams = [];
    for (const stream of merged) {
      if (!stream.url || seenUrls.has(stream.url)) continue;
      seenUrls.add(stream.url);
      finalStreams.push(stream);
    }
    console.log(`[BDIX Combined] Total aggregated streams: ${finalStreams.length} (${dflixStreams.length} DFLIX, ${circleStreams.length} CircleFTP)`);
    return finalStreams;
  } catch (err) {
    console.log(`[BDIX Combined] Error:`, err.message);
    return [];
  }
}
async function onSettings3() {
  const circleSettings = await onSettings();
  const dflixSettings = await onSettings2();
  return [
    { type: "header", label: "BDIX Aggregator" },
    ...dflixSettings,
    ...circleSettings
  ];
}

if (typeof globalThis !== 'undefined' && typeof module !== 'undefined' && module.exports) {
  globalThis.getStreams = module.exports.getStreams;
  globalThis.onSettings = module.exports.onSettings;
}
