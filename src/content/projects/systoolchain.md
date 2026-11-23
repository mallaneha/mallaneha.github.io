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

<img class="canvas" src="/canvas/systoolchain.svg" width="480" height="300" loading="lazy" alt="SysToolChain in three steps. Batch: files in Cloud Storage go through PySpark on Dataproc into PostgreSQL, 144K+ player records. Stream: live World Cup YouTube comments flow through Kafka, which counts player mentions. Predict: a Random Forest halves the rating error, 0.97 RMSE against 1.94 for the linear baseline, with 0.98 R squared.">

<div class="stats">
  <div><strong>144K+</strong><span>player records</span></div>
  <div><strong>0.98 R²</strong><span>Random Forest</span></div>
  <div><strong>0.97</strong><span>RMSE, vs 1.94 baseline</span></div>
</div>

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
