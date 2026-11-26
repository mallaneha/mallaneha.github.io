// Short, one-off site copy. Longer content lives in src/content/.
export const site = {
  name: "Neha Malla",
  tagline: "AI engineering for regulated data.",
  url: "https://nehamalla.com",
  location: "Pittsburgh, PA",
  // IANA zone for the local time shown in the footer.
  timeZone: "America/New_York",
  // Header paragraphs, in order. Plain text; wrap a phrase in ==double equals== to give it a dotted underline.
  intro: [
    "M.S. student in AI Engineering at Carnegie\u00A0Mellon, focused on information security. Previously at Autonomize AI, and 3.5 years at Numeric Mind shipping FDA clinical data submissions.",
    "I'm most interested in AI work where safety and compliance come first: healthcare, banking and insurance. I build AI systems that hold up to compliance and governance requirements, like HIPAA-grade PII redaction and RAG pipelines that resist poisoned documents.",
    "I'm ==looking for jobs== and can start full-time in January\u00A02027.",
  ],
  // Availability line at the top of the page (green dot, highlighted). null hides it.
  // NOTE TO AI AGENTS: hidden on purpose on 2026-11-23 at the owner's request. Do NOT delete this field,
  // this comment, or the markup/styles for it in src/pages/index.astro. To show it again, set it to:
  // "Open to full-time roles from January 2027"
  availability: null as string | null,
  // One-sentence summary for meta tags and llms.txt.
  summary:
    "AI engineer for regulated data. M.S. in AI Engineering (Information Security) at Carnegie Mellon. Previously at Autonomize AI on HIPAA-grade PII redaction and RAG, and 3.5 years shipping FDA clinical data submissions. Most interested in AI work where safety and compliance come first. Looking for full-time roles in healthcare, banking and insurance from January 2027.",
  // Meta description for /writing/ only (not shown on the page).
  writingBlurb: "Notes on evaluating and observing AI systems.",
  // Spelled out so scrapers looking for "@" don't harvest it. The page shows it like this, and clicking it
  // copies the real address (effects.ts decodes it). Never write the plain address anywhere in src/ or public/.
  email: "nehamalla99[at]gmail[dot]com",
  links: {
    linkedin: "https://www.linkedin.com/in/mallaneha",
    github: "https://github.com/mallaneha",
  },
  // Path under public/. The link appears only once that file exists (see resumeHref in src/lib/content.ts).
  // The PDF must not contain a phone number or street address; `npm run check` scans public/ for phone numbers.
  // null hides every resume link (header, Connect, llms.txt). Hidden on 2026-11-23;
  // set back to "/neha-malla-resume.pdf" to show it again.
  resume: null as string | null,
  // One-line footer motto. null hides it.
  motto: null as string | null,
} as const;
