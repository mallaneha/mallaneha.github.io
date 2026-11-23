---
title: "What a serving engine changes when patient data can't leave"
description: "Why regulated teams self-host models, and the parts of vLLM that decide whether that's affordable."
date: 2026-11-22
type: post
tags: [llm-systems, healthcare]
draft: true
---

<!--
TODO(Neha) before publishing. Outline only.
- Have you run vLLM (or another serving engine) yourself, in a course or at Autonomize AI? If yes, add
  the model, GPU and one number (throughput, latency, memory). Only what's public from the internship.
  If not, frame this as notes from reading, and say so.
- Your program's AI core includes 14-763 Systems and Tool Chains for AI Engineering. If it covered
  model serving, cite it here. I couldn't find a public description to confirm what it covers.
-->

## The constraint

In healthcare, sending prompts with patient data to a hosted API is often a compliance question
before it's a technical one. Self-hosting answers the compliance question and creates a cost one.
<!-- TODO(Neha): one sentence from your own experience, if you have one. -->

## Where the memory goes: the KV cache

Generating each token reuses keys and values computed for earlier tokens. Storing them is what
limits how many requests fit on a GPU.

## PagedAttention

vLLM stores the KV cache in fixed-size blocks, like virtual memory pages, so it wastes far less
memory and fits more requests per GPU ([Kwon et al., 2023](https://arxiv.org/abs/2309.06180)).

## Batching and scheduling

One or two lines on continuous batching: new requests join mid-flight instead of waiting for a batch
to finish.

## What this means for a regulated team

The tie-back: these techniques are what make a self-hosted model cheap enough to choose over an API.
<!-- TODO(Neha): your take. -->

## Where I'm learning this

CMU's 11-868 Large Language Model Systems covers this directly, with a lecture on LLM serving and
PagedAttention (readings include the vLLM and ORCA papers) and a recitation on SGLang and vLLM
([11-868 syllabus](https://llmsystem.github.io/llmsystem2026fall/docs/Syllabus)).
<!-- TODO(Neha): if you aren't taking 11-868, keep it as "a public syllabus I used", as written. -->

## Further reading

- [Build it, part 3: a serving budget for an LLM](/writing/build-a-serving-budget/), which works out how much
  the KV cache limits a self-hosted model, with a calculator.
- Rohit Ghumare, [Inside the vLLM Engine](https://rohitghumare.com/guides/inside-vllm/): a
  detailed tour of vLLM's block pool, scheduler, process loop, speculative decoding and structured output.
