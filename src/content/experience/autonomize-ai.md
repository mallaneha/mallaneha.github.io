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

I spent the summer as an AI/ML intern at Autonomize AI, a healthcare AI company. My work came down
to two problems: keeping patient data private, and getting reliable answers out of messy insurance
documents.

<div class="stats">
  <div><strong>97.7%</strong><span>anonymization recall</span></div>
  <div><strong>100+</strong><span>Medicare PDFs</span></div>
  <div><strong>90%</strong><span>extraction success</span></div>
</div>

## PII redaction

The pipelines had to meet HIPAA, so I benchmarked Presidio, OpenMed and Private AI for PII redaction
on healthcare datasets, on both text and multimodal pipelines. The pipeline reached 97.7%
anonymization recall. Its pseudonymization is reversible, so customer data can be restored when
it's needed.

## Document RAG

Medicare Evidence of Coverage PDFs cover the same ground, but every plan lays them out differently.
I hardened the RAG ingestion pipeline for over 100 of them. It uses each document's table of
contents to find the medical benefits charts and pull them out on their own. Extraction success
went up to as much as 90%.

## Security

I configured Wiz cloud security tools. I also brought our generative AI architectures in line with
the OWASP Top 10, using red- and blue-teaming agents.

## Takeaways

Healthcare AI turned out to be mostly a data problem. Getting the right section out of a PDF, and
keeping a patient's name out of the output, mattered more than which model answered.

Tools: Presidio, OpenMed, Private AI, Wiz.
