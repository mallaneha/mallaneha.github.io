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

> If you can't see why the agent answered, you can't fix it when it's wrong.

## Deployment

Milvus, the LangGraph backend and the MCP services run as separate microservices on GKE, built with
Docker and Terraform. A Streamlit UI sits on top, and Google Translate is wired in through FastMCP
for multilingual questions.

## Takeaways

Reflection costs an extra model call. In research, a wrong answer that sounds right costs more.

> The full write-up covers how I measured the 80%.
