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

<img class="canvas" src="/canvas/research-assistant-agent.svg" width="480" height="300" loading="lazy" alt="RAG Research Assistant in three steps. Retrieve: a question goes to the Milvus vector store and the top documents come back. Reflect: the draft answer is checked claim by claim; a claim with no source is flagged and the agent drafts again. Grounded: only sourced claims are returned, with citations, giving 80% fewer hallucinations.">

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
