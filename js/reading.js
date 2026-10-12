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
  const birth = r.kind === 'qimen' && r.input?.mode === 'birth';
  if (r.kind === 'qimen') { prefs.qmMode = birth ? 'birth' : 'now'; savePrefs(); }
  READ[birth ? 'qimenBirth' : r.kind] = { input: { ...r.input }, result: r.result, recName: r.name, recMemo: r.memo };
  go(r.kind, 'read');
}
function savedNote(st) {
  return st.recName ? h('p', 'panel small', `📁 ${st.recName}`, st.recMemo ? h('span', 'muted', ` — ${st.recMemo}`) : null) : '';
}

// 생년월일 칸: 양력(날짜) / 음력(년·월·일 + 윤달). 음력은 양력으로 바꿔 i.date에 넣음 (판 계산은 양력·절기로)
function birthDate(i) {
  let cal = i.cal || 'solar';
  const L = i.lunar || {};
  const solar = inp('date', i.date, { min: '1900-02-05', max: '2100-12-31' });
  const num = (v, ph, min, max) => inp('number', v, { placeholder: ph, min, max, inputMode: 'numeric' });
  const ly = num(L.y, '년', 1900, 2100), lm = num(L.m, '월', 1, 12), ld = num(L.d, '일', 1, 30);
  const leap = inp('checkbox', ''); leap.checked = !!L.leap;
  const lunar = h('div', 'row', ly, lm, ld, h('label', 'check', leap, '윤달'));
  const show = () => { solar.hidden = cal === 'lunar'; lunar.hidden = cal !== 'lunar'; };
  show();
  return {
    el: h('div', 'field birth', h('div', 'row', '생년월일', seg([['solar', '양력'], ['lunar', '음력']], cal, v => { cal = v; show(); })), solar, lunar),
    // 보기 버튼을 누를 때: 칸 값을 i로 옮기고, 못 바꾸면 이유를 돌려줌
    read() {
      i.cal = cal;
      if (cal === 'solar') { i.date = solar.value; delete i.lunar; return ''; }
      i.lunar = { y: +ly.value, m: +lm.value, d: +ld.value, leap: leap.checked };
      if (!i.lunar.y || !i.lunar.m || !i.lunar.d) { i.date = ''; return '음력 년·월·일을 모두 넣어 주세요.'; }
      const r = lunarToSolar(i.lunar.y, i.lunar.m, i.lunar.d, i.lunar.leap);
      i.date = r.date || '';
      return r.err || '';
    },
  };
}
const birthText = i => {
  const s = `양력 ${i.date.replaceAll('-', '.')}`, L = i.lunar;
  return i.cal === 'lunar' && L ? `음력 ${L.y}.${L.leap ? '윤' : ''}${pad2(L.m)}.${pad2(L.d)} (${s})` : s;
};

function renderReading(view, subj) {
  ({ myeongri: readMyeongri, liuren: readLiuren, qimen: readQimen, tarot: readTarot })[subj](view);
}

