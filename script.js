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

  if (state === "block") {
    b.innerHTML = `
      <h3>점수 ${score} / 최고 ${bestScore}</h3>
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
    if (!hasMove()) gameOver();
    return;
  }

  if (state === "quiz") {
    const q = quizSet[quizIndex];
    b.innerHTML = `
      <h3>OX 문제 ${quizIndex+1}/3</h3>
      <p>${q.q}</p>
      ${
        showExplain
          ? `<div class="explain"><b>정답:</b> ${q.a}<br>${q.e}</div>
             <button onclick="nextQuiz()">다음</button>`
          : `<button onclick="answer('O')">O</button>
             <button onclick="answer('X')">X</button>`
      }
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
        <input id="importUrl" placeholder="JSON URL">
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

/* ================= 게임 로직 ================= */
function startGame() {
  board.fill(0);
  score = 0;
  newBlocks();
  state = "block";
  render();
}

function newBlocks() {
  blocks = [];
  for(let i=0;i<3;i++)
    blocks.push(SHAPES[Math.floor(Math.random()*SHAPES.length)]);
}

function drawBoard() {
  const el = document.getElementById("board");
  el.innerHTML="";
  board.forEach((v,i)=>{
    const c=document.createElement("div");
    c.className="cell"+(v?" filled":"");
    c.onclick=()=>{previewIndex=i;render();}
    if(selectedBlock!==null && previewIndex!==null){
      const can=canPlace(blocks[selectedBlock],previewIndex);
      blocks[selectedBlock].forEach(([r,c2])=>{
        const pos=(Math.floor(previewIndex/BOARD)+r)*BOARD+(previewIndex%BOARD+c2);
        if(pos===i && board[i]===0)
          c.classList.add(can?"preview-ok":"preview-bad");
      });
    }
    el.appendChild(c);
  });
}

function drawBlocks() {
  const el=document.getElementById("blocks");
  el.innerHTML="";
  blocks.forEach((s,i)=>{
    const b=document.createElement("div");
    b.className="block";
    b.onclick=()=>selectedBlock=i;
    Array(25).fill(0).forEach((_,k)=>{
      const d=document.createElement("div");
      if(!s.some(([r,c])=>r*5+c===k)) d.style.visibility="hidden";
      b.appendChild(d);
    });
    el.appendChild(b);
  });
}

function canPlace(s,i){
  const r=Math.floor(i/BOARD), c=i%BOARD;
  return s.every(([dr,dc])=>{
    const nr=r+dr,nc=c+dc,p=nr*BOARD+nc;
    return nr>=0&&nr<BOARD&&nc>=0&&nc<BOARD&&board[p]===0;
  });
}

function confirmPlace(){
  if(selectedBlock===null||previewIndex===null) return;
  if(!canPlace(blocks[selectedBlock],previewIndex)) return;
  blocks[selectedBlock].forEach(([r,c])=>{
    board[(Math.floor(previewIndex/BOARD)+r)*BOARD+(previewIndex%BOARD+c)]=1;
  });
  clearLines();
  blocks.splice(selectedBlock,1);
  selectedBlock=null; previewIndex=null;
  if(blocks.length===0){ pickQuiz(); state="quiz"; }
  render();
}

function clearLines(){
  let n=0;
  for(let r=0;r<BOARD;r++)
    if([...Array(BOARD)].every((_,c)=>board[r*BOARD+c])){
      for(let c=0;c<BOARD;c++) board[r*BOARD+c]=0; n++;
    }
  for(let c=0;c<BOARD;c++)
    if([...Array(BOARD)].every((_,r)=>board[r*BOARD+c])){
      for(let r=0;r<BOARD;r++) board[r*BOARD+c]=0; n++;
    }
  if(n){
    score+=n*100;
    if(score>bestScore){
      bestScore=score;
      localStorage.setItem("bestScore",bestScore);
    }
  }
}

function hasMove(){
  return blocks.some(s=>board.some((_,i)=>canPlace(s,i)));
}

function gameOver(){ state="gameover"; render(); }

/* ================= 퀴즈 ================= */
function pickQuiz(){
  quizSet=[...quizDB].sort(()=>Math.random()-0.5).slice(0,3);
  quizIndex=0; quizCorrect=0; showExplain=false;
}

function answer(v){
  if(v===quizSet[quizIndex].a) quizCorrect++;
  showExplain=true;
  render();
}

function nextQuiz(){
  showExplain=false;
  quizIndex++;
  if(quizIndex===3){
    if(quizCorrect>=2){ newBlocks(); state="block"; }
    else quizIndex=0;
  }
  render();
}

/* ================= 문제 관리 ================= */
let tempAns="O";
function setAns(v){ tempAns=v; }

function addQuiz(){
  const q=document.getElementById("q").value.trim();
  const e=document.getElementById("e").value.trim();
  if(!q) return;
  quizDB.push({id:Date.now(),q,a:tempAns,e});
  saveQuiz(); render();
}

function delQuiz(id){
  quizDB=quizDB.filter(q=>q.id!==id);
  saveQuiz(); render();
}

function exportQuiz(){
  const blob=new Blob([JSON.stringify(quizDB,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="quiz_backup.json";
  a.click();
}

async function importQuiz(){
  const url=document.getElementById("importUrl").value.trim();
  if(!url) return;
  const res=await fetch(url);
  quizDB=await res.json();
  saveQuiz(); alert("불러오기 완료"); render();
}

/* ================= 시작 ================= */
loadQuiz();
render();
