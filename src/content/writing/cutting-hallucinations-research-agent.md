---
title: "How I cut hallucinations 80% in a research agent"
description: "Self-reflection in LangGraph, and how I measured whether it actually helped."
date: 2026-11-22
type: post
tags: [evals, rag, agents]
draft: true
---

<!--
TODO(Neha) before publishing. Everything marked TODO below is a detail only you know.
Facts already in the post come from the resume: LangGraph agentic RAG, Milvus, self-reflection,
80% fewer hallucinations, LangSmith, GKE + Docker + Terraform, Streamlit, FastMCP + Google Translate.
-->

I built a research assistant that answers questions from a document collection. The first version
worked the way most RAG demos do: retrieve a few chunks from a vector store, paste them into a
prompt, generate an answer. It was fast and it sounded right. Too often it was wrong.

This post covers what I changed (a self-reflection loop in LangGraph), and the part that matters
more: how I measured whether the change actually reduced hallucinations, rather than just
trusting that it felt better.

## What counts as a hallucination

"Hallucination" is too vague to measure, so I needed a definition I could score. For a RAG system,
the useful one is **faithfulness**: is every claim in the answer supported by the documents the
system retrieved?

RAGAS defines it as the number of claims in the response that the retrieved context supports,
divided by the total number of claims
([RAGAS docs](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/)).
An answer with two claims, one of them unsupported, scores 0.5.

This definition deliberately ignores whether the answer is _true in the world_. An answer can be
factually correct and still unfaithful if the retrieved documents don't say it. For a research
tool that's the right standard: if the user can't trace a claim back to a source, the claim is a
liability.

<!-- TODO(Neha): confirm this is the definition you used. If you counted "answers with any
unsupported claim" instead of a claim-level ratio, say so here; the 80% depends on it. -->

## The baseline: retrieve, then generate

The first pipeline was a straight line: embed the question, pull the top-k chunks from Milvus,
generate. It failed in three repeating ways:

1. **Retrieval missed, and the model answered anyway.** No relevant chunk came back, so the model
   filled the gap from its own weights.
2. **Retrieval hit, and the model went past it.** The right chunk was there, but the answer added
   details that weren't in it.
3. **The answer drifted from the question.** It was grounded, but in a nearby topic.

A single prompt can't fix all three, because each one needs a check at a different point in the
pipeline.

<!-- TODO(Neha): swap in one real example from your traces for any of these three. -->

## The fix: let the agent check its own work

Two papers shaped the design.

**Self-RAG** (Asai et al., 2023) trains a model to emit reflection tokens that critique its own
process: whether to retrieve, whether a passage is relevant, whether the output is supported by
it, and whether the answer is useful ([arXiv:2310.11511](https://arxiv.org/abs/2310.11511)). I
didn't fine-tune a model. I took the idea of checking at each step and built the checks as graph
nodes with an LLM grader.

**Corrective RAG** (Yan et al., 2024) adds a lightweight evaluator that grades retrieved documents
and changes course when retrieval looks bad, by discarding the documents and searching again
instead of generating from them ([arXiv:2401.15884](https://arxiv.org/abs/2401.15884)).

In LangGraph that turns into a loop rather than a line:

1. **Retrieve** chunks from Milvus.
2. **Grade the documents.** Drop chunks that aren't relevant to the question. If nothing relevant
   is left, rewrite the query and retrieve again.
3. **Generate** an answer from the chunks that passed.
4. **Check groundedness.** Is every claim supported by those chunks? If not, generate again.
5. **Check usefulness.** Does it answer the question that was asked? If not, rewrite the query.
6. **Stop** after a fixed number of retries and say the documents don't answer it.

Step 6 matters as much as the others. Without a retry cap the loop can spin, and without an honest
"I couldn't find this" exit the agent will eventually return something ungrounded just to finish.

LangGraph fits this well because the checks are conditional edges: the graph routes on the grader's
output instead of running a fixed chain.

<!-- TODO(Neha): your actual node names, which model graded, the retry cap, and whether you
implemented every check above. Delete any you didn't build. -->

## How I measured it

A change like this is easy to get wrong in both directions. Reflection can look like it helps on
the five questions you tried by hand and do nothing on the rest. So I treated it as an experiment.

**A fixed question set.** The same questions ran through the baseline and the reflective agent.
LangSmith organizes this as a dataset of examples, an evaluator that scores each output, and an
experiment, which is one version of the app run against the dataset
([LangSmith docs](https://docs.langchain.com/langsmith/evaluation-concepts)). Two experiments on
the same dataset can be compared side by side.

**An LLM judge, checked against me.** Scoring faithfulness by hand doesn't scale, so an LLM judge
scored each answer. But a judge is another model that can be wrong. Hamel Husain's advice is to
label a sample yourself with simple good/bad labels and track how often the judge agrees, using
precision and recall rather than raw agreement when failures are rare
([Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/)). I labeled a sample by hand
before trusting the judge's numbers.

**Traces for every failure.** LangSmith logged each run, so every failing answer came with its
retrieved chunks, grader decisions and final prompt. That's what turned "it hallucinated" into
"retrieval returned the wrong section, and the grader let it through."

<!-- TODO(Neha): dataset size, where the questions came from, judge model, how many you labeled
by hand, and judge-vs-you agreement. Even rough numbers make this section credible. -->

## Results

With self-reflection, hallucinations dropped by **80%** compared to the baseline.

<!-- TODO(Neha): give the before and after rates (e.g. "from X% of answers to Y%"), not just the
relative drop. Readers trust "X → Y" more than a percentage of a percentage. -->

It wasn't free:

- **Latency and cost went up.** Every grading step is another model call, and a retry repeats
  several of them. <!-- TODO(Neha): rough before/after latency. -->
- **More "I don't know" answers.** Some questions that used to get a confident wrong answer now get
  an honest non-answer. For research, that's the right trade, but it should be counted, not hidden.
- **Retrieval misses don't go away.** If the answer isn't in the vector store, reflection can only
  refuse. It can't find what was never indexed. Fixing that is a chunking and retrieval problem.

## What I'd do next

- **Grade with a smaller model.** The graders do narrow yes/no work, which a cheaper model may
  handle as well. That would claw back much of the latency.
- **Make the eval set grow from production.** Every failing trace that a user flags should become a
  dataset example, so the next change is tested against real failures.
- **Report faithfulness and answer rate together.** A system that refuses everything has perfect
  faithfulness. The pair is harder to game than either number alone.

## Takeaways

- Define hallucination as something you can count before you try to reduce it.
- Put checks where failures happen: after retrieval and after generation, not just in the prompt.
- Don't trust an LLM judge until you've checked it against your own labels.
- Keep the traces. The number tells you whether it got better. The traces tell you why.
