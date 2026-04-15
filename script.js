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
const ghostModeToggle = document.getElementById("ghost-mode-toggle");
const subtractionModeToggle = document.getElementById("subtraction-mode-toggle");
const negativeHalfwayToggle = document.getElementById("negative-halfway-toggle");
const currentTotalCard = document.getElementById("current-total-card");
const currentTotalLabelEl = document.getElementById("current-total-label");
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
const scoreTargetLabel = document.getElementById("score-target-label");
const scoreTarget = document.getElementById("score-target");
const scoreTimeLabel = document.getElementById("score-time-label");
const scoreTime = document.getElementById("score-time");
const scoreCalcSpeed = document.getElementById("score-calc-speed");
const scoreGrowthSpeed = document.getElementById("score-growth-speed");
const scorePassRunsLabel = document.getElementById("score-pass-runs-label");
const scorePassRuns = document.getElementById("score-pass-runs");
const graphCaption = document.getElementById("graph-caption");
const scoreRunTable = document.getElementById("score-run-table");
const openStatsButton = document.getElementById("open-stats-button");
const weakestRangeEl = document.getElementById("weakest-range");
const weakestRangeDetailEl = document.getElementById("weakest-range-detail");
const weakestTimeWindowEl = document.getElementById("weakest-time-window");
const weakestTimeWindowDetailEl = document.getElementById("weakest-time-window-detail");
const weakestDigitPairEl = document.getElementById("weakest-digit-pair");
const weakestDigitPairDetailEl = document.getElementById("weakest-digit-pair-detail");
const rangeStatsTable = document.getElementById("range-stats-table");
const timeStatsTable = document.getElementById("time-stats-table");
const digitStatsTable = document.getElementById("digit-stats-table");
const savedRunsTable = document.getElementById("saved-runs-table");
const closeScoreButton = document.getElementById("close-score-button");
const playAgainButton = document.getElementById("play-again-button");
const changeModeButton = document.getElementById("change-mode-button");
const speedChart = document.getElementById("speed-chart");
const statusCards = document.querySelectorAll(".status-card");
const isStatsPage = Boolean(document.querySelector(".stats-page-panel"));
const statsModeLabel = document.getElementById("stats-mode-label");

const STATS_STORAGE_KEY = "turtle-math-stats-v1";
const MAX_SAVED_RUNS = 40;
const RANGE_BUCKET_SIZE = 10;
const TIME_BUCKET_MS = 15000;

const TARGETS = {
  4: 35,
  6: 50,
  12: 100,
  20: 150,
};

const state = {
  modeSides: null,
  properTurtleMode: false,
  ghostMode: false,
  subtractionMode: false,
  negativeHalfwayMode: false,
  volume: 0.45,
  target: 50,
  startTotal: 0,
  total: 0,
  currentRolls: [],
  waitingForAnswer: false,
  finished: false,
  startedAt: null,
  lastStepAt: null,
  history: [],
  rollTimerId: null,
  nextRollTimerId: null,
  scoreboardMode: "run",
};

let audioContext = null;
let masterGainNode = null;
let persistedStats = loadPersistedStats();
let activeChartData = null;
let statsFilter = null;

function loadPersistedStats() {
  try {
    const raw = window.localStorage.getItem(STATS_STORAGE_KEY);

    if (!raw) {
      return { runs: [] };
    }

    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.runs)) {
      return { runs: [] };
    }

    return { runs: parsed.runs };
  } catch {
    return { runs: [] };
  }
}

function savePersistedStats() {
  try {
    window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(persistedStats));
  } catch {
    // Ignore storage failures so play still works even if local storage is unavailable.
  }
}

