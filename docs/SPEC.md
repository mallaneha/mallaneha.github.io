# Neha Malla: personal website spec

Final spec as of 2026-11-22. Everything decided so far, ready to build.

## 1. Basics

- **Address:** https://mallaneha.github.io (GitHub Pages user site). The repo must be named `mallaneha.github.io` under https://github.com/mallaneha. A custom domain can be added later.
- **Design reference:** https://paco.me. One page, one column, no nav menu, lots of white space, small clean sans-serif, gray secondary text, subtle link hovers. Fonts and colors weren't checked against paco.me's source, so treat them as "in the spirit of", not an exact copy.
- **Entry format everywhere:** linked title, then one short line. No cards or images.
- **Update 2026-11-22:** layout, rows, bottom-sheet drawers and click effects now follow https://ch.sh. Featured work and experience open as case-study drawers; the "Now" lines moved into the header. Details in `docs/DESIGN.md` and `docs/adr/0002-client-scripts-for-drawers-and-effects.md`.
- **Update 2026-11-22 (later):** the Building section is gone; Experience comes before Featured, with company logos; Connect is two columns (Email | Resume, LinkedIn | GitHub); the footer shows Pittsburgh's local time; click effects run on the home page only, outside drawers, and muting silences the sound but keeps the sparks.
- **Target roles:** applied AI engineering, and data and AI governance, in healthcare, banking and insurance. Interests: evaluating AI output, and observability.

## 2. Page content, top to bottom

### Header

- **Name (H1):** Neha Malla
- **Tagline (italic):** _Safe AI for high-stakes data._
- **Intro:**
  > I build applied AI systems where data is sensitive and mistakes are costly. M.S. in AI Engineering (Information Security) at Carnegie Mellon. Previously at Autonomize AI on HIPAA-grade PII redaction and RAG, and 3.5 years shipping FDA clinical data submissions. Looking for full-time roles in healthcare, banking and insurance from January 2027.

### Building

- **RAG security:** defending retrieval pipelines against poisoning attacks. (Placeholder. Could become a small public eval project, e.g. an open benchmark of PII redaction tools on synthetic healthcare text.)

### Projects

- **Vector Guard:** layered defense that cut PoisonedRAG attack success from 59% to 3%.
- **Research Assistant Agent:** agentic RAG on GKE with self-reflection, 80% fewer hallucinations.
- **SysToolChain:** Spark and Kafka pipeline over 144K FIFA player records with live comment streaming.

Each should link to its GitHub repo, or later to a write-up post. Repo URLs are still needed.

### Experience

An addition to the paco.me layout, since she's job-hunting.

- **Autonomize AI, AI/ML Intern (2026):** HIPAA-grade PII redaction at 97.7% recall, RAG over 100+ Medicare PDFs.
- **Numeric Mind, Senior Data Analyst (2021–2025):** led 12 analysts, 15+ FDA submission packages.

### Writing

Heading line: "Notes on evaluating and observing AI systems." List 1–2 posts, then an "All writing" link.

Launch posts (recommended first):

1. **How I cut hallucinations 80% in a research agent.** Self-reflection in LangGraph, and how she measured it.
2. **What clinical data validation taught me about AI evals.** FDA / Pinnacle 21 checks applied to evaluating LLM output in regulated domains.

Backlog: 3. Tracing an agent with LangSmith: what the traces showed. 4. Measuring a RAG defense: from 59% to 3% attack success (and 72% to 24% on NQ). 5. Benchmarking PII redaction for HIPAA: Presidio vs OpenMed vs Private AI, and what 97.7% recall means. Only use what's public from the internship. 6. Red-teaming a GenAI app against the OWASP LLM Top 10. 7. What AI governance frameworks ask of evals (NIST AI RMF, EU AI Act).

Also support short **notes** (3–5 sentence findings) next to full posts.

### Now

CMU coursework (Generative AI & LLMs, AI Governance), open to full-time roles from January 2027, plus anything personal Neha wants to add.

### Connect

One line: email **nehamalla99@gmail.com**, [LinkedIn](https://www.linkedin.com/in/mallaneha), [GitHub](https://github.com/mallaneha), and a resume PDF link.

### Footer

A one-line personal motto + year. Motto still to be chosen.

## 3. Small touches

- Dark mode that follows the system setting.
- An `llms.txt` file so AI tools can read the site cleanly.
- Good meta tags: title "Neha Malla", the tagline as description, and a simple social preview.
- Fast, accessible, readable on phones.

## 4. Still open

- Footer motto.
- GitHub repo links for the three projects.
- Drafts of the two launch posts (placeholders are fine at first).
- Custom domain later, if wanted.

## 5. Background

- Inspiration shortlist: docs/research/inspirations.md
- paco.me breakdown and earlier drafts: not in this repo yet (was research/paco-blueprint.md)
- Resume: docs/reference/Neha_Malla_Resume.pdf (source only, has a phone number, never publish as-is)
