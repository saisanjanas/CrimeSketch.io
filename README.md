# 🔍 CrimeSketch.io
### AI-Powered Crime Scene Sketch Generator

<p align="center">
  <strong>Transforming Witness Descriptions into AI-Assisted Forensic Facial Sketches</strong>
</p>

<p align="center">
  🔐 Secure Case Management &nbsp; • &nbsp; 🧠 AI-Assisted Analysis &nbsp; • &nbsp; 🎨 Sketch Generation &nbsp; • &nbsp; 📄 Digital Reporting
</p>

---

## 🌟 About the Project

**CrimeSketch.io** is a secure, full-stack starter platform designed to help authorized investigators transform witness descriptions into reviewable forensic-style facial sketches.

The platform provides a structured workflow that brings together:

- 📝 Structured evidence intake
- 🧠 AI-assisted facial attribute extraction
- 🎨 Versioned AI sketch generation
- 💬 Interactive sketch refinement
- 📁 Case and evidence management
- 📄 Report generation and documentation

> ⚠️ **Project Disclaimer**
>
> CrimeSketch.io is a Hackfest 2026 prototype, not a certified forensic or evidence-management system.

---

## ⚙️ How It Works

The platform follows a four-stage workflow, from collecting witness evidence to reviewing and documenting generated sketches.

### 01 | 📥 Evidence Intake

Investigators can work with witness descriptions and supported evidence formats, including:

- 📝 Text descriptions
- 🎙️ Audio recordings
- 🖼️ Images
- 📑 PDF documents

Depending on the configured integrations, evidence can be transcribed, translated, or text-extracted.

**Key Principle:** Original witness statements should remain available for investigator review.

### 02 | 🧠 Structured Facial Description

The intended workflow uses a local **Gemma model through Ollama** to help extract facial attributes from witness descriptions.

The attributes include:

- Age range
- Face shape
- Jawline
- Eyes
- Eyebrows
- Nose
- Mouth
- Hair
- Facial hair
- Distinguishing features

Unspecified attributes should remain marked as **Not Provided**.

Investigators review and confirm the extracted facial description before proceeding to sketch generation.

### 03 | 🎨 Sketch Generation & Refinement

CrimeSketch.io includes an adapter for an **Automatic1111/Forge-compatible Stable Diffusion WebUI API**, using a Stable Diffusion 1.5 checkpoint.

When configured, the system can generate and refine monochrome, forensic-style sketch images.

Features include:

- AI-assisted facial sketch generation
- Sketch refinement
- Multiple reviewable sketch versions
- Investigator-controlled approval

**Important:** Previously approved sketches should never be silently replaced. Investigators must explicitly approve changes.

### 04 | 📊 Review & Reporting

The final stage focuses on reviewing generated sketches and documenting case information.

The intended workflow includes:

- 🔍 Reviewing generated facial sketches
- 📄 Generating case reports
- 🧊 Optionally creating 3D face models

**Implementation details:**

- PDF report layout and Gemini-based structured report content are implemented when configured.
- Whisper transcription and Hitem3D generation still require supported provider-specific adapters in this source project.

---

## 🔐 Security & Accountability

Security and accountability are important considerations when handling sensitive case information.

CrimeSketch.io includes the following security-related capabilities:

| 🔒 Feature | Description |
|---|---|
| 🔑 Authentication | Password-based authentication |
| 📧 Email Verification | Email verification and OTP support |
| 👥 Role-Based Access | Backend permission enforcement for supported operations |
| 📁 Evidence Protection | Case information and evidence uploads require appropriate access controls |
| 📋 Audit Logging | Audit events for defined backend actions |
| 🌐 Request Metadata | IP address and user-agent metadata may be recorded |

### 🛡️ Important Security Considerations

- IP address and user-agent metadata do not prove identity.
- Ordinary websites cannot access a visitor's MAC address.
- Evidence, transcripts, prompts, and reports may contain sensitive information.
- Review authorization, data retention, and provider data-handling policies before using real case material.
- Audit coverage should be extended as additional integrations are completed.

---

## 🛠️ Technology Stack

CrimeSketch.io combines modern web technologies with configurable AI integrations.

| Layer | Technology |
|---|---|
| 🎨 Frontend | React + Vite |
| ⚙️ Backend | Node.js + Express |
| 🗄️ Database | PostgreSQL |
| 🧠 Local AI | Ollama + supported Gemma model |
| 🎨 Sketch Generation | Automatic1111/Forge-compatible Stable Diffusion WebUI API |
| 🤖 Report Content | Gemini API |
| 📄 Document Generation | jsPDF |
| 🎙️ Optional Transcription | Whisper-compatible integration |
| 🧊 Optional 3D Generation | Hitem3D |

---

## 📋 System Requirements

Before setting up the project, ensure the following requirements are available.

| Requirement | Version / Details |
|---|---|
| Node.js | 20 or later |
| npm | Required |
| PostgreSQL | 14 or later |
| SMTP | Credentials required for email verification and OTP |
| Ollama | Optional |
| Gemma Model | Optional, locally available |
| Gemini API | Optional |
| Stable Diffusion WebUI | Optional |

---

## 🚀 Getting Started

Follow these steps to configure and run CrimeSketch.io locally.

### 📦 Step 1: Install Dependencies

Open PowerShell in the project root directory.

Install the root dependencies:

```powershell
npm install
```

