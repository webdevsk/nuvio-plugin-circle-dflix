/**
 * circleftp - Nuvio Provider (BDIX / NuvioTV)
 * Generated: 2026-11-10T14:29:46.363Z
 */
var __NuvioProvider__ = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/circleftp/index.js
  var index_exports = {};
  __export(index_exports, {
    getStreams: () => getStreams,
    onSettings: () => onSettings
  });

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
  function safeFetch(_0) {
    return __async(this, arguments, function* (url, options = {}, timeoutMs = 1e4) {
      const hasAbort = typeof AbortController !== "undefined";
      const controller = hasAbort ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
      try {
        const fetchOptions = __spreadProps(__spreadValues({}, options), {
          headers: __spreadValues({
            "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }, options.headers || {}),
          skipSizeCheck: true
          // Nuvio sandbox flag (ignored on TV if unsupported)
        });
        if (controller) {
          fetchOptions.signal = controller.signal;
        }
        if (!controller) {
          const timeoutPromise = new Promise(
            (_, reject) => setTimeout(() => reject(new Error("Fetch timeout")), timeoutMs)
          );
          return yield Promise.race([fetch(url, fetchOptions), timeoutPromise]);
        }
        return yield fetch(url, fetchOptions);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    });
  }
  function extractFileType(url, container) {
    if (container && typeof container === "string") {
      const c = container.toLowerCase();
      if (c.includes("mkv")) return "mkv";
      if (c.includes("mp4")) return "mp4";
      if (c.includes("m3u8") || c.includes("hls")) return "m3u8";
    }
    const cleanUrl = String(url || "").toLowerCase();
    if (cleanUrl.includes(".mkv")) return "mkv";
    if (cleanUrl.includes(".mp4")) return "mp4";
    if (cleanUrl.includes(".m3u8")) return "m3u8";
    return "mp4";
  }

  // src/circleftp/api.js
  function searchPosts(apiUrl, query, timeoutMs = 1e4) {
    return __async(this, null, function* () {
      try {
        const url = `${apiUrl.replace(/\/+$/, "")}/posts?searchTerm=${encodeURIComponent(query)}&order=desc`;
        const res = yield safeFetch(url, {
          headers: { "Accept": "application/json" }
        }, timeoutMs);
        if (!res.ok) return [];
        const data = yield res.json();
        return Array.isArray(data.posts) ? data.posts : [];
      } catch (err) {
        console.log(`[CircleFTP] Search failed for "${query}":`, err.message);
        return [];
      }
    });
  }
  function getPostDetail(apiUrl, id, timeoutMs = 1e4) {
    return __async(this, null, function* () {
      try {
        const url = `${apiUrl.replace(/\/+$/, "")}/posts/${id}`;
        const res = yield safeFetch(url, {
          headers: { "Accept": "application/json" }
        }, timeoutMs);
        if (!res.ok) return null;
        return yield res.json();
      } catch (err) {
        console.log(`[CircleFTP] Detail fetch failed for id ${id}:`, err.message);
        return null;
      }
    });
  }

  // src/common/tmdb.js
  var DEFAULT_TMDB_KEYS = [
    "1865f43a0549ca50d341dd9ab8b29f49",
    "439c478a771f35c05022f9feabcca01c",
    "b8a6a683a48e77c8e96bf71b3e5cb5b2",
    "8265bd1679663a7ea12ac168da84d2e8"
  ];
  var TMDB_BASES = [
    "https://api.tmdb.org/3",
    "https://api.themoviedb.org/3"
  ];
  function resolveMetadata(tmdbId, mediaType, customApiKey = null) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d;
      let rawId = tmdbId;
      let fallbackTitle = "";
      let fallbackYear = null;
      let fallbackImdbId = null;
      if (typeof rawId === "object" && rawId !== null) {
        fallbackTitle = rawId.title || rawId.name || "";
        fallbackYear = parseInt(rawId.year || rawId.release_date || "", 10) || null;
        fallbackImdbId = rawId.imdbId || rawId.imdb_id || null;
        rawId = rawId.id || rawId.tmdbId || rawId.tmdb_id || rawId.imdbId || rawId.imdb_id || fallbackTitle;
        if (fallbackTitle && isNaN(String(fallbackTitle))) {
          return {
            title: fallbackTitle,
            year: fallbackYear,
            imdbId: fallbackImdbId
          };
        }
      }
      let idStr = String(rawId || "").trim();
      if (idStr.toLowerCase().startsWith("tmdb:")) {
        idStr = idStr.slice(5).trim();
      }
      if (idStr.startsWith("tt") && idStr.includes(":")) {
        idStr = idStr.split(":")[0].trim();
      }
      const isImdb = idStr.startsWith("tt");
      if (isNaN(idStr) && !isImdb) {
        return {
          title: fallbackTitle || idStr,
          year: fallbackYear,
          imdbId: fallbackImdbId
        };
      }
      const isTv = mediaType === "tv" || mediaType === "series" || mediaType === "tvshow";
      const type = isTv ? "tv" : "movie";
      const keys = customApiKey ? [customApiKey, ...DEFAULT_TMDB_KEYS] : DEFAULT_TMDB_KEYS;
      for (const host of TMDB_BASES) {
        for (const apiKey of keys) {
          try {
            const endpoint = isImdb ? `${host}/find/${idStr}?api_key=${apiKey}&external_source=imdb_id` : `${host}/${type}/${idStr}?api_key=${apiKey}&append_to_response=external_ids`;
            const res = yield safeFetch(endpoint, {
              headers: { "Accept": "application/json" }
            }, 5e3);
            if (!res || !res.ok) continue;
            const data = yield res.json();
            if (isImdb) {
              const item = isTv ? ((_a = data.tv_results) == null ? void 0 : _a[0]) || ((_b = data.tv_episode_results) == null ? void 0 : _b[0]) : (_c = data.movie_results) == null ? void 0 : _c[0];
              if (item) {
                const rawDate = item.release_date || item.first_air_date || "";
                return {
                  title: item.title || item.name || item.original_title || item.original_name || fallbackTitle,
                  year: parseInt(rawDate.slice(0, 4), 10) || fallbackYear,
                  imdbId: idStr
                };
              }
            } else {
              const rawDate = data.release_date || data.first_air_date || "";
              return {
                title: data.title || data.name || data.original_title || data.original_name || fallbackTitle,
                year: parseInt(rawDate.slice(0, 4), 10) || fallbackYear,
                imdbId: ((_d = data.external_ids) == null ? void 0 : _d.imdb_id) || data.imdb_id || fallbackImdbId
              };
            }
          } catch (e) {
          }
        }
      }
      const targetImdb = isImdb ? idStr : fallbackImdbId;
      if (targetImdb) {
        try {
          const cinemetaType = isTv ? "series" : "movie";
          const cinemetaRes = yield safeFetch(`https://v3-cinemeta.strem.io/meta/${cinemetaType}/${targetImdb}.json`, {
            headers: { "Accept": "application/json" }
          }, 5e3);
          if (cinemetaRes && cinemetaRes.ok) {
            const metaData = yield cinemetaRes.json();
            if (metaData && metaData.meta) {
              return {
                title: metaData.meta.name || fallbackTitle,
                year: parseInt(metaData.meta.year || "", 10) || fallbackYear,
                imdbId: targetImdb
              };
            }
          }
        } catch (e) {
        }
      }
      return {
        title: fallbackTitle || idStr,
        year: fallbackYear,
        imdbId: targetImdb || null
      };
    });
  }

  // src/circleftp/index.js
  function getStreams(_0, _1) {
    return __async(this, arguments, function* (tmdbId, mediaType, season = null, episode = null, userSettings = {}) {
      try {
        const globalSettings = typeof globalThis !== "undefined" && globalThis.SCRAPER_SETTINGS || {};
        const settings = __spreadValues(__spreadValues({}, globalSettings), userSettings || {});
        const apiUrl = settings.circleApiUrl || DEFAULT_API_URL;
        const customTmdbKey = settings.tmdbApiKey || null;
        const isTv = mediaType === "tv" || mediaType === "series" || mediaType === "tvshow";
        const meta = yield resolveMetadata(tmdbId, mediaType, customTmdbKey);
        if (!meta || !meta.title) {
          console.log(`[CircleFTP] Could not resolve metadata for TMDB ID: ${JSON.stringify(tmdbId)}`);
          return [];
        }
        const searchQuery = meta.title;
        console.log(`[CircleFTP] Searching "${searchQuery}" (${meta.year || "unknown year"}) [${mediaType}]`);
        const posts = yield searchPosts(apiUrl, searchQuery);
        if (!posts || posts.length === 0) {
          console.log(`[CircleFTP] No posts found for query: ${searchQuery}`);
          return [];
        }
        const streams = [];
        const seenUrls = /* @__PURE__ */ new Set();
        if (!isTv) {
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
          const details = yield Promise.all(
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
            const fileType = extractFileType(videoUrl, matches[i].quality);
            streams.push({
              name: PROVIDER_NAME,
              title: `[CircleFTP] ${quality}${releaseNote}`,
              url: videoUrl,
              quality,
              type: fileType,
              provider: "circleftp",
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
          const details = yield Promise.all(
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
            const fileType = extractFileType(videoUrl, matches[i].quality);
            streams.push({
              name: PROVIDER_NAME,
              title: `[CircleFTP] S${targetSeason}E${targetEpisode} - ${quality}`,
              url: videoUrl,
              quality,
              type: fileType,
              provider: "circleftp",
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
    });
  }
  function onSettings() {
    return __async(this, null, function* () {
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
    });
  }
  return __toCommonJS(index_exports);
})();

// Universal export for CommonJS (Nuvio) and global (QuickJS / TV sandboxes)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getStreams: typeof __NuvioProvider__ !== "undefined" ? __NuvioProvider__.getStreams : undefined,
    onSettings: typeof __NuvioProvider__ !== "undefined" ? __NuvioProvider__.onSettings : undefined
  };
}
if (typeof globalThis !== "undefined" && typeof __NuvioProvider__ !== "undefined") {
  globalThis.getStreams = __NuvioProvider__.getStreams;
  globalThis.onSettings = __NuvioProvider__.onSettings;
}
if (typeof global !== "undefined" && typeof __NuvioProvider__ !== "undefined") {
  global.getStreams = __NuvioProvider__.getStreams;
  global.onSettings = __NuvioProvider__.onSettings;
}
if (typeof self !== "undefined" && typeof __NuvioProvider__ !== "undefined") {
  self.getStreams = __NuvioProvider__.getStreams;
  self.onSettings = __NuvioProvider__.onSettings;
}
