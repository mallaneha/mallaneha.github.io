---
title: "Measuring a RAG defense: from 59% to 3% attack success"
description: "How I measured a defense against poisoned retrieval, and what it cost on clean questions."
date: 2026-11-22
type: post
tags: [rag, evals, security]
draft: true
---

<!--
TODO(Neha) before publishing. Outline only. The only facts here are from docs/SPEC.md:
attack success 59% → 3%, and "72% to 24% on NQ". I don't know what the 72% → 24% measures
(attack success on Natural Questions? accuracy?). Please say, since the title depends on it.
Also: the attack, the defense, the model, the dataset sizes, and whether this was coursework or a project.
- If this was for a CMU course, cite it. Likely candidates from your program are 14-795 AI Applications
  in Information Security or 14-757 Introduction to Machine Learning with Adversaries in Mind.
  Confirm which one, or delete this line.
-->

## The attack

What poisoned retrieval is: an attacker plants text in the corpus so the retriever serves it and the
model follows it. <!-- TODO(Neha): the exact attack you tested. -->

## The defense

<!-- TODO(Neha): what you built, in two or three lines. -->

## How I measured it

Attack success rate on poisoned queries, measured the same way before and after. Plus a check that
clean questions still get answered.

## Results

From 59% to 3% attack success. <!-- TODO(Neha): what 72% → 24% on NQ means, and what it cost on
clean accuracy and latency. -->

## What it doesn't cover

Attacks the evaluation didn't include. An honest limits section makes the number credible.

## Takeaways

<!-- TODO(Neha): two or three lines. -->
