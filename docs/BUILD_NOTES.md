# Build notes

- The sample case records are intentionally marked as demo data in the UI. They are not seeded into PostgreSQL.
- Live registration is closed if SMTP settings are absent. Login is closed if OTP email delivery cannot be configured.
- Live sessions are stored in an HTTP-only cookie; the UI does not read the session token.
- The API uses PostgreSQL-backed case permission checks and writes audit events for key current endpoints.
- Stable Diffusion 1.5, Whisper, and Hitem3D routes do not return fabricated output. They require a concrete provider-specific adapter before they can be activated.
- The frontend creates a real downloadable PDF; when in demo mode, that file is marked as a demo and describes its limitations.
