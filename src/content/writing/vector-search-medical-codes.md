---
title: "Why vector search misses medical codes"
description: "E11.9 and E11.65 look alike to an embedding model. Keyword, vector and hybrid search on a toy health plan document."
date: 2026-11-23
type: post
tags: [rag, healthcare, evals]
draft: true
---

Claims, prior-authorization lists and coverage policies are full of codes: diagnosis codes like E11.9,
procedure codes like 99213, drug codes. When a claims reviewer or a member types one into a search box,
they want the paragraph with that exact code. A paragraph about a similar code is a wrong answer.

Vector search, the default retriever in most RAG tutorials, is built to find similar things. For codes,
similar is the problem. This post shows the failure on a small example you can click through, then what
I'd do about it. It doesn't cover which embedding model to use or how to tune BM25.

## Two codes that mean almost the same thing

E11.9 is the ICD-10-CM code for type 2 diabetes without complications. E11.65 is type 2 diabetes with
hyperglycemia (high blood sugar). In a health plan they can be covered differently: one might cover test
strips with no paperwork, the other a continuous glucose monitor after prior authorization.

An embedding model is trained to put text with similar meaning close together. These two codes sit in
paragraphs about the same disease, with nearly the same words around them. So their vectors land close
together, and small differences in wording decide which one ranks first.

Keyword search ignores meaning. If the query contains the token `e11.65`, only chunks with that exact
token score. BM25, the standard keyword ranking formula, also weights rare terms higher, and a specific
code is about as rare as a term gets.

Eugene Yan made this point in 2023: embedding search struggles with names, acronyms and IDs, and keyword
search misses synonyms, so "hybrid retrieval (traditional search index + embedding-based search) works
better than either alone" ([Yan, 2023](https://eugeneyan.com/writing/llm-patterns)). Augment's team
found something similar for source code: for their SWE-bench agent, grep and find were enough, and
better embeddings didn't necessarily improve the end result ([Jason Liu's
write-up](https://jxnl.co/writing/2025/09/11/why-grep-beat-embeddings-in-our-swe-bench-agent-lessons-from-augment/)).

## Try it: one document, three searches

The document below is a made-up health plan split into six chunks. The codes in it are real. Pick a
query and compare the top three results from keyword search, vector search and hybrid search. The chunk
that actually answers the query is highlighted.

<code-search>
<div class="xp-fallback"><p>With JavaScript on, this runs three queries against a six-chunk toy plan document with keyword search (BM25), vector search and hybrid search (reciprocal rank fusion).</p><p>For "E11.65", keyword search ranks the right chunk first and vector search ranks it second, behind the E11.9 chunk. For "99213 copay", vector search prefers the 99203 chunk. For "high blood sugar", keyword search never finds the right chunk, which says "hyperglycemia", and vector search ranks it first. Hybrid search gets the first two right, and the third only after adding "hyperglycemia" as a synonym to the keyword query.</p></div>
</code-search>

Here's what each query shows.

- **"E11.65"**: vector search puts the E11.9 chunk first. Keyword search finds the right one, because
  only one chunk contains that token. Hybrid keeps it first.
- **"99213 copay"**: vector search prefers the 99203 chunk (a new patient visit, not an established
  one). Same story: keyword and hybrid get it right.
- **"high blood sugar"**: now keyword search fails. The right chunk says "hyperglycemia", and the blood
  pressure chunk matches "high" and "blood" twice. Vector search gets it right, because this one is
  about meaning. Hybrid follows the keyword false hit and ranks the right chunk second. Tick the synonym
  box, which adds "hyperglycemia" to the keyword query, and hybrid gets it right.

One caveat about the toy. The BM25 and fusion scores are computed live, but I set the vector
similarities by hand to show the pattern Yan describes. They don't come from a real model. [ADD: the
same three queries run through a real embedding model, with its actual scores]

## How hybrid search combines the two

Hybrid search here uses reciprocal rank fusion (RRF). Each search returns a ranked list, and a chunk
gets 1 / (60 + rank) from each list it appears in. The chunk with the highest total wins. The 60 is the
usual default. It keeps the gap between first and second place small, so neither list decides on its
own.

RRF looks only at ranks, never at the scores. That's why it's popular: BM25 scores and cosine
similarities are on different scales, and with RRF you never have to convert one into the other. It's
also why the "high blood sugar" query fails. A strong keyword hit on the wrong chunk counts as much as a
strong vector hit on the right one, and hybrid only gets it right once the keyword side does too.

## What I'd do on real documents

In my Medicare Evidence of Coverage work, the documents mostly didn't contain codes. An Evidence of
Coverage is written for members, so its benefits charts name services in plain language, like "primary
care physician services". A question with a code in it would have had nothing exact to match. The hard
part of that project was somewhere else: every plan lays its document out differently, and I used each
document's table of contents to find the benefits charts before anything was indexed.

So the first thing I'd check is whether your documents contain codes at all. If they don't, a mapping
from codes to service names will do more than any search setting.

If they do, I'd do four things.

1. **Run keyword and vector search together from the start.** It means two indexes instead of one, and
   many search engines and vector databases support both.
2. **Tokenize codes as whole tokens.** A tokenizer that splits `E11.65` into `e11` and `65` makes
   keyword search worse at the one thing you need it for. Check what your search engine does with dots
   and hyphens.
3. **Route exact identifiers to an exact lookup.** If the query matches a code pattern, filter on a
   metadata field before you rank anything. Jason Liu describes this as extracting structure into
   metadata so queries can filter on it. The same goes for plan IDs when one index holds many plans: tag
   each chunk with its plan and filter on that first ([Liu,
   2025](https://jxnl.co/writing/2025/01/24/systematically-improving-rag-applications/)).
4. **Keep a synonym list for the plain-language side.** Members say "high blood sugar"; documents say
   "hyperglycemia". A short list of clinical terms and their everyday versions fixes many keyword
   misses.

## Measure it by query type

The trap here is the average. Liu's example: a system with 70% recall overall can be at 5% on one kind
of question ([Liu,
2025](https://jxnl.co/writing/2025/01/24/systematically-improving-rag-applications/)). Code lookups are
exactly that kind of question. They may be a small share of traffic, and they're the ones where a near
miss becomes a wrong coverage answer.

So I'd split the eval set into at least three groups (code lookups, plain-language coverage questions,
and questions that need more than one chunk) and report recall for each kind of search on each group. If
vector search wins on one group and loses on another, that's your case for hybrid, with numbers. It's a
cheap experiment to run on public coverage policies that list codes.

Keyword matching has a side benefit if you work somewhere regulated. When someone asks why the system
returned a paragraph, "the query contained E11.65 and so did this chunk" is an answer an auditor can
check. A cosine similarity of 0.80 isn't.
