# lib/coach-ai

Pure helpers for the Coach AI feature; the route is `src/app/api/coach-ai/route.ts`, the UI is `src/components/coach-ai/`, state in `src/stores/coach-ai-store.ts`.

- `prompt.ts` + `coach-rules.md` + `tier-kb.ts`: system prompt, coaching rules, per-tier knowledge base (tier chosen by `tierForCategory`).
- `request.ts`: parses and bounds the request body (`MAX_TOKENS`, message length limits).
- `stream.ts` / `stream-split.ts`: read MiniMax SSE into text tokens; `reveal.ts` and `use-revealed-text` pace the display.
- `web-search.ts`: optional Cohere planner then Tavily search with an 8 second deadline; falls back to `WEB_UNAVAILABLE`.
- `rate-limit.ts`: constants (`COACH_LIMIT` 20 per `COACH_WINDOW_MS`); persistence is in `lib/db/rate-limit.ts`.
- `coach-take.ts`, `citations.ts`, `markdown.ts`, `threads-client.ts`: rendering and persistence helpers.

Gotchas: `web-search.test.ts` includes a real 8 second timeout test, so the suite takes about 10 seconds. Keep these modules free of Node-only APIs (they run in the Worker).
