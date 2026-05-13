const state = {
  gamePoint: 11,
  leftScore: 0,
  rightScore: 0,
  leftSets: 0,
  rightSets: 0,
  targetSets: 3,
  doublesMode: true,
  lastServerIndex: -1,
  history: [],
};

const $ = (id) => document.getElementById(id);

const els = {
  singlesBtn: $("singlesBtn"),
  doublesBtn: $("doublesBtn"),
  set3Btn: $("set3Btn"),
  set5Btn: $("set5Btn"),
  set7Btn: $("set7Btn"),
  point11Btn: $("point11Btn"),
  point15Btn: $("point15Btn"),
  point21Btn: $("point21Btn"),
  setInfo: $("setInfo"),
  leftScore: $("leftScore"),
  rightScore: $("rightScore"),
  leftTeam: $("leftTeam"),
  rightTeam: $("rightTeam"),
  serverInfo: $("serverInfo"),
  statusInfo: $("statusInfo"),
  leftPointBtn: $("leftPointBtn"),
  rightPointBtn: $("rightPointBtn"),
  undoBtn: $("undoBtn"),
  speakBtn: $("speakBtn"),
  resetSetBtn: $("resetSetBtn"),
  nextSetBtn: $("nextSetBtn"),
  resetBtn: $("resetBtn"),
};

function snapshot() {
  return {
    gamePoint: state.gamePoint,
    leftScore: state.leftScore,
    rightScore: state.rightScore,
    leftSets: state.leftSets,
    rightSets: state.rightSets,
    targetSets: state.targetSets,
    doublesMode: state.doublesMode,
  };
}

function saveState() {
  state.history.push(snapshot());
}

function winsNeeded() {
  return Math.floor(state.targetSets / 2) + 1;
}

function currentSetNumber() {
  return state.leftSets + state.rightSets + 1;
}

function serverCount() {
  return state.doublesMode ? 4 : 2;
}

function currentServerIndex() {
  const startIndex = (currentSetNumber() - 1) % serverCount();
  const turnOffset = Math.floor((state.leftScore + state.rightScore) / 2);
  return (startIndex + turnOffset) % serverCount();
}

function isLeftServing() {
  return currentServerIndex() % 2 === 0;
}

function currentServerLabel() {
  const team = isLeftServing() ? "A팀" : "B팀";
  return `${currentServerIndex() + 1}번(${team})`;
}

function currentServerVoiceLabel() {
  return ["일번", "이번", "삼번", "사번"][currentServerIndex()];
}

function scoreVoicePrefix() {
  return `${state.leftScore} 대 ${state.rightScore}`;
}

function isGameOver() {
  const high = Math.max(state.leftScore, state.rightScore);
  const low = Math.min(state.leftScore, state.rightScore);
  return high >= state.gamePoint && high - low >= 2;
}

function isMatchOver() {
  return state.leftSets >= winsNeeded() || state.rightSets >= winsNeeded();
}

function speak(message) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = "ko-KR";
  utterance.rate = 1.05;
  window.speechSynthesis.speak(utterance);
}

function speakServer(force = false) {
  const serverIndex = currentServerIndex();
  if (!force && serverIndex === state.lastServerIndex) return;

  if (isMatchOver()) {
    speak(`${state.leftSets > state.rightSets ? "A팀" : "B팀"} 경기 승리입니다`);
  } else if (isGameOver()) {
    speak(`${state.leftScore > state.rightScore ? "A팀" : "B팀"} 세트 승리입니다`);
  } else {
    speak(`${scoreVoicePrefix()}, 서브 변경, ${currentServerVoiceLabel()} 서브`);
  }
}

function addPoint(leftTeam) {
  if (isGameOver() || isMatchOver()) return;
  saveState();
  if (leftTeam) state.leftScore += 1;
  else state.rightScore += 1;

  if (isGameOver()) {
    if (state.leftScore > state.rightScore) state.leftSets += 1;
    else state.rightSets += 1;
  }

  const previousServer = state.lastServerIndex;
  render();
  if (currentServerIndex() !== previousServer || isGameOver()) {
    speakServer(true);
  }
}

function changeMode(doubles) {
  if (state.doublesMode === doubles) return;
  saveState();
  state.doublesMode = doubles;
  state.lastServerIndex = -1;
  render();
  speakServer(true);
}

function changeTargetSets(targetSets) {
  if (state.targetSets === targetSets) return;
  saveState();
  state.targetSets = targetSets;
  render();
}

function changeGamePoint(gamePoint) {
  if (state.gamePoint === gamePoint) return;
  saveState();
  state.gamePoint = gamePoint;
  render();
}

function nextSet() {
  if (!isGameOver() || isMatchOver()) return;
  saveState();
  state.leftScore = 0;
  state.rightScore = 0;
  state.lastServerIndex = -1;
  render();
  speakServer(true);
}