// ---------- 명리 ----------
function readMyeongri(view) {
  const st = READ.myeongri ||= { input: { date: '', time: '', male: true, unknownHour: false } };
  const i = st.input;
  const bd = birthDate(i), time = inp('time', i.time);
  const unk = inp('checkbox', ''); unk.checked = i.unknownHour;
  const sex = seg([[true, '남'], [false, '여']], i.male, v => { i.male = v; });
  const out = h('div');
  const run = () => {
    st.err = bd.read(); i.time = time.value; i.unknownHour = unk.checked;
    st.recName = null;
    draw();
  };
  function draw() {
    if (st.err) return out.replaceChildren(h('p', 'empty', `⚠️ ${st.err}`));
    if (!i.date) return out.replaceChildren(h('p', 'empty', '생년월일(양력·음력)과 태어난 시각을 넣고 원국 보기를 눌러요.'));
    const [y, m, d] = i.date.split('-').map(Number);
    if (y < 1900 || y > 2100) return out.replaceChildren(h('p', 'empty', '1900~2100년만 계산할 수 있어요.'));
    const [hh, mm] = (i.unknownHour || !i.time ? '12:00' : i.time).split(':').map(Number);
    const r = myeongriAt(y, m, d, hh, mm, i.male, timeOpt(), i.unknownHour || !i.time);
    out.replaceChildren(
      savedNote(st),
      h('div', 'panel',
        h('div', 'panel-head', h('h3', '', `${i.male ? '건명(남)' : '곤명(여)'} · ${birthText(i)} ${i.unknownHour || !i.time ? '(시 모름)' : i.time}`), h('span', 'grow'),
          button('💾 저장', () => openSave('myeongri', { ...i }, null, ''), 'btn no-print')),
        h('p', 'hint', `절입: ${r.info.jeol.name} ${fmtUtc(r.info.jeol.utcMin * 60000)} · 다음 ${r.info.nextJeol.name} ${fmtUtc(r.info.nextJeol.utcMin * 60000)}`),
        i.unknownHour || !i.time ? null : h('p', 'hint', corrNote(r.info)),
        i.unknownHour || !i.time ? null : h('p', '', button('🧭 같은 생일로 기문 명국 보기', () => { READ.qimenBirth = { input: { date: i.date, time: i.time, male: i.male, cal: i.cal, lunar: i.lunar } }; prefs.qmMode = 'birth'; savePrefs(); go('qimen', 'read'); }, 'link')),
        drawPillars(r)),
      h('p', 'hint', '💡 글자나 칸을 누르면 뜻과 용어 설명이 나와요.'),
    );
  }
  view.replaceChildren(
    h('div', 'panel no-print',
      h('div', 'form-grid', bd.el, field('태어난 시각', time), h('div', 'field', '성별', sex),
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
  const mode = prefs.qmMode === 'now' ? 'now' : 'birth'; // 기본은 명국
  const top = h('div', 'panel no-print', h('div', 'row', seg([['birth', '👤 명국 (생년월일시)'], ['now', '⏱ 시가 포국 (지금·점)']], mode, v => { prefs.qmMode = v; savePrefs(); render(); })));
  const out = h('div');
  out.style.marginTop = '12px';
  view.replaceChildren(top, out);
  if (mode === 'birth') return qimenBirth(top, out);
  const st = READ.qimen ||= { input: { ...nowInput(), question: '' } };
  const i = st.input;
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
        button('💾 저장', () => openSave('qimen', { ...i, mode: 'now' }, null, i.question), 'btn no-print')),
      i.question ? h('p', '', '❓ ', h('b', '', i.question)) : null,
      h('p', 'hint', corrNote(r.pillars)),
      drawQimen(r)),
      h('p', 'hint', '💡 연국(시가)기문 · 전반식 · 절기+부두로 국을 정해요. 홍국기문(홍국수·세·행년)은 아직 없어요.'));
  }
  top.append(
    h('div', 'form-grid', field('날짜', date), field('시각', time)),
    h('div', 'row', button('‹ 이전 시', () => step(-2), 'btn'), button('지금', () => { Object.assign(i, nowInput()); date.value = i.date; time.value = i.time; draw(); }, 'btn'), button('다음 시 ›', () => step(2), 'btn')), q);
  draw();
}
// 명국: 태어난 시각으로 포국 + 사주 네 기둥과 년·월·일·시 궁 표시
function qimenBirth(top, out) {
  const st = READ.qimenBirth ||= { input: { date: '', time: '', male: true } };
  const i = st.input;
  const bd = birthDate(i), time = inp('time', i.time);
  const sex = seg([[true, '남'], [false, '여']], i.male, v => { i.male = v; });
  function draw() {
    if (st.err) return out.replaceChildren(h('p', 'empty', `⚠️ ${st.err}`));
    if (!i.date || !i.time) return out.replaceChildren(h('p', 'empty', '생년월일(양력·음력)과 태어난 시각을 넣고 명국 보기를 눌러요. 기문 명국은 시까지 있어야 해요.'));
    const r = qimenAt(...parseDT(i), timeOpt());
    const p = r.pillars;
    out.replaceChildren(savedNote(st), h('div', 'panel',
      h('div', 'panel-head', h('h3', '', `명국 · ${i.male ? '건명(남)' : '곤명(여)'} · ${birthText(i)} ${i.time}`), h('span', 'grow'),
        button('💾 저장', () => openSave('qimen', { ...i, mode: 'birth' }, null, ''), 'btn no-print')),
      h('p', '', h('b', 'glyph', `${p.year} ${p.month} ${p.day} ${p.hour}`), h('span', 'muted', ' (년 월 일 시)'), ' ',
        button('🀄 명리 원국으로', () => { READ.myeongri = { input: { date: i.date, time: i.time, male: i.male, unknownHour: false, cal: i.cal, lunar: i.lunar } }; go('myeongri', 'read'); }, 'link')),
      h('p', 'hint', corrNote(p)),
      drawQimen(r)),
      h('p', 'hint', '💡 연국기문 명반이에요. 태어난 시각의 시가 포국에 년·월·일·시가 놓인 궁을 표시해요. 홍국기문 명반(홍국수·세·행년·대운)은 아직 없어요.'));
  }
  top.append(
    h('div', 'form-grid', bd.el, field('태어난 시각', time), h('div', 'field', '성별', sex)),
    h('div', 'row', button('명국 보기', () => { st.err = bd.read(); i.time = time.value; st.recName = null; draw(); }, 'btn primary')));
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
    delete i.ai; st.aiBusy = false; st.aiErr = '';
    show();
  };
  function show() {
    if (!st.result) return out.replaceChildren(h('p', 'empty', '스프레드를 고르고 질문을 떠올린 뒤 🃏 뽑기를 눌러요.'));
    const sp = { name: st.input.spreadName || SPREADS[i.spread].name, question: i.question, cards: st.result };
    const allOpen = st.result.every(c => !c.hidden);
    out.replaceChildren(savedNote(st), h('div', 'panel',
      h('div', 'panel-head', h('span', 'grow'),
        allOpen ? null : button('모두 뒤집기', () => { st.result.forEach(c => { c.hidden = false; }); show(); }, 'btn'),
        allOpen && !st.aiBusy && !i.ai ? button('🤖 질문에 맞춰 읽기', () => askClaude(st), 'btn no-print') : null,
        allOpen ? button('💾 저장', () => openSave('tarot', { ...i, spreadName: SPREADS[i.spread].name }, st.result.map(({ hidden, ...c }) => c), i.question), 'btn no-print') : null),
      drawSpread(sp, k => { st.result[k].hidden = false; show(); }),
      st.aiErr ? h('p', 'hint', `⚠️ ${st.aiErr}`) : null),
      allOpen && (st.aiBusy || i.ai) ? h('div', 'panel',
        h('div', 'panel-head', h('h3', '', st.aiBusy ? '🤖 Claude가 읽는 중…' : '🤖 질문에 맞춰 읽기')),
        Object.assign(h('div', 'ai-text', st.aiBusy ? st.aiText : i.ai), { id: 'aiText' })) : null,
      allOpen ? h('p', 'hint', '💡 카드를 누르면 정방향·역방향 뜻과 그림 설명이 나와요.') : null);
  }
  view.replaceChildren(
    h('div', 'panel no-print',
      h('div', 'form-grid', h('div', 'field', '스프레드', seg(Object.entries(SPREADS).map(([k, v]) => [k, `${v.name} (${v.pos.length})`]), i.spread, v => { i.spread = v; }))),
      q, h('div', 'row', button('🃏 뽑기', draw, 'btn primary')),
      h('p', 'hint', `78장에서 섞어 뽑아요. 역방향 ${prefs.tarotRev ? '켬' : '끔'} (🔧 보정에서 바꿔요).`)),
    out);
  show();
}

