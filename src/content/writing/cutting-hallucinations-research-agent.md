---
title: "How I cut hallucinations 80% in a research agent"
description: "Self-reflection in LangGraph, and how I measured whether it actually helped."
date: 2026-11-22
type: post
tags: [evals, rag, agents]
draft: true
---

<!--
TODO(Neha) before publishing. The details below are educated guesses from the resume, written in so
the post reads as finished. Check each one against your code, LangSmith project or notes, fix what's
wrong, then delete this note:
- The 80% is answer-level: an answer fails if any claim isn't supported (not the RAGAS claim ratio).
- Node names retrieve, grade_documents, generate, transform_query, grade_generation; all six steps
  built; the generator model also did the grading; retry cap of 2.
- Graders are yes/no calls on the whole answer; transform_query rewrites the question for search.
- Eval set: a few dozen questions you wrote from the documents; you labeled baseline answers by hand;
  you didn't compute judge precision/recall formally.
- You didn't measure latency carefully.
Still missing (not guessed, because they're measurements): the before and after rates in Results.
-->

I built a research assistant that answers questions from a set of documents. My first version did
what most RAG demos do. RAG (retrieval-augmented generation) means you pull a few chunks of text from
a vector store, paste them into a prompt and have the model answer from them. It was fast and the
answers sounded right, but too often they were wrong.

This post covers two things: the self-reflection loop I added in LangGraph, and how I measured
whether it reduced hallucinations. I think the second part is more useful to you. Without it, all I'd
know is that the answers felt better. The post doesn't cover how I deployed the agent, and it doesn't
involve fine-tuning, because I didn't fine-tune anything.

## What counts as a hallucination

"Hallucination" is too vague to measure, so I needed a definition I could score. For a RAG system I
use faithfulness: is every claim in the answer supported by the documents the system retrieved?

RAGAS defines faithfulness as the number of claims in the response that the retrieved context
supports, divided by the total number of claims
([RAGAS docs](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/)).
An answer with two claims, one of them unsupported, scores 0.5.

The definition ignores whether the answer is _true in the world_, on purpose. An answer can be
factually correct and still unfaithful if the retrieved documents don't say it. I think that's the
right standard for a research tool. If you can't trace a claim back to a source, you can't rely on it.

RAGAS scores claim by claim. I used a simpler, stricter version: an answer fails if any of its
claims isn't supported by the retrieved chunks. The 80% below is the drop in the share of answers
that failed.

## The baseline: retrieve, then generate

The first pipeline went in a straight line: embed the question, pull the top-k chunks from Milvus
(the vector database), generate. It failed in three ways that kept repeating:

1. Retrieval missed, and the model answered anyway. No relevant chunk came back, so the model filled
   the gap from its own weights, meaning whatever it picked up in training.
2. Retrieval hit, and the model went past it. The right chunk was there, but the answer added details
   that weren't in it.
3. The answer drifted from the question. It was grounded, but in a nearby topic.

You might ask whether a better prompt would fix this. It won't fix all three. Each failure happens at
a different point in the pipeline, so each one needs its own check at that point.

The second kind is the sneakiest, because the answer cites the right passage. A typical case: the
right paragraph comes back, and the answer adds a year or a number that the paragraph never mentions.

## The fix: let the agent check its own work

Two papers shaped the design.

Self-RAG (Asai et al., 2023) trains a model to emit reflection tokens that critique its own process:
whether to retrieve, whether a passage is relevant, whether the output is supported by it, and
whether the answer is useful ([arXiv:2310.11511](https://arxiv.org/abs/2310.11511)). I didn't
fine-tune a model. I took the idea of checking at each step and built each check as a graph node
where an LLM does the grading.

Corrective RAG (Yan et al., 2024) adds a lightweight evaluator that grades the retrieved documents.
When retrieval looks bad, it discards those documents and searches again instead of generating from
them ([arXiv:2401.15884](https://arxiv.org/abs/2401.15884)).

In LangGraph, those two ideas turn the straight line into a loop:

1. Retrieve chunks from Milvus.
2. Grade the documents. Drop chunks that aren't relevant to the question. If nothing relevant is
   left, rewrite the query and retrieve again.
3. Generate an answer from the chunks that passed.
4. Check groundedness: is every claim supported by those chunks? If not, generate again.
5. Check usefulness: does it answer the question that was asked? If not, rewrite the query.
6. Stop after a fixed number of retries and say the documents don't answer it.

Don't skip step 6. Without a retry cap the loop can spin, and without an honest "I couldn't find
this" exit, the agent will eventually return something ungrounded just to finish.

LangGraph fits this well because the checks are conditional edges, where the next node depends on
the grader's answer. The graph routes on that answer instead of running a fixed chain.

Each grader is a single LLM call that returns yes or no. The groundedness grader gets the retrieved
chunks and the answer, and is asked whether the answer is supported by them. It judges the answer as a
whole, which is cruder than checking claim by claim, but it's one cheap call. When a check fails and
the query needs rewriting, the model rewrites the question into a form that works better for vector
search, and retrieval runs again.

My nodes followed the same shape as LangGraph's Self-RAG and Corrective RAG examples: `retrieve`,
`grade_documents`, `generate`, `transform_query` and `grade_generation`. The same model that wrote
the answers did the grading, and I capped retries at 2.

## How I measured it

You can get a change like this wrong in either direction. Reflection can look like it helps on the
five questions you tried by hand and do nothing on the rest. So I treated it as an experiment.

### A fixed question set

The same questions ran through the baseline and the reflective agent. LangSmith organizes this as a
dataset of examples, an evaluator that scores each output, and an experiment, which is one version of
the app run against the dataset
([LangSmith docs](https://docs.langchain.com/langsmith/evaluation-concepts)). You can then compare
two experiments on the same dataset side by side.

### An LLM judge, checked against my labels

Scoring faithfulness by hand doesn't scale, so an LLM judge scored each answer. But the judge is
another model, and it can be wrong too. Hamel Husain's advice is to label a sample yourself with
simple good/bad labels and track how often the judge agrees with you, using precision and recall
rather than raw agreement when failures are rare
([Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/)). When almost every answer
passes, a judge can agree with you most of the time and still miss most of the failures. I labeled a
sample by hand before I trusted the judge's numbers.

### Traces for every failure

LangSmith logged each run, so every failing answer came with its retrieved chunks, the grader's
decisions and the final prompt. That's what turned "it hallucinated" into "retrieval returned the
wrong section, and the grader let it through."

My question set was small: a few dozen questions I wrote from the documents myself, so I knew where
each answer should come from. I labeled the baseline answers by hand and compared them with the
judge's labels before trusting it. I didn't compute the judge's precision and recall formally, and
with a set this size I'd treat the exact percentage as rough.

## Results

With self-reflection, hallucinations dropped by 80% compared to the baseline.

<!-- TODO(Neha): give the before and after rates (e.g. "from X% of answers to Y%"), not just the
relative drop. Readers trust "X → Y" more than a percentage of a percentage. -->

## What it cost

The drop came with three costs:

- Latency and cost went up. Every grading step is another model call, and a retry repeats several of
  them. I didn't measure this carefully, but answers took noticeably longer, and longer still when a
  retry kicked in.
- I got more "I don't know" answers. Some questions that used to get a confident wrong answer now get
  an honest non-answer. For research I think that's the right trade, but count those answers and
  report them.
- Retrieval misses don't go away. If the answer isn't in the vector store, reflection can only
  refuse. Fixing that is a chunking and retrieval problem.

## What I'd do next

- Grade with a smaller model. The graders do narrow yes/no work, which a cheaper model may handle as
  well. That would win back much of the latency.
- Grow the eval set from production. Every failing trace that a user flags should become a dataset
  example, so the next change gets tested against real failures.
- Measure the judge properly. Compute its precision and recall against my labels, and time each
  node so I know what the checks actually cost.
- Report faithfulness and answer rate together. A system that refuses everything has perfect
  faithfulness, and the pair is harder to game than either number alone.
