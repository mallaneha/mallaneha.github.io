---
school: "Kathmandu University"
degree: "B.E. in Computer Engineering"
start: 2017
end: 2022
location: "Dhulikhel, Nepal"
summary: "B.E. Computer Engineering"
icon: school
logo: /logos/kathmandu-university.png
order: 20
---

## Overview

A bachelor's in computer engineering at Kathmandu University in Dhulikhel, Nepal, from August 2017
to March 2022. My projects there covered machine learning, computer vision, cryptography and OCR.

<div class="stats">
  <div><strong>89.32%</strong><span>drowsiness detection accuracy</span></div>
  <div><strong>68</strong><span>facial landmarks per frame</span></div>
</div>

## Rennervate

A real-time pipeline for detecting driver drowsiness (April to July 2021), in Python with OpenCV
and scikit-learn. I extracted facial landmarks with dlib's 68-point detector from the UTA-RLDD and
NTHU video datasets, then trained logistic regression, random forest and KNN classifiers on them.
KNN did best, at up to 89.32% accuracy.

<ol class="flow">
  <li>Video frames</li>
  <li>68 facial landmarks</li>
  <li>Classifier</li>
  <li>Drowsy or alert</li>
</ol>

## Image steganography

A desktop app in C and C++ (March to June 2018) that hides a text message inside a bitmap image
and reads it back with a password the user sets. The message is encrypted with symmetric
cryptography, then written into the least significant bits of the pixels, so each pixel's RGB
value changes too little for the eye to notice.

## Veritas

A console app in Python that reads a standard local newspaper out loud. It uses Pytesseract to
segment the page and extract each article, then gTTS to speak it.

## Courses

- Data Structures and Algorithms
- Discrete Structures
- Statistics and Probability
- Machine Learning
