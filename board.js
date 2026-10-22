/* 판서 보드 (board.js) — 슬라이드 HTML 끝에 <script src=".../board.js"></script> 한 줄로 붙임
   필요한 페이지 전역: stage(슬라이드 담는 1280×720 div), slides(배열), cur(현재 번호), go(i), tg(cls),
   SS 또는 S(슬라이드 데이터 배열, slides와 같은 순서), #ui(아래 버튼 막대 자리)
   기능: 펜·색연필·형광펜·지우개·레이저·도형, 굵기·색(직접 고르기), 되돌리기·다시 실행, 선 보정,
         꾹 누르면 직선·원·세모·네모로 정리, 빈 칠판, 같이 쓰기(PeerJS: 판서·슬라이드·해석/문법·퀴즈·커서·레이저 동기화) */
(()=>{
"use strict";
const VERSION = "2026-10-23-6";

/* ---------- 스타일 ---------- */
const CSS = `
#bd{position:absolute;top:0;left:0;width:1280px;height:720px;transform-origin:0 0;pointer-events:none;z-index:5}
#bd canvas{position:absolute;inset:0;width:1280px;height:720px}
#ink{touch-action:none}
.drawing #ink{pointer-events:auto;cursor:crosshair}
.drawing.er #ink{cursor:cell}
.drawing.laser #ink{cursor:none}
#fx{pointer-events:none}
.rcur{position:absolute;left:0;top:0;display:none;pointer-events:none;transform:translate(-3px,-2px)}
.rcur svg{width:22px;height:22px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}
.rcur b{position:absolute;left:16px;top:16px;font:700 11px Body,"Malgun Gothic",sans-serif;color:#fff;background:#7c3aed;border-radius:6px;padding:1px 6px;white-space:nowrap}
.bar{position:fixed;bottom:10px;display:flex;align-items:center;gap:1px;z-index:9;background:rgba(29,36,51,.94);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:4px;box-shadow:0 8px 24px rgba(0,0,0,.28)}
#ui{right:14px;left:auto;gap:1px;opacity:.55;transition:opacity .2s}
#ui:hover,.drawing #ui,#ui:has(.live){opacity:1}
#pen{left:12px;display:none;z-index:10}
.drawing #pen{display:flex}
.bar button,#ui.bar button{display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 10px;border:0;border-radius:9px;background:transparent;color:#d5d9e2;font:600 13.5px Body,"Malgun Gothic",sans-serif;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}
.bar button:hover,#ui.bar button:hover{background:rgba(255,255,255,.1);color:#fff}
.bar button.ic,#ui.bar button.ic{width:32px;padding:0;justify-content:center}
.bar button.on,#ui.bar button.on{background:#fff;color:#1d2433}
.bar button.locked,#ui.bar button.locked{opacity:.35;cursor:not-allowed}
.bar svg{width:17px;height:17px;flex:none}
.bar .sep{width:1px;height:20px;background:rgba(255,255,255,.14);margin:0 3px}
#ui.bar #coBtn.live{background:#16a34a;color:#fff}
#ui .off{display:none}
.hideKo #koBtn .on-i,.hideNt #ntBtn .on-i{display:none}
.hideKo #koBtn .off,.hideNt #ntBtn .off{display:block}
.hideKo #ui #koBtn,.hideNt #ui #ntBtn{color:#7d8699}
#pen #colors,#pen #sizes{display:flex;gap:1px;align-items:center;padding:0 2px}
#pen button.c{width:20px;height:20px;padding:0;margin:0 3px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(255,255,255,.3);transition:transform .15s}
#pen button.c:hover{transform:scale(1.12)}
#pen button.c.on{box-shadow:0 0 0 2px #1d2433,0 0 0 3.5px #fff}
#pen .pick{position:relative;display:block;width:20px;height:20px;margin:0 3px;border-radius:50%;cursor:pointer;background:conic-gradient(#ff4d4d,#ffd84d,#5ee35e,#4dd8ff,#5b6bff,#e44dff,#ff4d4d);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35);transition:transform .15s}
#pen .pick:hover{transform:scale(1.12)}
#pen .pick input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0;padding:0}
#pen button.s{width:28px;padding:0;justify-content:center}
#pen button.s.on{background:rgba(255,255,255,.16)}
#pen button.s i{display:block;border-radius:50%}
#shapeMenu{position:fixed;display:none;gap:2px;padding:4px;z-index:12}
#shapeMenu.open{display:flex}
@media (max-width:1180px){#pen{bottom:58px}}
#co{position:fixed;right:14px;bottom:62px;width:300px;display:none;flex-direction:column;gap:10px;z-index:11;background:#1d2433;color:#fff;border-radius:14px;padding:14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:500 14px Body,"Malgun Gothic",sans-serif}
#co.open{display:flex}
#co .row{display:flex;gap:6px}
#co button{font:600 13px Body,"Malgun Gothic",sans-serif;border:0;border-radius:10px;padding:9px 10px;cursor:pointer;background:#2e3546;color:#fff;flex:1}
#co button.main{background:#e8633a}
#co button.on{background:#fff;color:#1d2433}
#co button:disabled{opacity:.45;cursor:not-allowed}
#co input{flex:1;min-width:0;font:700 17px Body,"Malgun Gothic",sans-serif;letter-spacing:.03em;border:0;border-radius:10px;padding:7px 12px;background:#fff;color:#1d2433}
#co .code{font:800 28px Title,Body,sans-serif;letter-spacing:.04em;text-align:center;background:#2e3546;border-radius:10px;padding:6px 0}
#co .st{font-size:13px;color:#c7ccd6;line-height:1.45}
#co .st b{color:#7ee08a}
#co .x{position:absolute;right:10px;top:6px;background:none;flex:none;padding:4px 6px;font-size:16px;color:#9aa1b0}
#bdToast{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:20;background:#1d2433;color:#fff;font:600 14px Body,"Malgun Gothic",sans-serif;padding:9px 16px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.3);opacity:0;transition:opacity .25s;pointer-events:none}
#bdToast.show{opacity:1}
.slide.blank{background-color:#fff;background-image:linear-gradient(#eef1f6 1px,transparent 1px),linear-gradient(90deg,#eef1f6 1px,transparent 1px);background-size:40px 40px}
.slide.blank .bk{position:absolute;left:28px;top:20px;font:700 15px Body,"Malgun Gothic",sans-serif;color:#9aa1b0;display:flex;gap:10px;align-items:center}
#ui.bar #unblankBtn.arm{background:#e5322d;color:#fff}
#helpBtn{position:fixed;right:8px;top:8px;width:18px;height:18px;padding:0;border:0;border-radius:50%;background:rgba(29,36,51,.6);color:#fff;font:700 11px/18px Body,"Malgun Gothic",sans-serif;text-align:center;cursor:pointer;z-index:9;opacity:.35;transition:opacity .2s}
#helpBtn:hover{opacity:1}
#help{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(10,14,22,.5);z-index:30}
#help.open{display:flex}
#help .box{position:relative;width:min(580px,92vw);max-height:86vh;overflow:auto;background:#fff;color:#1d2433;border-radius:16px;padding:22px 26px 18px;font:500 14px/1.6 Body,"Malgun Gothic",sans-serif;box-shadow:0 20px 50px rgba(0,0,0,.35)}
#help h3{font:400 20px Title,Body,"Malgun Gothic",sans-serif;margin-bottom:4px}
#help h4{font-weight:800;font-size:14px;margin:12px 0 3px;color:#e8633a}
#help ul{padding-left:18px}
#help li{margin:2px 0}
#help kbd{font:700 11.5px Consolas,monospace;background:#eef0f4;border:1px solid #d9dde5;border-bottom-width:2px;border-radius:4px;padding:0 5px}
#help .x{position:absolute;right:12px;top:10px;border:0;background:none;font-size:18px;color:#9aa1b0;cursor:pointer}
#saveAsk{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(10,14,22,.5);z-index:31}
#saveAsk.open{display:flex}
#saveAsk .box{position:relative;width:min(440px,92vw);background:#fff;color:#1d2433;border-radius:16px;padding:22px 24px 18px;font:500 14px/1.6 Body,"Malgun Gothic",sans-serif;box-shadow:0 20px 50px rgba(0,0,0,.35)}
#saveAsk h3{font:400 20px Title,Body,"Malgun Gothic",sans-serif;margin-bottom:6px}
#saveAsk .st2{color:#5b6475;font-size:13.5px}
#saveAsk .row2{display:flex;flex-direction:column;gap:8px;margin-top:14px}
#saveAsk .row2 button{font:700 14px Body,"Malgun Gothic",sans-serif;border:0;border-radius:10px;padding:11px;cursor:pointer;background:#eef0f4;color:#1d2433}
#saveAsk .row2 button.main{background:#e8633a;color:#fff}
#saveAsk .x{position:absolute;right:12px;top:10px;border:0;background:none;font-size:18px;color:#9aa1b0;cursor:pointer}
img.bd-print{display:none}
@media print{img.bd-print{display:block;position:absolute;left:0;top:0;width:1280px;height:720px;z-index:50;pointer-events:none}.slide.bd-noprint{display:none!important}#saveAsk{display:none!important}}

@media print{#bd,#pen,#co,#shapeMenu,#bdToast,#ui,#helpBtn,#help,#saveAsk{display:none!important}}
`;
document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);

/* ---------- 아이콘 ---------- */
const ic = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  prev: ic('<path d="M15 18l-6-6 6-6"/>'), next: ic('<path d="M9 18l6-6-6-6"/>'),
  pen: ic('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  pc: ic('<path d="M21.2 6.8a2.8 2.8 0 0 0-4-4L3.8 16.2a2 2 0 0 0-.5.8l-1.3 4.4a.5.5 0 0 0 .6.6l4.4-1.3a2 2 0 0 0 .8-.5Z"/><path d="M15 5l4 4"/>'),
  hl: ic('<path d="M9 11l-6 6v3h9l3-3"/><path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>'),
  er: ic('<path d="M7 21l-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L11 21"/><path d="M22 21H7"/><path d="M5 11l9 9"/>'),
  laser: ic('<circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
  line: ic('<path d="M5 19L19 5"/>'), circle: ic('<circle cx="12" cy="12" r="8"/>'), tri: ic('<path d="M12 4l9 16H3Z"/>'),
  heart: ic('<path d="M12 20.5C9 18.4 2.5 14 2.5 8.6 2.5 5.5 4.8 3.5 7.4 3.5c2 0 3.6 1.2 4.6 3 1-1.8 2.6-3 4.6-3 2.6 0 4.9 2 4.9 5.1 0 5.4-6.5 9.8-9.5 11.9Z"/>'),
  star: ic('<path d="M12 2.5 17.8 20.5 2.6 9.4h18.8L6.2 20.5Z"/>'),
  undo: ic('<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
  redo: ic('<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
  trash: ic('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  users: ic('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  eye: ic('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  eyeoff: ic('<path d="M10.7 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M2 2l20 20"/>'),
  full: ic('<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>'),
  pdf: ic('<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>'),
  board: ic('<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M12 8v6M9 11h6"/>'),
};
const eyes = () => I.eye.replace("<svg ", '<svg class="on-i" ') + I.eyeoff.replace("<svg ", '<svg class="off" ');

/* ---------- 화면 요소 만들기 ---------- */
const $ = id => document.getElementById(id);
document.body.insertAdjacentHTML("beforeend", `
<div id="bd"><canvas id="ink" width="2560" height="1440"></canvas><canvas id="fx" width="2560" height="1440"></canvas>
  <div class="rcur" id="rcur"><svg viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7Z" fill="#7c3aed" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg><b>상대</b></div></div>
<div id="pen" class="bar">
  <span id="colors"></span><span class="sep"></span><span id="sizes"></span><span class="sep"></span>
  <button class="ic on" data-t="pen" title="펜">${I.pen}</button>
  <button class="ic" data-t="pc" title="색연필">${I.pc}</button>
  <button class="ic" data-t="hl" title="형광펜 (곧은 선)">${I.hl}</button>
  <button class="ic" data-t="er" title="지우개 (E)">${I.er}</button>
  <button class="ic" data-t="laser" title="레이저 포인터 (L)">${I.laser}</button>
  <button class="ic" data-t="shape" id="shapeBtn" title="도형">${I.circle}</button>
  <span class="sep"></span>
  <button class="ic" id="undoBtn" title="되돌리기 (Ctrl+Z)">${I.undo}</button>
  <button class="ic" id="redoBtn" title="다시 실행 (Ctrl+Y)">${I.redo}</button>
  <button class="ic" id="clearBtn" title="이 장 모두 지우기 (Delete)">${I.trash}</button>
</div>
<div id="shapeMenu" class="bar">
  <button class="ic" data-shape="line" title="직선 (가로·세로로 맞춤, 꾹 누른 뒤 움직이면 자유 각도)">${I.line}</button>
  <button class="ic" data-shape="circle" title="원">${I.circle}</button>
  <button class="ic" data-shape="tri" title="세모">${I.tri}</button>
  <button class="ic" data-shape="heart" title="하트">${I.heart}</button>
  <button class="ic" data-shape="star" title="별">${I.star}</button>
</div>
<div id="co">
  <button class="x" id="coX" title="닫기">✕</button>
  <b style="font-size:16px">같이 쓰기</b>
  <div class="st">같은 링크를 연 두 사람의 판서, 슬라이드, 해석·문법 가리기, 퀴즈 정답이 실시간으로 맞춰져요.</div>
  <div id="coIdle">
    <div class="st" style="margin-bottom:6px">방 이름 (영어·숫자)</div>
    <div class="row"><input id="coIn" maxlength="16" placeholder="예: dahyun" autocomplete="off"><button class="main" id="coGo" style="flex:none;padding:9px 16px">시작</button></div>
  </div>
  <div id="coOn" style="display:none">
    <div class="code" id="coCode"></div>
    <div class="st" id="coSt" style="margin-top:8px"></div>
    <div id="coLock" style="margin-top:10px">
      <div class="st" style="margin-bottom:6px">슬라이드 넘기기</div>
      <div class="row"><button data-lock="both">둘 다</button><button data-lock="me">나만</button></div>
      <div class="st" id="coLockSt" style="margin-top:6px"></div>
    </div>
    <div class="row" style="margin-top:10px"><button class="main" id="coCopy">수업방에 올릴 링크 복사</button></div>
    <div class="st" style="margin-top:8px">이 링크를 수업방에 한 번 올려 두면, 선생님과 학생이 언제 들어오든 자동으로 연결돼요.</div>
    <div class="row" style="margin-top:8px"><button id="coLeave">나가기</button></div>
  </div>
</div>
<div id="bdToast"></div>
<button id="helpBtn" title="판서 사용설명서 (?)">?</button>
<div id="help"><div class="box">
  <button class="x" id="helpX" title="닫기">✕</button>
  <h3>판서 사용설명서</h3>
  <h4>시작</h4>
  <ul><li>아래 <b>판서</b> 버튼 또는 <kbd>P</kbd>로 켜고 끄기, <kbd>Esc</kbd>로 끄기</li>
  <li>펜과 마우스로만 써져요. 손가락·손바닥이 닿아도 그려지지 않아요</li></ul>
  <h4>도구 (왼쪽 아래 막대)</h4>
  <ul><li><b>펜</b> 매끈한 선 · <b>색연필</b> 크레용 느낌, 펜을 세게 누르면 진하게</li>
  <li><b>형광펜</b> 곧은 선, 거의 수평이면 딱 수평 · <b>지우개</b> <kbd>E</kbd></li>
  <li><b>레이저</b> <kbd>L</kbd> 움직이면 빨간 점이 따라와요. 흔적은 바로 사라져요 (상대 화면에도 보여요)</li>
  <li><b>도형</b> 직선·원·세모·하트·별 — 끌어서 그려요. 색연필로 쓰면 손으로 그린 느낌</li>
  <li>색: 동그라미 / 무지개 동그라미로 아무 색이나 · 굵기: 점 크기 버튼</li></ul>
  <h4>꾹 누르기</h4>
  <ul><li>그리다가 멈추고 꾹 누르고 있으면 반듯하게: 선 → 직선, 대충 그린 동그라미·세모·네모 → 반듯한 모양</li>
  <li>직선은 웬만하면 가로·세로로 맞춰져요. 다른 각도는 <b>꾹 누른 뒤 움직이기</b></li>
  <li>글자 밑에 가로선을 그으면 글자 바로 밑에 붙어요 (밑줄)</li></ul>
  <h4>저장</h4>
  <ul><li>아래 막대의 저장(↓) 버튼 → <b>필기한 장만</b> 또는 <b>전체 슬라이드</b>를 PDF로. 인쇄 창에서 대상을 "PDF로 저장"으로</li>
  <li>저장하지 않은 필기가 있을 때 창을 닫으면 "나가시겠어요?"가 떠요. <b>머무르기</b>를 누르면 PDF 저장 창이 나와요</li></ul>
  <h4>고치기</h4>
  <ul><li>되돌리기 <kbd>Ctrl</kbd>+<kbd>Z</kbd> · 다시 실행 <kbd>Ctrl</kbd>+<kbd>Y</kbd> · 이 장 모두 지우기 휴지통 / <kbd>Delete</kbd></li>
  <li>되돌리기는 내가 그은 선만 지워요</li></ul>
  <h4>슬라이드</h4>
  <ul><li>넘기기 <kbd>←</kbd> <kbd>→</kbd> · 해석 숨기기 <kbd>K</kbd> · 문법 숨기기 <kbd>N</kbd> · 전체화면 <kbd>F</kbd></li>
  <li><b>빈 칠판</b> 칠판 버튼 → 지금 장 다음에 빈 장 추가. 지울 때는 "칠판 지우기"를 두 번</li></ul>
  <h4>같이 쓰기 (온라인 과외)</h4>
  <ul><li>같이 쓰기 → 방 이름 → 시작 → <b>수업방에 올릴 링크 복사</b> → 수업방에 붙여 넣기. 둘 다 그 링크로 들어오면 자동 연결</li>
  <li>판서·슬라이드·해석/문법 가리기·퀴즈 정답·레이저·상대 커서가 맞춰져요</li>
  <li>연결되면 <b>슬라이드 넘기기 [둘 다] [나만]</b> — 선생님이 먼저 "나만"을 누르면 학생은 못 넘겨요</li></ul>
</div></div>
<div id="saveAsk"><div class="box">
  <button class="x" id="saveX" title="닫기">✕</button>
  <h3 id="saveTitle">필기를 PDF로 저장할까요?</h3>
  <p class="st2">인쇄 창이 열리면 <b>대상</b>을 <b>PDF로 저장</b>으로 고르고 저장을 누르세요.</p>
  <div class="row2">
    <button class="main" id="saveInk">필기한 장만 저장</button>
    <button id="saveAll">전체 슬라이드 저장</button>
    <button id="saveNo">저장 안 함</button>
  </div>
</div></div>`);
const ui = $("ui");
ui.className = "bar";
ui.innerHTML = `
  <button class="ic nav" id="prevBtn" title="이전 (←)">${I.prev}</button>
  <button class="ic nav" id="nextBtn" title="다음 (→)">${I.next}</button>
  <span class="sep"></span>
  <button id="penBtn" title="판서 (P)">${I.pen}<span>판서</span></button>
  <button id="coBtn" title="같이 쓰기">${I.users}<span>같이 쓰기</span></button>
  <span class="sep"></span>
  <button class="ic" id="blankBtn" title="다음에 빈 칠판 추가">${I.board}</button>
  <button id="unblankBtn" title="이 빈 칠판 지우기" style="display:none">${I.trash}<span>칠판 지우기</span></button>
  <button id="koBtn" title="해석 보이기/숨기기 (K)">${eyes()}<span>해석</span></button>
  <button id="ntBtn" title="문법 보이기/숨기기 (N)">${eyes()}<span>문법</span></button>
  <button class="ic" id="pdfBtn" title="필기 PDF로 저장">${I.pdf}</button>
  <button class="ic" id="fsBtn" title="전체화면 (F)">${I.full}</button>`;

let toastT = 0;
function toast(msg){ const t = $("bdToast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove("show"), 2200); }

/* ---------- 페이지와 연결 ---------- */
const bd = $("bd"), ink = $("ink"), ctx = ink.getContext("2d"), fx = $("fx"), fctx = fx.getContext("2d");
const data = () => typeof SS !== "undefined" ? SS : S;           /* 슬라이드 데이터 (slides와 같은 순서) */
const syncBox = () => { bd.style.transform = stage.style.transform; };
addEventListener("resize", ()=>setTimeout(syncBox));
new MutationObserver(syncBox).observe(stage, {attributes:true, attributeFilter:["style"]});
syncBox();

const pageGo = window.go, pageTg = window.tg;
let remoteGo = false;
window.go = function(i){
  if(!remoteGo && !canNav()){ toast("지금은 상대만 슬라이드를 넘길 수 있어요."); return; }
  pageGo(i); blankUI();
  if(!remoteGo){ if(coLoaded) touched = true; send({type:"go", k:skey()}); }
  drawInk();
};
window.tg = function(c){
  pageTg(c);
  if(c==="hideKo" || c==="hideNt") send({type:"view", ...viewState()});
};
const viewState = () => ({ko:document.body.classList.contains("hideKo"), nt:document.body.classList.contains("hideNt")});
function applyView(v){ if(!v) return; document.body.classList.toggle("hideKo", !!v.ko); document.body.classList.toggle("hideNt", !!v.nt); }

/* 전체화면: 막혀 있으면(다른 사이트 화면 안 등) 새 창으로, 그래도 안 되면 안내 */
window.fs = function(){
  const d = document, el = d.documentElement;
  if(d.fullscreenElement || d.webkitFullscreenElement){ (d.exitFullscreen || d.webkitExitFullscreen).call(d); return; }
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  const fallback = ()=>{ if(window.top !== window) window.open(location.href, "_blank"); else alert("이 브라우저에서는 전체화면 버튼이 막혀 있어요. PC라면 키보드의 F11을 눌러 보세요."); };
  if(!req || d.fullscreenEnabled === false || d.webkitFullscreenEnabled === false) return fallback();
  let ok = false;
  const p = (()=>{ try{ return req.call(el); }catch(e){ return Promise.reject(e); } })();
  if(p && p.then) p.then(()=>ok = true, ()=>{ ok = true; fallback(); });
  setTimeout(()=>{ if(!ok && !(d.fullscreenElement || d.webkitFullscreenElement)) fallback(); }, 1500);
};

/* 슬라이드 이름: 번호 대신 내용으로 붙여, 기기마다 장 나눔이 달라도 같은 장을 찾게 함 */
const baseKey = x => x.blank ? "blank:" + x.blank : x.ns ? `${x.m.ls}#${x.ns.join(",")}` : x.raw ? "raw" : `${x.m.ls}|${x.sec}`;
function skey(i = cur){
  const src = data(), x = src[i];
  if(!x) return "i" + i;
  const b = baseKey(x); let n = 0;
  for(let j=0;j<i;j++) if(baseKey(src[j])===b) n++;
  return b + "~" + n;
}
function indexOfKey(k){
  let i = slides.findIndex((_,j)=>skey(j)===k);
  if(i<0){
    const m = k.match(/^(.+)#(\d+)/);
    if(m) i = data().findIndex(x=>x.ns && x.m.ls===m[1] && x.ns.includes(+m[2]));
  }
  return i;
}
function goKey(k){ const i = indexOfKey(k); if(i>=0 && i!==cur){ remoteGo = true; window.go(i); remoteGo = false; } }

/* ---------- 판서 상태 ---------- */
const INK = {}, REDO = {};                         /* 슬라이드 이름 → 획 목록 / 내가 되돌린 획 */
const PAL = {pen:["#e5322d","#2563eb","#16a34a","#111827"], pc:["#d93a2b","#ee7f1f","#2f66cf","#2f8f52","#4d515a"], hl:["#ffe14d","#7ee08a","#ff8fc7","#7cc8ff"]};
const SIZES = {pen:[2,4,7,11], pc:[3,6,10], hl:[14,24,36], er:[20,40,80]};
const sel = {pen:{c:0,s:1}, pc:{c:0,s:1}, hl:{c:0,s:1}, er:{s:1}};
const CUSTOM = {};
let tool = "pen", drawBase = "pen", shapeKind = "circle", stroke = null;
const ME = Math.random().toString(36).slice(2,8);
const CID = (()=>{ try{ let c = localStorage.getItem("boardCid"); if(!c){ c = Math.random().toString(36).slice(2,10); localStorage.setItem("boardCid", c); } return c; }catch(e){ return "t" + ME; } })();
const palOf = t => t==="hl" || t==="pc" ? t : "pen";
const sizeOf = t => t==="shape" || t==="laser" ? drawBase : t;   /* 도형은 마지막에 쓴 펜/색연필 모양을 따름 */
const colorOf = k => sel[k].c < PAL[k].length ? PAL[k][sel[k].c] : (CUSTOM[k] || PAL[k][0]);

function togglePen(on = !document.body.classList.contains("drawing")){
  document.body.classList.toggle("drawing", on);
  $("penBtn").classList.toggle("on", on);
  if(!on){ $("shapeMenu").classList.remove("open"); hideLaser(); }
}
let shownK = "";
function buildBar(){
  const st = sizeOf(tool), k = palOf(st), box = $("colors");
  if(k!==shownK){                                 /* 색 목록이 바뀔 때만 다시 그림 (색 고르는 창이 닫히지 않게) */
    shownK = k;
    box.innerHTML = PAL[k].map((c,i)=>`<button class="c" data-c="${i}" style="background:${c}"></button>`).join("")
      + `<button class="c" data-c="${PAL[k].length}" title="직접 고른 색"></button>`
      + `<label class="pick" title="색 직접 고르기"><input type="color" value="${colorOf(k)}"></label>`;
  }
  const cs = box.querySelectorAll(".c"), cu = cs[cs.length-1];
  cu.style.display = CUSTOM[k] ? "" : "none"; if(CUSTOM[k]) cu.style.background = CUSTOM[k];
  cs.forEach((b,i)=>b.classList.toggle("on", tool!=="er" && tool!=="laser" && sel[k].c===i));
  const ws = SIZES[st], cc = colorOf(k);
  $("sizes").innerHTML = ws.map((w,i)=>{
    const d = Math.round(4 + i*12/(ws.length-1));
    const look = st==="hl" ? `width:18px;height:${Math.max(4,d-3)}px;border-radius:2px;background:${cc}`
               : st==="er" ? `width:${d}px;height:${d}px;background:none;border:2px solid #fff`
               : `width:${d}px;height:${d}px;background:${cc};box-shadow:0 0 0 1px rgba(255,255,255,.35)`;
    return `<button class="s${sel[st].s===i?" on":""}" data-s="${i}" title="굵기 ${i+1}"><i style="${look}"></i></button>`;
  }).join("");
  $("sizes").style.visibility = tool==="laser" ? "hidden" : "";
  document.querySelectorAll("#pen [data-t]").forEach(b=>b.classList.toggle("on", b.dataset.t===tool));
  $("shapeBtn").innerHTML = I[shapeKind];
  document.body.classList.toggle("er", tool==="er");
  document.body.classList.toggle("laser", tool==="laser");
  $("undoBtn").style.opacity = myLast(skey()) >= 0 ? "" : ".4";
  $("redoBtn").style.opacity = (REDO[skey()]||[]).length ? "" : ".4";
}
function setTool(t){
  tool = t;
  if(t==="pen" || t==="pc") drawBase = t;
  if(t!=="laser") hideLaser();
  buildBar();
}
$("pen").addEventListener("click", e=>{
  const b = e.target.closest("button"); if(!b) return;
  if(b.id==="shapeBtn"){
    const m = $("shapeMenu"), r = b.getBoundingClientRect();
    setTool("shape");
    m.classList.toggle("open"); m.style.left = (r.left - 40) + "px"; m.style.bottom = (innerHeight - r.top + 8) + "px";
    return;
  }
  $("shapeMenu").classList.remove("open");
  if(b.dataset.t) setTool(b.dataset.t);
  else if(b.dataset.c){ if(tool==="er" || tool==="laser") setTool(drawBase); sel[palOf(sizeOf(tool))].c = +b.dataset.c; buildBar(); }
  else if(b.dataset.s){ sel[sizeOf(tool)].s = +b.dataset.s; buildBar(); }
});
$("pen").addEventListener("input", e=>{
  if(e.target.type!=="color") return;
  if(tool==="er" || tool==="laser") setTool(drawBase);
  const k = palOf(sizeOf(tool)); CUSTOM[k] = e.target.value; sel[k].c = PAL[k].length; buildBar();
});
$("shapeMenu").addEventListener("click", e=>{
  const b = e.target.closest("button"); if(!b) return;
  shapeKind = b.dataset.shape; setTool("shape"); $("shapeMenu").classList.remove("open");
});
$("undoBtn").onclick = ()=>undoInk();
$("redoBtn").onclick = ()=>redoInk();
$("clearBtn").onclick = ()=>clearInk();

/* ---------- 색연필 질감 ---------- */
const GRAIN = {};
const PAPER = (()=>{                              /* 0~1 종이 결 값 (128×128, 이어 붙여도 이음새 없음) */
  const N = 128, out = new Float32Array(N*N);
  let s = 20261023; const rnd = ()=> (s = (s*1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const grid = g => { const a = Array.from({length:g*g}, rnd);
    return (x, y)=>{ const fx = x/N*g, fy = y/N*g, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx-x0, ty = fy-y0;
      const v = (i, j)=>a[((j+g)%g)*g + (i+g)%g];
      return (v(x0,y0)*(1-tx) + v(x0+1,y0)*tx)*(1-ty) + (v(x0,y0+1)*(1-tx) + v(x0+1,y0+1)*tx)*ty; }; };
  const n8 = grid(8), n32 = grid(32), n64 = grid(64);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const streak = .5 + .5*Math.sin((x*.9 + y*.35) + n8(x,y)*6);
    out[y*N+x] = .34*rnd() + .26*n64(x,y) + .2*n32(x,y) + .1*n8(x,y) + .1*streak;
  }
  return out;
})();
function grain(c){
  if(GRAIN[c]) return GRAIN[c];
  const N = 128, cv = document.createElement("canvas"); cv.width = cv.height = N;
  const g = cv.getContext("2d"), img = g.createImageData(N, N);
  const [r, gg, b] = [1,3,5].map(i=>parseInt(c.slice(i, i+2), 16));
  for(let i=0;i<N*N;i++){ const a = Math.max(0, Math.min(1, (PAPER[i] - .2) * 2.6)); img.data.set([r, gg, b, a*255], i*4); }
  g.putImageData(img, 0, 0);
  const p = ctx.createPattern(cv, "repeat");
  p.setTransform?.(new DOMMatrix([.5,0,0,.5,0,0]));
  return GRAIN[c] = p;
}

/* ---------- 그리기 ---------- */
function paintPencil(st, g){
  const p = st.pts, w = st.w;
  let seed = 7; for(const ch of String(st.id||"")) seed = (seed*31 + ch.charCodeAt(0)) % 9973;
  const h = (k, i)=>{ const v = Math.sin(k*12.9898 + i*78.233 + seed*.618) * 43758.5453; return v - Math.floor(v); };
  const nrm = p.map((q,i)=>{ const a = p[Math.max(0,i-1)], b = p[Math.min(p.length-1,i+1)];
    const dx = b[0]-a[0], dy = b[1]-a[1], L = Math.hypot(dx,dy) || 1; return [-dy/L, dx/L]; });
  const K = Math.max(4, Math.round(w*1.1));
  const cum = [0]; for(let i=1;i<p.length;i++) cum.push(cum[i-1] + Math.hypot(p[i][0]-p[i-1][0], p[i][1]-p[i-1][1]));
  const total = cum[cum.length-1], T = Math.max(1, Math.min(w*2.5 + 8, total*.3));
  const tp = st.closed ? ()=>1 : i=>{ const u = Math.min(1, Math.min(cum[i], total-cum[i]) / T); return .55 + .45*u*u*(3-2*u); };
  g.save();
  g.strokeStyle = g.fillStyle = grain(st.c); g.lineCap = "round"; g.lineJoin = "round";
  const lw = Math.max(1.3, w/K*2.5); g.lineWidth = lw;
  for(let k=0;k<K;k++){
    const off = (k/(K-1) - .5) * w * .85, shade = .75 + .35*h(k, -1);
    const at = i=>{ const j = (h(k, i) - .5) * w * .1, o = (off+j) * tp(i); return [p[i][0] + nrm[i][0]*o, p[i][1] + nrm[i][1]*o]; };
    if(p.length===1){ const [x,y] = at(0); g.globalAlpha = .7*shade; g.beginPath(); g.arc(x, y, lw/2, 0, 7); g.fill(); continue; }
    for(let s=0; s<p.length-1; s+=4){
      const e = Math.min(p.length-1, s+4);
      let pr = 0, ta = 0; for(let i=s;i<=e;i++){ pr += (p[i][2] ?? .5); ta += tp(i); } pr /= (e-s+1); ta /= (e-s+1);
      g.globalAlpha = Math.min(1, (.6 + .8*pr) * shade * (.8 + .2*ta));
      g.lineWidth = lw * (.85 + .15*ta);
      g.beginPath(); const a = at(s); g.moveTo(a[0], a[1]);
      for(let i=s+1;i<=e;i++){ const b = at(i); g.lineTo(b[0], b[1]); }
      g.stroke();
    }
  }
  g.restore();
}
function paint(st, g = ctx){
  if(st.t==="pc") return paintPencil(st, g);
  const p = st.pts;
  g.save();
  g.globalCompositeOperation = st.t==="er" ? "destination-out" : "source-over";
  g.globalAlpha = st.t==="hl" ? .45 : 1;
  g.strokeStyle = st.c; g.lineWidth = st.w;
  g.lineCap = st.t==="hl" ? "butt" : "round"; g.lineJoin = "round";
  g.beginPath(); g.moveTo(p[0][0], p[0][1]);
  if(p.length===1) g.lineTo(p[0][0]+.1, p[0][1]);
  for(let i=1;i<p.length-1;i++){ const mx=(p[i][0]+p[i+1][0])/2, my=(p[i][1]+p[i+1][1])/2; g.quadraticCurveTo(p[i][0],p[i][1],mx,my); }
  if(p.length>1) g.lineTo(p[p.length-1][0], p[p.length-1][1]);
  g.stroke(); g.restore();
}
/* 다 그은 획은 한 장에 모아 두고, 긋는 중에는 그 장 + 지금 획만 다시 그림 */
const done = document.createElement("canvas"); done.width = ink.width; done.height = ink.height;
const dctx = done.getContext("2d"); let doneSig = "";
function drawInk(){
  const k = skey(), arr = INK[k] || [], sig = k + ":" + arr.length + ":" + (arr.length ? arr[arr.length-1].id : "") + ":" + (arr.length ? arr[0].id : "");
  if(sig !== doneSig){
    doneSig = sig;
    dctx.setTransform(1,0,0,1,0,0); dctx.clearRect(0,0,done.width,done.height);
    dctx.setTransform(2,0,0,2,0,0); arr.forEach(st=>paint(st, dctx));
  }
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,ink.width,ink.height); ctx.drawImage(done, 0, 0);
  ctx.setTransform(2,0,0,2,0,0);
  Object.values(LIVE).forEach(st=>{ if(st.k===k) paint(st); });
  if(stroke) paint(stroke);
  if(document.body.classList.contains("drawing")) buildUndoState();
}
function buildUndoState(){
  $("undoBtn").style.opacity = myLast(skey()) >= 0 ? "" : ".4";
  $("redoBtn").style.opacity = (REDO[skey()]||[]).length ? "" : ".4";
}

/* ---------- 도형 ---------- */
function sampleLine(a, b, step = 4){
  const n = Math.max(1, Math.round(Math.hypot(b[0]-a[0], b[1]-a[1]) / step)), out = [];
  for(let i=0;i<=n;i++) out.push([a[0]+(b[0]-a[0])*i/n, a[1]+(b[1]-a[1])*i/n, .5]);
  return out;
}
function polyPts(vs){ let out = []; vs.forEach((v,i)=>{ const seg = sampleLine(v, vs[(i+1)%vs.length]); out = out.concat(i ? seg.slice(1) : seg); }); return out; }
function ellipsePts(cx, cy, rx, ry){ const n = Math.max(32, Math.round((rx+ry)*.6)), out = []; for(let i=0;i<=n;i++){ const a = -Math.PI/2 + i/n*Math.PI*2; out.push([cx+rx*Math.cos(a), cy+ry*Math.sin(a), .5]); } return out; }
function bez(a, b, c, d, n = 24){ const out = []; for(let i=1;i<=n;i++){ const s = i/n, u = 1-s;
  out.push([u*u*u*a[0] + 3*u*u*s*b[0] + 3*u*s*s*c[0] + s*s*s*d[0], u*u*u*a[1] + 3*u*u*s*b[1] + 3*u*s*s*c[1] + s*s*s*d[1], .5]); } return out; }
/* 하트: 둥근 두 봉우리 + 얕게 들어간 가운데 + 아래 뾰족 (0~1 상자 기준 베지어) */
const HEART = [[.5,.97], [[.36,.86],[.03,.63],[.03,.36]], [[.03,.14],[.17,.04],[.29,.04]], [[.41,.04],[.47,.11],[.5,.21]],
               [[.53,.11],[.59,.04],[.71,.04]], [[.83,.04],[.97,.14],[.97,.36]], [[.97,.63],[.64,.86],[.5,.97]]];
function heartPts(l, t, w, h){
  const m = q=>[l + q[0]*w, t + q[1]*h]; let cur0 = m(HEART[0]), out = [[...cur0, .5]];
  for(let i=1;i<HEART.length;i++){ const [c1, c2, e] = HEART[i].map(m); out = out.concat(bez(cur0, c1, c2, e)); cur0 = e; }
  return out;
}
/* 별: 펜이면 반듯한 별. 색연필이면 한 붓 그리기 별(0→2→4→1→3→0)을 부드러운 곡선으로 —
   꼭짓점을 지나쳤다 돌아와 열린 고리가 생기고, 마지막은 시작점을 지나서 끝남, 꼭짓점·획이 살짝 흔들림 */
function catmull(pts, seg = 10){
  const out = [[...pts[0], .5]];
  for(let i=0;i<pts.length-1;i++){
    const p0 = pts[i-1] || pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2] || p2;
    for(let s=1;s<=seg;s++){ const u = s/seg, u2 = u*u, u3 = u2*u;
      out.push([.5*((2*p1[0]) + (-p0[0]+p2[0])*u + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*u2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*u3),
                .5*((2*p1[1]) + (-p0[1]+p2[1])*u + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*u2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*u3), .5]); }
  }
  return out;
}
function starPts(l, t, w, h, hand){
  const cx = l + w/2, rx = w/1.902, ry = h/1.809, cy = t + ry, s = Math.max(w, h);
  if(s < 6) return [];
  const v = [0,1,2,3,4].map(k=>{ const a = (-90 + 72*k) * Math.PI/180; return [cx + rx*Math.cos(a), cy + ry*Math.sin(a)]; });
  const J = [[.015,-.02],[-.02,.015],[.02,.02],[-.015,-.015],[.015,.01]];
  if(hand) v.forEach((q,k)=>{ q[0] += J[k][0]*s; q[1] += J[k][1]*s; });
  const order = [0,2,4,1,3,0].map(k=>v[k]);
  if(!hand){ let out = [[...order[0], .5]]; for(let i=1;i<6;i++) out = out.concat(sampleLine(order[i-1], order[i]).slice(1)); return out; }   /* 펜: 깔끔한 별 */
  const o = s*.085, bend = s*.018;
  const dir = (a, b)=>{ const dx = b[0]-a[0], dy = b[1]-a[1], L = Math.hypot(dx, dy) || 1; return [dx/L, dy/L]; };
  const d0 = dir(order[0], order[1]);
  const pts = [[order[0][0] - d0[0]*o*.4, order[0][1] - d0[1]*o*.4]];
  for(let i=1;i<=5;i++){
    const A = order[i-1], T = order[i], dIn = dir(A, T);
    const m = [(A[0]+T[0])/2 - dIn[1]*bend*(i%2 ? 1 : -1), (A[1]+T[1])/2 + dIn[0]*bend*(i%2 ? 1 : -1)];
    pts.push(m);
    if(i===5){ pts.push([T[0] + dIn[0]*o*1.5, T[1] + dIn[1]*o*1.5]); break; }   /* 마지막은 시작점을 지나서 끝 */
    const dOut = dir(T, order[i+1]);
    pts.push([T[0] + dIn[0]*o, T[1] + dIn[1]*o]);           /* 꼭짓점을 살짝 지나침 */
    pts.push([T[0] - dOut[0]*o*.9 - dIn[0]*o*.15, T[1] - dOut[1]*o*.9 - dIn[1]*o*.15]);  /* 돌아와 다음 획 시작 → 열린 고리 */
  }
  return catmull(pts);
}
/* 손으로 그린 원: 살짝 기울고, 한 바퀴보다 조금 더 돌아 끝이 바깥으로 빠짐 */
function handCircle(cx, cy, rx, ry){
  const n = Math.max(40, Math.round((rx+ry)*.7)), out = [], rot = -.12, a0 = .62*Math.PI;
  for(let i=0;i<=n;i++){
    const s = i/n * 1.1, a = a0 - s*Math.PI*2, k = .955 + .09*s;
    const x = rx*k*Math.cos(a), y = ry*k*Math.sin(a);
    out.push([cx + x*Math.cos(rot) - y*Math.sin(rot), cy + x*Math.sin(rot) + y*Math.cos(rot), .5]);
  }
  return out;
}
const circleFor = (base, cx, cy, rx, ry) => base==="pc" ? handCircle(cx, cy, rx, ry) : ellipsePts(cx, cy, rx, ry);
function shapePts(kind, x0, y0, x1, y1, base){
  const l = Math.min(x0,x1), r = Math.max(x0,x1), t = Math.min(y0,y1), b = Math.max(y0,y1), w = r-l, h = b-t;
  if(kind==="circle") return circleFor(base, (l+r)/2, (t+b)/2, w/2, h/2);
  if(kind==="star") return starPts(l, t, w, h, base==="pc");
  if(kind==="tri") return polyPts([[(l+r)/2, t], [r, b], [l, b]]);
  if(kind==="rect") return polyPts([[l,t],[r,t],[r,b],[l,b]]);
  if(kind==="heart") return heartPts(l, t, w, h);
  return [];
}
/* 꾹 누르면 정리: 열린 선 → 직선, 닫힌 모양 → 원(타원)·세모·네모 */
function rdp(pts, eps){
  if(pts.length < 3) return pts.slice();
  const [a, b] = [pts[0], pts[pts.length-1]]; let mi = 0, md = 0;
  const L = Math.hypot(b[0]-a[0], b[1]-a[1]) || 1;
  for(let i=1;i<pts.length-1;i++){ const d = Math.abs((b[0]-a[0])*(a[1]-pts[i][1]) - (a[0]-pts[i][0])*(b[1]-a[1])) / L; if(d > md){ md = d; mi = i; } }
  if(md <= eps) return [a, b];
  return rdp(pts.slice(0, mi+1), eps).slice(0, -1).concat(rdp(pts.slice(mi), eps));
}
function recognize(st){
  const p = st.pts, xs = p.map(q=>q[0]), ys = p.map(q=>q[1]);
  const l = Math.min(...xs), r = Math.max(...xs), t = Math.min(...ys), b = Math.max(...ys), size = Math.max(r-l, b-t);
  if(size < 18) return null;
  const gap = Math.hypot(p[0][0]-p[p.length-1][0], p[0][1]-p[p.length-1][1]);
  if(gap > size*.3) return {kind:"line"};
  const cx = (l+r)/2, cy = (t+b)/2, rx = Math.max(1,(r-l)/2), ry = Math.max(1,(b-t)/2);
  const err = p.reduce((s,q)=>s + Math.abs(Math.hypot((q[0]-cx)/rx, (q[1]-cy)/ry) - 1), 0) / p.length;
  if(err < .13) return {kind:"ellipse", pts:circleFor(st.t, cx, cy, rx, ry), open:st.t==="pc"};
  const ring = p.concat([p[0]]); let m = 0, md = 0;   /* 시작점에서 가장 먼 점에서 둘로 나눠 꼭짓점 찾기 */
  ring.forEach((q,i)=>{ const d = Math.hypot(q[0]-p[0][0], q[1]-p[0][1]); if(d > md){ md = d; m = i; } });
  let v = rdp(ring.slice(0, m+1), size*.12).slice(0, -1).concat(rdp(ring.slice(m), size*.12)); v = v.slice(0, -1);
  if(v.length > 1 && Math.hypot(v[0][0]-v[v.length-1][0], v[0][1]-v[v.length-1][1]) < size*.15) v = v.slice(0, -1);
  if(v.length===3 || v.length===4) return {kind:"poly", pts:polyPts(v)};
  if(err < .22) return {kind:"ellipse", pts:circleFor(st.t, cx, cy, rx, ry), open:st.t==="pc"};
  return null;
}

/* ---------- 입력 ---------- */
const SMOOTH = .42;                               /* 선 보정: 1이면 보정 없음, 작을수록 더 매끈 */
let holdT = 0, holdAt = null;
function addPt(q){
  const L = stroke.pts[stroke.pts.length-1], lp = L[2] ?? .5, qp = q[2] ?? .5;
  const s = [L[0] + (q[0]-L[0])*SMOOTH, L[1] + (q[1]-L[1])*SMOOTH, lp + (qp-lp)*SMOOTH];
  stroke.raw = q;
  if(Math.hypot(s[0]-L[0], s[1]-L[1]) >= .8) stroke.pts.push(s);
  if(!holdAt || Math.hypot(q[0]-holdAt[0], q[1]-holdAt[1]) > 4){   /* 움직이는 동안은 꾹 누르기 시간 다시 셈 */
    holdAt = q; clearTimeout(holdT);
    if(stroke.t==="pen" || stroke.t==="pc") holdT = setTimeout(snapStroke, 550);
  }
}
/* 직선은 웬만하면 가로(180°)·세로(90°)로: tol도 안쪽이면 맞춤 (90이면 늘 맞춤) */
function hv(a, q, tol){
  const dx = q[0]-a[0], dy = q[1]-a[1], ang = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);   /* 0~180 */
  const toH = Math.min(ang, 180-ang), toV = Math.abs(90-ang);
  if(toH <= toV && toH <= tol) return [q[0], a[1], q[2]];
  if(toV < toH && toV <= tol) return [a[0], q[1], q[2]];
  return q;
}
/* 밑줄: 가로선이 글자 줄의 아랫부분~바로 밑에 걸치면 그 글자 바로 밑으로 붙임 */
let TEXTR = [];
function textRects(){
  const sl = slides[cur]; if(!sl) return [];
  const sr = stage.getBoundingClientRect(), sc = sr.width/1280, out = [];
  const tw = document.createTreeWalker(sl, NodeFilter.SHOW_TEXT, {acceptNode:n=>n.nodeValue.trim() ? 1 : 2});
  const rg = document.createRange();
  for(let n; (n = tw.nextNode());){
    const pe = n.parentElement; if(!pe || getComputedStyle(pe).visibility==="hidden") continue;
    rg.selectNodeContents(n);
    for(const rc of rg.getClientRects()) if(rc.width > 2) out.push({l:(rc.left-sr.left)/sc, r:(rc.right-sr.left)/sc, t:(rc.top-sr.top)/sc, b:(rc.bottom-sr.top)/sc});
  }
  return out;
}
function underline(a, e){
  if(Math.abs(e[1]-a[1]) > .01 || Math.abs(e[0]-a[0]) < 12 || !stroke || stroke.free) return sampleLine(a, e);
  const x0 = Math.min(a[0], e[0]), x1 = Math.max(a[0], e[0]), y = a[1];
  let best = null, bd = 1e9;
  for(const r of TEXTR){
    const h = r.b - r.t, ov = Math.min(x1, r.r) - Math.max(x0, r.l);
    if(ov < 8 || y < r.t + h*.45 || y > r.b + 16) continue;   /* 글자 줄 아래쪽 절반 ~ 바로 밑 16px */
    const d = Math.abs(y - r.b); if(d < bd){ bd = d; best = r; }
  }
  if(!best) return sampleLine(a, e);
  const yy = best.b - (best.b - best.t)*.1 + stroke.w/2;
  return sampleLine([a[0], yy, .5], [e[0], yy, .5]);
}
function freeAngle(){                             /* 직선 도구: 꾹 누르고 있으면 자유 각도 */
  if(!stroke || stroke.shape!=="line" || stroke.free) return;
  stroke.free = true; toast("자유 각도로 그려요");
}
function snapStroke(){
  if(!stroke || stroke.snap || stroke.shape) return;
  const res = recognize(stroke); if(!res) return;
  if(res.kind==="line"){ stroke.snap = "line"; stroke.pts = underline(stroke.pts[0], hv(stroke.pts[0], stroke.raw || stroke.pts[stroke.pts.length-1], 15)); }
  else { stroke.snap = "shape"; stroke.closed = !res.open; stroke.pts = res.pts; }
  delete stroke.raw; drawInk(); sendLive(true);
}
function pos(e){ const r = ink.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*1280, (e.clientY-r.top)/r.height*720, e.pointerType==="pen" && e.pressure ? e.pressure : .5]; }
let lastLive = 0;
function sendLive(force){ if(conns.length && (force || Date.now()-lastLive > 40)){ lastLive = Date.now(); send({type:"live", who:ME, st:stroke}); } }
ink.addEventListener("pointerdown", e=>{
  if(e.pointerType==="touch") return;              /* 손가락·손바닥은 무시, 펜(과 마우스)으로만 판서 */
  try{ ink.setPointerCapture(e.pointerId); }catch(err){}
  const q = pos(e);
  if(tool==="laser"){ laserDown = true; laserAt(q); return; }
  const base = tool==="shape" ? drawBase : tool, k = palOf(base);
  const c = base==="er" ? "#000" : colorOf(k);
  stroke = {t:base, c, w:SIZES[base][sel[base].s], pts:[q], k:skey(), id:ME + Date.now().toString(36), o:ME};
  if(tool==="shape"){ stroke.shape = shapeKind; stroke.x0 = q[0]; stroke.y0 = q[1]; stroke.closed = shapeKind==="tri" || shapeKind==="heart" || (shapeKind==="circle" && base!=="pc"); }
  if((base==="pen" || base==="pc") && tool!=="er") TEXTR = textRects();   /* 밑줄 맞추기용 글자 위치 */
  holdAt = q; clearTimeout(holdT);
  if(stroke.shape==="line") holdT = setTimeout(freeAngle, 450);
  else if(tool!=="shape" && (base==="pen" || base==="pc")) holdT = setTimeout(snapStroke, 700);
  drawInk();
});
ink.addEventListener("pointermove", e=>{
  if(tool==="laser"){ laserAt(pos(e)); return; }
  if(!stroke) return;
  const q = pos(e);
  if(stroke.shape==="line"){
    if(!holdAt || Math.hypot(q[0]-holdAt[0], q[1]-holdAt[1]) > 4){ holdAt = q; clearTimeout(holdT); if(!stroke.free) holdT = setTimeout(freeAngle, 450); }
    const a = [stroke.x0, stroke.y0];
    stroke.pts = underline(a, stroke.free ? q : hv(a, q, 90));
  }
  else if(stroke.shape) stroke.pts = shapePts(stroke.shape, stroke.x0, stroke.y0, q[0], q[1], stroke.t);
  else if(stroke.t==="hl"){
    const [x0,y0] = stroke.pts[0]; let [x,y] = q;
    if(Math.abs(y-y0) < Math.abs(x-x0)*0.27) y = y0;
    stroke.pts = [[x0,y0],[x,y]];
  }
  else if(stroke.snap==="line") stroke.pts = underline(stroke.pts[0], hv(stroke.pts[0], q, 15));
  else if(stroke.snap) return;
  else { const ev = e.getCoalescedEvents?.() || []; (ev.length ? ev : [e]).forEach(x=>addPt(pos(x))); }
  drawInk(); sendLive();
});
const endStroke = ()=>{
  laserDown = false; clearTimeout(holdT); holdAt = null;
  if(!stroke) return;
  if(stroke.raw){                                 /* 보정 때문에 덜 따라온 끝부분을 실제 끝점까지 이어 줌 */
    const L = stroke.pts[stroke.pts.length-1], q = stroke.raw;
    for(let i=1;i<=3;i++) stroke.pts.push([L[0]+(q[0]-L[0])*i/3, L[1]+(q[1]-L[1])*i/3, L[2] ?? .5]);
    delete stroke.raw;
  }
  const keep = stroke.t==="hl" || stroke.shape ? stroke.pts.length>1 : true;   /* 형광펜·도형은 클릭만 하면 버림 */
  if(keep){ touched = true; (INK[stroke.k] ||= []).push(stroke); REDO[stroke.k] = []; send({type:"add", who:ME, st:stroke}); }
  stroke = null; drawInk();
};
ink.addEventListener("pointerup", endStroke);
ink.addEventListener("pointercancel", endStroke);
ink.addEventListener("pointerleave", ()=>{ if(tool==="laser") laserAt(null); });

function myLast(k){ const a = INK[k]||[]; for(let j=a.length-1;j>=0;j--) if(!a[j].o || a[j].o===ME) return j; return -1; }
function undoInk(){                               /* 내가 그은 마지막 획만 되돌림 */
  const k = skey(), a = INK[k]||[], j = myLast(k);
  if(j<0) return;
  const [st] = a.splice(j,1); (REDO[k] ||= []).push(st);
  send({type:"del", k, id:st.id}); drawInk();
}
function redoInk(){
  const k = skey(), r = REDO[k]||[]; if(!r.length) return;
  const st = r.pop(); (INK[k] ||= []).push(st);
  send({type:"add", who:ME, st}); drawInk();
}
function clearInk(){ const k = skey(); INK[k] = []; REDO[k] = []; send({type:"clear", k}); drawInk(); }

/* ---------- 레이저·상대 커서 ---------- */
const LASER = {};                                 /* 누구 → [{x,y,t}] */
let laserDown = false, fxOn = false, lastLaser = 0;
/* 레이저: 레이저 도구일 때 움직이기만 해도(누르지 않아도) 빨간 점이 따라오고 짧은 꼬리가 생겼다 사라짐 */
function laserAt(q){
  const a = LASER.me ||= [];
  if(!q){ LASER.me = []; send({type:"laser", who:ME, x:null}); kickFx(); return; }
  a.push({x:q[0], y:q[1], t:performance.now()});
  if(a.length > 80) a.splice(0, a.length-80);
  if(conns.length && Date.now()-lastLaser > 16){ lastLaser = Date.now(); send({type:"laser", who:ME, x:q[0], y:q[1]}); }
  kickFx();
}
function hideLaser(){ if(LASER.me && LASER.me.length){ LASER.me = []; send({type:"laser", who:ME, x:null}); kickFx(); } }
function kickFx(){ if(!fxOn){ fxOn = true; requestAnimationFrame(drawFx); } }
function drawFx(){
  const now = performance.now(), LIFE = 420;
  fctx.setTransform(1,0,0,1,0,0); fctx.clearRect(0,0,fx.width,fx.height); fctx.setTransform(2,0,0,2,0,0);
  let alive = false;
  for(const who in LASER){
    const a = LASER[who]; while(a.length > 1 && now - a[0].t > LIFE) a.shift();
    if(!a.length) continue;
    alive = true;
    const h = a[a.length-1];
    if(a.length > 1){                              /* 꼬리: 한 줄로 매끈하게, 끝으로 갈수록 투명하게 */
      const tl = a[0];
      fctx.save(); fctx.lineCap = "round"; fctx.lineJoin = "round";
      fctx.beginPath(); fctx.moveTo(tl.x, tl.y);
      for(let i=1;i<a.length-1;i++){ const mx = (a[i].x+a[i+1].x)/2, my = (a[i].y+a[i+1].y)/2; fctx.quadraticCurveTo(a[i].x, a[i].y, mx, my); }
      fctx.lineTo(h.x, h.y);
      const gr = fctx.createLinearGradient(tl.x, tl.y, h.x, h.y);
      gr.addColorStop(0, "rgba(255,40,40,0)"); gr.addColorStop(1, "rgba(255,40,40,.5)");
      fctx.strokeStyle = gr; fctx.lineWidth = 9; fctx.shadowColor = "rgba(255,0,0,.6)"; fctx.shadowBlur = 12; fctx.stroke();
      const gc = fctx.createLinearGradient(tl.x, tl.y, h.x, h.y);
      gc.addColorStop(0, "rgba(255,90,90,0)"); gc.addColorStop(1, "rgba(255,70,70,.95)");
      fctx.strokeStyle = gc; fctx.lineWidth = 3.2; fctx.shadowBlur = 0; fctx.stroke();
      fctx.restore();
    }
    fctx.save();                                   /* 머리: 빛나는 빨간 점 */
    fctx.shadowColor = "rgba(255,0,0,.9)"; fctx.shadowBlur = 18;
    fctx.fillStyle = "#ff2b2b"; fctx.beginPath(); fctx.arc(h.x, h.y, 5.5, 0, 7); fctx.fill();
    fctx.shadowBlur = 0; fctx.fillStyle = "rgba(255,235,235,.95)"; fctx.beginPath(); fctx.arc(h.x, h.y, 2.2, 0, 7); fctx.fill();
    fctx.restore();
  }
  if(alive) requestAnimationFrame(drawFx); else fxOn = false;
}
const rcur = $("rcur"); let rcurT = 0, lastCur = 0, curOut = true;
function showRcur(m){
  if(m.x==null || m.draw || m.laser){ rcur.style.display = "none"; return; }   /* 상대가 쓰는 중이거나 레이저일 땐 화살표 숨김 */
  rcur.style.display = "block"; rcur.style.left = m.x + "px"; rcur.style.top = m.y + "px";
  clearTimeout(rcurT); rcurT = setTimeout(()=>rcur.style.display = "none", 5000);
}
addEventListener("pointermove", e=>{               /* 내 커서 위치를 상대에게 (내 화면엔 표시 안 함) */
  if(!conns.length || Date.now()-lastCur < 60) return;
  lastCur = Date.now();
  const r = stage.getBoundingClientRect(), x = (e.clientX-r.left)/r.width*1280, y = (e.clientY-r.top)/r.height*720;
  const inside = x>=0 && x<=1280 && y>=0 && y<=720;
  if(!inside){ if(!curOut){ curOut = true; send({type:"cur", x:null}); } return; }
  curOut = false;
  send({type:"cur", x, y, draw:!!stroke, laser:tool==="laser" && document.body.classList.contains("drawing")});
});
document.addEventListener("mouseleave", ()=>{ if(conns.length){ curOut = true; send({type:"cur", x:null}); } });

/* ---------- 퀴즈 정답 열기 동기화 ---------- */
const QUIZ = {};                                   /* 슬라이드 이름 → {번호: 열림} */
stage.addEventListener("click", e=>{
  const q = e.target.closest(".q"); if(!q) return;
  setTimeout(()=>{                                  /* 페이지가 open을 바꾼 뒤에 읽음 */
    const sl = q.closest(".slide"), i = [...sl.querySelectorAll(".q")].indexOf(q), k = skey(slides.indexOf(sl)), open = q.classList.contains("open");
    (QUIZ[k] ||= {})[i] = open; send({type:"quiz", k, i, open});
  });
});
function applyQuiz(k, i, open){
  (QUIZ[k] ||= {})[i] = open;
  const sl = slides[indexOfKey(k)]; const q = sl && sl.querySelectorAll(".q")[i]; if(q) q.classList.toggle("open", open);
}

/* ---------- 빈 칠판 ---------- */
const BLANKS = [];                                 /* [{id, after}] 추가한 순서대로 */
const blankHTML = id => `<section class="slide blank" data-blank="${id}"><div class="bk">빈 칠판</div><div class="ft">빈 칠판<span class="pg"></span></div></section>`;
function renumber(){ slides.forEach((s,i)=>{ const p = s.querySelector(".pg"); if(p) p.textContent = `${i+1} / ${slides.length}`; }); }
function insertBlank(id, after, mine){
  if(data().some(x=>x.blank===id)) return;
  let i = indexOfKey(after); if(i<0) i = slides.length-1;
  const tmp = document.createElement("div"); tmp.innerHTML = blankHTML(id); const el = tmp.firstElementChild;
  slides[i].after(el); slides.splice(i+1, 0, el); data().splice(i+1, 0, {raw:blankHTML(id), blank:id});
  if(!BLANKS.some(b=>b.id===id)) BLANKS.push({id, after});
  if(i+1 <= cur && !mine) cur++;                 /* 앞쪽에 끼워 넣어지면 지금 보던 장 번호를 한 칸 밀기 */
  renumber();
  remoteGo = true; window.go(mine ? i+1 : cur); remoteGo = false;
}
function removeBlank(id){
  const j = data().findIndex(x=>x.blank===id); if(j<0) return;
  const k = skey(j); delete INK[k];
  slides[j].remove(); slides.splice(j,1); data().splice(j,1);
  const b = BLANKS.findIndex(x=>x.id===id); if(b>=0) BLANKS.splice(b,1);
  if(cur >= j && cur > 0) cur--;
  renumber(); remoteGo = true; window.go(Math.min(cur, slides.length-1)); remoteGo = false;
}
$("blankBtn").onclick = ()=>{
  if(!canNav()){ toast("지금은 상대만 슬라이드를 넘길 수 있어요."); return; }
  const id = Math.random().toString(36).slice(2,8), after = skey();
  insertBlank(id, after, true); send({type:"blank", id, after}); send({type:"go", k:skey()});
  if(!document.body.classList.contains("drawing")) togglePen(true);
};
/* 빈 칠판 지우기: 아래 막대에 있고(판서 중에도 누를 수 있게), 두 번 눌러야 지워짐(확인 창은 다른 사이트 화면 안에서 막힐 수 있어서 안 씀) */
let armT = 0;
function blankUI(){
  const b = $("unblankBtn"), on = !!(data()[cur] && data()[cur].blank);
  b.style.display = on ? "" : "none";
  if(!on){ b.classList.remove("arm"); b.querySelector("span").textContent = "칠판 지우기"; }
}
$("unblankBtn").onclick = ()=>{
  const b = $("unblankBtn"), x = data()[cur]; if(!x || !x.blank) return;
  if(!canNav()){ toast("지금은 상대만 슬라이드를 바꿀 수 있어요."); return; }
  if(!b.classList.contains("arm")){
    b.classList.add("arm"); b.querySelector("span").textContent = "한 번 더 누르면 지워져요";
    clearTimeout(armT); armT = setTimeout(blankUI, 3000); return;
  }
  clearTimeout(armT); const id = x.blank;
  removeBlank(id); send({type:"unblank", id}); send({type:"go", k:skey()}); blankUI();
};

/* ---------- 같이 쓰기 (PeerJS) ---------- */
const LIVE = {};
let peer = null, conns = [], isHost = false, room = "", active = false, retryT = 0, autoOpen = false;
let touched = /^#([2-9]|\d\d)/.test(location.hash), coLoaded = false, LOCK = null;
setTimeout(()=>coLoaded = true, 1500);
const connected = () => conns.some(c=>c.open);
const canNav = () => !LOCK || LOCK===CID || !connected();
function send(msg, except){ msg.from = CID; conns.forEach(c=>{ if(c!==except && c.open) try{ c.send(msg); }catch(e){} }); }
function syncMsg(){ return {type:"sync", ink:INK, k:skey(), touched, host:isHost, cid:CID, lock:LOCK, view:viewState(), quiz:QUIZ, blanks:BLANKS}; }
function apply(msg, from){
  const t = msg.type;
  if(t==="sync"){
    (msg.blanks||[]).forEach(b=>insertBlank(b.id, b.after, false));
    for(const [k, arr] of Object.entries(msg.ink||{})){
      const mine = INK[k] ||= [], ids = new Set(mine.map(s=>s.id));
      arr.forEach(s=>{ if(!ids.has(s.id)) mine.push(s); });
    }
    for(const [k, m] of Object.entries(msg.quiz||{})) for(const [i, o] of Object.entries(m)) if(o) applyQuiz(k, +i, true);
    if(LOCK && LOCK!==CID && LOCK!==msg.cid && !msg.lock) LOCK = null;   /* 주인이 사라진 잠금은 풂 */
    if(msg.lock && !LOCK) LOCK = msg.lock;
    /* 어느 화면을 따를지: 슬라이드 잠금 주인 > 이미 수업 중이던 쪽 > 방을 맡은 쪽 */
    const follow = msg.lock && msg.lock===msg.cid ? true : LOCK===CID ? false
                 : (msg.touched && (!touched || msg.host)) || (!touched && !msg.touched && msg.host);
    if(follow){ applyView(msg.view); goKey(msg.k); touched = true; }
    lockUI();
  }
  else if(t==="live"){ LIVE[msg.who] = msg.st; }
  else if(t==="add"){ delete LIVE[msg.who]; const a = INK[msg.st.k] ||= []; if(!a.some(s=>s.id===msg.st.id)) a.push(msg.st); }
  else if(t==="del"){ const a = INK[msg.k]||[]; const j = a.findIndex(s=>s.id===msg.id); if(j>=0) a.splice(j,1); }
  else if(t==="clear"){ INK[msg.k] = []; }
  else if(t==="go"){
    if(LOCK && msg.from!==LOCK){ if(LOCK===CID) send({type:"go", k:skey()}); }   /* 잠금 주인이 아니면 무시하고 내 위치로 되돌림 */
    else goKey(msg.k);
  }
  else if(t==="view"){ applyView(msg); }
  else if(t==="quiz"){ applyQuiz(msg.k, msg.i, msg.open); }
  else if(t==="lock"){ LOCK = msg.owner || null; lockUI(); toast(LOCK ? "상대가 슬라이드 넘기기를 '나만'으로 정했어요." : "이제 둘 다 슬라이드를 넘길 수 있어요."); }
  else if(t==="blank"){ insertBlank(msg.id, msg.after, false); }
  else if(t==="unblank"){ removeBlank(msg.id); }
  else if(t==="cur"){ showRcur(msg); }
  else if(t==="laser"){
    const a = LASER[msg.who] ||= [];
    if(msg.x==null) a.length = 0; else { a.push({x:msg.x, y:msg.y, t:performance.now()}); if(a.length > 80) a.splice(0, a.length-80); }
    kickFx();
  }
  if(isHost && t!=="sync") send(msg, from);
  drawInk();
}
function pid(){ let h = 5381; for(const ch of document.title) h = (h*33 ^ ch.codePointAt(0))>>>0; return `s2ionn-${h.toString(36)}-${room}`; }
const setSt = h => $("coSt").innerHTML = h;
function coStatus(){
  const n = conns.filter(c=>c.open).length;
  if(active) setSt(n ? "<b>● 연결됨</b> · 함께 쓰는 중" : isHost ? "상대가 들어오기를 기다리는 중…" : "연결하는 중…");
  $("coBtn").classList.toggle("live", n>0);
  $("coLock").style.display = n ? "" : "none";
  lockUI();
  if(n && autoOpen){ autoOpen = false; setTimeout(()=>coPanel(false), 1500); }
}
function lockUI(){
  const other = LOCK && LOCK!==CID && connected();
  document.querySelectorAll("#coLock [data-lock]").forEach(b=>{
    b.classList.toggle("on", b.dataset.lock==="both" ? !LOCK : LOCK===CID);
    b.disabled = !!other;
  });
  $("coLockSt").textContent = other ? "상대가 '나만'으로 정했어요. 상대만 넘길 수 있어요." : LOCK===CID ? "나만 슬라이드를 넘길 수 있어요." : "";
  document.querySelectorAll("#ui .nav, #blankBtn, #unblankBtn").forEach(b=>b.classList.toggle("locked", !!other));
}
document.querySelectorAll("#coLock [data-lock]").forEach(b=>b.onclick = ()=>{
  if(LOCK && LOCK!==CID) return;
  LOCK = b.dataset.lock==="me" ? CID : null;
  send({type:"lock", owner:LOCK}); lockUI();
  if(LOCK) send({type:"go", k:skey()});
});
function coPanel(open = !$("co").classList.contains("open")){ $("co").classList.toggle("open", open); }
function coUI(){
  $("coIdle").style.display = active ? "none" : "";
  $("coOn").style.display = active ? "" : "none";
  $("coCode").textContent = room;
  coStatus();
}
function loadPeer(){
  return window.Peer ? Promise.resolve() : new Promise((ok, no)=>{
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js";
    s.onload = ok; s.onerror = ()=>{ s.remove(); no(new Error("load")); }; document.head.appendChild(s);
  });
}
function dropPeer(){
  const old = conns; conns = [];
  old.forEach(c=>{ try{ c.close(); }catch(e){} });
  if(peer){ const p = peer; peer = null; try{ p.destroy(); }catch(e){} }
}
function wire(c){
  c.on("open", ()=>{ if(!conns.includes(c)) conns.push(c); c.send(syncMsg()); coStatus(); });
  c.on("data", m=>apply(m, c));
  c.on("close", ()=>{
    if(!conns.includes(c)) return;
    conns = conns.filter(x=>x!==c); Object.keys(LIVE).forEach(k=>delete LIVE[k]); Object.keys(LASER).forEach(k=>{ if(k!=="me") delete LASER[k]; });
    rcur.style.display = "none"; drawInk(); coStatus();
    if(!isHost && active){ clearTimeout(retryT); retryT = setTimeout(enter, 1000); }
  });
  c.on("error", ()=>{});
}
async function enter(){                            /* 먼저 온 쪽이 방을 맡고, 나중에 온 쪽이 붙음 */
  clearTimeout(retryT); if(!active) return;
  try{ await loadPeer(); }catch(e){ setSt("인터넷 연결을 확인해 주세요. 다시 시도하는 중…"); retryT = setTimeout(enter, 5000); return; }
  if(!active) return;
  dropPeer(); isHost = false; coStatus();
  const p = peer = new Peer(pid());
  p.on("open", ()=>{ if(p===peer){ isHost = true; coStatus(); } });
  p.on("connection", c=>{ if(p===peer) wire(c); });
  p.on("disconnected", ()=>{ if(p===peer && active) try{ p.reconnect(); }catch(e){} });
  p.on("error", err=>{
    if(p!==peer) return;
    if(err.type==="unavailable-id") join();
    else{ setSt("연결 오류 · 다시 시도하는 중…"); retryT = setTimeout(enter, 3000); }
  });
}
function join(){
  dropPeer(); isHost = false;
  const p = peer = new Peer();
  p.on("open", ()=>{
    if(p!==peer) return;
    const c = p.connect(pid(), {reliable:true}); wire(c);
    setTimeout(()=>{ if(p===peer && !c.open) enter(); }, 8000);
  });
  p.on("error", ()=>{ if(p===peer){ clearTimeout(retryT); retryT = setTimeout(enter, 2000); } });
}
function coStart(name){
  name = String(name||"").toLowerCase().replace(/[^a-z0-9]/g, "");
  if(name.length<2){ alert("방 이름은 영어나 숫자로 2글자 이상 적어 주세요."); return; }
  room = name; active = true;
  try{ localStorage.setItem("coRoom", name); }catch(e){}
  try{ const u = new URL(location.href); u.searchParams.set("room", name); history.replaceState(null, "", u); }catch(e){}
  coUI(); enter();
}
function coLeave(){
  active = false; clearTimeout(retryT); dropPeer(); isHost = false; LOCK = null;
  try{ const u = new URL(location.href); u.searchParams.delete("room"); history.replaceState(null, "", u); }catch(e){}
  coUI();
}
function coCopy(){
  const url = location.origin + location.pathname + "?room=" + room;
  const ok = ()=>{ const b = $("coCopy"); b.textContent = "복사했어요!"; setTimeout(()=>b.textContent = "수업방에 올릴 링크 복사", 1500); };
  const ask = ()=>prompt("이 링크를 복사해서 수업방에 올리세요", url);
  try{ navigator.clipboard.writeText(url).then(ok, ask); }catch(e){ ask(); }
}
$("coX").onclick = ()=>coPanel(false);
$("coGo").onclick = ()=>coStart($("coIn").value);
$("coIn").addEventListener("keydown", e=>{ e.stopPropagation(); if(e.key==="Enter") coStart(e.target.value); });
$("coLeave").onclick = coLeave;
$("coCopy").onclick = coCopy;
addEventListener("pagehide", ()=>{ if(peer) peer.destroy(); });
/* ---------- 필기 PDF 저장 : 판서를 장마다 그림으로 얹고 인쇄(→ PDF로 저장) ---------- */
let savedSig = "", prepared = false;
const inkCount = () => Object.values(INK).reduce((s,a)=>s + a.length, 0);
const inkSig = () => Object.entries(INK).map(([k,a])=>k + a.length + (a.length ? a[a.length-1].id : "")).join("|");
const unsaved = () => inkCount() > 0 && inkSig() !== savedSig;
function preparePrint(onlyInk){
  cleanupPrint();
  const cv = document.createElement("canvas"); cv.width = 2560; cv.height = 1440; const g = cv.getContext("2d");
  slides.forEach((sl,i)=>{
    const arr = INK[skey(i)] || [];
    if(!arr.length){ if(onlyInk) sl.classList.add("bd-noprint"); return; }
    g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,2560,1440); g.setTransform(2,0,0,2,0,0);
    arr.forEach(st=>paint(st, g));
    const im = new Image(); im.className = "bd-print"; im.src = cv.toDataURL("image/png"); sl.appendChild(im);
  });
  prepared = true;
}
function cleanupPrint(){
  document.querySelectorAll("img.bd-print").forEach(x=>x.remove());
  document.querySelectorAll(".slide.bd-noprint").forEach(x=>x.classList.remove("bd-noprint"));
  prepared = false;
}
addEventListener("beforeprint", ()=>{ if(!prepared) preparePrint(false); });   /* Ctrl+P로 인쇄해도 필기가 같이 나옴 */
addEventListener("afterprint", ()=>{ cleanupPrint(); savedSig = inkSig(); });
function savePdf(onlyInk){
  saveAsk(false);
  if(onlyInk && !inkCount()){ toast("아직 필기한 장이 없어요."); return; }
  preparePrint(onlyInk);
  setTimeout(()=>{ try{ window.print(); }catch(e){ cleanupPrint(); toast("이 화면에서는 인쇄가 막혀 있어요. 새 창에서 열어 저장해 주세요."); } }, 60);
}
function saveAsk(on = true, closing = false){
  $("saveAsk").classList.toggle("open", on);
  $("saveTitle").textContent = closing ? "나가기 전에 필기를 PDF로 저장할까요?" : "필기를 PDF로 저장할까요?";
  $("saveNo").textContent = closing ? "저장 안 함" : "닫기";
}
$("pdfBtn").onclick = ()=>saveAsk(true);
$("saveInk").onclick = ()=>savePdf(true);
$("saveAll").onclick = ()=>savePdf(false);
$("saveNo").onclick = ()=>{ saveAsk(false); savedSig = inkSig(); };   /* 저장 안 함 → 이번 필기로는 다시 묻지 않음 */
$("saveX").onclick = ()=>saveAsk(false);
$("saveAsk").addEventListener("click", e=>{ if(e.target.id==="saveAsk") saveAsk(false); });
/* 창을 닫거나 새로고침할 때: 저장 안 한 필기가 있으면 브라우저의 "나가시겠어요?"를 띄우고,
   머무르기를 고르면 바로 PDF 저장 창을 보여 줌 (브라우저는 닫힐 때 직접 만든 창을 띄우지 못하게 막음) */
addEventListener("beforeunload", e=>{
  if(!unsaved()) return;
  e.preventDefault(); e.returnValue = "";
  setTimeout(()=>saveAsk(true, true), 200);
});

try{ $("coIn").value = localStorage.getItem("coRoom") || ""; }catch(e){}

/* ---------- 버튼·단축키 ---------- */
$("prevBtn").onclick = ()=>window.go(cur-1);
$("nextBtn").onclick = ()=>window.go(cur+1);
$("penBtn").onclick = ()=>togglePen();
$("coBtn").onclick = ()=>coPanel();
$("koBtn").onclick = ()=>window.tg("hideKo");
$("ntBtn").onclick = ()=>window.tg("hideNt");
$("fsBtn").onclick = ()=>window.fs();
const helpOpen = (on = !$("help").classList.contains("open")) => $("help").classList.toggle("open", on);
$("helpBtn").onclick = ()=>helpOpen();
$("helpX").onclick = ()=>helpOpen(false);
$("help").addEventListener("click", e=>{ if(e.target.id==="help") helpOpen(false); });
addEventListener("keydown", e=>{
  const k = e.key;
  if(e.target.matches && e.target.matches("input, textarea")) return;
  if((e.ctrlKey||e.metaKey) && (k==="z"||k==="Z")){ e.preventDefault(); e.shiftKey ? redoInk() : undoInk(); return; }
  if((e.ctrlKey||e.metaKey) && (k==="y"||k==="Y")){ e.preventDefault(); redoInk(); return; }
  if($("help").classList.contains("open") && k==="Escape"){ helpOpen(false); return; }
  if($("saveAsk").classList.contains("open") && k==="Escape"){ saveAsk(false); return; }
  if(k==="?"){ helpOpen(); return; }
  if(k==="p"||k==="P"){ togglePen(); return; }
  if(document.body.classList.contains("drawing")){
    if(k==="e"||k==="E"){ setTool(tool==="er" ? drawBase : "er"); return; }
    if(k==="l"||k==="L"){ setTool(tool==="laser" ? drawBase : "laser"); return; }
    if(k==="Delete"){ clearInk(); return; }
    if(k==="Escape"){ togglePen(false); return; }
  }
});

buildBar(); drawInk();
const roomQ = new URLSearchParams(location.search).get("room");
if(roomQ){ autoOpen = true; coPanel(true); coStart(roomQ); }
window.Board = {VERSION, INK, REDO, QUIZ, BLANKS, setTool, togglePen, skey, recognize, rdp, get state(){ return {tool, LOCK, CID, isHost, conns:conns.length, cur}; }, sel, insertBlank};
})();
