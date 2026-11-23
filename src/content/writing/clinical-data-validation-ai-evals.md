---
title: "What clinical data validation taught me about AI evals"
description: "Applying FDA and Pinnacle 21 style checks to evaluating LLM output in regulated domains."
date: 2026-11-22
type: post
tags: [evals, healthcare, governance]
draft: true
---

Before I worked on AI systems, I spent three and a half years preparing clinical trial data for FDA
submissions. I built more than 800 standardized datasets and reports, and every one of them was
validated before it left the building.

When I started evaluating LLM output, I expected to learn a new discipline. I kept running into
problems that clinical data teams had solved years ago. This post covers five habits from that work
that I now use for AI evals. It doesn't cover eval tooling or how to set up a test harness, and you
don't need to know anything about clinical trials to follow it.

## How validation works in a submission

Clinical trial data goes to the FDA in standard formats defined by CDISC, the standards body for
clinical research data. Three of them matter here:

- SDTM organizes the collected data in a standard structure. It is one of the standards required
  for submission to the FDA and Japan's PMDA
  ([CDISC SDTM](https://www.cdisc.org/standards/foundational/sdtm)).
- ADaM defines the analysis datasets built from SDTM. A core principle is traceability between
  analysis results, analysis data and the SDTM source
  ([CDISC ADaM](https://www.cdisc.org/standards/foundational/adam)).
- Define-XML is the metadata describing which datasets, variables and controlled terms were used,
  and the FDA requires it for every study in a submission
  ([CDISC Define-XML](https://www.cdisc.org/standards/data-exchange/define-xml)).

Before anything is submitted, the data runs through a validator. The FDA publishes its own validator
rules, used "to ensure data are standards compliant and support meaningful review and analysis"
([FDA study data standards](https://www.fda.gov/industry/fda-data-standards-advisory-board/study-data-standards-resources)).
In industry, Pinnacle 21 is a widely used tool for running checks like these. Each finding has to be
fixed, or explained to the reviewer in a reviewer's guide.

It's tedious work. It's also why a regulator can trust a dataset built by a team they've never met.

## 1. Passing the format checks doesn't make the answer right

A clean validation report means the data is well formed: the right variables, the right controlled
terms, consistent dates. It says nothing about whether the analysis is right. A dataset can pass
every structural rule and still carry a wrong derivation, meaning a value computed from other values
with the wrong logic.

The simplest one I remember was an age group. The spec said 65 and over, and the code used greater
than 65, so every 65-year-old landed in the younger group. Every variable had the right type and the
right label, and Pinnacle 21 had nothing to say about it. We found it when the group counts in the
demographics table didn't match the listing.

LLM evals have the same trap. A response can be valid JSON, use the right format, cite a source and
pass every assertion, and still be wrong.

So I keep two layers of checks apart:

- Conformance checks are cheap and deterministic, and they run on every change. Hamel Husain
  describes these as unit tests for LLMs, assertions you'd write in pytest that run fast on every
  code change ([Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/)).
- Correctness checks are slower and more expensive. They need a human reviewer, or an LLM judge that
  has been checked against human labels.

An output has to pass the first layer before it's worth spending the second on. Don't let a green
first layer stand in for the second.

## 2. Trace every finding back to a record

The most useful thing I built at Numeric Mind was a debugging tool. A Pinnacle 21 finding tells you
that a rule failed, but it doesn't hand you the patient records behind it. Analysts were looking
those up by hand. My tool traced each finding back to the exact records in the SDTM and ADaM
datasets, and it cut our issue resolution time by 75%.

The slowest ones were ADaM values that didn't match their SDTM source. Before, an analyst rebuilt the
derivation by hand to find where they split. After, the tool showed the ADaM record and the SDTM
records it came from side by side.

ADaM builds this idea into the standard: an analysis result should be traceable to the data it came
from.

For AI systems the equivalent is the trace. When an eval fails, I want one click from the failing
score to the exact input, retrieved documents, prompt version, intermediate steps and output. A pass
rate on its own tells you something is wrong. You need the trace to know what to fix.

## 3. Have someone else check it independently

In clinical programming, important outputs are commonly checked by a second programmer who produces
them independently. If two people derive the same number separately, you can trust it more than if
one person checks their own work.

On my team, key ADaM datasets and the main tables were double-programmed. A second analyst wrote
their own code from the same spec, and we compared the outputs with PROC COMPARE. When they didn't
match, the cause was usually a spec that two people could read two ways, and we fixed the spec before
touching either program.

An LLM judge is a second programmer you haven't vetted yet. Before you trust it, check its work
against yours: label a sample by hand and measure how often the judge agrees. Hamel recommends
precision and recall for this rather than raw agreement, because when failures are rare, a judge
that says "fine" every time looks accurate. That judge would never catch a failure. And when the judge disagrees with you, check whether your
rubric can be read two ways before you blame the judge.

## 4. Decide what blocks a release before you see the results

Not every validator finding blocks a submission. Some must be fixed. Others are acceptable if you
explain them. Teams decide which is which, write it down, and justify it to the reviewer.

Pinnacle 21 once flagged duplicate vital signs records at the same visit. They were real: the
protocol asked for repeated blood pressure readings a few minutes apart. Deleting them would have
given us a clean report and wrong data, so we kept them and explained why in the reviewer's guide.

AI evals need the same explicit triage. In Hamel's words, your pass rate is "a product decision." A
formatting slip in an internal summary and a leaked patient identifier aren't the same failure, and
they shouldn't share a threshold. I write down which checks are blocking, which are warnings, and
why, before I look at the results. Otherwise it's too easy to decide a bad number is acceptable after
you've seen it.

## 5. Document the evaluation like a submission

A submission includes metadata (Define-XML) and reviewer's guides along with the data, explaining
what was done and why. A reviewer can understand the package without calling the team.

AI governance frameworks are asking for the same thing. The NIST AI RMF Playbook's MEASURE function
expects that the test sets, metrics and tools used during evaluation are documented
([NIST AI RMF Playbook: Measure](https://airc.nist.gov/airmf-resources/playbook/measure/)). In
practice I keep a short eval card next to every reported number. It lists:

- the dataset and where it came from
- metric definitions
- the judge model and its agreement with humans
- known gaps
- what changed since the last run

## Where the analogy breaks

Clinical validation has a fixed target. The standards say exactly what a conformant dataset looks
like, and most checks are deterministic. Generated text has no single correct form. Two different
answers can both be right, and the same prompt can produce different outputs on different runs.

So AI evals need things clinical validation mostly doesn't: sampling and repeated runs, human
judgment on open-ended quality, and judges that are themselves models with error rates. The habits
above still apply, but you won't get the same certainty from them.

If you want one place to start, write the eval card for a number you already report. The gaps you
find while filling it in are your next checks.
