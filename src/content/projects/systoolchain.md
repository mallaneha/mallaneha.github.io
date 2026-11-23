---
title: "SysToolChain"
summary: "Batch and streaming data on GCP"
year: 2025
status: shipped
featured: true
icon: flow
tech: [PySpark, PostgreSQL, Kafka, PyTorch, GCP]
order: 30
---

## Overview

An end-to-end data pipeline on GCP: batch ingestion of FIFA player data, live streaming of World
Cup comments, and models that predict player ratings.

<figure class="story" role="img" aria-label="SysToolChain in three steps. Batch: files in Cloud Storage go through PySpark on Dataproc into PostgreSQL, 144K+ player records. Stream: live World Cup YouTube comments flow through Kafka, with a custom producer and consumer counting player mentions. Predict: a Random Forest reaches 0.97 RMSE against 1.94 for the linear baseline, and 0.98 R squared.">
<div class="story-steps">
<div class="story-step"><div class="story-label">1 · <b>Batch</b></div><div class="story-scene"><span class="story-pipe"><i class="story-flow"></i><i class="story-flow"></i><i class="story-flow"></i><span class="story-chip is-center">Cloud Storage</span><span class="story-chip is-center">PySpark · Dataproc</span><span class="story-chip is-center">PostgreSQL (JDBC)</span></span></div><div class="story-stats"><span class="story-stats-title">loaded</span><span class="story-stat"><strong>144K+</strong>player records</span></div></div>
<div class="story-step"><div class="story-label">2 · <b>Stream</b></div><div class="story-scene"><span class="story-feed"><span class="story-track"><span class="story-bubble">kickoff in 5!</span><span class="story-bubble"><b>Player A</b> scores!</span><span class="story-bubble">who is the ref?</span><span class="story-bubble"><b>Player B</b> again!!</span><span class="story-bubble">kickoff in 5!</span><span class="story-bubble"><b>Player A</b> scores!</span><span class="story-bubble">who is the ref?</span><span class="story-bubble"><b>Player B</b> again!!</span></span></span><span class="story-chip is-center">Kafka → mention counts</span><span class="story-note">live World Cup YouTube comments</span></div><div class="story-stats"><span class="story-stats-title">pipeline</span><span class="story-stat"><strong>Kafka</strong>producer + consumer</span></div></div>
<div class="story-step"><div class="story-label">3 · <b>Predict</b></div><div class="story-scene"><span class="story-bars"><span class="story-note">rating error (RMSE)</span><span>Linear baseline</span><span class="story-bar" style="width:100%">1.94</span><span>Random Forest</span><span class="story-bar is-good" style="width:50%">0.97</span></span></div><div class="story-stats"><span class="story-stats-title">Random Forest</span><span class="story-stat is-good"><strong>0.98 R²</strong>rating fit</span></div></div>
</div>
</figure>

## Batch

PySpark loads 144K+ FIFA player records into PostgreSQL. It runs on GCP Dataproc with Cloud
Storage, and Spark talks to a self-hosted PostgreSQL Docker container over JDBC.

<ol class="flow">
  <li>Cloud Storage</li>
  <li>PySpark on Dataproc</li>
  <li>PostgreSQL over JDBC</li>
</ol>

## Streaming

Live World Cup YouTube comments flow through Kafka with a custom producer and consumer, tracking
mentions of top-rated players. Ambiguous names are filtered out to reduce false matches.

## Models

I trained and tuned rating prediction models in Spark MLlib and PyTorch. A Random Forest reached
0.97 RMSE and 0.98 R², against 1.94 RMSE for the linear baseline.

## Takeaways

One project covered the whole path, from raw files and a live stream to a trained model. The Random
Forest roughly halved the linear baseline's error (0.97 vs 1.94 RMSE).