function resetSet() {
  if (state.leftScore === 0 && state.rightScore === 0) return;
  saveState();
  if (isGameOver()) {
    if (state.leftScore > state.rightScore) state.leftSets = Math.max(0, state.leftSets - 1);
    else state.rightSets = Math.max(0, state.rightSets - 1);
  }
  state.leftScore = 0;
  state.rightScore = 0;
  state.lastServerIndex = -1;
  render();
  speakServer(true);
}

function undo() {
  const previous = state.history.pop();
  if (!previous) return;
  Object.assign(state, previous);
  state.lastServerIndex = -1;
  render();
}

function resetMatch() {
  state.leftScore = 0;
  state.rightScore = 0;
  state.leftSets = 0;
  state.rightSets = 0;
  state.history = [];
  state.lastServerIndex = -1;
  render();
  speakServer(true);
}

function setSelected(button, selected) {
  button.classList.toggle("selected", selected);
}

function render() {
  const leftServing = isLeftServing();
  els.leftScore.textContent = state.leftScore;
  els.rightScore.textContent = state.rightScore;

  els.leftScore.classList.toggle("serving", leftServing);
  els.rightScore.classList.toggle("serving", !leftServing);

  els.leftTeam.textContent = leftServing ? "A팀 서브" : "A팀";
  els.rightTeam.textContent = leftServing ? "B팀" : "B팀 서브";
  els.leftTeam.classList.toggle("serving-left", leftServing);
  els.rightTeam.classList.toggle("serving-right", !leftServing);

  els.setInfo.textContent = `${state.doublesMode ? "복식" : "단식"}  ${currentSetNumber()}세트  ${state.leftSets}:${state.rightSets}  ${state.targetSets}세트/${winsNeeded()}선승  ${state.gamePoint}점`;
  els.serverInfo.textContent = `${currentServerLabel()} 서브`;

  if (isMatchOver()) {
    els.statusInfo.textContent = `${state.leftSets > state.rightSets ? "A팀" : "B팀"} 경기 승리`;
  } else if (isGameOver()) {
    els.statusInfo.textContent = `${state.leftScore > state.rightScore ? "A팀" : "B팀"} 세트 승리`;
  } else if (state.leftScore >= state.gamePoint - 1 && state.rightScore >= state.gamePoint - 1) {
    els.statusInfo.textContent = "듀스";
  } else {
    els.statusInfo.textContent = `${state.gamePoint}점 경기`;
  }

  const scoringEnabled = !isGameOver() && !isMatchOver();
  els.leftScore.disabled = !scoringEnabled;
  els.rightScore.disabled = !scoringEnabled;
  els.leftPointBtn.disabled = !scoringEnabled;
  els.rightPointBtn.disabled = !scoringEnabled;
  els.nextSetBtn.disabled = !isGameOver() || isMatchOver();
  els.resetSetBtn.disabled = state.leftScore === 0 && state.rightScore === 0;
  els.undoBtn.disabled = state.history.length === 0;

  setSelected(els.singlesBtn, !state.doublesMode);
  setSelected(els.doublesBtn, state.doublesMode);
  setSelected(els.set3Btn, state.targetSets === 3);
  setSelected(els.set5Btn, state.targetSets === 5);
  setSelected(els.set7Btn, state.targetSets === 7);
  setSelected(els.point11Btn, state.gamePoint === 11);
  setSelected(els.point15Btn, state.gamePoint === 15);
  setSelected(els.point21Btn, state.gamePoint === 21);

  state.lastServerIndex = currentServerIndex();
}

els.leftScore.addEventListener("click", () => addPoint(true));
els.rightScore.addEventListener("click", () => addPoint(false));
els.leftPointBtn.addEventListener("click", () => addPoint(true));
els.rightPointBtn.addEventListener("click", () => addPoint(false));
els.singlesBtn.addEventListener("click", () => changeMode(false));
els.doublesBtn.addEventListener("click", () => changeMode(true));
els.set3Btn.addEventListener("click", () => changeTargetSets(3));
els.set5Btn.addEventListener("click", () => changeTargetSets(5));
els.set7Btn.addEventListener("click", () => changeTargetSets(7));
els.point11Btn.addEventListener("click", () => changeGamePoint(11));
els.point15Btn.addEventListener("click", () => changeGamePoint(15));
els.point21Btn.addEventListener("click", () => changeGamePoint(21));
els.undoBtn.addEventListener("click", undo);
els.speakBtn.addEventListener("click", () => speakServer(true));
els.resetSetBtn.addEventListener("click", resetSet);
els.nextSetBtn.addEventListener("click", nextSet);
els.resetBtn.addEventListener("click", resetMatch);

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") addPoint(true);
  if (event.key === "ArrowRight" || event.key === "b" || event.key === "B") addPoint(false);
  if (event.key === "Backspace") undo();
});

render();
