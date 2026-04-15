const modeScreen = document.getElementById("mode-screen");
const gameScreen = document.getElementById("game-screen");
const modeButtons = document.querySelectorAll(".mode-button");
const properModeToggle = document.getElementById("proper-mode-toggle");
const modeTurtleArt = document.getElementById("mode-turtle-art");
const gameTurtleArt = document.getElementById("game-turtle-art");
const modeLabel = document.getElementById("mode-label");
const currentTotalEl = document.getElementById("current-total");
const rollStatusCard = document.getElementById("roll-status-card");
const turtleConfettiLayer = document.getElementById("turtle-confetti-layer");
const winConfettiLayer = document.getElementById("win-confetti-layer");
const rollStatusLabel = document.getElementById("roll-status-label");
const rolledNumberEl = document.getElementById("rolled-number");
const rolledDieEl = document.getElementById("rolled-die");
const promptText = document.getElementById("prompt-text");
const helperText = document.getElementById("helper-text");
const properRollGrid = document.getElementById("proper-roll-grid");
const properCurrentTotalEl = document.getElementById("proper-current-total");
const properRollEls = [
  document.getElementById("proper-roll-1"),
  document.getElementById("proper-roll-2"),
  document.getElementById("proper-roll-3"),
];
const properRollDieEls = [
  document.getElementById("proper-roll-die-1"),
  document.getElementById("proper-roll-die-2"),
  document.getElementById("proper-roll-die-3"),
];
const messageBox = document.getElementById("message-box");
const startButton = document.getElementById("start-button");
const fullscreenButton = document.getElementById("fullscreen-button");
const restartButton = document.getElementById("restart-button");
const answerForm = document.getElementById("answer-form");
const answerInput = document.getElementById("answer-input");
const submitButton = document.getElementById("submit-button");
const volumeSlider = document.getElementById("volume-slider");
const volumeValue = document.getElementById("volume-value");
const mobileKeypadButton = document.getElementById("mobile-keypad-button");
const keypadWrap = document.getElementById("keypad-wrap");
const keypadButtons = document.querySelectorAll(".keypad-button");
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
  4: 35,
  6: 50,
  12: 100,
  20: 150,
};

const state = {
  modeSides: null,
  properTurtleMode: false,
  volume: 0.45,
  target: 50,
  total: 0,
  currentRolls: [],
  waitingForAnswer: false,
  finished: false,
  startedAt: null,
  lastStepAt: null,
  history: [],
  rollTimerId: null,
  nextRollTimerId: null,
};

let audioContext = null;
let masterGainNode = null;

function getTargetForMode(sides) {
  return TARGETS[sides] * (state.properTurtleMode ? 2 : 1);
}

function getRollCount() {
  return state.properTurtleMode ? 3 : 1;
}

function getCurrentRollTotal() {
  return state.currentRolls.reduce((sum, roll) => sum + roll, 0);
}

function setMessage(text, type = "") {
  messageBox.textContent = text;
  messageBox.className = "message";

  if (type) {
    messageBox.classList.add(type);
  }
}

function ensureAudioContext() {
  if (!window.AudioContext && !window.webkitAudioContext) {
    return null;
  }

  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    masterGainNode = audioContext.createGain();
    masterGainNode.gain.value = state.volume;
    masterGainNode.connect(audioContext.destination);
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

function updateVolumeDisplay() {
  const percent = Math.round(state.volume * 100);
  volumeSlider.value = String(percent);
  volumeValue.textContent = `${percent}%`;

  if (masterGainNode) {
    masterGainNode.gain.value = state.volume;
  }
}

function playCorrectChime() {
  const ctx = ensureAudioContext();

  if (!ctx || !masterGainNode) {
    return;
  }

  const now = ctx.currentTime;
  const notes = [784, 1046.5];

  notes.forEach((frequency, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + index * 0.08;
    const end = start + 0.18;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain);
    gain.connect(masterGainNode);
    osc.start(start);
    osc.stop(end);
  });
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
  const rollTotal = state.currentRolls.length > 0 ? getCurrentRollTotal() : null;
  const totalLabel = `${state.total}/${state.target}`;
  currentTotalEl.textContent = totalLabel;
  rolledNumberEl.textContent = state.properTurtleMode ? "-" : rollTotal ?? "-";
  modeLabel.textContent = state.modeSides
    ? state.properTurtleMode
      ? `D${state.modeSides} Proper`
      : `D${state.modeSides}`
    : "-";
  rollStatusLabel.textContent = state.properTurtleMode ? "Roll Total" : "Roll";
  rolledDieEl.dataset.sides = state.modeSides ?? "";
  rollStatusCard.classList.toggle("hidden", state.properTurtleMode);
  statusCards[2].classList.toggle("hidden", state.properTurtleMode);
  rolledDieEl.setAttribute(
    "aria-label",
    rollTotal === null || !state.modeSides
      ? "Die result pending"
      : state.properTurtleMode
        ? `D${state.modeSides} proper turtle roll total: ${rollTotal}`
        : `D${state.modeSides} roll: ${rollTotal}`,
  );
  properCurrentTotalEl.textContent = totalLabel;
  properRollEls.forEach((el, index) => {
    el.textContent = state.currentRolls[index] ?? "-";
  });
  properRollDieEls.forEach((el) => {
    el.dataset.sides = state.modeSides ?? "";
  });
}

