---
title: "Reading a transformer from the attacker's side"
description: "Where untrusted text enters a transformer, and why prompt injection is a property of the architecture, not a bug."
date: 2026-11-22
type: post
tags: [llm-systems, security]
draft: true
---

<!--
TODO(Neha) before publishing. Outline only. Everything below is a suggested angle, not your words yet.
- Is this the angle you want? It ties the transformer to your security focus instead of being one more
  general explainer.
- Which CMU course did you meet this in? Your program's AI core lists Introduction to Deep Learning
  (24-788 or 18-786). Confirm which one you took, or delete the course reference.
- Add one thing you built or ran yourself (an assignment, a notebook, a probe). That's what makes it yours.
-->

## Why I looked inside

One line on why someone working on AI security needs the internals: you can't reason about what an
attacker controls without knowing where their text goes. <!-- TODO(Neha): your real reason. -->

## Tokens: everything becomes the same kind of thing

System prompt, user message and retrieved document all become one token sequence. Nothing in the
input marks which tokens are trusted.

## Attention: every token can read every other token

Self-attention ([Vaswani et al., 2017](https://arxiv.org/abs/1706.03762)) lets each position weigh
every earlier position. An instruction hidden in a retrieved PDF gets the same mechanism as the
system prompt.

## So prompt injection is structural

The point of the post: instruction/data separation doesn't exist inside the model, so defenses live
outside it (retrieval filtering, output checks, privilege limits). Link forward to the RAG defense post.

## What I took from coursework

<!-- TODO(Neha): what Introduction to Deep Learning covered that this relies on, in one or two lines.
Program curriculum: https://www.cmu.edu/ini/academics/msaie-is/curriculum_ms37.html
(confirm your cohort page: MS36, MS37 or MS38). -->

For systems depth beyond my own courses, CMU's 11-868 Large Language Model Systems has a public
syllabus that starts from LLM architecture and pre-training
([11-868 syllabus](https://llmsystem.github.io/llmsystem2026fall/docs/Syllabus)).

## Further reading

- [Build it, part 1: attention, one dot product at a time](/writing/build-attention/), which computes one head
  by hand and shows how every token's vector reaches every other.
- Rohit Ghumare, [Inside the Transformer](https://rohitghumare.com/guides/inside-the-transformer/):
  a long build-it-yourself walkthrough, from the original architecture to current variants.
