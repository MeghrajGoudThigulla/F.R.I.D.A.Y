# F.R.I.D.A.Y - Universal Career Copilot & Job Matcher

F.R.I.D.A.Y is an evidence-first, privacy-focused career workspace and job-matching platform designed for workers across 7 occupational clusters (Software, Healthcare, Skilled Trades, Education/Public, Finance/Corporate, Retail/Hospitality, and Creative). It operates entirely client-side with zero server overhead and zero cloud maintenance costs.

---

## Key Differentiators & Production Architecture

- **Deterministic Word-Boundary Fact Gate:** Enforces *"Reformulate, never fabricate."* Checks quantitative metrics (`35%`, `$1.2M`, `15,000`) and high-risk credentials (`RN`, `CPA`, `CDL`, `Clearances`) using strict word boundaries—preventing substring false passes (e.g. `5` never matches `15`, `rn` never matches `concern`). The gate inspects the entire document payload (headline, summary, bullets, cover letter, outreach, and STAR answers) and blocks export if unverified claims exist.
- **Strict Hard Gate Eligibility:** Evaluates mandatory licensure, work authorization, and security clearances independently as **Pass / Fail / Unknown**. Unknown gates are surfaced prominently and never silently passed or averaged into a fit score.
- **Cryptographic License Verification:** Pro and Coach entitlements are cryptographically verified using Web Crypto HMAC-SHA256 signatures (`<payload>.<signature>`) rather than insecure string prefix checks.
- **Closed-Loop PDF Text-Layer Verification:** After compiling PDFs with `jsPDF`, the binary text layer is re-extracted and inspected using `pdfjs-dist` to verify candidate contact details, linear reading order, and federal USAJobs 2-page rules with month/year dates and hours-per-week compliance markers.
- **Header-Based API Key Handling:** Google Gemini BYOK keys are transmitted strictly via the `x-goog-api-key` HTTP header, completely avoiding URL query parameters that leak into browser history, proxies, or server logs.
- **Ciphertext-Only Encrypted Backup:** AES-GCM 256-bit vault backup derived with PBKDF2 (100,000 iterations). Enforces passphrase strength (letters + numbers, 8+ chars) and stores checksums strictly over ciphertext to eliminate plaintext metadata leakage.
- **Voice-to-Resume Intake:** Built-in speech-guided intake wizard for non-desk and blue-collar trades workers who do not have an existing resume file.
- **Earn-First Pilot Hub:** Built-in operational queue to log, tailor, and deliver $9–$19 human-verified application packs for early cash flow.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
- **Local Vault:** Dexie.js (IndexedDB) with Web Crypto API
- **Document Processing:** PDF.js, Mammoth.js, jsPDF, docx
- **Testing:** Vitest
- **Icons:** Lucide React

---

## Getting Started

```bash
# Install dependencies
npm install

# Run automated test suites (22 unit & integration tests)
npm test

# Run local development server
npm run dev

# Build for production
npm run build
```

---

## Taxonomy & License Attributions

1. **O*NET Database:** This tool incorporates information from the **O*NET 31.0 Database** by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the CC BY 4.0 license. O*NET® is a trademark of USDOL/ETA.
2. **ESCO Classification:** This service uses the **ESCO classification** of the European Commission (version 1.2, covering 3,039 occupations and 13,939 skills across 28 languages).

---

## License

MIT License - Copyright (c) 2026 Thigulla Meghraj Goud
