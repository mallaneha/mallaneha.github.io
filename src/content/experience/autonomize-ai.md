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
  <div><strong>97.7%</strong><span>anonymization recall</span></div>
  <div><strong>100+</strong><span>Medicare PDFs</span></div>
  <div><strong>90%</strong><span>extraction success</span></div>
</div>

## PII redaction

For HIPAA compliance, I benchmarked Presidio, OpenMed and Private AI for PII redaction on healthcare
datasets, across both text and multimodal pipelines. The resulting pipeline reached 97.7%
anonymization recall. Its pseudonymization is reversible, so customer data can be restored when
it's needed.

## Document RAG

Medicare Evidence of Coverage PDFs cover the same ground, but every plan lays them out differently.
The hardened RAG ingestion pipeline for over 100 of them uses each document's table of contents to
find the medical benefits charts and pull them out on their own. Extraction success rose to as much
as 90%.

## Security

The security work was configuring Wiz cloud security tools and bringing the generative AI
architectures in line with the OWASP Top 10, using red- and blue-teaming agents.

## Takeaways

Healthcare AI turned out to be mostly a data problem. Getting the right section out of a PDF, and
keeping a patient's name out of the output, mattered more than which model answered.

Tools: Presidio, OpenMed, Private AI, Wiz.