Install the frontend dependencies:

```powershell
npm --prefix client install
```

### 🔧 Step 2: Configure Environment Variables

Copy `.env.example` to `.env` and configure the required environment variables.

Make sure to configure:

- PostgreSQL connection string
- Strong `JWT_SECRET`
- SMTP settings
- `CLIENT_ORIGIN`

> 🔐 **Security Reminder:** Never commit `.env`, API keys, passwords, or other secrets to GitHub.

### 🗄️ Step 3: Initialize the Database

Create a PostgreSQL database.

Example database name:

```text
ai_nexus_forensics
```

Apply the database schema:

```powershell
psql -U postgres -h localhost -p 5432 -d ai_nexus_forensics -f server/schema.sql
```

Adjust the username, port, and database name according to your configuration.

### ▶️ Step 4: Start the Application

From the project root directory, execute:

```powershell
npm run dev
```

Open the local frontend address displayed by Vite.

Usually:

```text
http://localhost:5173
```

If the root development script is unavailable, check `package.json` for the configured frontend and backend scripts.

### ❤️ Step 5: Verify the Backend

Open the following endpoint in your browser:

```text
http://localhost:4100/api/health
```

The health endpoint reports the backend and integration status.

**Note:** A configured endpoint does not necessarily mean every provider-specific workflow is fully implemented.

---

## 🤖 Optional AI Configuration

CrimeSketch.io supports additional AI capabilities when the required services and credentials are configured.

### 🧠 1. Gemma Through Ollama

To enable local AI-assisted facial attribute extraction:

1. Install Ollama.
2. Check the available model tags:

```powershell
ollama list
```

3. Configure the following environment variables in `.env`:

```env
OLLAMA_BASE_URL=
OLLAMA_MODEL=
```

Use a model tag that is actually available in your installation.

### 🎨 2. Stable Diffusion Sketch Generation

To enable AI-powered facial sketch generation:

1. Run an Automatic1111/Forge-compatible WebUI.
2. Enable API access.
3. Load a compatible Stable Diffusion 1.5 checkpoint.
4. Configure the WebUI endpoint:

```env
STABLE_DIFFUSION_API_URL=
```

> ⚠️ Keep the inference service private. Do not expose an unauthenticated API to the public internet.

### 📄 3. Gemini-Based Reports

To enable Gemini-based structured report content, configure:

```env
GEMINI_API_KEY=
GEMINI_MODEL=
```

**Security Reminder:** Never expose the Gemini API key in frontend code or a `VITE_*` variable.

### 🎙️ 4. Whisper & Hitem3D

These integrations require provider-specific adapters and are not fully implemented in this source project.

Do not treat these integrations as operational until the required adapters and services have been tested.

---

## 📊 Current Implementation Status

The following table summarizes the current development and integration status of CrimeSketch.io.

| Capability | Implementation Status |
|---|---|
| ⚛️ React/Vite Interface & Navigation | ✅ Implemented |
| 🧪 Demo Workspace | ✅ Implemented; sample data only |
| 🗄️ PostgreSQL Schema & Backend APIs | 🟡 Implemented; requires configuration |
| 🔐 Password Authentication & Email OTP | 🟡 Requires database and SMTP configuration |
| 📁 Case Metadata & Private File Upload | 🟡 Backend starter implemented; production hardening required |
| 🧠 Gemma/Ollama Assistant | 🟡 Available when configured |
| 🤖 Gemini Report Content | 🟡 Available when configured |
| 📄 PDF Layout & Download | ✅ Implemented |
| 🎨 Stable Diffusion Generation/Refinement | 🟡 Adapter implemented; requires compatible running service |
| 🎙️ Whisper Transcription | 🔧 Provider-specific adapter required |
| 🧊 Hitem3D 3D Generation | 🔧 Provider-specific adapter required |
| 📋 Audit Events | 🟡 Implemented for defined actions; coverage can be extended |
| 🛡️ Tamper-Evident Audit Storage & Digital Signatures | ❌ Not implemented |

**Status Legend**

- ✅ Implemented
- 🟡 Implemented with configuration requirements or limitations
- 🔧 Requires additional integration
- ❌ Not implemented

---

## 📂 Project Structure

The project follows a modular structure separating the frontend, backend, database schema, and documentation.

```text
ai-nexus-forensics/
│
├── client/
│   └── src/
│
├── server/
│   ├── index.js
│   ├── schema.sql
│   └── private_uploads/
│
├── docs/
│
├── .env.example
├── package.json
└── README.md
```

---

## 🎯 Project Vision

CrimeSketch.io aims to bring evidence intake, AI-assisted facial description, sketch generation, case management, and reporting into one structured platform.

By combining modern full-stack development with configurable AI integrations, the project demonstrates how technology can support investigators in organizing witness-provided information and producing reviewable facial sketches.

**Built with 💻 Technology, 🧠 AI, and 🔍 a Focus on Responsible Investigation.**

---

<p align="center">
  <strong>🔍 CrimeSketch.io — From Witness Descriptions to Reviewable Sketches.</strong>
  <br/>
  <sub>Hackfest 2026 | Prototype Project</sub>
</p>
## Security Notice

Use demo mode only with sample data. Before any real investigative use, review authentication, authorization, evidence retention, upload validation, audit coverage, database backups, legal requirements, and external AI provider data-handling terms. This prototype is not a substitute for a validated forensic system.
