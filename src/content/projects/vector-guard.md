---
title: "Vector Guard"
summary: "Defending RAG against poisoning"
year: 2026
status: shipped
featured: true
icon: shield
tech: [Python]
order: 10
---

## Overview

Vector Guard is a layered defense for retrieval-augmented generation. I first attacked a RAG
system built for a security operations center (SOC), then built filters that stop poisoned
documents from steering its answers.

<img class="canvas" src="/canvas/vector-guard.svg" width="480" height="300" loading="lazy" alt="Vector Guard in three steps. Attack: 2 of 5 retrieved documents are poisoned and the answer comes out wrong, 59% attack success. Four checks: structure, embedding, NLI contradiction and LLM score; poisoned documents stop at a check, clean ones pass. Defended: poisoned documents removed, the answer is right, 3% attack success.">

<div class="stats">
  <div><strong>59% → 3%</strong><span>attack success, threat intel</span></div>
  <div><strong>72% → 24%</strong><span>attack success, NQ benchmark</span></div>
  <div><strong>1,063</strong><span>CVE and ATT&CK documents</span></div>
</div>

## Approach

### Context

RAG systems trust whatever the retriever returns. In a SOC, an assistant that answers questions
about CVEs and MITRE ATT&CK techniques is a target: change a severity or a tactic and an analyst
makes the wrong call.

### Principles

- Attack first, so the defense is measured against a real number
- Several cheap checks in layers, not one expensive one
- Report attack success on a public benchmark too, not just my own data

### Audience

Teams putting RAG in front of security or other high-stakes data.

## Attack

I adapted the PoisonedRAG black-box attack to the SOC corpus. With just 2 poisoned documents per
query, the attack succeeded 59% of the time, changing answers about CVE severity, ATT&CK tactics
and targeted platforms.

## Defense

Each retrieved document passes four checks before it reaches the model.

<ol class="flow">
  <li>Structural filtering</li>
  <li>Embedding anomaly detection</li>
  <li>NLI contradiction checks</li>
  <li>LLM-based document scoring</li>
</ol>

Structural and embedding checks are cheap and catch documents that look or sit unlike the rest of
the corpus. The NLI and LLM checks are slower and catch documents that read normally but
contradict trusted sources.

## Takeaways

Attack success fell from 59% to 3% on the threat-intelligence data and from 72% to 24% on the
Natural Questions benchmark. The gap suggests a narrow, structured domain is easier to defend than
open-domain questions.

Measuring the attack first made the defense work concrete. Every layer had to earn its place
against a number.
