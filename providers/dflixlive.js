/**
 * dflixlive - Nuvio Provider (BDIX / NuvioTV)
 * Generated: 2026-11-10T14:29:46.425Z
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

  // src/dflixlive/index.js
  var index_exports = {};
  __export(index_exports, {
    getStreams: () => getStreams,
    onSettings: () => onSettings
  });

  // src/dflixlive/constants.js
  var PROVIDER_NAME = "DFLIX.live";
  var DEFAULT_BASE_URL = "https://dflix.live";

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

  // src/dflixlive/api.js
  function searchTitles(baseUrl, query, timeoutMs = 1e4) {
    return __async(this, null, function* () {
      try {
        const cleanBase = baseUrl.replace(/\/+$/, "");
        const url = `${cleanBase}/api/search?q=${encodeURIComponent(query)}`;
        const res = yield safeFetch(url, {
          headers: { "Accept": "application/json" }
        }, timeoutMs);
        if (!res.ok) return [];
        const data = yield res.json();
        return Array.isArray(data.results) ? data.results : [];
      } catch (err) {
        console.log(`[DFLIX.live] Search failed for "${query}":`, err.message);
        return [];
      }
    });
  }
  function getTitleDetails(baseUrl, id, timeoutMs = 1e4) {
    return __async(this, null, function* () {
      try {
        const cleanBase = baseUrl.replace(/\/+$/, "");
        const url = `${cleanBase}/api/title/${id}`;
        const res = yield safeFetch(url, {
          headers: { "Accept": "application/json" }
        }, timeoutMs);
        if (!res.ok) return null;
        return yield res.json();
      } catch (err) {
        console.log(`[DFLIX.live] Details fetch failed for id ${id}:`, err.message);
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

  // src/dflixlive/index.js
  function getStreams(_0, _1) {
    return __async(this, arguments, function* (tmdbId, mediaType, season = null, episode = null, userSettings = {}) {
      try {
        const globalSettings = typeof globalThis !== "undefined" && globalThis.SCRAPER_SETTINGS || {};
        const settings = __spreadValues(__spreadValues({}, globalSettings), userSettings || {});
        const baseUrl = settings.dflixBaseUrl || DEFAULT_BASE_URL;
        const cleanBase = baseUrl.replace(/\/+$/, "");
        const customTmdbKey = settings.tmdbApiKey || null;
        const isTv = mediaType === "tv" || mediaType === "series" || mediaType === "tvshow";
        const meta = yield resolveMetadata(tmdbId, mediaType, customTmdbKey);
        if (!meta || !meta.title) {
          console.log(`[DFLIX.live] Could not resolve metadata for TMDB ID: ${JSON.stringify(tmdbId)}`);
          return [];
        }
        const searchQuery = meta.title;
        console.log(`[DFLIX.live] Searching "${searchQuery}" (${meta.year || "unknown year"}) [${mediaType}]`);
        const results = yield searchTitles(cleanBase, searchQuery);
        if (!results || results.length === 0) {
          console.log(`[DFLIX.live] No search results for: ${searchQuery}`);
          return [];
        }
        const expectedKind = isTv ? "tv" : "movie";
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
        const detailList = yield Promise.all(
          bestMatches.map((m) => getTitleDetails(cleanBase, m.id))
        );
        const streams = [];
        const seenUrls = /* @__PURE__ */ new Set();
        for (const details of detailList) {
          if (!details || !Array.isArray(details.files)) continue;
          let relevantFiles = [];
          if (!isTv) {
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
            const epLabel = isTv ? `S${file.season}E${file.episode} - ` : "";
            const fileType = extractFileType(fullStreamUrl, file.container);
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
            streams.push(__spreadValues({
              name: PROVIDER_NAME,
              title: `[DFLIX.live] ${epLabel}${quality} [${container}]`,
              url: fullStreamUrl,
              quality,
              type: fileType,
              provider: "dflixlive",
              headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"
              }
            }, subtitles.length > 0 ? { subtitles } : {}));
          }
        }
        console.log(`[DFLIX.live] Found ${streams.length} stream(s) for "${meta.title}"`);
        return streams;
      } catch (error) {
        console.log(`[DFLIX.live] Unexpected error in getStreams:`, error.message);
        return [];
      }
    });
  }
  function onSettings() {
    return __async(this, null, function* () {
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
