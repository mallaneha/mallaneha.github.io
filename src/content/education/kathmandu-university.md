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

## Overview <span class="when">Aug 2017 – Mar 2022</span>

A bachelor's in computer engineering at Kathmandu University in Dhulikhel, Nepal. Projects there covered machine learning, computer vision, cryptography and OCR.

Relevant courses: Data Structures and Algorithms, Discrete Structures, Statistics and Probability, and Machine Learning.

## Rennervate

Rennervate (April to July 2021) detects driver drowsiness in real time, built in Python with OpenCV
and scikit-learn. dlib's 68-point detector pulls facial landmarks from the UTA-RLDD and NTHU video
datasets, and logistic regression, random forest and KNN classifiers learn from them. KNN
did best, at up to 89.32% accuracy.

<div class="stats">
  <div><strong>89.32%</strong><span>drowsiness detection accuracy</span></div>
  <div><strong>68</strong><span>facial landmarks per frame</span></div>
</div>

<ol class="flow">
  <li>Video frames</li>
  <li>68 facial landmarks</li>
  <li>Classifier</li>
  <li>Drowsy or alert</li>
</ol>

## Image steganography

A desktop app in C and C++ (March to June 2018) that hides a text message inside a bitmap image.
The user sets a password to read it back. The message is encrypted with symmetric cryptography and
written into the least significant bits of the pixels, so no pixel's RGB value changes enough for
the eye to notice.

## Veritas

A console app in Python that reads a standard local newspaper out loud. Pytesseract segments the page and
pulls out each article, and gTTS speaks it.
