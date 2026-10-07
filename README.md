# Nuvio BDIX Scrapers (Circle FTP & DFLIX.live)

High-performance, client-side streaming providers for the **Nuvio** app (React Native / Hermes engine), purpose-built for Bangladeshi BDIX networks targeting **Circle FTP** and **DFLIX.live**.

---

## ⚡ Features

- **Direct BDIX Speed:** Streams directly from local FTP hosts (`circleftp.net`, `dflix.live`) over BDIX peering without external proxies or intermediate cloud relay latency.
- **Client-Side & Hermes Ready:**
  - 100% compliant with React Native and Hermes runtime constraints.
  - Zero Node.js-only built-in modules (`fs`, `child_process`, `crypto`, `http`).
  - Uses standard `fetch()` API with `skipSizeCheck: true`.
  - Transpiles `async/await` down to ES2016 generator functions via `esbuild` so that dynamic code evaluation inside Hermes does not throw syntax errors.
- **Strict Nuvio Spec Compliance:**
  - Produces standard Nuvio stream objects (`name`, `title`, `url`, `quality`, optional `subtitles`).
  - Supports movies and TV series (season and episode matching).
  - External subtitle parsing from DFLIX.live (`.srt`).
- **Resilient Matching & Fallbacks:**
  - Multi-key TMDB metadata resolver with IMDB ID (`tt...`) fallback.
  - Fuzzy title normalizer that handles noise, release tags, and brackets.
  - Year validation to prevent false positives between sequels and prequels.
- **Three Independent Scrapers:**
  1. `CircleFTP` (`providers/circleftp.js`): Queries Circle FTP's REST API.
  2. `DFLIX.live` (`providers/dflixlive.js`): Queries DFLIX.live's search & title API.
  3. `BDIX Aggregator` (`providers/bdix.js`): Queries both platforms in parallel with URL deduplication.

---

## 📁 Project Structure

```
nuvio-plugin-circle-dflix/
├── manifest.json              # Nuvio repository manifest for plugin installation
├── package.json               # Build and test scripts
├── build.js                   # Bundler targeting ES2016 for Hermes compatibility
├── server.js                  # Local HTTP server with CORS for Wi-Fi debugging
├── test.js                    # End-to-end live testing suite
├── src/
│   ├── common/
│   │   ├── tmdb.js            # Resilient TMDB metadata resolver
│   │   └── utils.js           # Title matching, quality parser, fetch helper
│   ├── circleftp/
│   │   ├── api.js             # Circle FTP API queries
│   │   ├── constants.js       # Base URLs & defaults
│   │   └── index.js           # CircleFTP provider entry point
│   ├── dflixlive/
│   │   ├── api.js             # DFLIX.live API queries
│   │   ├── constants.js       # Base URLs & defaults
│   │   └── index.js           # DFLIX.live provider entry point
│   └── bdix/
│       └── index.js           # Combined parallel aggregator
└── providers/                 # Built and bundled standalone plugins
    ├── circleftp.js
    ├── dflixlive.js
    └── bdix.js
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Bundles
To compile and bundle files from `src/` into `providers/`:
```bash
npm run build
```

### 3. Run Live Test Suite
Execute the built providers against live BDIX endpoints:
```bash
npm test
```
The test suite verifies:
- Movie stream extraction (`Avatar`)
- TV series episode resolution (`Breaking Bad S01E01`)
- Multi-provider parallel aggregation (`Oppenheimer`)
- Schema conformance to Nuvio's provider interface

---

## 📲 How to Load into the Nuvio App

### Method A: Local Wi-Fi Server (For Fast Development)
1. Start the local server on your PC:
   ```bash
   npm start
   ```
2. Note the LAN URL displayed in the console (e.g. `http://192.168.0.105:3000/manifest.json`).
3. Ensure your phone/TV is on the same Wi-Fi network as your PC.
4. Open the **Nuvio** app:
   - Go to **Settings** &rarr; **Scrapers** (or **Add Repository**).
   - Enter your local manifest URL: `http://<YOUR_PC_IP>:3000/manifest.json`.
   - Toggle on **CircleFTP**, **DFLIX.live**, or **BDIX (Circle + DFLIX)**.

### Direct Installation Link (No Server Required!)

In the **Nuvio** app:
1. Go to **Settings** &rarr; **Scrapers** (or **Add Repository**).
2. Enter the Repository URL:
   ```
   https://raw.githubusercontent.com/mahdirdrmc/nuvio-plugin-circle-dflix/main/manifest.json
   ```
3. Enable **CircleFTP**, **DFLIX.live**, or **BDIX (Circle + DFLIX)**. Done!

### Direct Plugin Files (If Pasting Code Directly into Nuvio)
- **CircleFTP:** [`providers/circleftp.js`](https://raw.githubusercontent.com/mahdirdrmc/nuvio-plugin-circle-dflix/main/providers/circleftp.js)
- **DFLIX.live:** [`providers/dflixlive.js`](https://raw.githubusercontent.com/mahdirdrmc/nuvio-plugin-circle-dflix/main/providers/dflixlive.js)
- **BDIX All-in-One:** [`providers/bdix.js`](https://raw.githubusercontent.com/mahdirdrmc/nuvio-plugin-circle-dflix/main/providers/bdix.js)

---

## 🛠️ Provider Architecture Details

### Circle FTP
- **Search Endpoint:** `http://new.circleftp.net:5000/api/posts?searchTerm=<query>&order=desc`
- **Detail Endpoint:** `http://new.circleftp.net:5000/api/posts/<id>`
- **Content:**
  - Movie (`type: "singleVideo"`): `detail.content` is direct media link.
  - Series (`type: "series"`): `detail.content` is an array of seasons, each with an `episodes` array containing title and stream link.

### DFLIX.live
- **Search Endpoint:** `https://dflix.live/api/search?q=<query>`
- **Title Endpoint:** `https://dflix.live/api/title/<id>`
- **Content:**
  - `files` array contains stream objects with `streamUrl` (e.g. `/api/stream/<id>.mp4` or `/api/stream/<id>.mkv`).
  - Movie: Filter where `!file.season && !file.episode`.
  - Series: Filter where `file.season === season && file.episode === episode`.
  - Subtitles: External subtitles extracted from `file.subtitles` array.

---

## ⚙️ Provider Settings UI (`onSettings`)

Each provider exports `onSettings()` which generates native configuration fields inside Nuvio:
- **Custom API / Base URL:** If your ISP uses internal IP routing (such as `172.16.x.x`), you can customize the base URL directly from the Nuvio settings UI.
- **Custom TMDB Key:** Optional field for your personal TMDB API key.