// ---------- 타로: Claude로 질문에 맞춰 읽기 ----------
// ⚙️에 넣은 API 키로 브라우저에서 바로 부름(서버 없음). 키는 이 브라우저 설정(localStorage)에만 있음
const TAROT_SYS = `타로를 공부하는 사람이 뽑은 카드를 그 사람의 질문에 맞춰 읽어 주세요. 결론만큼 읽는 과정을 보고 싶어 해요.

- 카드마다 한 문단: 자리의 뜻과 카드의 뜻(정·역방향)을 짚고, 그래서 이 질문에서는 무엇을 말하는지 구체적으로 써요. 문단은 "1. 과거 · 펜타클 4 역방향 —"처럼 시작해요.
- 끝에 카드들이 서로 어떻게 이어지는지 묶어 한 문단, 그리고 해 볼 만한 일 한두 가지를 써요.
- 카드 뜻은 함께 주는 앱의 풀이를 바탕으로 해요.
- 질문이 없으면 '요즘의 나'에 대한 읽기로 해요.
- 쉬운 해요체로 쓰고, 정해진 미래처럼 단정하지 말아요.
- 마크다운 기호(#, *, -, 표)는 쓰지 말고 문단 사이는 빈 줄 하나로 나눠요.`;
function tarotPrompt(st) {
  const i = st.input;
  return [`질문: ${(i.question || '').trim() || '(없음)'}`, `스프레드: ${i.spreadName || SPREADS[i.spread].name}`,
    ...st.result.map((c, k) => {
      const t = TERMS.get(c.card);
      return `\n${k + 1}. ${c.pos} — ${t.term} ${c.reversed ? '역방향' : '정방향'}\n키워드: ${t.keywords}\n뜻: ${c.reversed ? t.reversed : t.upright}`;
    })].join('\n');
}
async function askClaude(st) {
  if (!prefs.claudeKey) { toast('⚙️ 설정에 Claude API 키를 넣어 주세요', 3000); $('settingsBtn').click(); return; }
  const cards = st.result, i = st.input, ctrl = new AbortController();
  const live = () => READ.tarot === st && st.result === cards; // 다시 뽑거나 다른 판을 열면 그만둠
  const redraw = () => { if (route.subj === 'tarot' && route.sub === 'read') render(); };
  Object.assign(st, { aiBusy: true, aiText: '', aiErr: '' });
  redraw();
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctrl.signal,
      headers: {
        'content-type': 'application/json', 'x-api-key': prefs.claudeKey, 'anthropic-version': '2023-06-01',
        'anthropic-beta': 'server-side-fallback-2026-07-01', // 안전 필터에 걸리면 서버가 다른 모델로 이어서 읽음
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-opus-5-5', max_tokens: 16000, stream: true, output_config: { effort: 'medium' }, fallbacks: 'default',
        system: TAROT_SYS, messages: [{ role: 'user', content: tarotPrompt(st) }],
      }),
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => null))?.error?.message || '';
      throw new Error({ 401: 'API 키가 맞지 않아요. ⚙️에서 다시 넣어 주세요.', 429: '요청이 많아요. 조금 뒤에 다시 해 보세요.', 529: 'Claude가 붐벼요. 조금 뒤에 다시 해 보세요.' }[res.status] || `읽지 못했어요 (${res.status}) ${msg}`);
    }
    // 스트리밍(SSE): 글자가 오는 대로 화면에 붙임
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = '', stop = null;
    for (;;) {
      const { value, done } = await reader.read();
      if (!live()) return ctrl.abort();
      if (done) break;
      buf += value.replaceAll('\r', '');
      let n;
      while ((n = buf.indexOf('\n\n')) >= 0) {
        const data = buf.slice(0, n).split('\n').find(l => l.startsWith('data:'));
        buf = buf.slice(n + 2);
        const e = data ? JSON.parse(data.slice(5)) : {};
        if (e.type === 'content_block_delta' && e.delta.type === 'text_delta') st.aiText += e.delta.text;
        else if (e.type === 'message_delta') stop = e.delta.stop_reason;
        else if (e.type === 'error') throw new Error(`읽다가 끊겼어요: ${e.error.message}`);
      }
      const el = $('aiText');
      if (el) el.textContent = st.aiText;
    }
    if (stop === 'refusal') throw new Error('Claude가 이 질문은 읽지 않았어요. 질문을 바꿔 다시 해 보세요.');
    i.ai = st.aiText + (stop === 'max_tokens' ? '\n\n(길이 제한에 걸려 여기서 끊겼어요)' : '');
  } catch (e) {
    if (live()) st.aiErr = e instanceof TypeError ? '인터넷에 연결돼 있는지 확인해 주세요.' : e.message;
  } finally {
    if (live()) { st.aiBusy = false; redraw(); }
  }
}

