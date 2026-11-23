---
title: "Benchmarking PII redaction for HIPAA: what 97.7% recall means"
description: "Comparing Presidio, OpenMed and Private AI on healthcare data, and why recall is the number that matters."
date: 2026-11-22
type: post
tags: [healthcare, evals, security]
draft: true
---

<!--
TODO(Neha) before publishing. Outline only. Facts come from your resume and
src/content/experience/autonomize-ai.md: Presidio vs OpenMed vs Private AI, healthcare datasets,
text and multimodal pipelines, 97.7% anonymization recall, reversible pseudonymization.
Only use what's public from the internship. Check anything else with Autonomize AI first.
- If a CMU course shaped how you thought about this (24-784 Trustworthy and Ethical AI Engineering,
  or a security course), cite it. Confirm the course first.
-->

## The problem

A missed name is a leak. In redaction, a false negative costs much more than a false positive.

## What I compared

Presidio, OpenMed and Private AI, on healthcare text and multimodal inputs.
<!-- TODO(Neha): which datasets (public ones only), and which entity types you scored. -->

## How I scored it

Entity-level recall and precision. <!-- TODO(Neha): exact vs partial match, and who labeled the ground truth. -->

## What 97.7% recall means

The 2.3% that got through: what kinds of entities they were, and whether that's acceptable for HIPAA.
<!-- TODO(Neha): only if you can share it. -->

## Reversible pseudonymization

Why replace names with consistent placeholders instead of deleting them: downstream models keep the
structure, and authorized users can restore the original.

## Takeaways

<!-- TODO(Neha): two or three lines. -->
