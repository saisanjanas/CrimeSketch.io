# CrimeSketch.io — AI Crime Scene Sketch Generator

CrimeSketch.io is a secure, full-stack starter platform designed to help authorized investigators turn witness descriptions into reviewable forensic-style facial sketches. It provides structured evidence intake, AI-assisted facial attribute extraction, versioned sketch generation, case management, and reporting workflows.

This project is a Hackfest 2026 prototype, not a certified forensic or evidence-management system.

## How It Works

### Step 1: Evidence Intake
Investigators can work with witness descriptions and supported evidence formats, including text, audio, images, and PDFs. Depending on the configured integrations, evidence can be transcribed, translated, or text-extracted. Original statements should remain available for investigator review.

### Step 2: Structured Facial Description
The intended workflow uses a local Gemma model through Ollama to help extract facial attributes such as age range, face shape, jawline, eyes, eyebrows, nose, mouth, hair, facial hair, and distinguishing features.

Unspecified attributes should remain marked as not provided. Investigators review and confirm the description before using it for sketch generation.

### Step 3: Sketch Generation and Refinement
The project includes an adapter for an Automatic1111/Forge-compatible Stable Diffusion WebUI API using a Stable Diffusion 1.5 checkpoint. When configured, it can generate and refine monochrome sketch-style images.

Generated versions should remain reviewable. Investigators should explicitly approve changes rather than having an earlier approved sketch silently replaced.

### Step 4: Review and Reporting
The intended workflow includes reviewing the sketch, generating a case report, and optionally creating a 3D face model.

PDF report layout and Gemini-based structured report content are implemented when configured. Whisper transcription and Hitem3D generation still require supported provider-specific adapters in this source project.

## Security and Accountability

- Password-based authentication, email verification, and email OTP require the appropriate database and SMTP configuration.
- Role-based permissions are enforced by the backend for supported operations.
- Case information and evidence uploads require appropriate access controls.
- Audit events are implemented for defined backend actions; extend coverage as additional integrations are completed.
- IP address and user-agent metadata may be recorded. These do not prove identity, and ordinary websites cannot access a visitor's MAC address.
- Evidence, transcripts, prompts, and reports may contain sensitive information. Review authorization, data retention, and provider data-handling policies before using real case material.

## Technology Stack

- **Frontend:** React and Vite
- **Backend:** Node.js and Express
- **Database:** PostgreSQL
- **Local AI:** Ollama with a supported Gemma model
- **Sketch generation:** Automatic1111/Forge-compatible Stable Diffusion WebUI API
- **Report content:** Gemini API
- **Document generation:** jsPDF
- **Optional integrations:** Whisper-compatible transcription and Hitem3D, subject to adapter availability

## Requirements

- Node.js 20 or later
- npm
- PostgreSQL 14 or later
- SMTP credentials for email verification and OTP
- Optional: Ollama and a locally available Gemma model
- Optional: configured Gemini API and Stable Diffusion WebUI services

## Run the Project

Open PowerShell in the project root directory.

### 1. Install dependencies

```powershell
npm install
npm --prefix client install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and configure the required values, including the PostgreSQL connection string, a strong `JWT_SECRET`, SMTP settings, and `CLIENT_ORIGIN`.

Never commit `.env`, API keys, passwords, or other secrets to GitHub.

### 3. Initialize the database

Create the PostgreSQL database, for example `ai_nexus_forensics`, and apply the schema:

```powershell
psql -U postgres -h localhost -p 5432 -d ai_nexus_forensics -f server/schema.sql
```

Adjust the username, port, and database name to match your configuration.

### 4. Start the application

From the project root:

```powershell
npm run dev
```

Open the local frontend address shown by Vite, usually `http://localhost:5173`.

If the root development script is unavailable, check `package.json` for the configured frontend and backend scripts.

### 5. Verify the backend

Open:

`http://localhost:4100/api/health`

The health endpoint reports the backend and integration status. A configured endpoint does not necessarily mean every provider-specific workflow is fully implemented.

## Optional AI Configuration

### Gemma Through Ollama
Install Ollama, check available model tags with `ollama list`, and configure `OLLAMA_BASE_URL` and `OLLAMA_MODEL` in `.env`. Use a model tag that is actually available in your installation.

### Stable Diffusion Sketch Generation
Run an Automatic1111/Forge-compatible WebUI with API access enabled and a compatible Stable Diffusion 1.5 checkpoint loaded. Configure `STABLE_DIFFUSION_API_URL` in the server environment. Keep the inference service private and do not expose an unauthenticated API to the public internet.

### Gemini Reports
Configure `GEMINI_API_KEY` and `GEMINI_MODEL` on the server. Never expose the API key in frontend code or a `VITE_*` variable.

### Whisper and Hitem3D
These integrations require provider-specific adapters and are not fully implemented in this source project. Do not treat them as operational until the required adapters and services have been tested.

## Current Implementation Status

| Capability | Status |
|---|---|
| React/Vite interface and navigation | Implemented |
| Demo workspace | Implemented; sample data only |
| PostgreSQL schema and backend APIs | Implemented; requires configuration |
| Password authentication and email OTP | Requires database and SMTP configuration |
| Case metadata and private file upload | Backend starter implemented; production hardening required |
| Gemma/Ollama assistant | Available when configured |
| Gemini report content | Available when configured |
| PDF layout and download | Implemented |
| Stable Diffusion generation/refinement | Adapter implemented; requires compatible running service |
| Whisper transcription | Provider-specific adapter required |
| Hitem3D 3D generation | Provider-specific adapter required |
| Audit events | Implemented for defined actions; coverage can be extended |
| Tamper-evident audit storage and digital signatures | Not implemented |

## Project Structure

```text
ai-nexus-forensics/
├── client/
│   └── src/
├── server/
│   ├── index.js
│   ├── schema.sql
│   └── private_uploads/
├── docs/
├── .env.example
├── package.json
└── README.md
```

## Security Notice

Use demo mode only with sample data. Before any real investigative use, review authentication, authorization, evidence retention, upload validation, audit coverage, database backups, legal requirements, and external AI provider data-handling terms. This prototype is not a substitute for a validated forensic system.