function resetRoundPrompt() {
  promptText.textContent = "Press start to begin.";
  helperText.textContent = state.properTurtleMode
    ? "Proper Turtle Mode rolls three dice at once."
    : "The die will roll automatically after you start.";
  promptText.classList.toggle("hidden", state.properTurtleMode);
  properRollGrid.classList.toggle("hidden", !state.properTurtleMode);
}

function getTargetLabel() {
  return state.target;
}

function setInputEnabled(enabled) {
  answerInput.disabled = !enabled;
  submitButton.disabled = !enabled;
  keypadButtons.forEach((button) => {
    button.disabled = !enabled;
  });

  if (enabled) {
    answerInput.focus();
  } else {
    answerInput.value = "";
  }
}

function toggleKeypadVisibility() {
  const willShow = keypadWrap.classList.contains("hidden");
  keypadWrap.classList.toggle("hidden", !willShow);
  mobileKeypadButton.textContent = willShow
    ? "Hide on-page num pad"
    : "Click if you are on mobile";
}

async function toggleFullscreen() {
  const element = document.documentElement;
  const doc = document;
  const currentFullscreenElement =
    doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;

  try {
    if (currentFullscreenElement) {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
      fullscreenButton.textContent = "Full Screen";
      return;
    }

    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
    } else {
      setMessage("Fullscreen is not supported on this device or browser.");
      return;
    }

    fullscreenButton.textContent = "Exit Full Screen";
  } catch {
    setMessage("Fullscreen was blocked by the browser.", "error");
  }
}

function applyProperModeTheme() {
  document.body.classList.toggle("proper-turtle-mode", state.properTurtleMode);
  properModeToggle.setAttribute("aria-pressed", String(state.properTurtleMode));
  properModeToggle.classList.toggle("active", state.properTurtleMode);
  properModeToggle.textContent = state.properTurtleMode
    ? "Proper Turtle Mode ✓"
    : "Proper Turtle Mode";
  const turtleSrc = state.properTurtleMode ? "turtle_turtle.png" : "turtle.png";
  modeTurtleArt.src = turtleSrc;
  gameTurtleArt.src = turtleSrc;
}

function startMode(sides) {
  clearPendingTimers();
  state.modeSides = sides;
  state.target = getTargetForMode(sides);
  state.total = 0;
  state.currentRolls = [];
  state.waitingForAnswer = false;
  state.finished = false;
  state.startedAt = null;
  state.lastStepAt = null;
  state.history = [];

  updateDisplay();
  resetRoundPrompt();
  answerInput.max = String(state.target);
  setInputEnabled(false);
  setMessage(
    state.properTurtleMode
      ? `Proper Turtle Mode set to D${sides}. Reach ${state.target} with triple rolls.`
      : `Mode set to D${sides}. Reach ${state.target}.`,
  );
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

  if (!active) {
    rolledDieEl.classList.remove("rolling");
    return;
  }

  rolledDieEl.classList.remove("rolling");
  void rolledDieEl.offsetWidth;
  rolledDieEl.classList.add("rolling");
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

  state.currentRolls = Array.from(
    { length: getRollCount() },
    () => Math.floor(Math.random() * state.modeSides) + 1,
  );
  state.waitingForAnswer = true;
  updateDisplay();
  setRolling(true);
  if (!state.properTurtleMode) {
    promptText.textContent = `${state.total} + ${getCurrentRollTotal()} = ?`;
  }
  helperText.textContent = state.properTurtleMode
    ? `Current total and all three rolls are shown below. Reach exactly ${getTargetLabel()}.`
    : `Reach exactly ${getTargetLabel()} in D${state.modeSides}.`;
  setInputEnabled(true);
  setMessage("Type the new total. It will accept automatically when correct.");
}

function finishGame() {
  state.finished = true;
  state.waitingForAnswer = false;
  state.currentRolls = [];
  setRolling(false);
  updateDisplay();
  rainWinConfetti();

  promptText.textContent = `You reached ${state.target}.`;
  promptText.classList.remove("hidden");
  properRollGrid.classList.add("hidden");
  helperText.textContent = "The game is over. Choose another mode to play again.";
  setInputEnabled(false);
  setMessage("You win.", "success");
  openScoreboard("Target reached");
}

