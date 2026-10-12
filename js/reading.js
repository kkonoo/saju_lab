'use strict';
// 🔮 보기: 날짜·시각을 넣어 판을 뽑음 (명리 원국 · 육임 과전 · 기문 포국 · 타로 뽑기)

const READ = {}; // 과목별 { input, result }
const nowInput = () => { const d = new Date(); return { date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`, time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}` }; };
const parseDT = i => [...i.date.split('-').map(Number), ...(i.time || '12:00').split(':').map(Number)];
const fmtDT = i => `${i.date.replaceAll('-', '.')} ${i.time}`;
function shiftHours(i, hours) {
  const [y, m, d, hh, mm] = parseDT(i);
  const t = new Date(y, m - 1, d, hh + hours, mm);
  return { ...i, date: `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`, time: `${pad2(t.getHours())}:${pad2(t.getMinutes())}` };
}
function field(label, input) { return h('label', 'field', label, input); }
function inp(type, value, attrs = {}) { return Object.assign(h('input'), { type, value: value ?? '', ...attrs }); }
function corrNote(p) {
  return prefs.correct === 'lon'
    ? `시는 ${pad2(p.local.h)}:${pad2(p.local.m)} 기준으로 나눴어요 (경도 ${prefs.lon}° 보정${prefs.yajasi ? ', 야자시' : ''}) · ⚙️에서 바꿔요`
    : `시계 시각 그대로 시를 나눴어요${prefs.yajasi ? ' (야자시)' : ''} · ⚙️에서 바꿔요`;
}
function openSavedRec(r) {
  READ[r.kind] = { input: { ...r.input }, result: r.result, recName: r.name, recMemo: r.memo };
  go(r.kind, 'read');
}
function savedNote(st) {
  return st.recName ? h('p', 'panel small', `📁 ${st.recName}`, st.recMemo ? h('span', 'muted', ` — ${st.recMemo}`) : null) : '';
}

function renderReading(view, subj) {
  ({ myeongri: readMyeongri, liuren: readLiuren, qimen: readQimen, tarot: readTarot })[subj](view);
}

// ---------- 명리 ----------
function readMyeongri(view) {
  const st = READ.myeongri ||= { input: { date: '', time: '', male: true, unknownHour: false } };
  const i = st.input;
  const date = inp('date', i.date, { min: '1900-02-05', max: '2100-12-31' }), time = inp('time', i.time);
  const unk = inp('checkbox', ''); unk.checked = i.unknownHour;
  const sex = seg([[true, '남'], [false, '여']], i.male, v => { i.male = v; });
  const out = h('div');
  const run = () => {
    i.date = date.value; i.time = time.value; i.unknownHour = unk.checked;
    st.recName = null;
    draw();
  };
  function draw() {
    if (!i.date) return out.replaceChildren(h('p', 'empty', '양력 생년월일과 태어난 시각을 넣고 원국 보기를 눌러요.'));
    const [y, m, d] = i.date.split('-').map(Number);
    if (y < 1900 || y > 2100) return out.replaceChildren(h('p', 'empty', '1900~2100년만 계산할 수 있어요.'));
    const [hh, mm] = (i.unknownHour || !i.time ? '12:00' : i.time).split(':').map(Number);
    const r = myeongriAt(y, m, d, hh, mm, i.male, timeOpt(), i.unknownHour || !i.time);
    out.replaceChildren(
      savedNote(st),
      h('div', 'panel',
        h('div', 'panel-head', h('h3', '', `${i.male ? '건명(남)' : '곤명(여)'} · 양력 ${i.date.replaceAll('-', '.')} ${i.unknownHour || !i.time ? '(시 모름)' : i.time}`), h('span', 'grow'),
          button('💾 저장', () => openSave('myeongri', { ...i }, null, ''), 'btn no-print')),
        h('p', 'hint', `절입: ${r.info.jeol.name} ${fmtUtc(r.info.jeol.utcMin * 60000)} · 다음 ${r.info.nextJeol.name} ${fmtUtc(r.info.nextJeol.utcMin * 60000)}`),
        i.unknownHour || !i.time ? null : h('p', 'hint', corrNote(r.info)),
        drawPillars(r)),
      h('p', 'hint', '💡 글자나 칸을 누르면 뜻과 용어 설명이 나와요. 음력 생일은 아직 못 넣어요(양력으로 바꿔서 넣어 주세요).'),
    );
  }
  view.replaceChildren(
    h('div', 'panel no-print',
      h('div', 'form-grid', field('생년월일 (양력)', date), field('태어난 시각', time), h('div', 'field', '성별', sex),
        h('label', 'check', unk, '시 모름')),
      h('div', 'row', button('원국 보기', run, 'btn primary'))),
    out);
  out.style.marginTop = '12px';
  draw();
}

