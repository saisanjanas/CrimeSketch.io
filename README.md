# CrimeSketch.IO: AI Crime Scene Sketch Generator from Witness Description
CrimeSketch.io is a secure, full-stack web platform that helps authorized investigators turn witness descriptions into reviewable forensic-style facial sketches. Witnesses often struggle to describe a face, and sketch artists aren’t always available. CrimeSketch.io gives investigators a faster, structured, fully documented starting point.

# How it works

STEP1 : 
Evidence intake:
Investigators add witness input as text, voice recordings, images or PDFs. Voice is transcribed locally with Whisper, PDFs are text-extracted, and non-English statements are translated into English. The original statement is kept next to the translation, and the investigator can review and correct each transcript.

STEP 2:
Structured description:
Gemma 4, running locally through Ollama, extracts facial attributes: age range, face shape, jawline, eyes, eyebrows, nose, mouth, hairline, hairstyle, facial hair and distinguishing features. Anything the witness didn’t state is marked “Not provided”, and the AI asks one focused follow-up question at a time. The investigator edits and confirms the description before it can be used.

STEP 3:
Sketch generation:
Stable Diffusion 1.5 creates a monochrome, pencil-style sketch from the confirmed attributes. Every generation is saved as a numbered version.
Iterative refinement. Through a chat, the investigator can say things like “make the nose narrower” or “thicker eyebrows”. Each request becomes a reviewable change that can be accepted, rejected, retried or restored, and ambiguous requests trigger a clarifying question. Nothing replaces the approved sketch without the investigator’s explicit choice.

STEP 4
Final output. After approving a sketch, the investigator can attempt an approximate 3D face model through Hitem3D. They can also generate a professional PDF case report, written with Gemini Flash from confirmed case data only. It covers the witness statements, translations, confirmed attributes, evidence inventory, sketch history, approval status and limitations, and never invents facts.

# Security and accountability

1.Email and password login with a separate emailed one-time code, with expiry, attempt limits and rate limiting.
2.Administrator, investigator and reviewer roles, enforced on the server for every operation.
3.Private evidence storage, with files served only to authorized users.
4.An append-only audit log recording logins, case access, uploads, sketch generation, approvals and report exports, with filters and CSV export.
5.Server-observed IP and device metadata is recorded. The platform does not claim MAC-address tracking, which browsers don’t expose.



# Tech stack:
Node.js and Express, a SQL database, Ollama with Gemma 4, Whisper, Stable Diffusion 1.5, Gemini Flash and Hitem3D.