function endGameTooHigh() {
  state.finished = true;
  state.waitingForAnswer = false;
  state.currentRolls = [];
  setRolling(false);
  updateDisplay();

  promptText.textContent = `You went past ${state.target}.`;
  promptText.classList.remove("hidden");
  properRollGrid.classList.add("hidden");
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

function spawnConfetti(layer, count, { spread = 1, durationBase = 900, drift = 120 } = {}) {
  if (!layer) {
    return;
  }

  const colors = ["#ff6b6b", "#ffd166", "#63f4b0", "#56cfe1", "#f8f9fa"];

  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${50 + (Math.random() - 0.5) * 100 * spread}%`;
    piece.style.top = `${Math.random() * 14}%`;
    piece.style.setProperty("--confetti-color", colors[index % colors.length]);
    piece.style.setProperty("--confetti-x", `${(Math.random() - 0.5) * drift}px`);
    piece.style.setProperty("--confetti-rotate", `${(Math.random() - 0.5) * 1080}deg`);
    piece.style.setProperty("--confetti-duration", `${durationBase + Math.random() * 500}ms`);
    piece.style.setProperty("--confetti-delay", `${Math.random() * 120}ms`);
    layer.appendChild(piece);
    window.setTimeout(() => piece.remove(), durationBase + 1000);
  }
}

function burstTurtleConfetti() {
  spawnConfetti(turtleConfettiLayer, 26, {
    spread: 0.7,
    durationBase: 820,
    drift: 110,
  });
}

function rainWinConfetti() {
  winConfettiLayer.classList.add("active");
  spawnConfetti(winConfettiLayer, 180, {
    spread: 1.9,
    durationBase: 1900,
    drift: 220,
  });
  window.setTimeout(() => {
    winConfettiLayer.classList.remove("active");
  }, 3200);
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
    ctx.font = "16px Roboto";
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
  ctx.font = "14px Roboto";
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
  if (!state.waitingForAnswer || state.currentRolls.length === 0 || state.finished) {
    return;
  }

  const guessedTotal = Number.parseInt(answerInput.value, 10);
  const rollTotal = getCurrentRollTotal();
  const correctTotal = state.total + rollTotal;

  if (Number.isNaN(guessedTotal)) {
    setMessage("Type the new total. It will accept automatically when correct.");
    return;
  }

  if (guessedTotal < correctTotal) {
    setMessage("Keep going.", "");
    return;
  }

  if (guessedTotal > correctTotal) {
    setMessage(`Too high. ${state.total} + ${rollTotal} is smaller than ${guessedTotal}.`, "error");
    return;
  }

  recordStep(correctTotal);
  state.total = correctTotal;
  state.currentRolls = [];
  state.waitingForAnswer = false;
  setRolling(false);
  updateDisplay();
  flashSuccess();
  burstTurtleConfetti();
  playCorrectChime();
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

  autoRoll();
}

function handleKeypadPress(button) {
  if (answerInput.disabled) {
    return;
  }

  ensureAudioContext();

  const action = button.dataset.keypadAction;
  const value = button.dataset.keypadValue;
  let nextValue = answerInput.value;

  if (action === "clear") {
    nextValue = "";
  } else if (action === "backspace") {
    nextValue = nextValue.slice(0, -1);
  } else if (value) {
    nextValue = `${nextValue}${value}`;
  }

  const maxLength = String(state.target).length + 1;
  answerInput.value = nextValue.slice(0, maxLength);
  maybeAcceptAnswer();
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    startMode(Number.parseInt(button.dataset.sides, 10));
  });
});

properModeToggle.addEventListener("click", () => {
  ensureAudioContext();
  state.properTurtleMode = !state.properTurtleMode;
  applyProperModeTheme();
  resetRoundPrompt();
  setMessage(
    state.properTurtleMode
      ? "Proper Turtle Mode is on. Buttons turn red and each turn rolls three dice."
      : "Proper Turtle Mode is off. Standard single-roll rules are active.",
  );
});

startButton.addEventListener("click", beginRun);
restartButton.addEventListener("click", leaveGame);
answerForm.addEventListener("submit", handleAnswer);
answerForm.addEventListener("focusin", ensureAudioContext);
answerInput.addEventListener("input", maybeAcceptAnswer);
volumeSlider.addEventListener("input", () => {
  state.volume = Number.parseInt(volumeSlider.value, 10) / 100;
  updateVolumeDisplay();
  ensureAudioContext();
});
mobileKeypadButton.addEventListener("click", toggleKeypadVisibility);
fullscreenButton.addEventListener("click", toggleFullscreen);
keypadWrap.addEventListener("click", (event) => {
  const button = event.target.closest(".keypad-button");

  if (!button) {
    return;
  }

  handleKeypadPress(button);
});
playAgainButton.addEventListener("click", () => {
  hideScoreboard();
  startMode(state.modeSides);
});
changeModeButton.addEventListener("click", leaveGame);

applyProperModeTheme();
updateVolumeDisplay();
updateDisplay();
