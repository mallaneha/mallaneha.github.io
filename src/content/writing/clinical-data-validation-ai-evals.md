---
title: "What clinical data validation taught me about AI evals"
description: "Applying FDA and Pinnacle 21 style checks to evaluating LLM output in regulated domains."
date: 2026-11-22
type: post
tags: [evals, healthcare, governance]
draft: true
---

<!--
TODO(Neha) before publishing. Facts from the resume: 3.5 years at Numeric Mind, 800+ CDISC
datasets and reports in SAS and R, 10+ pharma clients, 15+ FDA submission packages, Pinnacle 21,
a debugging tool tracing P21 findings to patient records (-75% resolution time), led 12 analysts.
Add one or two real (anonymized) stories where marked; they'll make this post.
-->

Before I worked on AI systems, I spent three and a half years preparing clinical trial data for FDA
submissions. I built more than 800 standardized datasets and reports, and every one of them was
validated before it left the building.

When I started evaluating LLM output, I expected a new discipline. Instead I kept finding problems
that clinical data teams solved years ago. This post covers five habits from regulated data work
that I now use for AI evals.

## How validation works in a submission

Clinical trial data goes to the FDA in standard formats defined by CDISC:

- **SDTM** organizes the collected data in a standard structure. It is one of the standards
  required for submission to the FDA and Japan's PMDA
  ([CDISC SDTM](https://www.cdisc.org/standards/foundational/sdtm)).
- **ADaM** defines the analysis datasets built from SDTM. A core principle is traceability between
  analysis results, analysis data and the SDTM source
  ([CDISC ADaM](https://www.cdisc.org/standards/foundational/adam)).
- **Define-XML** is the metadata describing which datasets, variables and controlled terms were
  used, and the FDA requires it for every study in a submission
  ([CDISC Define-XML](https://www.cdisc.org/standards/data-exchange/define-xml)).

Before anything is submitted, the data runs through a validator. The FDA publishes its own
validator rules, used "to ensure data are standards compliant and support meaningful review and
analysis" ([FDA study data standards](https://www.fda.gov/industry/fda-data-standards-advisory-board/study-data-standards-resources)).
In industry, Pinnacle 21 is a widely used tool for running checks like these. Each finding has to be
fixed, or explained to the reviewer in a reviewer's guide.

None of this is glamorous. It is also why a regulator can trust a dataset built by a team they've
never met.

## 1. Conformance is not correctness

A clean validation report means the data is well-formed: the right variables, the right
controlled terms, consistent dates. It doesn't mean the analysis is right. A dataset can pass every
structural rule and still carry a wrong derivation.

LLM evals have the same trap. A response can be valid JSON, use the right format, cite a source,
pass every assertion, and still be wrong.

So I keep two layers apart:

- **Conformance checks**: cheap, deterministic, run on every change. Hamel Husain describes these
  as unit tests for LLMs, assertions you'd write in pytest that run fast on every code change
  ([Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/)).
- **Correctness checks**: slower and more expensive. A human reviewer, or an LLM judge that has
  been checked against human labels.

Passing the first layer earns an output the right to be checked by the second. It doesn't replace
it.

## 2. Every finding must trace back to a record

The most useful thing I built at Numeric Mind wasn't a dataset. It was a debugging tool. A
Pinnacle 21 finding tells you that a rule failed; it doesn't hand you the patient records behind
it. Analysts were looking those up by hand. My tool traced each finding back to the exact records
in the SDTM and ADaM datasets, and it cut our issue resolution time by 75%.

<!-- TODO(Neha): one sentence on what a typical finding looked like before and after the tool. -->

ADaM bakes this idea into the standard: an analysis result should be traceable to the data it came
from.

For AI systems the equivalent is the trace. When an eval fails, I want one click from the failing
score to the exact input, retrieved documents, prompt version, intermediate steps and output. A
pass rate without traces tells you something is wrong. It doesn't tell you what to fix.

## 3. Check independently

In clinical programming, important outputs are commonly checked by a second programmer who
produces them independently. If two people derive the same number separately, you can trust it
more than if one person checks their own work.

<!-- TODO(Neha): describe how QC worked on your team, e.g. whether you double-programmed key
datasets and TLFs, and what happened when outputs didn't match. -->

An LLM judge is a second programmer, but one you haven't hired yet. Before trusting it, you check
its work against yours: label a sample by hand and measure how often the judge agrees. Hamel
recommends precision and recall for this rather than raw agreement, because when failures are rare
a judge that says "fine" every time looks accurate. A judge that never catches a failure is a rubber
stamp, not a reviewer.

## 4. Severity is a decision, not a default

Not every validator finding blocks a submission. Some must be fixed. Others are acceptable if you
explain them. Teams decide which is which, write it down, and justify it to the reviewer.

AI evals need the same explicit triage. In Hamel's words, your pass rate is "a product decision."
A formatting slip in an internal summary and a leaked patient identifier aren't the same failure,
and they shouldn't share a threshold. I write down which checks are blocking, which are warnings,
and why, before I look at the results. Then a bad number can't quietly become an acceptable one.

## 5. Document the evaluation like a submission

A submission doesn't just include data. It includes metadata (Define-XML) and reviewer's guides
explaining what was done and why. A reviewer can understand the package without calling the team.

AI governance frameworks are asking for the same thing. The NIST AI RMF Playbook's MEASURE function
expects that the test sets, metrics and tools used during evaluation are documented
([NIST AI RMF Playbook: Measure](https://airc.nist.gov/airmf-resources/playbook/measure/)). In
practice I keep a short eval card next to every reported number: dataset and where it came from,
metric definitions, judge model and its agreement with humans, known gaps, and what changed since
the last run.

## Where the analogy breaks

Clinical validation has a fixed target. The standards say exactly what a conformant dataset looks
like, and most checks are deterministic. Generated text has no single correct form. Two different
answers can both be right, and the same prompt can produce different outputs on different runs.

That means AI evals need things clinical validation mostly doesn't: sampling and repeated runs,
human judgment on open-ended quality, and judges that are themselves models with error rates. The
habits carry over. The certainty doesn't.

## Takeaways

- Keep conformance checks and correctness checks separate, and require both.
- Make every failing score traceable to the exact input and output behind it.
- Validate your judge against human labels before trusting it.
- Decide severity and thresholds before you see the results.
- Document the eval so someone else could audit it without asking you.

Regulated industries already know how to make data trustworthy to a skeptical reviewer. AI in
healthcare, banking and insurance will be held to the same standard, and the playbook already
exists.
