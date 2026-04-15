const modeScreen = document.getElementById("mode-screen");
const gameScreen = document.getElementById("game-screen");
const modeButtons = document.querySelectorAll(".mode-button");
const modeLabel = document.getElementById("mode-label");
const currentTotalEl = document.getElementById("current-total");
const rolledNumberEl = document.getElementById("rolled-number");
const promptText = document.getElementById("prompt-text");
const helperText = document.getElementById("helper-text");
const messageBox = document.getElementById("message-box");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const answerForm = document.getElementById("answer-form");
const answerInput = document.getElementById("answer-input");
const submitButton = document.getElementById("submit-button");
const scoreModal = document.getElementById("score-modal");
const modalTitle = document.getElementById("modal-title");
const scoreTarget = document.getElementById("score-target");
const scoreTime = document.getElementById("score-time");
const scoreSpeed = document.getElementById("score-speed");
const graphCaption = document.getElementById("graph-caption");
const playAgainButton = document.getElementById("play-again-button");
const changeModeButton = document.getElementById("change-mode-button");
const speedChart = document.getElementById("speed-chart");
const statusCards = document.querySelectorAll(".status-card");

const TARGETS = {
  4: 70,
  6: 100,
  12: 200,
  20: 300,
};

const state = {
  modeSides: null,
  target: 100,
  total: 0,
  currentRoll: null,
  waitingForAnswer: false,
  finished: false,
  startedAt: null,
  lastStepAt: null,
  history: [],
  rollTimerId: null,
  nextRollTimerId: null,
};

function setMessage(text, type = "") {
  messageBox.textContent = text;
  messageBox.className = "message";

  if (type) {
    messageBox.classList.add(type);
  }
}

function clearPendingTimers() {
  if (state.rollTimerId) {
    window.clearTimeout(state.rollTimerId);
    state.rollTimerId = null;
  }

  if (state.nextRollTimerId) {
    window.clearTimeout(state.nextRollTimerId);
    state.nextRollTimerId = null;
  }
}

function updateDisplay() {
  currentTotalEl.textContent = state.total;
  rolledNumberEl.textContent = state.currentRoll ?? "-";
  modeLabel.textContent = state.modeSides ? `D${state.modeSides}` : "-";
}

function resetRoundPrompt() {
  promptText.textContent = "Press start to begin.";
  helperText.textContent = "The die will roll automatically after you start.";
}

function getTargetLabel() {
  return state.target;
}

function setInputEnabled(enabled) {
  answerInput.disabled = !enabled;
  submitButton.disabled = !enabled;

  if (enabled) {
    answerInput.focus();
  } else {
    answerInput.value = "";
  }
}

function startMode(sides) {
  clearPendingTimers();
  state.modeSides = sides;
  state.target = TARGETS[sides];
  state.total = 0;
  state.currentRoll = null;
  state.waitingForAnswer = false;
  state.finished = false;
  state.startedAt = null;
  state.lastStepAt = null;
  state.history = [];

  updateDisplay();
  resetRoundPrompt();
  setInputEnabled(false);
  setMessage(`Mode set to D${sides}. Reach ${state.target}.`);
  startButton.disabled = false;
  startButton.textContent = "Start Game";
  setRolling(false);
  hideScoreboard();

  modeScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
}

function leaveGame() {
  clearPendingTimers();
  modeScreen.classList.remove("hidden");
  gameScreen.classList.add("hidden");
  answerInput.value = "";
  setRolling(false);
  hideScoreboard();
}

function setRolling(active) {
  statusCards[2].classList.toggle("rolling", active);
}

function beginRun() {
  if (state.finished || !state.modeSides || state.startedAt !== null) {
    return;
  }

  state.startedAt = performance.now();
  state.lastStepAt = state.startedAt;
  startButton.disabled = true;
  startButton.textContent = "Running";
  autoRoll();
}

function autoRoll() {
  if (state.finished || state.waitingForAnswer || !state.modeSides) {
    return;
  }

  setRolling(true);
  rolledNumberEl.textContent = "...";
  promptText.textContent = "Rolling...";
  helperText.textContent = "Watch the die, then type the new total.";
  setInputEnabled(false);

  state.rollTimerId = window.setTimeout(() => {
    state.currentRoll = Math.floor(Math.random() * state.modeSides) + 1;
    state.waitingForAnswer = true;
    state.rollTimerId = null;
    setRolling(false);
    updateDisplay();
    promptText.textContent = `${state.total} + ${state.currentRoll} = ?`;
    helperText.textContent = `Reach exactly ${getTargetLabel()} in D${state.modeSides}.`;
    setInputEnabled(true);
    setMessage("Type the new total. It will accept automatically when correct.");
  }, 520);
}

function finishGame() {
  state.finished = true;
  state.waitingForAnswer = false;

  promptText.textContent = `You reached ${state.target}.`;
  helperText.textContent = "The game is over. Choose another mode to play again.";
  setInputEnabled(false);
  setMessage("You win.", "success");
  openScoreboard("Target reached");
}

function endGameTooHigh() {
  state.finished = true;
  state.waitingForAnswer = false;

  promptText.textContent = `You went past ${state.target}.`;
  helperText.textContent = "That run is over. Choose another mode to try again.";
  setInputEnabled(false);
  setMessage(`Too high. Your total reached ${state.total}.`, "error");
  openScoreboard("Run ended");
}

