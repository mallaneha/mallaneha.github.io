---
company: "Autonomize AI"
role: "AI/ML Intern"
start: 2026
end: 2026
location: "Austin, TX"
summary: "AI/ML Intern · 2026"
icon: pulse
logo: /logos/autonomize-ai.png
order: 10
---

## Overview

A summer internship (May to July 2026) at a healthcare AI company. I worked on keeping patient
data private and on getting reliable answers out of messy insurance documents.

<div class="stats">
  <div><strong>97.7%</strong><span>anonymization recall</span></div>
  <div><strong>100+</strong><span>Medicare PDFs</span></div>
  <div><strong>90%</strong><span>extraction success</span></div>
</div>

## PII redaction

I benchmarked Presidio, OpenMed and Private AI on healthcare datasets for PII redaction, across
text and multimodal pipelines, for HIPAA compliance. The pipeline reached 97.7% anonymization
recall, with reversible pseudonymization so customer data can be restored when needed.

> In redaction, recall is the number that matters: a missed name is a leak.

## Document RAG

I hardened a RAG ingestion pipeline for over 100 Medicare Evidence of Coverage PDFs. The layouts
vary from plan to plan, so I used the table of contents to find and isolate the medical benefits
charts. Extraction success rose to as much as 90%.

## Security

I configured Wiz cloud security tools and aligned generative AI architectures with the OWASP Top
10, using red- and blue-teaming agents.

## Takeaways

Healthcare AI is mostly a data problem. Getting the right section out of a PDF, and keeping a
patient's name out of the output, mattered more than which model answered.