// ---------- 육임 ----------
function readLiuren(view) {
  const st = READ.liuren ||= { input: { ...nowInput(), dayMode: 'auto', question: '' } };
  const i = st.input;
  const out = h('div');
  const q = inp('text', i.question, { placeholder: '질문 (비워 둬도 돼요)' });
  q.addEventListener('input', () => { i.question = q.value; });
  const date = inp('date', i.date), time = inp('time', i.time);
  const change = () => { i.date = date.value || nowInput().date; i.time = time.value || '12:00'; st.recName = null; draw(); };
  date.addEventListener('change', change); time.addEventListener('change', change);
  const step = n => { Object.assign(i, shiftHours(i, n)); date.value = i.date; time.value = i.time; draw(); };
  function draw() {
    const dm = i.dayMode === 'auto' ? undefined : i.dayMode === 'day';
    const r = liurenAt(...parseDT(i), timeOpt(), dm);
    out.replaceChildren(savedNote(st), h('div', 'panel',
      h('div', 'panel-head', h('h3', '', `${fmtDT(i)} · ${r.day}일 ${r.pillars.hour}시`), h('span', 'grow'),
        button('💾 저장', () => openSave('liuren', { ...i }, null, i.question), 'btn no-print')),
      i.question ? h('p', '', '❓ ', h('b', '', i.question)) : null,
      h('p', 'hint', corrNote(r.pillars)),
      drawLiuren(r)),
      h('p', 'hint', '💡 칸을 누르면 천장·육친 뜻이 나와요. 주점/야점 자동은 卯~申시를 낮으로 봐요. 귀인 표·섭해 방식은 📘 개념에 적어 두었어요.'));
  }
  view.replaceChildren(
    h('div', 'panel no-print',
      h('div', 'form-grid', field('날짜', date), field('시각', time),
        h('div', 'field', '주점·야점', seg([['auto', '자동'], ['day', '주점'], ['night', '야점']], i.dayMode, v => { i.dayMode = v; draw(); }))),
      h('div', 'row', button('‹ 이전 시', () => step(-2), 'btn'), button('지금', () => { Object.assign(i, nowInput()); date.value = i.date; time.value = i.time; draw(); }, 'btn'), button('다음 시 ›', () => step(2), 'btn')), q),
    out);
  out.style.marginTop = '12px';
  q.style.width = '100%';
  draw();
}

// ---------- 기문 ----------
function readQimen(view) {
  const st = READ.qimen ||= { input: { ...nowInput(), question: '' } };
  const i = st.input;
  const out = h('div');
  const q = inp('text', i.question, { placeholder: '질문·메모 (비워 둬도 돼요)' });
  q.addEventListener('input', () => { i.question = q.value; });
  q.style.width = '100%';
  const date = inp('date', i.date), time = inp('time', i.time);
  const change = () => { i.date = date.value || nowInput().date; i.time = time.value || '12:00'; st.recName = null; draw(); };
  date.addEventListener('change', change); time.addEventListener('change', change);
  const step = n => { Object.assign(i, shiftHours(i, n)); date.value = i.date; time.value = i.time; draw(); };
  function draw() {
    const r = qimenAt(...parseDT(i), timeOpt());
    out.replaceChildren(savedNote(st), h('div', 'panel',
      h('div', 'panel-head', h('h3', '', `${fmtDT(i)} · ${r.pillars.day}일 ${r.shi}시`), h('span', 'grow'),
        button('💾 저장', () => openSave('qimen', { ...i }, null, i.question), 'btn no-print')),
      i.question ? h('p', '', '❓ ', h('b', '', i.question)) : null,
      h('p', 'hint', corrNote(r.pillars)),
      drawQimen(r)),
      h('p', 'hint', '💡 연국(시가)기문 · 전반식 · 절기+부두로 국을 정해요. 홍국기문(홍국수·세·행년)은 아직 없어요.'));
  }
  view.replaceChildren(
    h('div', 'panel no-print',
      h('div', 'form-grid', field('날짜', date), field('시각', time)),
      h('div', 'row', button('‹ 이전 시', () => step(-2), 'btn'), button('지금', () => { Object.assign(i, nowInput()); date.value = i.date; time.value = i.time; draw(); }, 'btn'), button('다음 시 ›', () => step(2), 'btn')), q),
    out);
  out.style.marginTop = '12px';
  draw();
}

