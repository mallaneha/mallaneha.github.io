---
title: "Build it, part 2: where GPT-2's 124M parameters live"
description: "Count GPT-2 small's parameters matrix by matrix, and see why a third of them are a lookup table."
date: 2026-11-22
type: post
tags: [llm-systems]
draft: false
---

This is part 2 of my "Build it" series. [Part 1](/writing/build-attention/) built one attention head by
hand. This part counts every parameter in GPT-2 small, matrix by matrix, until you reach 124,439,808. It
doesn't cover training or what the parameters end up learning. It's bookkeeping, which is more useful
than it sounds.

People repeat "124M parameters" about GPT-2 small without saying where the parameters are. I think it's
worth counting once, because the answer explains how bigger models are built and what they cost to run.

I mostly use a parameter count to estimate memory. At 2 bytes per parameter (16-bit
weights), GPT-2 small is about 250 MB and a 7B model is about 14 GB. That's the first line of the
budget in [part 3](/writing/build-a-serving-budget/).

GPT-2 small has a vocabulary of 50,257 tokens, a context of 1,024 tokens, 768-dimensional embeddings
(d_model, the width of every vector inside the model) and 12 layers, each with 12 attention heads.
Everything below follows from those five numbers.

<gpt-shape>
<div class="xp-fallback"><p>This is an interactive parameter counter. With JavaScript on, you can change d_model, layers, heads, vocabulary and context and watch the total update.</p><p>For GPT-2 small it comes to 124,439,808 parameters: token embeddings 31.0%, position embeddings 0.6%, attention 22.8%, MLP 45.5% and layer norms under 0.1%.</p></div>
</gpt-shape>

## The embedding table

The first thing the model does is look up each token in a table with one row per token and 768
columns. That's 50,257 × 768 = 38,597,376 parameters, 31% of the whole model, and all it does is turn
token IDs into vectors. Keep that in mind when you compare small models by parameter count: a big chunk
of a small model is a lookup table.

GPT-2 also learns a position table: 1,024 × 768 = 786,432 parameters, one row per position.

At the other end, the model has to turn a 768-dimensional vector back into a score for every token in
the vocabulary. GPT-2 reuses the embedding table for that (transposed), so the output layer costs
nothing extra. This trick is called weight tying.

## One transformer block

Each of the 12 blocks has four weight matrices and two layer norms (a normalization step with a learned
gain and bias for each dimension). Using d for d_model:

| Matrix                       | Shape             | Weights + biases |
| ---------------------------- | ----------------- | ---------------- |
| Query, key, value projection | d × 3d            | 3d² + 3d         |
| Attention output projection  | d × d             | d² + d           |
| MLP up-projection            | d × 4d            | 4d² + 4d         |
| MLP down-projection          | 4d × d            | 4d² + d          |
| Two layer norms              | 2 × (gain + bias) | 4d               |

That adds up to 12d² + 13d per block. At d = 768 it's 7,087,872, and twelve blocks make 85,054,464.
The MLP, the two-layer feed-forward network after attention, takes two thirds of each block, because
it widens the vector to 4 × 768 = 3,072 and back.

Add a final layer norm (1,536 parameters) and the total is 38,597,376 + 786,432 + 85,054,464 + 1,536
= 124,439,808.

If you'd rather check it in code:

```python
def gpt2_params(vocab=50257, ctx=1024, d=768, layers=12):
    embeddings = vocab * d + ctx * d
    per_block = 12 * d * d + 13 * d
    return embeddings + layers * per_block + 2 * d  # + final layer norm

gpt2_params()  # 124439808
```

## Why more heads don't add parameters

Move the heads slider in the counter and the total doesn't change. The 12 heads don't each get their
own 768-wide matrices. They split the same d × 3d projection into 12 slices of 64, so more heads just
means narrower heads. The one rule is that d_model has to divide evenly by the head count.

## What grows when you scale up

Pick GPT-2 XL (d_model 1,600, 48 layers). The total becomes 1,557,611,200, and the embedding share
drops from 31% to 5%. The vocabulary stays the same while the blocks grow with d², so at large sizes
almost everything is attention and MLP weights.

The d² is also why the rest of this series keeps coming back to the blocks. Doubling d_model roughly
quadruples the weights in every layer.

## Two rules of thumb: memory and compute

Stored as 16-bit floats, each parameter takes 2 bytes, so GPT-2 small is about 249 MB of weights.
Generating one token takes about 2 FLOPs per parameter, one multiply and one add, so about 249 million
FLOPs for GPT-2 small. Both rules come from kipply's inference arithmetic. I'd learn them by heart:
[part 3](/writing/build-a-serving-budget/) puts them to work for a model a hundred times bigger.

## What newer models change

Sebastian Raschka's architecture comparison shows that models from 2025 and 2026 still share this
skeleton, with a few swaps. Most replace the learned position table with RoPE, so the 786,432 position
parameters disappear. Grouped-query attention gives several query heads one shared key and value head,
which shrinks the d × 3d projection. Many large models replace the single MLP with a mixture of
experts, so the parameter count and the parameters used per token are no longer the same number.
DeepSeek V3 has 671B parameters but uses 37B for each token.

## Further reading

- Jay Mody, [GPT in 60 Lines of NumPy](https://jaykmody.com/blog/gpt-from-scratch/), which builds
  these same matrices and loads OpenAI's real GPT-2 weights into them.
- Sebastian Raschka, [The Big LLM Architecture
  Comparison](https://magazine.sebastianraschka.com/p/the-big-llm-architecture-comparison) and the
  [LLM Architecture Gallery](https://sebastianraschka.com/llm-architecture-gallery/), for what changed
  after GPT-2.
- Georgia Tech Polo Club, [Transformer Explainer](https://poloclub.github.io/transformer-explainer/),
  which walks through the same GPT-2 small shapes in the browser.

Next, [part 3](/writing/build-a-serving-budget/) uses these two rules to work out how many requests a
13B model can serve at once.
