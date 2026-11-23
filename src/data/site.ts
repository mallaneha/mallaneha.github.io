// Short, one-off site copy. Longer content lives in src/content/.
export const site = {
  name: "Neha Malla",
  tagline: "Safe AI for high-stakes data.",
  url: "https://mallaneha.github.io",
  location: "Pittsburgh, PA",
  // Header paragraphs, in order. Plain text; {email} and {linkedin} become links.
  intro: [
    "Currently finishing an M.S. in AI Engineering (Information Security) at Carnegie Mellon. Previously at Autonomize AI, and 3.5 years at Numeric Mind shipping FDA clinical data submissions.",
    "I build applied AI systems where data is sensitive and mistakes are costly: PII redaction, retrieval that holds up under attack, and agents you can trace and measure.",
    "I'm most interested in healthcare, banking and insurance.",
  ],
  // Availability badge under the name. null hides it.
  availability: "Open to full-time roles from January 2027" as string | null,
  // One-sentence summary for meta tags and llms.txt.
  summary:
    "I build applied AI systems where data is sensitive and mistakes are costly. M.S. in AI Engineering (Information Security) at Carnegie Mellon. Previously at Autonomize AI on HIPAA-grade PII redaction and RAG, and 3.5 years shipping FDA clinical data submissions. Looking for full-time roles in healthcare, banking and insurance from January 2027.",
  writingBlurb: "Notes on evaluating and observing AI systems.",
  email: "nehamalla99@gmail.com",
  links: {
    linkedin: "https://www.linkedin.com/in/mallaneha",
    github: "https://github.com/mallaneha",
  },
  // Path under public/. The link appears only once that file exists (see resumeHref in src/lib/content.ts).
  // The PDF must not contain a phone number or street address; `npm run check` scans public/ for phone numbers.
  resume: "/neha-malla-resume.pdf" as string | null,
  // One-line footer motto. null hides it.
  motto: null as string | null,
} as const;
