---
title: "A KV cache is patient data too"
description: "Offloading the KV cache to RAM, disk or the network makes it faster, and creates new places where prompt data is stored."
date: 2026-11-22
type: note
tags: [llm-systems, healthcare, security]
draft: true
---

<!--
TODO(Neha): a 3–5 sentence note. Rewrite in your words. Check the claim in sentence two against
your own understanding before publishing; it's reasoning, not a cited fact.
-->

Rohit Ghumare's [Four Tiers for One KV Cache](https://rohitghumare.com/blog/tpu-8-kv-tiers/) works
out when moving a model's KV cache from GPU memory to host RAM, storage or the network beats
recomputing it. Reading it from a healthcare angle, what stood out to me is that the KV cache is
derived from the prompt, so every tier it moves to is one more place where patient data is
stored. That puts cache offloading in scope for the same encryption, retention and access rules as
the prompt itself. CMU's 11-868 has a lecture on better KV caches for LLM serving, with CacheGen and
CacheBlend as readings ([syllabus](https://llmsystem.github.io/llmsystem2026fall/docs/Syllabus)).
<!-- TODO(Neha): end with your own one-line takeaway or open question. -->
