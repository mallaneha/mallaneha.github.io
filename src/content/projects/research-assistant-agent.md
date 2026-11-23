---
title: "RAG Research Assistant Agent"
summary: "Agentic RAG with self-reflection"
year: 2026
status: shipped
featured: true
icon: spark
tech: [Python, LangGraph, LangChain, Milvus, FastMCP, GCP]
links:
  post: cutting-hallucinations-research-agent
order: 20
---

## Overview

A research assistant built to keep answers grounded in its sources. It uses an agentic RAG
workflow in LangGraph over a Milvus vector store, then checks its own answers before returning
them.

<figure class="story" role="img" aria-label="RAG Research Assistant in three steps. Retrieve: a question goes to the Milvus vector store and the top documents come back. Reflect: the draft is checked claim by claim; a claim with no source is dropped and the agent drafts again. Grounded: only sourced claims are returned, with citations, for 80% fewer hallucinations.">
<div class="story-steps">
<div class="story-step"><div class="story-label">1 · <b>Retrieve</b></div><div class="story-scene"><span class="story-chip is-mono">Q: When did the Transformer appear?</span><span class="story-chip is-center">Milvus vector store</span><span class="story-chip is-mono story-in">[1] paper · 2017</span><span class="story-chip is-mono story-in">[2] survey</span><span class="story-chip is-mono story-in">[3] lecture notes</span></div><div class="story-num">top documents for the question</div></div>
<div class="story-step"><div class="story-label">2 · <b>Reflect</b></div><div class="story-scene"><span class="story-card"><span class="story-note">Draft</span><span class="story-line">Introduced in 2017 [1] <span class="story-mark is-good">✓</span></span><span class="story-line is-flag">Replaced all RNNs <span class="story-mark is-bad">✗</span></span></span><span class="story-loop"><span class="story-spin" aria-hidden="true">↻</span>no source: drop it, draft again</span></div><div class="story-num">is every claim in the documents?</div></div>
<div class="story-step"><div class="story-label">3 · <b>Grounded</b></div><div class="story-scene"><span class="story-card is-good"><span class="story-note">Answer</span><span class="story-line">Introduced in 2017 [1] <span class="story-mark is-good">✓</span></span></span><span class="story-chip is-mono">source: [1] paper</span></div><div class="story-num is-good"><strong>80%</strong>fewer hallucinations</div></div>
</div>
</figure>

<div class="stats">
  <div><strong>80%</strong><span>fewer hallucinations</span></div>
  <div><strong>GKE</strong><span>deployed as microservices</span></div>
</div>

## Approach

### Context

A plain retrieve-then-generate pipeline answers confidently even when the retrieved documents
don't support the answer. For research, that's worse than no answer.

### Principles

- Ground every answer in retrieved documents
- Check the answer before the user sees it
- Trace everything, so failures can be explained

### Audience

Anyone who needs answers they can verify against sources, in more than one language.

## Self-reflection

The agent doesn't stop at the first draft. It reflects on each generated answer against the
retrieved documents, and the self-reflection step reduced hallucinations by 80%.

<ol class="flow">
  <li>Retrieve from Milvus</li>
  <li>Generate an answer</li>
  <li>Reflect: is it grounded?</li>
  <li>Return, or try again</li>
</ol>

## Observability

I traced the agent end to end with LangSmith to evaluate its routing, debug execution traces, and
keep improving retrieval accuracy.

## Deployment

Milvus, the LangGraph backend and the MCP services run as separate microservices on GKE, built with
Docker and Terraform. A Streamlit UI sits on top, and Google Translate is wired in through FastMCP
for multilingual questions.

## Takeaways

Reflection costs an extra model call. In research, a wrong answer that sounds right costs more.
