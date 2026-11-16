# F.R.I.D.A.Y - Universal Career Copilot & Job Matcher

F.R.I.D.A.Y is a privacy-first, local-vault career workspace and job matching platform. It runs client-side with zero server dependencies, allowing job seekers across technical, clinical, skilled trades, and corporate domains to evaluate role fit truthfully, generate evidence-backed resumes, and organize applications.

## Key Features

- **Local-First Privacy Vault:** All resume text, applicant data, and application tracking state stay in IndexedDB inside the user's browser.
- **Truthful Evidence Ledger:** Strict fact-checking gate ensures drafted bullets only cite candidate-confirmed experience and metrics ("Reformulate, never fabricate").
- **Hard Gate Eligibility Checking:** Evaluates legal, clinical, licensure, and clearance requirements independently (Pass / Fail / Unknown) rather than averaging them away.
- **4-Pillar Scoring Model:** Explains job fit across Skill Coverage (40%), Experience Alignment (25%), Preference Alignment (20%), and Evidence Strength (15%).
- **Multi-Domain Taxonomy:** Includes deep rule packs for Software & Engineering, Healthcare & Nursing, and Skilled Trades (with voice/speech intake), plus universal packs for Education, Finance, Retail, and Design.
- **Single-Column ATS Exporter:** Exports clean ATS-compatible PDFs and editable Word DOCX files with text-layer checks and federal USAJobs 2-page limit validation.
- **3-Tier AI Engine:**
  - **Tier 1:** 100% free, deterministic in-browser NLP and rule-based generation requiring no API keys.
  - **Tier 2:** Guided BYOK (Bring Your Own Key) for Google Gemini (`gemini-2.5-flash` or `gemini-1.5-flash`).
  - **Tier 3:** Cloud credit proxy readiness for non-technical users.
- **Earn-First Pilot Portal:** Built-in workflow for delivering verified resume packs ($9–$19) to pilot clients for zero-capital cash flow.
- **Career CRM Kanban:** Visual application tracking with follow-up alerts, salary offer logs, and recruiter contact management.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
- **Storage:** Dexie.js (IndexedDB) with AES-GCM encrypted backup/restore
- **Document Processing:** PDF.js, Mammoth.js, docx, jsPDF
- **Icons:** Lucide React

## Getting Started

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build for production
npm run build
```

## Deployment ($0 Fixed Hosting)

F.R.I.D.A.Y is structured as a static single-page application compatible with Cloudflare Pages, Vercel, or static CDN hosting.

## License

MIT License
