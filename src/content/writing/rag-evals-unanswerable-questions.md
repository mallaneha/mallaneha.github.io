---
title: "Your RAG eval set needs questions it can't answer"
description: "Without unanswerable questions, refusing always looks like a mistake. How I score hallucinations, wrong refusals and right refusals."
date: 2026-11-23
type: post
tags: [evals, rag, healthcare]
draft: true
---

When I added self-reflection to my [research agent](/writing/cutting-hallucinations-research-agent/),
hallucinations went down and "I don't know" answers went up. I said at the end of that post that you
should count those refusals and report them. Doing that properly turned out to need a different eval set
from the one I started with. <!-- TODO(Neha): confirm every question in the research agent eval set had
an answer in the documents -->

Every question in it had an answer somewhere in the documents. That sounds reasonable, and it hides the
problem. If every question can be answered, every refusal counts as a mistake, so the system that never
refuses scores best. You can't test whether a system knows when to stop if no question ever asks it to.

This post covers what to add to an eval set, the five outcomes I score, and how to pick a relevance
floor: the retrieval score below which the system refuses. It doesn't cover how to write the refusal
message or what to do after one (routing to a person, asking a follow-up).

## Vector search always returns something

A retriever doesn't know when it has nothing. Simon Willison wrote about a RAG demo someone built over
his project's docs. Asked "what is the meaning of life?", it answered in the voice of a gerbil, because
a release note happened to contain an example prompt about one. His explanation: "because embeddings
search orders by similarity score it will ALWAYS return results" ([Willison,
2024](https://simonwillison.net/2024/Jun/6/accidental-prompt-injection/)). Ask about something the
documents don't cover and you still get the nearest chunks. They're just the nearest wrong ones.

So the model has to notice that the context doesn't answer the question, and models are bad at that.
Chroma tested 18 models with distracting, nearly relevant text in the context, and found they made up
answers more often than they declined to answer ([Kelly Hong's talk, via Hamel
Husain](https://hamel.dev/notes/llm/rag/p6-context_rot.html)).

Health plan documents are full of nearly relevant text: last year's plan next to this year's, the
in-network rule next to the out-of-network one. A made-up answer that cites a real paragraph from the
wrong section is the failure I worry about most.

I saw a plainer version of this in my research agent. In the baseline, when I asked something the
documents didn't cover, the model answered anyway, from whatever it picked up in training. [ADD: the
question, and what the agent said] The answer read just as well as the grounded ones, and nothing in it
hinted that the documents had nothing to say. The LangSmith trace showed it: the retrieved chunks had
nothing to do with the question. <!-- TODO(Neha): confirm this was a question with no answer in the
documents, not only a retrieval miss -->

## Five outcomes, not two

A typical RAG eval scores each answer right or wrong. Once some questions have no answer, two labels
aren't enough. Eugene Yan splits the no-answer cases into hallucinated answers, wrong refusals and right
refusals ([Yan, 2025](https://eugeneyan.com/writing/qa-evals/)). I split the answered side once more,
because a wrong answer built on the wrong chunk is a retrieval bug, and you fix it in a different place.

|                    | The documents answer it                     | They don't     |
| ------------------ | ------------------------------------------- | -------------- |
| **System answers** | Right answer, or wrong answer (wrong chunk) | Made-up answer |
| **System refuses** | Wrong refusal                               | Right refusal  |

Each cell points at a different fix. Made-up answers need a refusal path or a stricter prompt. Wrong
answers from the wrong chunk need better retrieval. Wrong refusals mean either the floor is too high or
the right chunk scored too low, and the second is a retrieval problem again.

## Try it: move the relevance floor

Below is a toy eval set: 20 questions about one health plan document. Fourteen can be answered from it.
Six can't, like "Is my dentist in network?" when the document has no provider list. Each dot is a
question, placed by the top retrieval score it got. The system refuses anything to the left of the
floor.

<abstain-lab>
<div class="xp-fallback"><p>With JavaScript on, this is a slider for the relevance floor over a toy eval set of 20 questions, 6 of which the documents can't answer.</p><p>With no floor, the system answers all 20: 11 right, 3 wrong, and 6 made up, so 9 of 20 (45%) answers are wrong or made up. At a floor of 0.60 it answers 12 and refuses 8. Wrong or made-up answers drop to 3 of 20 (15%), and 4 questions it could have answered get refused.</p></div>
</abstain-lab>

Three things to try:

1. Leave the floor at 0. The system answers everything, and 9 of 20 answers are wrong or made up.
2. Move it to 0.60. Wrong and made-up answers drop to 3, and 4 good questions now get refused. Whether
   that's a good trade depends on what a wrong answer costs. For a benefits question, I'd take it: a
   member who hears "I don't know" calls the plan, and a member who hears a wrong answer may not.
3. Untick the six unanswerable questions. Now the floor can only hurt. At 0.60 you drop from 11 right
   answers to 9, and nothing on the screen shows what you got in exchange. That's what my first eval set
   would have told me.

The scores in the toy overlap on purpose. "Is my dentist in network?" scores 0.71, higher than several
real answers, because the document talks about networks a lot. No floor separates the two groups
cleanly. [ADD: how much the scores overlapped on a real eval set]

## How I build the no-answer questions

Write the no-answer questions with as much care as the rest. "Who won the game last night?" is easy to
refuse and tells you almost nothing. The useful ones sit close to the documents:

- **Missing on purpose.** The topic is in the documents, the detail isn't. Premiums for next year, a
  specific dentist, a member's own ID.
- **Wrong version.** The answer exists for a different plan year, product or state. This is where nearly
  relevant text does the most damage.
- **Out of scope but nearby.** Questions a real member would ask the same chatbot, like "Can I switch
  plans in March?", that the document set was never meant to answer.

Real user questions are the best source once you have them. Until then, I write them by hand from the
documents, the same way I write answerable ones, so I know for each question where the answer is or why
it isn't there. Yan also suggests mixing question types and varying where in the document the evidence
sits ([Yan, 2025](https://eugeneyan.com/writing/qa-evals/)).

I don't have a tested ratio to recommend. The toy above makes 6 of 20 unanswerable, which is enough for
the refusal numbers to move. [ADD: the ratio and set size used in a real eval, if there is one]

## What to report

I report four numbers together, never one alone:

1. **Answer rate**: how often the system answers at all.
2. **Accuracy when it answers**: right answers divided by answers given.
3. **Made-up rate**: made-up answers divided by unanswerable questions.
4. **Wrong refusal rate**: wrong refusals divided by answerable questions.

A system that refuses everything has a perfect made-up rate, and one that refuses nothing has a perfect
wrong-refusal rate. Side by side, neither can look good by accident.

When the floor changes, I report all four before and after, on the same set, and I decide what counts as
acceptable before I look. That habit comes from [clinical data
validation](/writing/clinical-data-validation-ai-evals/), where you decide what blocks a release before
you see the results.

## Where a single floor isn't enough

A score threshold is the simplest refusal policy, and a crude one. Retrieval scores aren't calibrated
across query types, so a floor that works for coverage questions can be wrong for code lookups. Two
approaches go further:

- **Grade the context, not just the score.** A second model call checks whether the retrieved chunks
  actually answer the question, which is what the document grader in my research agent did. It costs a
  call, and it catches the high-scoring wrong chunks a floor can't.
- **Abstain on the answer, not the retrieval.** GopherCite trained a reward model and returned "I don't
  know" when the score of the answer fell below a threshold ([Lilian Weng's
  survey](https://lilianweng.github.io/posts/2024-07-07-hallucination/)). Same idea, applied after
  generation.

Both still need no-answer questions to tune them. So start there: add ten questions your documents can't
answer to the eval set you already have, and see what your system says.
