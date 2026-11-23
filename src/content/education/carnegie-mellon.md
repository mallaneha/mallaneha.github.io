---
school: "Carnegie Mellon University"
degree: "M.S. in AI Engineering (Information Security)"
start: 2025
end: 2026
location: "Pittsburgh, PA"
summary: "M.S. AI Engineering"
icon: school
logo: /logos/cmu.png
logoSize: 30
order: 10
---

## Overview <span class="when">Aug 2025 – Dec 2026</span>

I'm doing a master's in AI engineering at Carnegie Mellon in Pittsburgh, with a concentration in
information security. I've built three projects here: a data pipeline on GCP, a research agent
that checks its own answers, and a defense that keeps poisoned documents out of RAG.

<div class="stats">
  <div><strong>144K+</strong><span>player records in the pipeline</span></div>
  <div><strong>80%</strong><span>fewer hallucinations</span></div>
  <div><strong>59% → 3%</strong><span>RAG attack success</span></div>
</div>

## Courses

- Generative AI and LLMs
- Systems and Tool Chains for AI Engineering
- AI Governance
- Introduction to Information Security

## SysToolChain <span class="when">Oct – Nov 2025</span>

I built a batch and streaming pipeline on GCP. PySpark on Dataproc loads 144K+ FIFA player records
from Cloud Storage into a self-hosted PostgreSQL container over JDBC. Live World Cup YouTube
comments come in through Kafka, where my custom consumer tracks mentions of top-rated players and
filters out ambiguous names. I trained rating models in Spark MLlib and PyTorch. A Random Forest
reached 0.97 RMSE and 0.98 R², against 1.94 RMSE for the linear baseline.

## Research Assistant Agent <span class="when">Feb 2026</span>

I built a research assistant that answers from documents in a Milvus vector store, using an agentic
RAG workflow in LangGraph. Before it returns an answer, the agent checks it against the retrieved
documents, and that step cut hallucinations by 80%. LangSmith traces every run. Milvus, the backend
and the MCP services run as microservices on GKE, set up with Docker and Terraform. There's a
Streamlit UI on top, and Google Translate comes in through FastMCP for questions in other
languages.

<ol class="flow">
  <li>Retrieve from Milvus</li>
  <li>Generate an answer</li>
  <li>Reflect: is it grounded?</li>
  <li>Return, or try again</li>
</ol>

## Vector Guard <span class="when">Apr 2026</span>

I attacked a RAG assistant built for a security operations center, over 1,063 CVE and MITRE ATT&CK
documents. My adaptation of the PoisonedRAG attack changed its answers 59% of the time, with just 2
poisoned documents per query. Then I put four checks between retrieval and the model: structural
filtering, embedding anomaly detection, NLI contradiction checks and LLM-based document scoring.
Attack success fell to 3% on the threat-intelligence data, and from 72% to 24% on the Natural
Questions benchmark.

## Takeaways

Each project built on the one before. The first moved and modeled data at scale, the second
grounded an agent's answers in retrieved documents, and the third attacked that kind of retrieval
and then defended it.