// ---------- 타로 ----------
const SPREADS = {
  one: { name: '원 카드', pos: ['오늘의 카드'] },
  three: { name: '쓰리 카드', pos: ['과거', '현재', '미래'] },
  sao: { name: '상황·장애·조언', pos: ['상황', '장애', '조언'] },
  celtic: { name: '켈틱 크로스', pos: ['현재', '가로막는 것', '바탕', '지나간 일', '목표', '가까운 미래', '태도', '환경', '바람·두려움', '결과'] },
};
function rand(n) { try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; } catch { return Math.floor(Math.random() * n); } }
function readTarot(view) {
  const st = READ.tarot ||= { input: { spread: 'three', question: '' }, result: null };
  const i = st.input;
  const q = inp('text', i.question, { placeholder: '질문 (예: 이번 달 연구는 어디에 힘을 쓸까?)' });
  q.addEventListener('input', () => { i.question = q.value; });
  q.style.width = '100%';
  const out = h('div');
  out.style.marginTop = '12px';
  const draw = () => {
    const sp = SPREADS[i.spread];
    const deck = CONTENT.tarot.terms.map(t => t.id).filter(id => /^tr-[mwcsp]\d\d$/.test(id));
    for (let k = deck.length - 1; k > 0; k--) { const j = rand(k + 1); [deck[k], deck[j]] = [deck[j], deck[k]]; }
    st.result = sp.pos.map((pos, k) => ({ pos, card: deck[k], reversed: prefs.tarotRev && rand(2) === 1, hidden: true }));
    st.recName = null;
    show();
  };
  function show() {
    if (!st.result) return out.replaceChildren(h('p', 'empty', '스프레드를 고르고 질문을 떠올린 뒤 🃏 뽑기를 눌러요.'));
    const sp = { name: st.input.spreadName || SPREADS[i.spread].name, question: i.question, cards: st.result };
    const allOpen = st.result.every(c => !c.hidden);
    out.replaceChildren(savedNote(st), h('div', 'panel',
      h('div', 'panel-head', h('span', 'grow'),
        allOpen ? null : button('모두 뒤집기', () => { st.result.forEach(c => { c.hidden = false; }); show(); }, 'btn'),
        allOpen ? button('💾 저장', () => openSave('tarot', { ...i, spreadName: SPREADS[i.spread].name }, st.result.map(({ hidden, ...c }) => c), i.question), 'btn no-print') : null),
      drawSpread(sp, k => { st.result[k].hidden = false; show(); })),
      allOpen ? h('p', 'hint', '💡 카드를 누르면 정방향·역방향 뜻과 그림 설명이 나와요.') : null);
  }
  view.replaceChildren(
    h('div', 'panel no-print',
      h('div', 'form-grid', h('div', 'field', '스프레드', seg(Object.entries(SPREADS).map(([k, v]) => [k, `${v.name} (${v.pos.length})`]), i.spread, v => { i.spread = v; }))),
      q, h('div', 'row', button('🃏 뽑기', draw, 'btn primary')),
      h('p', 'hint', `78장에서 섞어 뽑아요. 역방향 ${prefs.tarotRev ? '켬' : '끔'} (⚙️에서 바꿔요).`)),
    out);
  show();
}
