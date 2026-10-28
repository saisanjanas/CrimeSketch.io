# CrimeSketch.io — Hack Fest 2026

A full-stack starter for the **AI Crime Scene Sketch Generator from Witness Description**. The interface follows the supplied Dark Futuristic Editorial Tech UI spec: near-black surfaces, electric-lime accents, Space Grotesk headings, monospace metadata, compact borders, and responsive editorial layouts.

## Important modes

- **Demo workspace** is available from the login screen so you can inspect the UI and exercise navigation and form flows immediately. Demo records are sample/browser state only; they are not authenticated, securely stored, or suitable for real evidence. The demo never pretends to have generated a real AI sketch.
- **Live mode** requires PostgreSQL, a strong `JWT_SECRET`, configured email delivery for OTP, and a case user created through registration/email verification. Provider-dependent actions report an explicit error when their integration is unavailable.
- The sketch, transcription, and 3D integrations intentionally fail closed until a provider-specific adapter is connected. A URL/key alone does not guarantee that two providers share the same request format.

## Requirements

- Node.js 20+ and npm
- PostgreSQL 14+
- SMTP account for registration verification and email OTP
- Optional: Ollama and a locally pulled Gemma model
- Optional: Gemini API key, Automatic1111/Forge-compatible Stable Diffusion WebUI API using the SD 1.5 checkpoint, Whisper-compatible provider, and Hitem3D supported integration

## Run the front end / demo mode

1. Open this project directory in a terminal.
2. Install dependencies:

   ```bash
   npm install
   npm --prefix client install
   ```

3. Start the development servers:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` and choose **ENTER DEMO WORKSPACE**.

The frontend's demo mode needs no API keys or database. `/api/health` reports the backend and integration status. In this environment, dependency installation could not be verified, so if npm is unable to fetch packages check your network/proxy settings and rerun the install commands.

## Configure live mode

1. Create a PostgreSQL database, for example `ai_nexus_forensics`.
2. Copy `.env.example` to `.env` and fill in all required values. Generate a long random `JWT_SECRET` (at least 32 characters). Configure `DATABASE_URL`, SMTP, and `CLIENT_ORIGIN`.
3. Install dependencies with the commands above.
4. Apply the schema:

   ```bash
   psql "$DATABASE_URL" -f server/schema.sql
   ```

   On Windows PowerShell, `psql` must be installed and on PATH. If environment-variable expansion differs in your shell, pass the connection string directly to `psql` or use your database tool to run `server/schema.sql`.

5. Start the API and frontend with `npm run dev`.
6. Register an account from the sign-in screen, verify the email OTP, then sign in with password and a second email OTP.
7. Promote the first administrator using a controlled SQL operation only after creating and verifying the account:

   ```sql
   UPDATE users SET role = 'administrator' WHERE email = 'YOUR_VERIFIED_EMAIL';
   ```

Do not use the demo workspace for real case data.

## Optional AI configuration

### Gemma 4 through Ollama

1. Install Ollama: <https://ollama.com/download>
2. Pull the Gemma model tag available in your Ollama installation. Check the installed tag with `ollama list` and set `OLLAMA_MODEL` to exactly that tag.
3. Start Ollama and check `http://localhost:11434` locally.
4. Set `OLLAMA_BASE_URL` and `OLLAMA_MODEL` in `.env`. The `/api/ai/ask` endpoint uses a constrained system prompt and stores assistant messages in the configured database.

Model tags can change. Do not assume that a tag copied from a tutorial is available without checking `ollama list`.

### Gemini Flash report content

Set `GEMINI_API_KEY` and `GEMINI_MODEL` on the server only. Never include the API key in any Vite `VITE_*` variable or browser code. The backend returns validated JSON content; the front end uses jsPDF for document layout and download.

### Stable Diffusion 1.5 sketch generation and refinement

The server includes an adapter for the Automatic1111 / Forge-compatible Stable Diffusion WebUI API (`/sdapi/v1/txt2img` and `/sdapi/v1/img2img`). Run a WebUI-compatible instance with API access enabled, load the Stable Diffusion 1.5 checkpoint, then set `STABLE_DIFFUSION_API_URL` to the private service base URL (for example, `http://127.0.0.1:7860`). Add `STABLE_DIFFUSION_API_KEY` only if your deployment uses a compatible bearer-token gateway. Keep the inference service private; do not expose an unauthenticated WebUI API directly to the public internet.

The backend saves returned images to the private upload directory, versions sketch outputs, and provides protected case-image routes. If no provider is configured or an image is not returned, the app reports an error rather than fabricating a result.

### Whisper and Hitem3D

These integrations require provider-specific adapters and are not fully implemented in this source project. The API returns explicit unavailable/not-implemented responses until a supported service adapter is completed; no transcript or 3D output is fabricated.

## Security and deployment notes

- Set `NODE_ENV=production`, use HTTPS, use a trusted proxy configuration only if you deploy behind one, and use secure environment variables / secret management.
- Configure `TRUST_PROXY_HOPS` only when the proxy topology is understood. Incorrect proxy trust can make IP logging unreliable.
- The server stores uploads in `UPLOAD_DIR`, which must be outside the public static directory and protected by filesystem permissions. Back up and restrict this directory appropriately.
- MAC addresses are not normally visible to remote websites. IP and user-agent metadata are not proof of identity and should be combined with authentication and role-based access control.
- Evidence, transcripts, prompts, translations, and reports may be sensitive. Check institutional authorization and provider data-handling terms before sending them to hosted AI services.
- Review retention policies, access controls, database backups, file scanning, and legal/procedural requirements before production use.
- This project is a hackathon starter, not a certified forensic or evidence-management system. Obtain a security review before real investigations.

## Current integration status

| Capability | Status in this source project |
|---|---|
| Editorial UI and responsive navigation | Implemented |
| Demo workspace and clearly labelled sample data | Implemented |
| PostgreSQL schema and backend account/case APIs | Implemented; requires PostgreSQL setup |
| Password + email OTP and email verification | Implemented; requires PostgreSQL + SMTP |
| Case metadata, permissions, private file upload | Backend starter implemented; production hardening still required |
| Gemma/Ollama constrained assistant | Implemented when Ollama and database are configured |
| Gemini Flash structured report content | Implemented when Gemini key and database are configured |
| PDF download/layout | Implemented with jsPDF; demo reports are visibly marked |
| Stable Diffusion 1.5 generation/refinement | Automatic1111/Forge-compatible WebUI adapter implemented; requires a running SD 1.5 WebUI service |
| Whisper transcription | Provider-specific adapter still required |
| Hitem3D 3D generation | Provider-specific adapter still required |
| Audit events and role-restricted log endpoint | Implemented for defined backend actions; extend as integrations are completed |
| Tamper-evident audit storage / digital signatures | Not implemented; do not claim these properties |

## Structure

```text
ai-nexus-forensics/
├── client/                 # React + Vite UI
│   └── src/                # App screens and design system
├── server/
│   ├── index.js            # Express API and service adapters
│   ├── schema.sql          # PostgreSQL schema
│   └── private_uploads/    # Private local upload target (ignored by Git)
├── .env.example
└── package.json
```
