**Hello GPT OSS (Cloudflare Workers)**

- **Overview**: A simple API on Cloudflare Workers that calls Cloudflare AI `@cf/openai/gpt-oss-120b`. Now routes inference via **Cloudflare AI Gateway** for metrics, caching, safety controls, and observability.
- **Endpoints**: `POST /text-input`, `POST /text-input-object`, `POST /structured-output` (implemented in `src/index.ts`).

**Type Support (Workaround for gpt-oss)**

- Workers AI types do not yet officially include `@cf/openai/gpt-oss-120b`. As a workaround, this repo locally augments the `AiModels` interface so TypeScript understands the input/output shape.
- See `ai-models-augment.d.ts:1` for the augmentation and model IO shape. This enables typed calls to `env.AI.run('@cf/openai/gpt-oss-120b', …)` used in `src/index.ts:1`.
- The request schema in `src/schema.ts:1` mirrors the same shape to validate inputs at runtime.
- When official typings are available in Workers AI, remove the local augmentation from `ai-models-augment.d.ts:1` and rely on the upstream types. Until then, treat the shape as provisional and subject to change.
  **Prerequisites**

- **Node.js** and **pnpm/npm** available
- **Wrangler** is included as a devDependency (use via `npm run dev`)
- Cloudflare account for deploys. The AI binding is configured as `AI` in `wrangler.jsonc`.
- AI Gateway created in your Cloudflare account. Note the Gateway ID/slug (used as `GATEWAY_ID`).

**Local Development**

- Install deps: `pnpm i` or `npm i`
- Start dev server: `npm run dev` (defaults to `http://localhost:8787`)
- Configure env vars for dev: add `GATEWAY_ID` to `.dev.vars`. This repo already includes an example: `.dev.vars:1`.

**API**

- `POST /text-input` (`text/plain`): Send the prompt as the request body. Responds with model output (JSON string). `src/index.ts:1`
- `POST /text-input-object` (`application/json`): Request body must match the schema below. `src/schema.ts:1`
  - `instructions?: string`
  - `input: string | [{ role: 'developer' | 'user', content: string }]`
- Requests are routed through AI Gateway using `gateway: { id: env.GATEWAY_ID }`. See `src/index.ts:1`.

**AI Gateway Setup**

- **Create a Gateway**: Cloudflare Dashboard → AI → AI Gateway → Create. Choose a name (this becomes your gateway slug/ID) and enable any features you want (caching, safety, logging, rate limits, etc.).
- **Get Gateway ID**: Copy the gateway slug/ID from the dashboard.
- **Wire it to Workers AI**: This worker already passes `gateway: { id: env.GATEWAY_ID }` to `env.AI.run`. Provide the ID via env vars/secrets (below).

**Environment Variables**

- `GATEWAY_ID`: Your AI Gateway ID/slug.
  - Local (dev): add to `.dev.vars` (already present as an example).
  - Production: `wrangler secret put GATEWAY_ID` (or set as an environment variable in your deployment pipeline). Ensure this is defined before deploying.

**curl Scripts**

- Text: `scripts/curl-text.sh "Hello! Summarize this."` or `echo "A question" | scripts/curl-text.sh` (`scripts/curl-text.sh:1`)
- JSON: `scripts/curl-object.sh scripts/sample-payload.json` (`scripts/curl-object.sh:1`)
- Structured: `scripts/curl-structured.sh scripts/sample-payload.json` (`scripts/curl-structured.sh:1`)
- Switch base URL: `BASE_URL="https://<your-worker>.workers.dev" scripts/curl-text.sh "Hello"`

**Sample JSON**

- See `scripts/sample-payload.json:1` for an example payload.

**Deploy**

- `npm run deploy`
- You may need to run `wrangler login` the first time
- Before deploy, set `GATEWAY_ID` in production (see Environment Variables).

**Notes / Troubleshooting**

- 404: Verify path and method (`POST /text-input`, `POST /text-input-object`). `src/index.ts:1`
- 400: Likely schema mismatch or empty prompt. `src/schema.ts:1`
- Default `BASE_URL` is `http://localhost:8787`. Set `BASE_URL` to switch to your production URL.
- Missing Gateway: If `GATEWAY_ID` is unset or incorrect, requests may fail at `env.AI.run`. Double‑check the value and that the Gateway exists.
- Observability: After routing via AI Gateway, use the Cloudflare dashboard to view usage, latency, and cache metrics per model/endpoint.

**Structured Output**

- **Endpoint**: `POST /structured-output` (`application/json`).
- **What it does**: Forces the model to return a JSON object that matches a predefined JSON Schema. The worker validates and returns only the parsed, typed JSON. See `src/index.ts:1` and `src/schema.ts:1`.
- **Schema (Zod → JSON Schema)**: The worker uses the following Zod shape and converts it to JSON Schema for `text.format`:
  - `user_request: string`
  - `thought_process: string[]`
  - `final_answer: string`

- **Sample request body** (minimal — same shape as `scripts/sample-payload.json:1`):

  ```json
  {
    "instructions": "You are a concise assistant.",
    "input": [
      { "role": "user", "content": "日本語で、寿司の注文方法を3ステップで教えて。" }
    ]
  }
  ```

- **How it’s enforced**: The handler injects `text.format` with `type: "json_schema"`, a `name`, the generated `schema`, and `strict: true` when calling `env.AI.run`. The response’s `output_text` is parsed as JSON and validated with the same Zod schema before returning. See `src/index.ts:1`.

- **Example response** (shape example; actual text varies):

  ```json
  {
    "user_request": "日本語で、寿司の注文方法を3ステップで教えて。",
    "thought_process": [
      "リクエストを要約し、手順の粒度を決める",
      "シンプルな3ステップに分解する",
      "店舗や状況に依存しない表現に整える"
    ],
    "final_answer": "1) カウンターか席に着いたら『おすすめをお願いします』など希望を伝える。2) 1～2貫ずつ順番に注文し、苦手や予算も適宜伝える。3) 締めに味噌汁や巻物を頼み、会計をお願いする。"
  }
  ```

- **Try it**: `scripts/curl-structured.sh scripts/sample-payload.json` (set `BASE_URL` to target prod). The server returns only the validated JSON object.
