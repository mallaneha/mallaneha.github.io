---
title: "Testing a RAG poisoning defense against static and adaptive attacks"
description: "How I measured Vector Guard against PoisonedRAG, what that result covers, and how I'd test it against an attacker who adapts."
date: 2026-11-23
type: post
tags: [security, rag, evals]
draft: false
---

Vector Guard is a layered defense I built against poisoned documents in retrieval-augmented generation
(RAG). On my threat-intelligence data, it cut attack success from 59% to 3%. On the Natural Questions
benchmark, from 72% to 24%.

This post is about what those numbers measure: one kind of attack, run the same way every time. A paper
published in October 2025 showed how much a setup like that leaves out, and I think anyone reporting a
defense number, me included, should say so. I'll cover the attack, the four checks, how I measured them,
and what I'd test next, but not the code.

## The attack

RAG systems trust whatever the retriever returns. If someone can add documents to the index, they can
steer the answers. PoisonedRAG is a published version of this attack. You write a few documents per
target question so that they get retrieved and push the model toward your answer ([Zou et al.,
2024](https://arxiv.org/abs/2402.07867)).

My target was an assistant for a security operations center (SOC) that answers questions about CVEs and
MITRE ATT&CK techniques from 1,063 documents. Attackers have a reason to go after it: change a CVE's
severity from Critical to Low, and an analyst deprioritizes a real vulnerability.

I adapted the black-box version of PoisonedRAG to that corpus. With two poisoned documents per query,
the attack succeeded 59% of the time. The poisoned answers changed CVE severities, ATT&CK tactics and
which platforms a technique targets.

I measured the attack before writing any defense. That made the defense work concrete, because every
layer had to earn its place against that number.

## Four checks, cheapest first

Every retrieved document goes through four checks before it reaches the model:

1. **Structure**: does it look like the other documents in the corpus?
2. **Embedding anomaly**: does its embedding sit where documents like it usually sit?
3. **NLI contradiction**: does it contradict a trusted source? NLI (natural language inference) is a
   model that labels whether one text supports, contradicts or is unrelated to another.
4. **LLM score**: an LLM rates how trustworthy the document is.

The first two are cheap. They catch documents that look or sit unlike the rest. The last two are slower
and catch documents that read normally but disagree with what the corpus already says. Pick a kind of
poisoned document below and see where it stops.

<poison-layers>
<div class="xp-fallback"><p>With JavaScript on, this shows which of the four checks (structure, embedding, NLI contradiction, LLM score) each kind of poisoned document is built to be caught by.</p><p>A document that looks wrong stops at the structure check. One whose embedding sits wrong stops at the embedding check. One that contradicts a trusted source stops at the NLI check. One that reads normally, sits with similar documents and makes a claim no trusted document covers passes the first three, and only the LLM score might flag it.</p></div>
</poison-layers>

The last option is the one that worries me. A poisoned document about a CVE that no trusted document
covers yet has nothing to contradict. The NLI check has no source to compare against, so only the LLM
score stands in the way. Gaps like that are most likely for newly published CVEs.

These are what each check is designed to catch, not measured rates for each layer.

## The result, and what it's measured against

With all four checks, attack success fell from 59% to 3% on the threat-intelligence data, and from 72%
to 24% on Natural Questions. I read the gap as a sign that a narrow, structured domain is easier to
defend. CVE entries have a fixed shape, so there's a trusted source to contradict. Open-domain questions
don't.

Here's what those numbers held fixed. The attack was PoisonedRAG as published, adapted to my corpus,
with two poisoned documents per query. It wasn't written with the four checks in mind, and it didn't get
another try after a document was rejected.

## Static and adaptive attacks on published defenses

In October 2025, Milad Nasr, Nicholas Carlini, Florian Tramèr and 11 others published "The Attacker
Moves Second" ([arXiv:2510.09023](https://arxiv.org/abs/2510.09023)). They took 12 published defenses
against prompt injection and jailbreaks and attacked them with adaptive attacks: gradient-based search,
reinforcement learning, LLM-guided search, and human red-teamers. All of them keep iterating against the
defense until something gets through.

Toggle between the two kinds of attack.

<attack-gap>
<div class="xp-fallback"><p>With JavaScript on, this compares attack success against 12 published defenses under static and adaptive attacks, from Nasr et al. 2025 as reported by Simon Willison.</p><p>With static attacks, 7 of 12 defenses hold attack success under 10%. With adaptive attacks, 9 of 12 are at 90% or higher, and the best one still lets 71% through. Human red-teamers reached 100% against all of them.</p></div>
</attack-gap>

With static attacks, 7 of the 12 defenses keep attack success under 10%. With adaptive attacks, 9 of 12
are at 90% or higher, and the best one still lets 71% through. A human red-team of 500 people reached
100% against every defense. (The per-defense numbers come from [Simon Willison's
summary](https://simonwillison.net/2025/Nov/2/new-prompt-injection-papers/) of the paper's chart.)

These are prompt-injection and jailbreak defenses, not poisoning defenses, so you can't compare them
directly with Vector Guard. The lesson carries over anyway. A static number tells you how a defense does
against attacks that don't know it's there. It doesn't tell you how it does against someone trying to
get past it.

## What an adaptive test of Vector Guard would look like

If I were testing Vector Guard again, I'd give the attacker what a real one would eventually have.

- **Knowledge of the checks.** Write poisoned documents in the corpus's own format, so the structure
  check passes.
- **Feedback.** Let the attacker see which documents got rejected and rewrite them. Count attempts, not
  just success.
- **Gap targeting.** Aim at facts that no trusted document covers, so there's nothing for the NLI check
  to compare against.
- **A judge to fool.** Tune documents against an LLM scorer like the one in check 4, since that's the
  last line.

I'd report attack success as a curve against the attacker's effort, not as one number.

I'd also report the false positive rate. A filter that rejects poisoned documents and also 10% of good
ones has a cost, and in a SOC that cost is missing context on a real alert.

## How I'd report the result

I'd still report 59% to 3%, worded like this: attack success against the published PoisonedRAG black-box
attack, not tuned to the defense. The 72% to 24% on Natural Questions goes next to it, because the
open-domain number is the more realistic one for anything outside a narrow, structured corpus.

Simon Willison's conclusion from the paper is that until defenses like these can be relied on, the best
practical protection is limiting what an agent can do. So a filter shouldn't be the only thing between
an attacker and a bad outcome. What the assistant can do once a poisoned document gets through is the
subject of [the Rule of Two post](/writing/rule-of-two-healthcare-rag/).