function formatDecimal(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function formatAverageMs(ms) {
  return `${(ms / 1000).toFixed(2)}s avg`;
}

function getCalcSpeed(totalSteps, totalTimeMs) {
  if (totalTimeMs <= 0) {
    return 0;
  }

  return totalSteps / (totalTimeMs / 1000);
}

function getGrowthSpeed(totalNumbers, totalTimeMs) {
  if (totalTimeMs <= 0) {
    return 0;
  }

  return totalNumbers / (totalTimeMs / 1000);
}

function getRangeBucketIndex(fromTotal) {
  return Math.floor(fromTotal / RANGE_BUCKET_SIZE);
}

function getRangeLabel(rangeIndex) {
  const start = rangeIndex * RANGE_BUCKET_SIZE;
  const end = start + RANGE_BUCKET_SIZE - 1;
  return `${start}-${end}`;
}

function getTimeBucketIndex(elapsedMs) {
  return Math.floor(elapsedMs / TIME_BUCKET_MS);
}

function getTimeBucketLabel(timeBucketIndex) {
  const start = Math.floor((timeBucketIndex * TIME_BUCKET_MS) / 1000);
  const end = Math.floor(((timeBucketIndex + 1) * TIME_BUCKET_MS) / 1000) - 1;
  return `${start}-${end}s`;
}

function createBucketSummary(label) {
  return {
    label,
    attempts: 0,
    totalMs: 0,
    totalGrowth: 0,
  };
}

function addToBucket(collection, key, label, stepMs, growth) {
  if (!collection.has(key)) {
    collection.set(key, createBucketSummary(label));
  }

  const bucket = collection.get(key);
  bucket.attempts += 1;
  bucket.totalMs += stepMs;
  bucket.totalGrowth += growth;
}

function finalizeBucketSummaries(collection) {
  return Array.from(collection.values())
    .map((bucket) => ({
      ...bucket,
      averageMs: bucket.attempts > 0 ? bucket.totalMs / bucket.attempts : 0,
      growthSpeed: getGrowthSpeed(bucket.totalGrowth, bucket.totalMs),
    }))
    .sort((left, right) => right.averageMs - left.averageMs);
}

function getFilteredRuns(filter) {
  if (filter == null) return persistedStats.runs;
  if (filter.endsWith("-proper")) {
    const sides = Number.parseInt(filter, 10);
    return persistedStats.runs.filter((r) => r.modeSides === sides && r.properTurtleMode);
  }
  const sides = Number.parseInt(filter, 10);
  return persistedStats.runs.filter((r) => r.modeSides === sides && !r.properTurtleMode);
}

function aggregatePersistedStats(filter) {
  const rangeBuckets = new Map();
  const timeBuckets = new Map();
  const digitBuckets = new Map();
  const growthTimeline = new Map();
  let totalSteps = 0;
  let totalNumbers = 0;
  let totalTimeMs = 0;
  const runs = getFilteredRuns(filter);

  runs.forEach((run) => {
    totalSteps += run.steps.length;
    totalNumbers += run.total;
    totalTimeMs += run.totalTimeMs;

    run.steps.forEach((step) => {
      addToBucket(
        rangeBuckets,
        step.rangeBucketIndex,
        getRangeLabel(step.rangeBucketIndex),
        step.stepMs,
        step.growth,
      );
      addToBucket(
        timeBuckets,
        step.timeBucketIndex,
        getTimeBucketLabel(step.timeBucketIndex),
        step.stepMs,
        step.growth,
      );
      addToBucket(
        digitBuckets,
        step.endDigitPair,
        step.endDigitPair,
        step.stepMs,
        step.growth,
      );

      if (!growthTimeline.has(step.timeBucketIndex)) {
        growthTimeline.set(step.timeBucketIndex, {
          label: getTimeBucketLabel(step.timeBucketIndex),
          totalReached: 0,
          attempts: 0,
        });
      }

      const timePoint = growthTimeline.get(step.timeBucketIndex);
      timePoint.totalReached += step.toTotal;
      timePoint.attempts += 1;
    });
  });

  return {
    runCount: runs.length,
    totalSteps,
    totalNumbers,
    totalTimeMs,
    calcSpeed: getCalcSpeed(totalSteps, totalTimeMs),
    growthSpeed: getGrowthSpeed(totalNumbers, totalTimeMs),
    ranges: finalizeBucketSummaries(rangeBuckets),
    timeWindows: finalizeBucketSummaries(timeBuckets),
    digitPairs: finalizeBucketSummaries(digitBuckets),
    growthTimeline: Array.from(growthTimeline.entries())
      .sort((left, right) => left[0] - right[0])
      .map(([, value]) => ({
        label: value.label,
        averageReached: value.attempts > 0 ? value.totalReached / value.attempts : 0,
      })),
  };
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function renderStatsRows(container, rows, emptyText) {
  if (!container) {
    return;
  }

  if (rows.length === 0) {
    container.innerHTML = `<p class="stats-empty">${escapeHtml(emptyText)}</p>`;
    return;
  }

  container.innerHTML = rows
    .map(
      (row) => `
        <div class="stats-row">
          <strong>${escapeHtml(row.label)}</strong>
          <span>${formatAverageMs(row.averageMs)}</span>
          <span>${formatDecimal(row.growthSpeed)} nums/s</span>
          <span>${row.attempts} tries</span>
        </div>
      `,
    )
    .join("");
}

function renderSavedRuns(filteredRuns) {
  if (!savedRunsTable) {
    return;
  }

  const runs = filteredRuns ?? persistedStats.runs;

  if (runs.length === 0) {
    savedRunsTable.innerHTML =
      '<p class="stats-empty">No pass runs for this filter yet.</p>';
    return;
  }

  savedRunsTable.innerHTML = runs
    .slice()
    .reverse()
    .map((run) => {
      const calcSpeed = getCalcSpeed(run.steps.length, run.totalTimeMs);
      const growthSpeed = getGrowthSpeed(run.total, run.totalTimeMs);
      const date = new Date(run.completedAt).toLocaleString();
      const modeLabelText = run.properTurtleMode ? `D${run.modeSides} Proper` : `D${run.modeSides}`;

      return `
        <div class="stats-row">
          <strong>${escapeHtml(modeLabelText)}</strong>
          <span>${escapeHtml(date)}</span>
          <span>${formatSeconds(run.totalTimeMs)}</span>
          <span>${formatDecimal(calcSpeed)} calcs/s | ${formatDecimal(growthSpeed)} nums/s</span>
        </div>
      `;
    })
    .join("");
}

function updateInsightCard(titleEl, detailEl, summary, fallback) {
  if (!titleEl || !detailEl) {
    return;
  }

  if (!summary) {
    titleEl.textContent = "No saved data";
    detailEl.textContent = fallback;
    return;
  }

  titleEl.textContent = summary.label;
  detailEl.textContent = `${formatAverageMs(summary.averageMs)} • ${formatDecimal(summary.growthSpeed)} nums/s • ${summary.attempts} tries`;
}

function persistPassedRun(totalTimeMs) {
  const run = {
    completedAt: new Date().toISOString(),
    modeSides: state.modeSides,
    properTurtleMode: state.properTurtleMode,
    target: state.target,
    total: state.total,
    totalTimeMs,
    steps: state.history.map((step) => ({ ...step })),
  };

  persistedStats.runs.push(run);
  persistedStats.runs = persistedStats.runs.slice(-MAX_SAVED_RUNS);
  savePersistedStats();
}

function isSubtractingMode() {
  return state.subtractionMode || state.negativeHalfwayMode;
}

function getBaseTarget(sides) {
  return TARGETS[sides] * (state.properTurtleMode ? 2 : 1);
}

function getTargetForMode(sides) {
  const base = getBaseTarget(sides);
  if (state.negativeHalfwayMode) return -Math.ceil(base / 2);
  if (state.subtractionMode) return 0;
  return base;
}

function getRollCount() {
  return state.properTurtleMode ? 3 : 1;
}

function getCurrentRollTotal() {
  return state.currentRolls.reduce((sum, roll) => sum + roll, 0);
}

function setMessage(text, type = "") {
  if (!messageBox) {
    return;
  }

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
  if (!volumeSlider || !volumeValue) {
    return;
  }

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
  if (!currentTotalEl || !rolledNumberEl || !modeLabel || !rollStatusLabel || !rolledDieEl) {
    return;
  }

  const rollTotal = state.currentRolls.length > 0 ? getCurrentRollTotal() : null;
  const totalLabel = isSubtractingMode()
    ? `${state.total}/${state.target}`
    : `${state.total}/${state.target}`;
  const displayTotal = state.ghostMode ? "??" : totalLabel;
  currentTotalEl.textContent = displayTotal;

  if (currentTotalLabelEl) {
    currentTotalLabelEl.textContent = state.subtractionMode
      ? "Remaining"
      : state.negativeHalfwayMode
        ? "Progress"
        : "Current Total";
  }

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
  properCurrentTotalEl.textContent = state.ghostMode ? "??" : totalLabel;
  properRollEls.forEach((el, index) => {
    el.textContent = state.currentRolls[index] ?? "-";
  });
  properRollDieEls.forEach((el) => {
    el.dataset.sides = state.modeSides ?? "";
  });
}

function resetRoundPrompt() {
  if (!promptText || !helperText || !properRollGrid) {
    return;
  }

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
  if (!answerInput || !submitButton) {
    return;
  }

  answerInput.disabled = !enabled;
  submitButton.disabled = !enabled;
  keypadButtons.forEach((button) => {
    button.disabled = !enabled;
  });

  if (enabled) {
    if (keypadWrap.classList.contains("hidden")) {
      answerInput.focus();
    } else {
      answerInput.blur();
    }
  } else {
    answerInput.value = "";
  }
}

function toggleKeypadVisibility() {
  if (!keypadWrap || !mobileKeypadButton || !answerInput) {
    return;
  }

  const willShow = keypadWrap.classList.contains("hidden");
  keypadWrap.classList.toggle("hidden", !willShow);
  mobileKeypadButton.textContent = willShow
    ? "Hide on-page num pad"
    : "Click if you are on mobile";

  if (willShow) {
    answerInput.blur();
  } else if (!answerInput.disabled) {
    answerInput.focus();
  }
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
  const turtleSrc = state.properTurtleMode ? "turtle_turtle.png" : "turtle.png";

  if (properModeToggle) {
    properModeToggle.setAttribute("aria-pressed", String(state.properTurtleMode));
    properModeToggle.classList.toggle("active", state.properTurtleMode);
    properModeToggle.textContent = "Proper Turtle Mode";
  }

  if (modeTurtleArt) {
    modeTurtleArt.src = turtleSrc;
  }

  if (gameTurtleArt) {
    gameTurtleArt.src = turtleSrc;
  }
}

function startMode(sides) {
  clearPendingTimers();
  state.modeSides = sides;
  state.target = getTargetForMode(sides);
  state.startTotal = state.subtractionMode ? getBaseTarget(sides) : 0;
  state.total = state.startTotal;
  state.currentRolls = [];
  state.waitingForAnswer = false;
  state.finished = false;
  state.startedAt = null;
  state.lastStepAt = null;
  state.history = [];

  updateDisplay();
  resetRoundPrompt();
  answerInput.min = isSubtractingMode() ? "-9999" : "0";
  answerInput.max = "9999";
  setInputEnabled(false);

  let modeMsg;
  if (state.subtractionMode && state.properTurtleMode) {
    modeMsg = `Proper Turtle Subtraction. Count down from ${state.startTotal} to 0 with triple rolls.`;
  } else if (state.subtractionMode) {
    modeMsg = `Subtraction Mode set to D${sides}. Count down from ${state.startTotal} to 0.`;
  } else if (state.negativeHalfwayMode && state.properTurtleMode) {
    modeMsg = `Proper Turtle Subtraction Half Way. Subtract from 0 to reach ${state.target} with triple rolls.`;
  } else if (state.negativeHalfwayMode) {
    modeMsg = `Subtraction Half Way set to D${sides}. Subtract from 0 to reach ${state.target}.`;
  } else if (state.properTurtleMode) {
    modeMsg = `Proper Turtle Mode set to D${sides}. Reach ${state.target} with triple rolls.`;
  } else {
    modeMsg = `Mode set to D${sides}. Reach ${state.target}.`;
  }
  setMessage(modeMsg);
  startButton.disabled = false;
  startButton.textContent = "Start Game";
  setRolling(false);
  hideScoreboard();

  modeScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
}

function leaveGame() {
  clearPendingTimers();
  if (modeScreen && gameScreen) {
    modeScreen.classList.remove("hidden");
    gameScreen.classList.add("hidden");
  }
  if (answerInput) {
    answerInput.value = "";
  }
  setRolling(false);
  hideScoreboard();
}

function setRolling(active) {
  if (!statusCards[2] || !rolledDieEl) {
    return;
  }

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
    const op = isSubtractingMode() ? "−" : "+";
    const currentDisplay = state.ghostMode ? "??" : state.total;
    promptText.textContent = `${currentDisplay} ${op} ${getCurrentRollTotal()} = ?`;
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

  promptText.textContent = isSubtractingMode()
    ? `You reached ${state.target}.`
    : `You reached ${state.total}.`;
  promptText.classList.remove("hidden");
  properRollGrid.classList.add("hidden");
  helperText.textContent = "The game is over. Choose another mode to play again.";
  setInputEnabled(false);
  setMessage("You win.", "success");
  const totalTimeMs = (state.lastStepAt ?? performance.now()) - (state.startedAt ?? performance.now());
  persistPassedRun(totalTimeMs);
  openRunSummary("Target reached", totalTimeMs);
}

function endGameTooHigh() {
  state.finished = true;
  state.waitingForAnswer = false;
  state.currentRolls = [];
  setRolling(false);
  updateDisplay();

  if (isSubtractingMode()) {
    promptText.textContent = `You went past ${state.target}.`;
    setMessage(`Too low. Your total went to ${state.total}.`, "error");
  } else {
    promptText.textContent = `You went past ${state.target}.`;
    setMessage(`Too high. Your total reached ${state.total}.`, "error");
  }
  promptText.classList.remove("hidden");
  properRollGrid.classList.add("hidden");
  helperText.textContent = "That run is over. Choose another mode to try again.";
  setInputEnabled(false);
  const totalTimeMs = (state.lastStepAt ?? performance.now()) - (state.startedAt ?? performance.now());
  openRunSummary("Run ended", totalTimeMs);
}

function formatSeconds(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function recordStep(total) {
  const now = performance.now();
  const stepMs = now - state.lastStepAt;
  const elapsedMs = now - state.startedAt;
  const fromTotal = state.total;
  const growth = total - fromTotal;
  state.lastStepAt = now;
  state.history.push({
    fromTotal,
    toTotal: total,
    growth,
    stepMs,
    elapsedMs,
    rangeBucketIndex: getRangeBucketIndex(fromTotal),
    timeBucketIndex: getTimeBucketIndex(elapsedMs),
    endDigitPair: `${fromTotal % 10}+${growth % 10}`,
  });
}

function flashSuccess() {
  if (!answerForm) {
    return;
  }

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
  if (!scoreModal) {
    return;
  }

  scoreModal.classList.add("hidden");
  scoreModal.setAttribute("aria-hidden", "true");
}

function renderRunRows(totalTimeMs) {
  if (!scoreRunTable) {
    return;
  }

  if (state.history.length === 0) {
    scoreRunTable.innerHTML =
      '<p class="stats-empty">No correct answers were recorded in this run.</p>';
    return;
  }

  const averageStepMs = totalTimeMs > 0 ? totalTimeMs / state.history.length : 0;

  scoreRunTable.innerHTML = state.history
    .map((step, index) => {
      const direction = step.growth >= 0 ? "+" : "−";
      const growthValue = Math.abs(step.growth);
      const comparedToAverage = averageStepMs > 0 ? step.stepMs - averageStepMs : 0;
      let paceText = "on pace";

      if (comparedToAverage > 150) {
        paceText = `${((comparedToAverage) / 1000).toFixed(1)}s slower than avg`;
      } else if (comparedToAverage < -150) {
        paceText = `${(Math.abs(comparedToAverage) / 1000).toFixed(1)}s faster than avg`;
      }

      return `
        <div class="stats-row">
          <strong>Step ${index + 1}: ${step.fromTotal} ${direction} ${growthValue} = ${step.toTotal}</strong>
          <span>${formatSeconds(step.stepMs)} answer time</span>
          <span>${paceText}</span>
        </div>
      `;
    })
    .join("");
}

function drawChart(mode, aggregated, hoveredIndex = -1) {
  if (!speedChart) {
    return;
  }

  const ctx = speedChart.getContext("2d");
  const { width, height } = speedChart;
  const pad = { top: 20, right: 20, bottom: 36, left: 46 };
  const rawPoints =
    mode === "run"
      ? state.history.map((step) => ({ xValue: step.toTotal, yValue: step.stepMs }))
      : aggregated.growthTimeline.map((point, index) => ({
          xValue: index + 1,
          yValue: point.averageReached,
        }));

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

  if (rawPoints.length === 0) {
    ctx.fillStyle = "#95aab3";
    ctx.font = "16px Roboto";
    ctx.fillText("No saved stats recorded yet.", pad.left + 10, height / 2);
    return;
  }

  const maxX =
    mode === "run"
      ? Math.max(...rawPoints.map((p) => p.xValue), state.target)
      : Math.max(rawPoints.length, 1);
  const maxY =
    mode === "run"
      ? Math.max(...rawPoints.map((p) => p.yValue), 1000)
      : Math.max(...rawPoints.map((p) => p.yValue), 10);

  const plotPoints = rawPoints.map((p) => ({
    ...p,
    x: pad.left + (p.xValue / maxX) * (width - pad.left - pad.right),
    y: height - pad.bottom - (p.yValue / maxY) * (height - pad.top - pad.bottom),
  }));

  activeChartData = { mode, aggregated, plotPoints, hoveredIndex };

  ctx.strokeStyle = "#2fcf8f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  plotPoints.forEach((p, index) => {
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  plotPoints.forEach((p, index) => {
    const hovered = index === hoveredIndex;
    ctx.fillStyle = hovered ? "#ffffff" : "#63f4b0";
    ctx.beginPath();
    ctx.arc(p.x, p.y, hovered ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#95aab3";
  ctx.font = "14px Roboto";
  ctx.fillText(mode === "run" ? "Total reached" : "Saved time window", width / 2 - 28, height - 10);
  ctx.save();
  ctx.translate(16, height / 2 + 20);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(mode === "run" ? "Seconds for answer" : "Average total reached", 0, 0);
  ctx.restore();
  ctx.fillText("0", pad.left - 8, height - pad.bottom + 18);
  ctx.fillText(`${maxX}`, width - pad.right - 12, height - pad.bottom + 18);
  ctx.fillText(mode === "run" ? `${(maxY / 1000).toFixed(1)}s` : `${Math.round(maxY)}`, 4, pad.top + 6);

  if (hoveredIndex >= 0 && hoveredIndex < plotPoints.length) {
    drawChartTooltip(ctx, hoveredIndex, plotPoints, mode, width, height, pad);
  }
}

function drawChartTooltip(ctx, index, plotPoints, mode, width, height, pad) {
  const p = plotPoints[index];

  let lines;
  if (mode === "run") {
    const step = state.history[index];
    const op = isSubtractingMode() ? "−" : "+";
    lines = [
      `Answer ${index + 1}`,
      `${step.fromTotal} ${op} ${Math.abs(step.growth)} = ${step.toTotal}`,
      `${(step.stepMs / 1000).toFixed(2)}s`,
    ];
  } else {
    lines = [`Window ${index + 1}`, `avg reached: ${Math.round(p.yValue)}`];
  }

  const lineH = 18;
  const px = 10;
  const py = 8;
  ctx.font = "bold 13px Roboto";
  const tipW = Math.max(...lines.map((l) => ctx.measureText(l).width)) + px * 2;
  const tipH = lines.length * lineH + py * 2;

  let tx = p.x + 12;
  let ty = p.y - tipH - 12;
  if (tx + tipW > width - pad.right) tx = p.x - tipW - 12;
  if (ty < pad.top) ty = p.y + 14;

  const r = 6;
  ctx.fillStyle = "rgba(5, 14, 20, 0.94)";
  ctx.strokeStyle = "rgba(47, 207, 143, 0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tx + r, ty);
  ctx.lineTo(tx + tipW - r, ty);
  ctx.arcTo(tx + tipW, ty, tx + tipW, ty + r, r);
  ctx.lineTo(tx + tipW, ty + tipH - r);
  ctx.arcTo(tx + tipW, ty + tipH, tx + tipW - r, ty + tipH, r);
  ctx.lineTo(tx + r, ty + tipH);
  ctx.arcTo(tx, ty + tipH, tx, ty + tipH - r, r);
  ctx.lineTo(tx, ty + r);
  ctx.arcTo(tx, ty, tx + r, ty, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? "#edf4f6" : "#95aab3";
    ctx.font = i === 0 ? "bold 13px Roboto" : "13px Roboto";
    ctx.fillText(line, tx + px, ty + py + (i + 1) * lineH - 3);
  });
}

function openRunSummary(title, totalTimeMs) {
  if (
    !scoreModal ||
    !modalTitle ||
    !scoreTargetLabel ||
    !scoreTarget ||
    !scoreTimeLabel ||
    !scoreTime ||
    !scoreCalcSpeed ||
    !scoreGrowthSpeed ||
    !scorePassRuns ||
    !graphCaption
  ) {
    return;
  }

  const calcSpeed = getCalcSpeed(state.history.length, totalTimeMs);
  const growthSpeed = getGrowthSpeed(Math.abs(state.total - state.startTotal), totalTimeMs);

  state.scoreboardMode = "run";
  modalTitle.textContent = title;
  scoreTargetLabel.textContent = "Final Total";
  scoreTimeLabel.textContent = "Run Time";
  if (scorePassRunsLabel) {
    scorePassRunsLabel.textContent = "Correct Answers";
  }
  scoreTarget.textContent = `${state.total} / ${state.target}`;
  scoreTime.textContent = formatSeconds(totalTimeMs);
  scoreCalcSpeed.textContent = `${formatDecimal(calcSpeed)} calcs/s`;
  scoreGrowthSpeed.textContent = `${formatDecimal(growthSpeed)} nums/s`;
  scorePassRuns.textContent = String(state.history.length);
  graphCaption.textContent = "Line graph shows seconds spent on each correct answer in this run.";
  renderRunRows(totalTimeMs);
  drawChart("run", { growthTimeline: [] });
  if (playAgainButton) {
    playAgainButton.classList.remove("hidden");
  }
  if (changeModeButton) {
    changeModeButton.classList.remove("hidden");
  }
  scoreModal.classList.remove("hidden");
  scoreModal.setAttribute("aria-hidden", "false");
}

function getFilterLabel(filter) {
  if (filter == null) return "All Modes";
  if (filter.endsWith("-proper")) return `D${Number.parseInt(filter, 10)} Proper Turtle`;
  return `D${Number.parseInt(filter, 10)}`;
}

function renderStatsPage(filter) {
  const aggregated = aggregatePersistedStats(filter);

  if (statsModeLabel) {
    statsModeLabel.textContent = getFilterLabel(filter);
  }

  if (modalTitle) {
    modalTitle.textContent = "Saved stats";
  }
  if (scoreTargetLabel) {
    scoreTargetLabel.textContent = "Pass Runs";
  }
  if (scoreTimeLabel) {
    scoreTimeLabel.textContent = "Practice Time";
  }
  if (scorePassRunsLabel) {
    scorePassRunsLabel.textContent = "Total Steps";
  }
  if (scoreTarget) {
    scoreTarget.textContent = `${aggregated.runCount} pass runs`;
  }
  if (scoreTime) {
    scoreTime.textContent = formatSeconds(aggregated.totalTimeMs);
  }
  if (scoreCalcSpeed) {
    scoreCalcSpeed.textContent = `${formatDecimal(aggregated.calcSpeed)} calcs/s`;
  }
  if (scoreGrowthSpeed) {
    scoreGrowthSpeed.textContent = `${formatDecimal(aggregated.growthSpeed)} nums/s`;
  }
  if (scorePassRuns) {
    scorePassRuns.textContent = String(aggregated.totalSteps);
  }
  if (graphCaption) {
    graphCaption.textContent =
      "Line graph shows the average total reached during each saved time window.";
  }

  updateInsightCard(
    weakestRangeEl,
    weakestRangeDetailEl,
    aggregated.ranges[0],
    "Finish a pass run to build range stats.",
  );
  updateInsightCard(
    weakestTimeWindowEl,
    weakestTimeWindowDetailEl,
    aggregated.timeWindows[0],
    "Finish a pass run to build time stats.",
  );
  updateInsightCard(
    weakestDigitPairEl,
    weakestDigitPairDetailEl,
    aggregated.digitPairs[0],
    "Finish a pass run to build digit-pair stats.",
  );
  renderStatsRows(rangeStatsTable, aggregated.ranges.slice(0, 8), "No saved range stats yet.");
  renderStatsRows(timeStatsTable, aggregated.timeWindows.slice(0, 8), "No saved time-window stats yet.");
  renderStatsRows(digitStatsTable, aggregated.digitPairs.slice(0, 10), "No saved end-digit stats yet.");
  renderSavedRuns(getFilteredRuns(filter));
  drawChart("stats", aggregated);
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
  const correctTotal = isSubtractingMode()
    ? state.total - rollTotal
    : state.total + rollTotal;

  if (Number.isNaN(guessedTotal)) {
    setMessage("Type the new total. It will accept automatically when correct.");
    return;
  }

  if (isSubtractingMode()) {
    if (guessedTotal > correctTotal) {
      setMessage("Keep going.", "");
      return;
    }
    if (guessedTotal < correctTotal) {
      setMessage("Too low.", "error");
      return;
    }
  } else {
    if (guessedTotal < correctTotal) {
      setMessage("Keep going.", "");
      return;
    }
    if (guessedTotal > correctTotal) {
      setMessage("Too high.", "error");
      return;
    }
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

  if (isSubtractingMode()) {
    if (state.total === state.target) {
      finishGame();
      return;
    }
    if (state.total < state.target) {
      endGameTooHigh();
      return;
    }
  } else {
    if (state.total >= state.target) {
      finishGame();
      return;
    }
  }

  autoRoll();
}

function handleKeypadPress(button) {
  if (!answerInput || answerInput.disabled) {
    return;
  }

  ensureAudioContext();
  answerInput.blur();

  const action = button.dataset.keypadAction;
  const value = button.dataset.keypadValue;
  let nextValue = answerInput.value;

  if (action === "clear") {
    nextValue = "";
  } else if (action === "negate") {
    if (nextValue.startsWith("-")) {
      nextValue = nextValue.slice(1);
    } else {
      nextValue = `-${nextValue}`;
    }
  } else if (value) {
    nextValue = `${nextValue}${value}`;
  }

  const maxLength = String(Math.abs(state.target)).length + 2;
  answerInput.value = nextValue.slice(0, maxLength);
  maybeAcceptAnswer();
}

if (!isStatsPage) {
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      startMode(Number.parseInt(button.dataset.sides, 10));
    });
  });

  if (properModeToggle) {
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
  }

  if (startButton) {
    startButton.addEventListener("click", beginRun);
  }
  if (restartButton) {
    restartButton.addEventListener("click", leaveGame);
  }
  if (answerForm) {
    answerForm.addEventListener("submit", handleAnswer);
    answerForm.addEventListener("focusin", ensureAudioContext);
  }
  if (answerInput) {
    answerInput.addEventListener("input", maybeAcceptAnswer);
  }
  if (volumeSlider) {
    volumeSlider.addEventListener("input", () => {
      state.volume = Number.parseInt(volumeSlider.value, 10) / 100;
      updateVolumeDisplay();
      ensureAudioContext();
    });
  }
  if (mobileKeypadButton) {
    mobileKeypadButton.addEventListener("click", toggleKeypadVisibility);
  }
  if (fullscreenButton) {
    fullscreenButton.addEventListener("click", toggleFullscreen);
  }
  if (ghostModeToggle) {
    ghostModeToggle.addEventListener("click", () => {
      ensureAudioContext();
      state.ghostMode = !state.ghostMode;
      ghostModeToggle.setAttribute("aria-pressed", String(state.ghostMode));
      ghostModeToggle.classList.toggle("active", state.ghostMode);
      ghostModeToggle.textContent = "Ghost Mode";
      setMessage(
        state.ghostMode
          ? "Ghost Mode on. The running total is hidden during play."
          : "Ghost Mode off.",
      );
    });
  }
  if (subtractionModeToggle) {
    subtractionModeToggle.addEventListener("click", () => {
      ensureAudioContext();
      state.subtractionMode = !state.subtractionMode;
      if (state.subtractionMode) {
        state.negativeHalfwayMode = false;
        if (negativeHalfwayToggle) {
          negativeHalfwayToggle.setAttribute("aria-pressed", "false");
          negativeHalfwayToggle.classList.remove("active");
        }
      }
      subtractionModeToggle.setAttribute("aria-pressed", String(state.subtractionMode));
      subtractionModeToggle.classList.toggle("active", state.subtractionMode);
      setMessage(
        state.subtractionMode
          ? "Subtraction on. Count down from the target to zero."
          : "Subtraction off.",
      );
    });
  }
  if (negativeHalfwayToggle) {
    negativeHalfwayToggle.addEventListener("click", () => {
      ensureAudioContext();
      state.negativeHalfwayMode = !state.negativeHalfwayMode;
      if (state.negativeHalfwayMode) {
        state.subtractionMode = false;
        if (subtractionModeToggle) {
          subtractionModeToggle.setAttribute("aria-pressed", "false");
          subtractionModeToggle.classList.remove("active");
        }
      }
      negativeHalfwayToggle.setAttribute("aria-pressed", String(state.negativeHalfwayMode));
      negativeHalfwayToggle.classList.toggle("active", state.negativeHalfwayMode);
      setMessage(
        state.negativeHalfwayMode
          ? "Subtraction Half Way on. Subtract from 0 to reach the negative half-target."
          : "Subtraction Half Way off.",
      );
    });
  }
  if (closeScoreButton) {
    closeScoreButton.addEventListener("click", hideScoreboard);
  }
  if (keypadWrap) {
    keypadWrap.addEventListener("click", (event) => {
      const button = event.target.closest(".keypad-button");

      if (!button) {
        return;
      }

      handleKeypadPress(button);
    });
  }
  if (playAgainButton) {
    playAgainButton.addEventListener("click", () => {
      hideScoreboard();
      startMode(state.modeSides);
    });
  }
  if (changeModeButton) {
    changeModeButton.addEventListener("click", leaveGame);
  }

  if (speedChart) {
    speedChart.addEventListener("mousemove", (e) => {
      if (!activeChartData) return;
      const rect = speedChart.getBoundingClientRect();
      const scaleX = speedChart.width / rect.width;
      const scaleY = speedChart.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      let closest = -1;
      let minDist = 18;
      activeChartData.plotPoints.forEach((p, i) => {
        const dist = Math.hypot(mx - p.x, my - p.y);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });

      speedChart.style.cursor = closest >= 0 ? "pointer" : "default";

      if (closest !== activeChartData.hoveredIndex) {
        drawChart(activeChartData.mode, activeChartData.aggregated, closest);
      }
    });

    speedChart.addEventListener("mouseleave", () => {
      if (activeChartData && activeChartData.hoveredIndex !== -1) {
        speedChart.style.cursor = "default";
        drawChart(activeChartData.mode, activeChartData.aggregated, -1);
      }
    });
  }

  applyProperModeTheme();
  updateVolumeDisplay();
  updateDisplay();
} else {
  const filterPills = document.querySelectorAll(".filter-pill");
  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      const raw = pill.dataset.filter;
      statsFilter = raw === "" ? null : raw;
      renderStatsPage(statsFilter);
    });
  });

  renderStatsPage(statsFilter);
}
