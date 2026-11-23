---
company: "Autonomize AI"
role: "AI/ML Intern"
start: 2026
end: 2026
location: "Austin, TX"
summary: "AI/ML Intern"
icon: pulse
logo: /logos/autonomize-ai.png
order: 10
---

## Overview <span class="when">May – Jul 2026</span>

A summer internship at Autonomize AI, a healthcare AI company. The work came down to two problems:
keeping patient data private, and getting reliable answers out of messy insurance documents.

<div class="stats">
  <div><strong>97.7%</strong><span>of PHI redacted</span></div>
  <div><strong>100+</strong><span>Medicare PDFs</span></div>
  <div><strong>90%</strong><span>best-case extraction</span></div>
</div>

## PII redaction

For HIPAA compliance, I benchmarked Presidio, OpenMed and Private AI for PII redaction on healthcare
datasets, across both text and multimodal pipelines. On text, the best of the three caught 97.7%
of PHI (protected health information). The redaction is reversible: placeholders map back to the real values, so
customer data can be restored when it's needed.

## Document RAG

Medicare Evidence of Coverage PDFs cover the same ground, but every plan lays them out differently.
I hardened the RAG ingestion pipeline for over 100 of them: it reads each document's table of
contents to find the medical benefits charts and pulls out just those pages. Depending on the
layout, up to 90% of PDFs had their chart extracted.

## Security

The security work was configuring Wiz cloud security tools and bringing the generative AI
architectures in line with the OWASP Top 10, using red- and blue-teaming agents.

## Takeaways

Healthcare AI turned out to be mostly a data problem. Getting the right section out of a PDF, and
keeping a patient's name out of the output, mattered more than which model answered.

Tools: Presidio, OpenMed, Private AI, Wiz.
