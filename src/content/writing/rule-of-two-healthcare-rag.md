---
title: "The Rule of Two for a healthcare RAG assistant"
description: "Which features push a RAG assistant over patient data into untrusted input, sensitive data and outbound actions at once, and what to do then."
date: 2026-11-23
type: post
tags: [security, healthcare, rag, agents]
draft: true
---

With [Vector Guard](/#projects) I worked on keeping poisoned documents out of a RAG index. This post is
about the step after that: assume a bad document gets through. What can it make the assistant do?

The answer depends less on the model than on the features you give it. I'll check that with one rule,
Meta's Agents Rule of Two, applied feature by feature to a RAG assistant for health plan members. The
post doesn't cover permissions (which member's records the assistant can retrieve), which is a separate
failure. It also doesn't cover filtering out prompt injections, for reasons I'll get to.

## The three properties

Meta published the rule in October 2025 ([Meta
AI](https://ai.meta.com/blog/practical-ai-agent-security/)). It builds on Simon Willison's "lethal
trifecta" ([Willison, 2025](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)). In one
session, an agent should have no more than two of these:

- **[A] It processes untrusted input**: any text someone other than the user could have written.
- **[B] It has access to sensitive systems or private data.**
- **[C] It can change state or communicate externally**: send something, write something, or make a
  request that leaves the system.

If a task needs all three, the agent shouldn't run on its own. A person approves its actions, or
something equally reliable checks them.

The reason is prompt injection. In Willison's words, "LLMs are unable to reliably distinguish the
importance of instructions based on where they came from." If a document the agent reads says "send the
member's claims history to this address", and the agent can read claims and send things, nothing in the
model reliably stops it.

## Why not filter the bad text?

Because filters don't hold up against an attacker who keeps trying. In October 2025, a group of 14
researchers attacked 12 published defenses against prompt injection and jailbreaks with attacks that
adapt to the defense. Most defenses had reported near-zero attack success. Against adaptive attacks,
attack success was above 90% for most of them ([Nasr et al., 2025](https://arxiv.org/abs/2510.09023),
summarized by [Willison](https://simonwillison.net/2025/Nov/2/new-prompt-injection-papers/)). I go
through those numbers in [a separate post](/writing/measuring-rag-poisoning-defense/).

So I ask a different question: if an injection gets through, what's the worst it can do? That depends on
which of A, B and C the assistant has.

## Try it: build the assistant

Start with a member assistant that answers questions from the member's own claims and plan documents.
That's [B] by design, since it's the reason the assistant exists. Now add features and watch which
circles fill.

<rule-of-two>
<div class="xp-fallback"><p>With JavaScript on, this is a checklist of features for a health plan member assistant, next to a diagram of the three Rule of Two properties.</p><p>Answering from the member's claims and plan documents gives it [B] sensitive data. Reading PDFs the member uploads adds [A] untrusted input. Together that's two properties, which is lower risk. Adding any feature that shows links or images, sends email, or files an appeal adds [C], and then it has all three.</p></div>
</rule-of-two>

The default setup, member data plus uploaded PDFs, is A and B. That's a reasonable product. The worst a
malicious PDF can do is make the assistant give the member a bad answer. That's still a problem, but the
data stays put.

Now tick "Shows links and images in its answers". It doesn't sound like an action, which makes it the
easiest one to miss. If the chat window renders a Markdown image, the browser fetches the image URL, and
an injected instruction can put the member's data into that URL. Willison counts any tool that can load
an image, offer a link or make a request as a way to send data out, and most of the incidents he lists
were fixed by closing that outbound path ([Willison,
2025](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)).

"Emails the member a summary" and "Files an appeal" are the obvious [C] features. Each one is useful,
and each one gives the assistant all three.

## What all three looks like in practice

One of Willison's examples of all three in one place is GitHub's official MCP server. A single tool
could read public issues, which anyone can write, read private repositories, and open pull requests. An
issue with instructions in it led the agent to open a pull request that leaked private data.

The healthcare version is easy to write. A member uploads a scanned bill. An outside provider's referral
comes in by fax. Someone emails a document that ends up in the member's file. The assistant reads it, it
has the member's claims in context, and it can email or file things. That doesn't take a sophisticated
attacker, just one document with instructions in it.

At Autonomize, part of my work was testing generative AI systems against the OWASP Top 10 for LLM
applications, using red- and blue-teaming agents. Prompt injection is the first item on that list, and
documents are one of the ways in: anything the system reads is a place to hide an instruction. A person
skimming a document won't see an instruction in a footer or in white text. The model reads every word. I
can't share specific findings from that work.

## Four ways out

If the product needs all three, you have four options. I'd try them in this order.

1. **Drop a property.** Render links as plain text and never load remote images. Have the assistant
   draft the email and let the member send it from their own client. It's the cheapest option, and it
   removes the outcome rather than lowering its odds.
2. **Split the work into separate sessions.** One session reads uploaded documents and has no tools.
   Another acts, and never sees the raw untrusted text. Meta's post notes that starting each session
   with a fresh context changes the analysis.
3. **Put a person on every outbound action.** Tick the approval box in the widget. The assistant still
   has all three, but it can't act on its own. This works when actions are rare and the reviewer reads
   what's about to be sent. It fails when people start clicking "approve" without reading.
4. **Remove [B] from the risky session.** Mick Ayzenberg at Meta clarified that [B] covers any sensitive
   system, not only data, so a sandbox with no route to production doesn't count. An agent that only
   reads public provider pages and fills in a form, with no member data, is lower risk.

## Two properties still isn't safe

Meta's first diagram labelled the two-property overlaps "safe". Willison pushed back: untrusted input
plus the ability to change state can do damage even with no private data. Meta changed the label to
"lower risk", and I'd keep that wording. A and B together can still give a member a wrong answer about
their coverage. B and C together can still leak data through a bug, with no attacker involved.

The rule tells you where to put a person or a hard boundary. It doesn't replace the rest of the work:
permissions on what gets retrieved, redaction of what gets logged, and evals on what gets answered.
[GAP: link to a post on permission-aware retrieval, if written]

If you're building one of these, list your features the way the widget does and mark each one A, B or C.
Look hardest at the [C] features you didn't think of as actions.
