/* ================= 기본 설정 ================= */
const BOARD = 10;
let board = Array(BOARD*BOARD).fill(0);
let blocks = [];
let selectedBlock = null;
let previewIndex = null;

let score = 0;
let bestScore = Number(localStorage.getItem("bestScore")) || 0;
let state = "home";

/* ================= 문제 데이터 ================= */
const DEFAULT_QUIZ = [
  { id:1, q:"대한민국은 민주공화국이다", a:"O", e:"헌법 제1조" },
  { id:2, q:"국회는 행정권을 가진다", a:"X", e:"입법기관이다" },
  { id:3, q:"대통령 임기는 5년이다", a:"O", e:"헌법 제70조" }
];

let quizDB = [];
let quizSet = [];
let quizIndex = 0;
let quizCorrect = 0;
let showExplain = false;

/* ================= 블록 모양 ================= */
const SHAPES = [
  [[0,0]],
  [[0,0],[0,1]],
  [[0,0],[1,0]],
  [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[0,2],[0,3]],
  [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[1,0],[1,1]],
  [[0,1],[1,0],[1,1],[1,2]]
];

/* ================= 저장 ================= */
function loadQuiz() {
  const saved = localStorage.getItem("quizDB");
  quizDB = saved ? JSON.parse(saved) : DEFAULT_QUIZ;
  saveQuiz();
}

function saveQuiz() {
  localStorage.setItem("quizDB", JSON.stringify(quizDB));
}

/* ================= 렌더 ================= */
function render() {
  const b = document.body;

  if (state === "home") {
    b.innerHTML = `
      <h1>Memory Block Game</h1>
      <button onclick="startGame()">게임 시작</button>
      <button onclick="state='editor';render()">문제 관리</button>
    `;
    return;
  }

  if (state === "editor") {
    b.innerHTML = `
      <h2>문제 관리</h2>

      <input id="q" placeholder="문제">
      <div>
        <button onclick="setAns('O')">O</button>
        <button onclick="setAns('X')">X</button>
      </div>
      <textarea id="e" placeholder="해설"></textarea><br>
      <button onclick="addQuiz()">문제 추가</button>

      <hr>

      ${quizDB.map(q=>`
        <p>${q.q} (${q.a})
        <button onclick="delQuiz(${q.id})">삭제</button></p>
      `).join("")}

      <hr>

      <button onclick="exportQuiz()">문제 내보내기</button>

      <div class="import-box">
        <input id="importUrl" placeholder="JSON 파일 URL 붙여넣기">
        <button onclick="importQuiz()">문제 불러오기</button>
      </div>

      <br>
      <button onclick="state='home';render()">돌아가기</button>
    `;
    return;
  }

  if (state === "gameover") {
    b.innerHTML = `
      <h1>GAME OVER</h1>
      <p>점수 ${score}</p>
      <button onclick="state='home';render()">처음으로</button>
    `;
  }
}

/* ================= 문제 관리 ================= */
let tempAns = "O";
function setAns(v){ tempAns=v; }

function addQuiz() {
  const q = document.getElementById("q").value.trim();
  const e = document.getElementById("e").value.trim();
  if (!q) return;
  quizDB.push({ id:Date.now(), q, a:tempAns, e });
  saveQuiz();
  render();
}

function delQuiz(id) {
  quizDB = quizDB.filter(q=>q.id!==id);
  saveQuiz();
  render();
}

/* ================= 내보내기 ================= */
function exportQuiz() {
  const blob = new Blob([JSON.stringify(quizDB, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "quiz_backup.json";
  a.click();
}

/* ================= 불러오기 ================= */
async function importQuiz() {
  const url = document.getElementById("importUrl").value.trim();
  if (!url) return;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!Array.isArray(data)) throw "형식 오류";
    quizDB = data;
    saveQuiz();
    alert("문제 불러오기 완료");
    render();
  } catch {
    alert("불러오기 실패");
  }
}

/* ================= 시작 ================= */
loadQuiz();
render();