// ---------- 🔧 보정: 과목마다 다른 계산 기준 (여러 과목에 같이 쓰는 시각 보정·야자시는 ⚙️) ----------
const CALIB_NOTES = {
  myeongri: ['해는 입춘, 달은 절입(12절) 시각으로 나눠요.', '대운: 양남음녀 순행, 음남양녀 역행. 대운수 = 절입까지(역행은 지난 절입부터) 날 수 ÷ 3, 반올림(최소 1).',
    '음력 생일은 천문연 음력표로 양력으로 바꿔서 계산해요(윤달 포함).'],
  liuren: ['귀인: 甲戊庚 丑/未 · 乙己 子/申 · 丙丁 亥/酉 · 壬癸 卯/巳 · 辛 午/寅 (주점/야점).', '귀인이 앉은 지반이 亥~辰이면 순행, 巳~戌이면 역행.',
    '섭해는 간편법(맹 → 중 → 양일은 간상·음일은 지상).', '주점·야점 "자동"은 卯~申시를 낮으로 봐요. 판마다 보기에서 바꿀 수 있어요.'],
  qimen: ['연국(시가)기문 · 전반식.', '국 정하는 법: 절기중심법(拆補法) — 그날이 든 절기와 부두(직전 甲·己일)로 상·중·하원을 정해요. 초신접기법(置閏法)은 아직 없어요.',
    '중5궁은 곤2궁에 기궁.', '팔신은 양둔·음둔 모두 직부 등사 태음 육합 백호 현무 구지 구천.', '명국의 음력 생일은 천문연 음력표로 양력으로 바꿔요(윤달 포함).'],
  tarot: ['78장을 섞어 위에서부터 자리 수만큼 뽑아요.', '역방향을 쓰면 카드마다 반반 확률로 뒤집혀요.'],
};
function renderCalib(view, subj) {
  const rev = inp('checkbox', ''); rev.checked = prefs.tarotRev;
  rev.addEventListener('change', () => { prefs.tarotRev = rev.checked; savePrefs(); });
  view.replaceChildren(
    subj === 'tarot'
      ? h('div', 'panel', h('div', 'panel-head', h('h3', '', '🃏 뽑기')), h('label', 'check', rev, '역방향 카드 쓰기'))
      : h('div', 'panel', h('div', 'panel-head', h('h3', '', '⚙️ 공통 설정'), h('span', 'grow'), button('⚙️ 바꾸기', () => $('settingsBtn').click(), 'btn')),
        h('p', '', `시각 ${prefs.correct === 'lon' ? `경도 ${prefs.lon}° 보정` : '보정 안 함'} · 야자시 ${prefs.yajasi ? '씀' : '안 씀'}`),
        h('p', 'hint', '시각 보정·야자시는 명리·육임·기문에 같이 써서 ⚙️ 설정에 있어요.')),
    h('div', 'panel', h('div', 'panel-head', h('h3', '', '📐 이 앱의 계산 기준')), h('ul', 'calib-notes', ...CALIB_NOTES[subj].map(n => h('li', '', n)))),
  );
}
