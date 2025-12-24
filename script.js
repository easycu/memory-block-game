/* ================= 기본 설정 ================= */
const BOARD_SIZE = 10;
let board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);

let score = 0;
let bestScore = Number(localStorage.getItem("bestScore")) || 0;

let state = "home";
let blocks = [];
let selectedBlock = null;
let previewIndex = null;

/* ================= 문제 데이터 ================= */
const quizDB = [
  { q:"대한민국은 민주공화국이다", a:"O", e:"헌법 제1조" },
  { q:"국회는 행정권을 가진다", a:"X", e:"입법기관이다" },
  { q:"대통령 임기는 5년이다", a:"O", e:"헌법 제70조" },
  { q:"헌법재판소는 사법기관이다", a:"X", e:"독립 헌법기관이다" },
  { q:"선거권 연령은 만 18세이다", a:"O", e:"공직선거법" }
];

let quizSet = [];
let quizIndex = 0;
let quizCorrect = 0;
let showExplain = false;

/* ================= 블록 모양 ================= */
const blockShapes = [
  [[0,0]],
  [[0,0],[0,1]],
  [[0,0],[1,0]],
  [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[0,2],[0,3]],
  [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[1,0],[1,1]],
  [[0,0],[0,1],[0,2],[1,1]],
  [[1,0],[1,1],[1,2],[0,1]]
];

/* ================= 게임 시작 ================= */
function startGame() {
  board.fill(0);
  score = 0;
  newBlocks();
  state = "block";
  render();
}

/* ================= 블록 생성 ================= */
function newBlocks() {
  blocks = [];
  for (let i = 0; i < 3; i++) {
    blocks.push(blockShapes[Math.floor(Math.random() * blockShapes.length)]);
  }
}

/* ================= 퀴즈 랜덤 3문제 ================= */
function pickRandomQuiz() {
  quizSet = [...quizDB].sort(() => Math.random() - 0.5).slice(0, 3);
  quizIndex = 0;
  quizCorrect = 0;
  showExplain = false;
}

/* ================= 렌더 ================= */
function render() {
  const body = document.body;

  if (state === "home") {
    body.innerHTML = `<h1>Memory Block Game</h1><button onclick="startGame()">시작</button>`;
    return;
  }

  if (state === "block") {
    body.innerHTML = `
      <h2>블록 게임</h2>
      <p>점수: ${score} / 최고점수: ${bestScore}</p>
      <div id="game">
        <div id="board"></div>
        <div>
          <div id="blocks"></div>
          <button onclick="confirmPlace()">설치</button>
        </div>
      </div>
    `;
    drawBoard();
    drawBlocks();

    if (!hasAnyMove()) gameOver();
    return;
  }

  if (state === "quiz") {
    const q = quizSet[quizIndex];
    body.innerHTML = `
      <h2>OX 문제 ${quizIndex + 1}/3</h2>
      <p>${q.q}</p>
      ${
        showExplain
          ? `<div class="explain"><b>정답:</b> ${q.a}<br>${q.e}</div>
             <button onclick="nextQuiz()">다음 문제</button>`
          : `<button onclick="answer('O')">O</button>
             <button onclick="answer('X')">X</button>`
      }
    `;
  }

  if (state === "gameover") {
    body.innerHTML = `
      <h1>GAME OVER</h1>
      <p>점수: ${score}</p>
      <button onclick="startGame()">다시 시작</button>
    `;
  }
}

/* ================= 보드 ================= */
function drawBoard() {
  const el = document.getElementById("board");
  el.innerHTML = "";

  board.forEach((v,i) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    if (v) cell.classList.add("filled");

    if (selectedBlock !== null && previewIndex !== null) {
      const shape = blocks[selectedBlock];
      const can = canPlace(shape, previewIndex);
      const br = Math.floor(previewIndex / BOARD_SIZE);
      const bc = previewIndex % BOARD_SIZE;

      shape.forEach(([r,c]) => {
        const pos = (br+r)*BOARD_SIZE + (bc+c);
        if (pos === i && board[pos] === 0)
          cell.classList.add(can ? "preview-ok" : "preview-bad");
      });
    }

    cell.onclick = () => {
      previewIndex = i;
      render();
    };

    el.appendChild(cell);
  });
}

/* ================= 블록 ================= */
function drawBlocks() {
  const el = document.getElementById("blocks");
  el.innerHTML = "";

  blocks.forEach((shape,i) => {
    const b = document.createElement("div");
    b.className = "block";
    b.onclick = () => selectedBlock = i;

    const grid = Array(25).fill(0);
    shape.forEach(([r,c]) => grid[r*5 + c] = 1);

    grid.forEach(v => {
      const d = document.createElement("div");
      if (!v) d.style.visibility = "hidden";
      b.appendChild(d);
    });

    el.appendChild(b);
  });
}

/* ================= 배치 ================= */
function canPlace(shape, index) {
  const br = Math.floor(index / BOARD_SIZE);
  const bc = index % BOARD_SIZE;

  return shape.every(([r,c]) => {
    const nr = br+r, nc = bc+c;
    const pos = nr*BOARD_SIZE + nc;
    return nr>=0 && nr<BOARD_SIZE && nc>=0 && nc<BOARD_SIZE && board[pos]===0;
  });
}

function confirmPlace() {
  if (selectedBlock === null || previewIndex === null) return;
  const shape = blocks[selectedBlock];
  if (!canPlace(shape, previewIndex)) return;

  const br = Math.floor(previewIndex / BOARD_SIZE);
  const bc = previewIndex % BOARD_SIZE;

  shape.forEach(([r,c]) => {
    board[(br+r)*BOARD_SIZE + (bc+c)] = 1;
  });

  clearLines();
  blocks.splice(selectedBlock, 1);
  selectedBlock = null;
  previewIndex = null;

  if (blocks.length === 0) {
    pickRandomQuiz();
    state = "quiz";
  }

  render();
}

/* ================= 줄 삭제 + 점수 ================= */
function clearLines() {
  let cleared = 0;

  for (let r=0;r<BOARD_SIZE;r++) {
    if ([...Array(BOARD_SIZE)].every((_,c)=>board[r*BOARD_SIZE+c])) {
      for (let c=0;c<BOARD_SIZE;c++) board[r*BOARD_SIZE+c]=0;
      cleared++;
    }
  }

  for (let c=0;c<BOARD_SIZE;c++) {
    if ([...Array(BOARD_SIZE)].every((_,r)=>board[r*BOARD_SIZE+c])) {
      for (let r=0;r<BOARD_SIZE;r++) board[r*BOARD_SIZE+c]=0;
      cleared++;
    }
  }

  if (cleared) {
    score += cleared * 100;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("bestScore", bestScore);
    }
  }
}

/* ================= 게임오버 ================= */
function hasAnyMove() {
  return blocks.some(shape =>
    board.some((_,i)=>canPlace(shape,i))
  );
}

function gameOver() {
  state = "gameover";
}

/* ================= 퀴즈 ================= */
function answer(v) {
  if (v === quizSet[quizIndex].a) quizCorrect++;
  showExplain = true;
  render();
}

function nextQuiz() {
  showExplain = false;
  quizIndex++;

  if (quizIndex === 3) {
    if (quizCorrect >= 2) {
      newBlocks();
      state = "block";
    } else {
      quizIndex = 0;
    }
  }
  render();
}

/* ================= 시작 ================= */
render();