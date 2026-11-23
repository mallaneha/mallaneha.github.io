---
title: "LLMs by hand, part 3: a serving budget"
description: "Work out how many users a model can serve from four numbers: weights, KV cache, memory and bandwidth."
date: 2026-11-22
type: post
tags: [llm-systems]
series: llms-by-hand
part: 3
draft: false
---

This is the last part of my "LLMs by hand" series. Here you turn a model and some hardware into a budget:
how many requests fit in memory, how long each generation step takes, and how many tokens per second
you get. It covers decoding, the phase where the model generates one token at a time. It doesn't cover
prefill, communication between chips, or real measurements. Everything here is arithmetic, and the last
section says how far off that arithmetic can be.

Two facts drive the whole budget. When a model generates text, each new token needs the whole model:
every weight is read from memory once per step. On top of that, every request in the batch reads its
own KV cache, the keys and values saved from [part 1](/writing/build-attention/).

A lot of my work has been with clinical and healthcare data. In healthcare, sending a prompt with
patient data to a hosted API often has to clear a compliance review first. When it can't, the team
hosts the model itself, and this budget estimates what that costs.

The running example is LLaMA 2-13B on eight TPU v5e chips (Google's AI accelerators), the worked
example in Google's _How To Scale Your Model_. You can switch setups and change any number in the
widget.

<serving-budget>
<div class="xp-fallback"><p>This is an interactive serving calculator. With JavaScript on, you can change the model, hardware and batch size and see memory, step time and throughput update.</p><p>For LLaMA 2-13B on 8× TPU v5e with full multi-head attention and 8,192-token sequences: the weights take 26 GB of 137 GB, each sequence's KV cache takes 6.7 GB, and at most 16 sequences fit. Batch 1 runs at 5.0 ms per step (about 201 tokens/s). Batch 16 runs at 20.3 ms per step (about 787 tokens/s).</p></div>
</serving-budget>

## Step 1: the weights

13 billion parameters at 2 bytes each is 26 GB. Each v5e chip has 16 GiB, about 17.2 GB, so eight of
them hold 137 GB, and 111 GB is left after the weights.

## Step 2: the KV cache

For every token, every layer stores one key and one value vector per KV head:

```text
KV bytes per token = 2 (K and V) × bytes per number × head dim × KV heads × layers
                   = 2 × 2 × 128 × 40 × 40
                   = 819,200 bytes
```

That's about 0.8 MB for every token of every request. At 8,192 tokens a sequence needs 6.7 GB, a
quarter of the model's weights. If you only compute one number for a deployment, I'd make it this one.

## Step 3: how many requests fit

111 GB free ÷ 6.7 GB per sequence = 16 sequences. Ask for a 17th and the chips are out of memory. The
widget shows that limit as the dashed "memory full" line.

## Step 4: how long a step takes

Generating one token per request is a race between reading memory and doing math. The weights are
read once and shared by the whole batch, while each request's cache is read separately:

```text
step time ≈ batch × KV bytes per sequence / memory bandwidth
          + max(2 × batch × parameters / FLOP/s,  weight bytes / memory bandwidth)
```

At batch 1, reading 26 GB of weights at 8 × 820 GB/s takes 4.0 ms, and the cache adds 1.0 ms: 5.0 ms
per step, about 201 tokens per second. At batch 16 the weights still take 4.0 ms, but the caches now
take 16.4 ms. The step is 20.3 ms, 787 tokens per second, and 80% of the time goes to reading KV
caches.

## Step 5: the critical batch

The critical batch is the batch size where the weight matmuls stop waiting on memory and start waiting
on math. Each parameter costs 2 FLOPs per token and 2 bytes to read, so the crossover is at batch =
FLOP/s ÷ bandwidth. For a v5e that's 197 TFLOP/s ÷ 820 GB/s ≈ 240. kipply gets 208 for an A100 the same
way. Below that batch, the chips mostly wait for memory.

Here, memory runs out at 16, far below 240. This setup can never batch enough to make the matmuls
compute-bound. The KV cache is the bottleneck.

## Step 6: shrink the cache

Switch the widget to the setup with grouped-query attention (GQA), where 8 KV heads are shared by all
40 query heads. The cache drops to 164 kB per token and 1.3 GB per sequence, and 83 sequences fit
instead of 16. At batch 64 the model runs at about 3,750 tokens per second, almost five times the best
the full-attention setup can do.

That's why grouped-query attention is everywhere now. LLaMA-3 8B, for example, uses 32 query heads and
8 KV heads. The other architecture changes from [part 2](/writing/build-gpt2-parameter-count/)
(multi-head latent attention, sliding-window layers, sharing KV across layers) go after the same
number. Raschka's architecture gallery even lists KV-cache growth per token on each model's card.

Quantizing, storing numbers in fewer bits, helps the same way. Set weights and KV cache to int8, and
the weights drop to 13 GB, a sequence to 671 MB, and 185 sequences fit. The critical batch halves to
120, because each parameter is now 1 byte to read for the same 2 FLOPs.

## kipply's 52B example

The third setup is kipply's: a 52B-parameter model on A100s with 40 GB each. The weights take 104 GB,
so three GPUs is the minimum. That leaves 16 GB, and at about 2 MB per token that's 7,629 tokens, or 3
requests of 2,048 tokens. kipply rounds 2 MB to 0.002 GB and gets about 8,000 tokens, or a batch of 4.
On four GPUs, 56 GB is free, enough for about 26,700 tokens, or 13 requests of 2,048 tokens. A batch-1
step then takes about 18 ms, of which 17 ms is reading the weights.

## How far off the arithmetic is

Treat every number in this post as a lower bound. kipply checked this kind of estimate against a real
13B deployment: the arithmetic predicted 16.8 ms per token, and the measured time was 22.0 ms. Most of
the gap was achieved bandwidth (about 90% of the spec) and intermediate activations. The model above
also ignores communication between chips, the attention math itself, and prefill, the step that
processes the prompt before generation starts. Prefill is compute-bound, a different budget.

I haven't measured a deployment myself yet. When I do, I'll compare it with kipply's result, where the
measured time was about 30% above the arithmetic. If mine is much further off, I'll check my setup
first.

## Further reading

- kipply, [Transformer Inference
  Arithmetic](https://kipp.ly/blog/transformer-inference-arithmetic/), the first-principles version of
  all of this, with 12 exercises.
- Google DeepMind, [All About Transformer
  Inference](https://jax-ml.github.io/scaling-book/inference), chapter 7 of _How To Scale Your
  Model_. The LLaMA 2-13B example and the step-time formula come from there, along with sharding
  across chips.
- Sebastian Raschka, [LLM Architecture Gallery](https://sebastianraschka.com/llm-architecture-gallery/),
  to compare the KV-cache cost of real models.

If you want to check you've got this, do kipply's 12 exercises next. They push the same arithmetic
further.
