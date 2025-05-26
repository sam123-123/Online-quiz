"use strict";

import {
  shuffleArray,
  setLocalStorage,
  resetLocalStorage,
  getLocalStorage,
} from "./helpers.js";

const app = document.querySelector(".app");
const questionBox = document.querySelector(".question-box");
const results = document.querySelector(".results");
const resultsPage = document.querySelector(".results-page");
const again = document.querySelector(".again");
const lastScoreBox = document.querySelector(".last-score-box");
const lastScoreEl = document.getElementById("last-score");

let currentIndex = 0;
let quiz = [];
let questions = [];
let correctAnswers = [];
let answers = [];
let score = 0;

const FETCH_TIMEOUT = 5000;

const fetchQuestions = async function () {
  renderSpinner();

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out. Try again.")), FETCH_TIMEOUT)
  );

  try {
    const fetchPromise = fetch("https://opentdb.com/api.php?amount=10&type=multiple");
    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) throw new Error("Failed to fetch quiz.");

    const data = await response.json();
    quiz = data.results;
    quiz.length > 0 ? renderQuiz(quiz) : renderError("No quiz data.");
  } catch (err) {
    renderError(err.message);
  }
};

function renderSpinner() {
  questionBox.innerHTML = `<div class="spinner"></div>`;
}

function renderError(message) {
  questionBox.innerHTML = `<p style="color:red;">${message}</p>`;
}

function renderLastScore() {
  const lastScore = getLocalStorage("score");
  if (!lastScore) lastScoreBox.classList.add("hidden");
  else {
    lastScoreBox.classList.remove("hidden");
    lastScoreEl.innerText = lastScore;
  }
}

function init() {
  resetLocalStorage("answers");
  resetLocalStorage("questions");
  resultsPage.classList.add("hidden");
  renderLastScore();
  fetchQuestions();
}

function updateUI() {
  if (currentIndex < quiz.length) renderAppPage();
  else renderResultsPage();
}

function renderAppPage() {
  resultsPage.classList.add("hidden");
  renderQuiz(quiz);
}

function renderQuiz(quiz) {
  renderQuestion(quiz[currentIndex]);
}

function renderQuestion(questionData) {
  questionBox.innerHTML = "";

  const { question, incorrect_answers, correct_answer } = questionData;

  questions.push(question);
  correctAnswers.push(correct_answer);
  setLocalStorage("questions", questions);

  const options = [...incorrect_answers, correct_answer];
  shuffleArray(options);

  const html = `
    <h2 class="question"><strong>${currentIndex + 1}.</strong> ${question}</h2>
    <div class="options">
      ${options.map((opt) => `<button class="option">${opt}</button>`).join("")}
    </div>
  `;

  questionBox.insertAdjacentHTML("afterbegin", html);
  submitAnswer();
}

function submitAnswer() {
  document.querySelectorAll(".option").forEach((btn) =>
    btn.addEventListener("click", () => {
      answers.push(btn.textContent);
      setLocalStorage("answers", answers);
      currentIndex++;
      updateUI();
    })
  );
}

function calcScore() {
  score = answers.reduce((acc, ans, i) => acc + (ans === correctAnswers[i] ? 1 : 0), 0);
  setLocalStorage("score", score);
}

function renderResultsPage() {
  app.classList.add("hidden");
  questionBox.innerHTML = "";
  results.innerHTML = "";
  lastScoreBox.classList.add("hidden");
  resultsPage.classList.remove("hidden");

  calcScore();

  const html = `
    <div>Score: <span class="score">${score} / ${quiz.length}</span></div>
    <ol class="questions_list">
      ${quiz.map((q, i) => renderAnswers(q, i)).join("")}
    </ol>
  `;
  results.insertAdjacentHTML("afterbegin", html);
}

function renderAnswers(questionData, i) {
  const userAns = answers[i];
  const correctAns = questionData.correct_answer;

  return `
    <li>
      <div class="question-box">
        <p class="question">${questionData.question}</p>
        <div class="answers">
          ${
            userAns !== correctAns
              ? `<p class="answer answer--wrong">${userAns} &#x2716;</p>`
              : ""
          }
          <p class="answer answer--correct">${correctAns} &#x2714;</p>
        </div>
      </div>
    </li>
  `;
}

again.addEventListener("click", () => {
  currentIndex = 0;
  quiz = [];
  questions = [];
  correctAnswers = [];
  answers = [];
  score = 0;
  app.classList.remove("hidden");
  init();
});

init();
