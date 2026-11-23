---
title: "Build it: attention, one dot product at a time"
description: "Build one attention head by hand with four tokens and two-dimensional vectors, then watch what scaling and the causal mask change."
date: 2026-11-22
type: post
tags: [llm-systems]
draft: true
---

<!--
TODO(Neha) before publishing. Part 1 of 3 in the "Build it" series. Drafted from the reading notes in
mynotes/transformer/. Rewrite in your own voice, and add where you met this (course, project) if you want to.
The vectors are hand-picked toy values. Every number in the text matches what the widget computes.
-->

Attention lets every token in a sentence decide how much to borrow from every other token. That one
mechanism is most of what makes a transformer a transformer, and it's small enough to compute by hand.
So that's what this post does: four tokens, vectors with two numbers each, and every step on screen.

## Three vectors per token

Each token starts as an embedding. A head multiplies that embedding by three learned matrices to get
three new vectors:

- a query, what this token is looking for
- a key, what this token offers to others
- a value, what this token hands over if someone attends to it

In GPT-2 small these vectors have 64 numbers each. Here they have two, and I picked them by hand
instead of learning them, so you can plot them.

## Scores are dot products

To decide where "sat" should look, take its query and compute a dot product with every key. A key that
points the same way as the query gets a large score. One at a right angle gets zero, and one pointing
away gets a negative score.

Try it below. The arrow is the query and the dots are keys. Drag the sliders to move the query and
watch which key grows.

<attention-lab>
<div class="xp-fallback"><p>This is an interactive attention head. With JavaScript on, you can move each token's query and toggle scaling and the causal mask.</p><p>With the default settings, "sat" (query 1.2, 0.8) scores the keys at −0.56 for "The", 2.16 for "cat" and 0.56 for itself. After scaling, masking and softmax it puts 68% of its attention on "cat", 22% on itself and 10% on "The". It can't see "down", which comes later.</p></div>
</attention-lab>

## Scale, so softmax doesn't saturate

The raw scores go through a softmax, which turns them into weights that sum to 1. Softmax is sensitive
to how spread out its inputs are. If one score is much bigger than the rest, it takes almost all the
weight and the other tokens are ignored.

Dot products get bigger as vectors get longer. If each component is random with variance 1, the dot
product of two d-dimensional vectors has a standard deviation of √d. So the transformer divides every
score by √d_k, the key dimension. The original paper uses 64-dimensional heads, so it divides by 8.

In the toy above, d_k is 2, so scaling only changes a little: turn it off and "sat" moves from 68% to
79% on "cat". At real sizes it matters much more. Here are random vectors at a dimension you choose:

<scale-lab>
<div class="xp-fallback"><p>With JavaScript on, this compares softmax with and without scaling for one random query and eight random keys. At d_k = 128 the scores spread to about ±√128 ≈ ±11, and without scaling one key typically takes almost all of the weight.</p></div>
</scale-lab>

## The causal mask

A model that predicts the next word can't be allowed to read it. So before the softmax, every score
for a later token is set to −∞, which becomes a weight of exactly 0.

You can see it in the widget. "The" is first, so it can only attend to itself, and its row is 100% on
"The". "down" is last and sees everything. Untick the mask and "sat" starts giving 4% of its attention
to "down", a word it shouldn't know yet.

## Weighted sum of values

The weights decide how much of each value vector to take. With the default settings "sat" outputs
0.10 × value("The") + 0.68 × value("cat") + 0.22 × value("sat") = (0.32, 0.90). That output replaces
"sat"'s vector for the next layer. It now carries information borrowed mostly from "cat".

## All tokens at once

Doing this one query at a time is fine on paper. In practice every query is a row of a matrix Q, every
key a row of K, every value a row of V, and the whole head is one line:

```python
def attention(q, k, v, mask):
    return softmax(q @ k.T / np.sqrt(q.shape[-1]) + mask) @ v
```

The matrix at the bottom of the widget is `softmax(q @ k.T / √d_k + mask)`, the attention pattern for
the whole sentence. The mask makes it lower-triangular.

## Many heads

A real layer runs several heads side by side. GPT-2 small has 12 heads of 64 dimensions each, which
together make its 768-dimensional embedding. Each head learns its own query, key and value matrices,
so each can look for something different. Their outputs are joined and projected back to 768. [Part
2](/writing/build-gpt2-parameter-count/) counts what all those matrices cost.

## The part that matters for serving

Look at what happens when a new token arrives. The keys and values of the earlier tokens don't change,
because they only depend on those tokens. So a model that is generating text can store them and only
compute the new token's query, key and value. That store is the KV cache, and [part
3](/writing/build-a-serving-budget/) shows it ends up deciding how many people one GPU can serve.

## Further reading

- Jay Alammar, [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/), the
  classic diagrams of queries, keys and values.
- Georgia Tech Polo Club, [Transformer Explainer](https://poloclub.github.io/transformer-explainer/).
  Type your own text into GPT-2 small and hover over tokens to see real attention weights.
- Brendan Bycroft, [LLM Visualization](https://bbycroft.net/llm), every matmul of a small GPT in 3D.
- PyTorch blog, [Inside the Matrix](https://pytorch.org/blog/inside-the-matrix/), which draws one
  attention head as six matrix multiplications.
