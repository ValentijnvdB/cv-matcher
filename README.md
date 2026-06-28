# CV Matcher

A browser-based tool for HR recruiters to match CVs against job vacancy requirements using an LLM. No backend required — all processing runs client-side against your own LLM provider.

## Features

- **Vacancy parsing** — paste text or upload a PDF/image; the LLM extracts structured requirements automatically
- **Requirement management** — edit, reorder, and prioritize requirements (`must` / `should` / `nice`)
- **CV analysis** — upload multiple CVs (PDF, image, or text); each is scored per requirement with a short reasoning
- **Weighted scoring** — configurable weights per priority level and configurable match thresholds (Excellent / Good / Fair / None)
- **Stale-analysis detection** — hash-based change detection flags CVs that were analyzed against an older version of the requirements, with a bulk re-analyze flow
- **Multi-provider LLM support** — OpenAI, Anthropic Claude, and Ollama (local); per-provider API key and model settings
- **Persistent storage** — vacancy, requirements, and CV analyses are stored in IndexedDB; settings in localStorage
- **Import / Export** — full session state serializable to/from JSON

## Tech stack

- [Vue 3](https://vuejs.org/) + [Pinia](https://pinia.vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/) v3
- [Vite](https://vitejs.dev/) v8
- [pdf.js](https://mozilla.github.io/pdf.js/) for client-side PDF text extraction (used as fallback for Ollama, which lacks native PDF support)
- IndexedDB for persistent storage

## Getting started

**Prerequisites:** Node.js ≥ 18

```bash
npm install
npm run dev
```

The app is now available at `http://localhost:5173`.

On first run, go to **Settings → Connections**, select your LLM provider, and enter your API key (or Ollama base URL). Use the connection test to verify before proceeding.

## Build

```bash
npm run build
```

Output is written to `dist/`. The build is fully static and can be served from any web server or CDN.

```bash
# Preview the production build locally
npm run preview
```

## Usage

Once running see the 'How does it work?' tab for a full explanation.