function formatSeconds(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function recordStep(total) {
  const now = performance.now();
  const stepMs = now - state.lastStepAt;
  state.lastStepAt = now;
  state.history.push({ total, stepMs });
}

function flashSuccess() {
  answerForm.classList.remove("success-flash");
  void answerForm.offsetWidth;
  answerForm.classList.add("success-flash");
}

function hideScoreboard() {
  scoreModal.classList.add("hidden");
  scoreModal.setAttribute("aria-hidden", "true");
}

function openScoreboard(title) {
  const totalTimeMs = (state.lastStepAt ?? performance.now()) - (state.startedAt ?? performance.now());
  const averageSpeed = state.total > 0 ? state.total / (totalTimeMs / 1000) : 0;

  modalTitle.textContent = title;
  scoreTarget.textContent = `${state.total} / ${state.target}`;
  scoreTime.textContent = formatSeconds(totalTimeMs);
  scoreSpeed.textContent = `${averageSpeed.toFixed(2)} nums/s`;
  graphCaption.textContent = "Line graph shows the seconds spent on each successful jump in total.";
  drawChart();
  scoreModal.classList.remove("hidden");
  scoreModal.setAttribute("aria-hidden", "false");
}

function drawChart() {
  const ctx = speedChart.getContext("2d");
  const { width, height } = speedChart;
  const pad = { top: 20, right: 20, bottom: 36, left: 46 };
  const points = state.history;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0d1720";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, height - pad.bottom);
  ctx.lineTo(width - pad.right, height - pad.bottom);
  ctx.stroke();

  if (points.length === 0) {
    ctx.fillStyle = "#95aab3";
    ctx.font = "16px Georgia";
    ctx.fillText("No successful steps recorded.", pad.left + 10, height / 2);
    return;
  }

  const maxTotal = Math.max(...points.map((point) => point.total), state.target);
  const maxStep = Math.max(...points.map((point) => point.stepMs), 1000);

  ctx.strokeStyle = "#2fcf8f";
  ctx.lineWidth = 3;
  ctx.beginPath();

  points.forEach((point, index) => {
    const x = pad.left + (point.total / maxTotal) * (width - pad.left - pad.right);
    const y =
      height -
      pad.bottom -
      (point.stepMs / maxStep) * (height - pad.top - pad.bottom);

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  ctx.fillStyle = "#63f4b0";
  points.forEach((point) => {
    const x = pad.left + (point.total / maxTotal) * (width - pad.left - pad.right);
    const y =
      height -
      pad.bottom -
      (point.stepMs / maxStep) * (height - pad.top - pad.bottom);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#95aab3";
  ctx.font = "14px Georgia";
  ctx.fillText("Total", width / 2 - 10, height - 10);
  ctx.save();
  ctx.translate(16, height / 2 + 20);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Seconds for step", 0, 0);
  ctx.restore();
  ctx.fillText(`0`, pad.left - 8, height - pad.bottom + 18);
  ctx.fillText(`${maxTotal}`, width - pad.right - 12, height - pad.bottom + 18);
  ctx.fillText(`${(maxStep / 1000).toFixed(1)}s`, 4, pad.top + 6);
}

function handleAnswer(event) {
  event.preventDefault();
}

function maybeAcceptAnswer() {
  if (!state.waitingForAnswer || state.currentRoll === null || state.finished) {
    return;
  }

  const guessedTotal = Number.parseInt(answerInput.value, 10);
  const correctTotal = state.total + state.currentRoll;

  if (Number.isNaN(guessedTotal)) {
    setMessage("Type the new total. It will accept automatically when correct.");
    return;
  }

  if (guessedTotal < correctTotal) {
    setMessage("Keep going.", "");
    return;
  }

  if (guessedTotal > correctTotal) {
    setMessage(`Too high. ${state.total} + ${state.currentRoll} is smaller than ${guessedTotal}.`, "error");
    return;
  }

  recordStep(correctTotal);
  state.total = correctTotal;
  state.currentRoll = null;
  state.waitingForAnswer = false;
  updateDisplay();
  flashSuccess();
  answerInput.value = "";
  setInputEnabled(false);

  if (state.total === state.target) {
    finishGame();
    return;
  }

  if (state.total > state.target) {
    endGameTooHigh();
    return;
  }

  promptText.textContent = `Correct. Current total: ${state.total}`;
  helperText.textContent = "Rolling the next die...";
  setMessage("Correct.", "success");
  state.nextRollTimerId = window.setTimeout(() => {
    state.nextRollTimerId = null;
    autoRoll();
  }, 320);
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    startMode(Number.parseInt(button.dataset.sides, 10));
  });
});

startButton.addEventListener("click", beginRun);
restartButton.addEventListener("click", leaveGame);
answerForm.addEventListener("submit", handleAnswer);
answerInput.addEventListener("input", maybeAcceptAnswer);
playAgainButton.addEventListener("click", () => {
  hideScoreboard();
  startMode(state.modeSides);
});
changeModeButton.addEventListener("click", leaveGame);

updateDisplay();
