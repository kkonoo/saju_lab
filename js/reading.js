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
const qmOpt = () => ({ ...timeOpt(), ju: prefs.qmJu, gods: prefs.qmGods }); // 기문 유파 설정(🔧 보정)
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
  if (r.kind === 'myeongri') { prefs.mrMode = 'one'; savePrefs(); }
  READ[birth ? 'qimenBirth' : r.kind] = { input: { ...r.input }, result: r.result, recName: r.name, recMemo: r.memo, recId: r.id };
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
// 나이: 세는 나이 + 만 나이. 명리는 양력 해로 세고(대운 나이와 같게), 기문 홍국은 입춘 기준 해로 셈(참고 앱과 같게)
function manAge(date, today) {
  const [y, m, d] = date.split('-').map(Number), [ty, tm, td] = today.split('-').map(Number);
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
}
function ageText(i, sajuYear) {
  const t = nowInput().date;
  const se = sajuYear ? fourPillars(...parseDT({ date: t, time: '12:00' })).sajuYear - sajuYear + 1 : +t.slice(0, 4) - +i.date.slice(0, 4) + 1;
  return `${se}세 · 만 ${manAge(i.date, t)}세`;
}
const birthText = i => {
  const s = `양력 ${i.date.replaceAll('-', '.')}`, L = i.lunar;
  return i.cal === 'lunar' && L ? `음력 ${L.y}.${L.leap ? '윤' : ''}${pad2(L.m)}.${pad2(L.d)} (${s})` : s;
};

function renderReading(view, subj) {
  ({ myeongri: readMyeongri, liuren: readLiuren, qimen: readQimen, tarot: readTarot })[subj](view);
}

// ---------- 명리 ----------
function myeongriOf(i) {
  const [y, m, d] = i.date.split('-').map(Number);
  const [hh, mm] = (i.unknownHour || !i.time ? '12:00' : i.time).split(':').map(Number);
  return myeongriAt(y, m, d, hh, mm, i.male, timeOpt(), i.unknownHour || !i.time);
}
function readMyeongri(view) {
  const mode = prefs.mrMode === 'cmp' ? 'cmp' : 'one';
  const modeRow = h('div', 'row', seg([['one', '👤 원국'], ['cmp', '⚖️ 저장한 판 비교']], mode, v => { prefs.mrMode = v; savePrefs(); render(); }));
  if (mode === 'cmp') {
    const top = h('div', 'panel no-print', modeRow), out = h('div');
    out.style.marginTop = '12px';
    view.replaceChildren(top, out);
    return readCompare(top, out);
  }
  const st = READ.myeongri ||= { input: { date: '', time: '', male: true, unknownHour: false } };
  const i = st.input;
  const bd = birthDate(i), time = inp('time', i.time);
  const unk = inp('checkbox', ''); unk.checked = i.unknownHour;
  const sex = seg([[true, '남'], [false, '여']], i.male, v => { i.male = v; });
  const out = h('div');
  const run = () => {
    st.err = bd.read(); i.time = time.value; i.unknownHour = unk.checked;
    fresh(st);
    draw();
  };
  function draw() {
    if (st.err) return out.replaceChildren(h('p', 'empty', `⚠️ ${st.err}`));
    if (!i.date) return out.replaceChildren(h('p', 'empty', '생년월일(양력·음력)과 태어난 시각을 넣고 원국 보기를 눌러요.'));
    const y = +i.date.slice(0, 4);
    if (y < 1900 || y > 2100) return out.replaceChildren(h('p', 'empty', '1900~2100년만 계산할 수 있어요.'));
    const r = myeongriOf(i);
    out.replaceChildren(
      savedNote(st),
      h('div', 'panel',
        h('div', 'panel-head', h('h3', '', `${i.male ? '건명(남)' : '곤명(여)'} · ${birthText(i)} ${i.unknownHour || !i.time ? '(시 모름)' : i.time} `, h('span', 'age-note', `(${ageText(i)})`)), h('span', 'grow'),
          aiButton('myeongri', st, r), button('💾 저장', () => saveBoard(st, 'myeongri', { ...i }, null, ''), 'btn no-print')),
        h('p', 'hint', `절입: ${r.info.jeol.name} ${fmtUtc(r.info.jeol.utcMin * 60000)} · 다음 ${r.info.nextJeol.name} ${fmtUtc(r.info.nextJeol.utcMin * 60000)}`),
        i.unknownHour || !i.time ? null : h('p', 'hint', corrNote(r.info)),
        h('p', '', button(`📖 일주 ${r.pillars[2].gan}${r.pillars[2].zhi} 풀이`, () => iljuHint(r.pillars[2].gan + r.pillars[2].zhi), 'link'), i.unknownHour || !i.time ? null : ' · ',
          i.unknownHour || !i.time ? null : button('🧭 같은 생일로 기문 명국 보기', () => { READ.qimenBirth = { input: { date: i.date, time: i.time, male: i.male, cal: i.cal, lunar: i.lunar } }; prefs.qmMode = 'birth'; savePrefs(); go('qimen', 'read'); }, 'link')),
        drawPillars(r)),
      ...aiBox('myeongri', st, r),
      h('p', 'hint', '💡 글자나 칸을 누르면 뜻과 용어 설명이 나와요.'),
    );
  }
  view.replaceChildren(
    h('div', 'panel no-print', modeRow,
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
  const date = inp('date', i.date), time = inp('time', i.time);
  const change = () => { i.date = date.value || nowInput().date; i.time = time.value || '12:00'; fresh(st); draw(); };
  date.addEventListener('change', change); time.addEventListener('change', change);
  const step = n => { Object.assign(i, shiftHours(i, n)); date.value = i.date; time.value = i.time; fresh(st); draw(); };
  function draw() {
    const dm = i.dayMode === 'auto' ? undefined : i.dayMode === 'day';
    const r = liurenAt(...parseDT(i), timeOpt(), dm);
    out.replaceChildren(savedNote(st), h('div', 'panel',
      h('div', 'panel-head', h('h3', '', `${fmtDT(i)} · ${r.day}일 ${r.pillars.hour}시`), h('span', 'grow'),
        aiButton('liuren', st, r), button('💾 저장', () => saveBoard(st, 'liuren', { ...i }, null, askName(i)), 'btn no-print')),
      askText(i) ? h('p', '', '❓ ', h('b', '', askText(i))) : null,
      h('p', 'hint', corrNote(r.pillars)),
      drawLiuren(r, (part, focus) => aiPart('liuren', st, r, part, focus))),
      ...aiBox('liuren', st, r),
      h('p', 'hint', '💡 칸을 누르면 천장·육친 뜻이 나와요. 주점/야점 자동은 卯~申시를 낮으로 봐요. 귀인 표·섭해 방식은 📘 개념에 적어 두었어요.'));
  }
  view.replaceChildren(
    h('div', 'panel no-print',
      h('div', 'form-grid', field('날짜', date), field('시각', time),
        h('div', 'field', '주점·야점', seg([['auto', '자동'], ['day', '주점'], ['night', '야점']], i.dayMode, v => { i.dayMode = v; fresh(st); draw(); }))),
      h('div', 'row', button('‹ 이전 시', () => step(-2), 'btn'), button('지금', () => { Object.assign(i, nowInput()); date.value = i.date; time.value = i.time; fresh(st); draw(); }, 'btn'), button('다음 시 ›', () => step(2), 'btn')),
      askForm(i, !!askText(i))),
    out);
  out.style.marginTop = '12px';
  draw();
}

// ---------- 기문 ----------
function readQimen(view) {
  const mode = ['now', 'cmp'].includes(prefs.qmMode) ? prefs.qmMode : 'birth'; // 기본은 명국
  const top = h('div', 'panel no-print', h('div', 'row', seg([['birth', '👤 명국'], ['now', '⏱ 시가 포국'], ['cmp', '⚖️ 비교']], mode, v => { prefs.qmMode = v; savePrefs(); render(); })));
  const out = h('div');
  out.style.marginTop = '12px';
  view.replaceChildren(top, out);
  if (mode === 'birth') return qimenBirth(top, out);
  if (mode === 'cmp') return readCompare(top, out);
  const st = READ.qimen ||= { input: { ...nowInput(), question: '' } };
  const i = st.input;
  const date = inp('date', i.date), time = inp('time', i.time);
  const change = () => { i.date = date.value || nowInput().date; i.time = time.value || '12:00'; fresh(st); draw(); };
  date.addEventListener('change', change); time.addEventListener('change', change);
  const step = n => { Object.assign(i, shiftHours(i, n)); date.value = i.date; time.value = i.time; fresh(st); draw(); };
  function draw() {
    const r = qimenAt(...parseDT(i), qmOpt());
    out.replaceChildren(savedNote(st), h('div', 'panel',
      h('div', 'panel-head', h('h3', '', `${fmtDT(i)} · ${r.pillars.day}일 ${r.shi}시`), h('span', 'grow'),
        aiButton('qimen', st, r), button('💾 저장', () => saveBoard(st, 'qimen', { ...i, mode: 'now' }, null, askName(i)), 'btn no-print')),
      askText(i) ? h('p', '', '❓ ', h('b', '', askText(i))) : null,
      h('p', 'hint', corrNote(r.pillars)),
      drawQimen(r, (part, focus) => aiPart('qimen', st, r, part, focus))),
      ...aiBox('qimen', st, r),
      h('p', 'hint', '💡 연국(시가)기문 · 전반식 · 절기+부두로 국을 정해요. 홍국기문(홍국수·세·행년)은 아직 없어요.'));
  }
  top.append(
    h('div', 'form-grid', field('날짜', date), field('시각', time)),
    h('div', 'row', button('‹ 이전 시', () => step(-2), 'btn'), button('지금', () => { Object.assign(i, nowInput()); date.value = i.date; time.value = i.time; fresh(st); draw(); }, 'btn'), button('다음 시 ›', () => step(2), 'btn')),
    askForm(i, !!askText(i)));
  draw();
}
// 명국: 태어난 시각으로 포국 + 사주 네 기둥과 년·월·일·시 궁 표시. 원명국 / 年局 / 月局 / 日局 + 홍국
const QM_CHARTS = [['won', '원명국'], ['year', '年局'], ['month', '月局'], ['day', '日局']];
function luSolar(y, m, d) { // 음력 → 양력, 그 달에 30일이 없으면 29일
  const r = lunarToSolar(y, m, d);
  return r.date || lunarToSolar(y, m, 29).date;
}
function qimenBirth(top, out) {
  const st = READ.qimenBirth ||= { input: { date: '', time: '', male: true } };
  const i = st.input;
  const bd = birthDate(i), time = inp('time', i.time);
  const sex = seg([[true, '남'], [false, '여']], i.male, v => { i.male = v; });
  const today = nowInput().date, tl = solarToLunar(today) || { y: +today.slice(0, 4), m: 1 };
  // 지금 보는 판의 날짜: 年局 = 그해 음력 생월·생일·생시, 月局 = 그해 그달 + 생일·생시, 日局 = 그날 + 생시
  function chartDate() {
    const bl = (i.cal === 'lunar' && i.lunar) || solarToLunar(i.date);
    const k = st.chart || 'won';
    if (k === 'won' || !bl) return { k: 'won', date: i.date, label: '원명국' };
    if (k === 'year') { const y = st.cy ?? tl.y; return { k, date: luSolar(y, bl.m, bl.d), label: `年局 ${y}`, slot: `y${y}`, y }; }
    if (k === 'month') { const y = st.cy ?? tl.y, m = st.cm ?? tl.m; return { k, date: luSolar(y, m, bl.d), label: `月局 ${y}년 음력 ${m}월`, slot: `m${y}-${m}`, y, m }; }
    const date = st.cd ?? today;
    return { k, date, label: `日局 ${date.replaceAll('-', '.')}`, slot: `d${date}` };
  }
  const move = (fn) => { fn(); st.gen = (st.gen || 0) + 1; st.aiBusy = false; st.aiErr = ''; draw(); };
  function chartBar(cd) {
    const ctl = cd.k === 'year' ? [button('◀', () => move(() => { st.cy = cd.y - 1; }), 'btn'), h('b', '', `${cd.y} ${gz60(cd.y - 1984)}`), button('▶', () => move(() => { st.cy = cd.y + 1; }), 'btn')]
      : cd.k === 'month' ? [button('◀', () => move(() => { [st.cy, st.cm] = cd.m === 1 ? [cd.y - 1, 12] : [cd.y, cd.m - 1]; }), 'btn'), h('b', '', `${cd.y}년 음력 ${cd.m}월`), button('▶', () => move(() => { [st.cy, st.cm] = cd.m === 12 ? [cd.y + 1, 1] : [cd.y, cd.m + 1]; }), 'btn')]
      : cd.k === 'day' ? [Object.assign(inp('date', cd.date), { onchange: e => e.target.value && move(() => { st.cd = e.target.value; }) })] : [];
    return h('div', 'qm-bar no-print',
      seg(QM_CHARTS, cd.k, v => move(() => { st.chart = v; })), h('span', 'row', ...ctl),
      seg([['both', '연국+홍국'], ['yeon', '연국'], ['hong', '홍국']], prefs.qmLayer || 'both', v => { prefs.qmLayer = v; savePrefs(); draw(); }));
  }
  function chipBar(cd) { // 기본 말고 더 볼 것 (켜 둔 것은 이 브라우저에 기억)
    const layer = prefs.qmLayer || 'both', show = prefs.qmShow ||= {};
    const list = [...(layer !== 'hong' ? QM_CHIPS.yeon : []), ...(layer !== 'yeon' ? QM_CHIPS.hong.filter(([k]) => cd.k === 'won' || (k !== 'daeun' && k !== 'soun')) : [])];
    return h('div', 'chips qm-chips no-print', h('span', 'muted small', '더 보기'), ...list.map(([k, label]) => {
      const b = button(label, () => { show[k] = !show[k]; savePrefs(); draw(); }, 'chip');
      b.classList.toggle('on', !!show[k]);
      return b;
    }));
  }
  function draw() {
    if (st.err) return out.replaceChildren(h('p', 'empty', `⚠️ ${st.err}`));
    if (!i.date || !i.time) return out.replaceChildren(h('p', 'empty', '생년월일(양력·음력)과 태어난 시각을 넣고 명국 보기를 눌러요. 기문 명국은 시까지 있어야 해요.'));
    const cd = chartDate();
    st.slot = cd.slot || '';
    const r = qimenAt(...parseDT({ date: cd.date, time: i.time }), qmOpt());
    const birth = cd.k === 'won' ? r.pillars : qimenAt(...parseDT(i), qmOpt()).pillars;
    const hk = honggukCalc(r.pillars, i.male, birth.sajuYear, r.dun === '양둔');
    const thisYear = +today.slice(0, 4), won = cd.k === 'won';
    const hv = { hk, layer: prefs.qmLayer || 'both', show: prefs.qmShow || {}, thisYear, won, P: r.pillars }; // 대운·소운은 원명국에만
    if (won) { hv.years = {}; for (let y = thisYear; y < thisYear + 9; y++) hv.years[hkSoun(y, i.male)] = y; }
    if (cd.k === 'year') { // 행년 궁(중5면 곤2)과 달: 달은 월지가 속한 궁에 고정(1월 寅 간8, 2월 卯 진3 …)
      const hp = hkHaengnyeon(cd.y, i.male, birth.sajuYear);
      Object.assign(hv, { haeng: hp === 5 ? 2 : hp, haengFrom5: hp === 5, haengYear: cd.y, months: {}, nowMonth: cd.y === tl.y ? tl.m : 0 });
      for (let m = 1; m <= 12; m++) (hv.months[+Object.keys(QM_GUNG_JI).find(k => QM_GUNG_JI[k].includes(JI[(m + 1) % 12]))] ||= []).push(m);
    }
    Object.assign(r, { hk, hv, chartLabel: cd.label, chartDate: cd.k === 'won' ? '' : `양력 ${cd.date.replaceAll('-', '.')} (음력 ${(() => { const l = solarToLunar(cd.date); return l ? `${l.y}.${l.leap ? '윤' : ''}${pad2(l.m)}.${pad2(l.d)}` : '?'; })()}) ${i.time}` });
    const p = r.pillars;
    out.replaceChildren(savedNote(st), h('div', 'panel',
      h('div', 'panel-head', h('h3', '', `${won ? '명국' : cd.label} · ${i.male ? '건명(남)' : '곤명(여)'} · ${won ? `${birthText(i)} ${i.time} ` : r.chartDate}`, won ? h('span', 'age-note', `(${ageText(i, birth.sajuYear)})`) : ''), h('span', 'grow'),
        aiButton('qimenBirth', st, r), button('💾 저장', () => saveBoard(st, 'qimen', { ...i, mode: 'birth' }, null, ''), 'btn no-print')),
      won ? '' : h('p', 'hint', `생일: ${birthText(i)} ${i.time} (${ageText(i, birth.sajuYear)}) · ${{ year: '年局(身數局) — 그해의 음력 생월·생일·생시로 세운 판', month: '月局 — 그해 그달 + 음력 생일·생시로 세운 판', day: '日局 — 그날 + 생시로 세운 판' }[cd.k]}`),
      h('p', '', h('b', 'glyph', [p.year, p.month, p.day, p.hour].flatMap((gz, k) => { const t = [...gz].map(c => h('span', `oh-cell ${ohCls(c)}`, c)); return k === 2 ? [button(t, () => iljuHint(gz), 'link glyph'), ' '] : [...t, ' ']; })), h('span', 'muted', '(년 월 일 시 · 일주를 누르면 풀이)'), ' ',
        button('🀄 명리 원국으로', () => { READ.myeongri = { input: { date: i.date, time: i.time, male: i.male, unknownHour: false, cal: i.cal, lunar: i.lunar } }; prefs.mrMode = 'one'; savePrefs(); go('myeongri', 'read'); }, 'link')),
      h('p', 'hint', corrNote(p)),
      chartBar(cd), chipBar(cd),
      drawQimen(r, (part, focus) => aiPart('qimenBirth', st, r, `${st.slot}${part}`, focus), hv)),
      ...aiBox('qimenBirth', st, r),
      h('p', 'hint', '💡 연국기문 명반에 홍국을 겹쳤어요. 홍국 규칙은 참고 앱 판(남녀 원명국·年局·日局)과 맞췄어요. 홍국 팔문·태을구성·강약·기의백격은 아직 없어요.'));
  }
  top.append(
    h('div', 'form-grid', bd.el, field('태어난 시각', time), h('div', 'field', '성별', sex)),
    h('div', 'row', button('명국 보기', () => { st.err = bd.read(); i.time = time.value; fresh(st); draw(); }, 'btn primary')));
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
  const out = h('div');
  out.style.marginTop = '12px';
  const draw = () => {
    const sp = SPREADS[i.spread];
    const deck = CONTENT.tarot.terms.map(t => t.id).filter(id => /^tr-[mwcsp]\d\d$/.test(id));
    for (let k = deck.length - 1; k > 0; k--) { const j = rand(k + 1); [deck[k], deck[j]] = [deck[j], deck[k]]; }
    st.result = sp.pos.map((pos, k) => ({ pos, card: deck[k], reversed: prefs.tarotRev && rand(2) === 1, hidden: true }));
    fresh(st);
    i.drawnAt = nowInput().date;
    show();
  };
  function show() {
    if (!st.result) return out.replaceChildren(h('p', 'empty', '스프레드를 고르고 질문을 떠올린 뒤 🃏 뽑기를 눌러요.'));
    const sp = { name: st.input.spreadName || SPREADS[i.spread].name, question: askText(i), cards: st.result };
    const allOpen = st.result.every(c => !c.hidden);
    out.replaceChildren(savedNote(st), h('div', 'panel',
      h('div', 'panel-head', h('span', 'grow'),
        allOpen ? null : button('모두 뒤집기', () => { st.result.forEach(c => { c.hidden = false; }); show(); }, 'btn'),
        allOpen ? aiButton('tarot', st, st.result) : null,
        allOpen ? button('💾 저장', () => saveBoard(st, 'tarot', { ...i, spreadName: SPREADS[i.spread].name }, st.result.map(({ hidden, ...c }) => c), askName(i)), 'btn no-print') : null),
      drawSpread(sp, k => { st.result[k].hidden = false; show(); })),
      ...(allOpen ? aiBox('tarot', st, st.result) : []),
      allOpen ? h('p', 'hint', '💡 카드를 누르면 정방향·역방향 뜻과 그림 설명이 나와요.') : '');
  }
  view.replaceChildren(
    h('div', 'panel no-print',
      h('div', 'form-grid', h('div', 'field', '스프레드', seg(Object.entries(SPREADS).map(([k, v]) => [k, `${v.name} (${v.pos.length})`]), i.spread, v => { i.spread = v; }))),
      askForm(i, true), h('div', 'row', button('🃏 뽑기', draw, 'btn primary')),
      h('p', 'hint', `78장에서 섞어 뽑아요. 역방향 ${prefs.tarotRev ? '켬' : '끔'} (🔧 보정에서 바꿔요).`)),
    out);
  show();
}

// ---------- 질문 칸 (타로·육임·기문 시가): 종류 · 날짜 · 기간 · 상대 · 상황 + 세부 질문. 다 안 넣어도 돼요 ----------
const ASK_KINDS = { // [이모지, 이름, 자주 하는 질문]
  love: ['💕', '연애', ['그 사람은 나를 어떻게 생각할까?', '이 관계는 앞으로 어떻게 될까?', '다시 연락이 올까?', '새 인연은 언제 올까?']],
  work: ['💼', '일·직장', ['이직해도 될까?', '이 일은 잘 풀릴까?', '면접 결과는 어떨까?', '지금 일에서 무엇에 힘을 쓸까?']],
  study: ['📚', '시험·공부', ['이번 시험에 붙을까?', '어디에 힘을 쓰면 좋을까?', '공부 방법을 바꿔야 할까?']],
  money: ['💰', '돈', ['이번 투자는 괜찮을까?', '돈이 들어올 때는 언제일까?', '어디서 새는 돈을 막아야 할까?']],
  people: ['🤝', '사람', ['이 사람과 잘 지내려면?', '이 갈등은 풀릴까?', '이 사람을 믿어도 될까?']],
  health: ['🌿', '건강', ['요즘 몸에서 조심할 곳은?', '생활에서 바꿀 것은?']],
  choice: ['🔀', '선택', ['A와 B 중 무엇이 나을까?', '지금 시작해도 될까?', '기다리는 게 나을까?']],
  flow: ['🌤', '흐름', ['이번 달 흐름은 어떨까?', '지금 나에게 필요한 것은?', '올해 조심할 것은?']],
};
const ASK_PERIODS = ['오늘', '이번 주', '이번 달', '3개월', '올해'];
// 하나 고르기 칩 (다시 누르면 풀림)
function pick(items, value, onPick) {
  const box = h('div', 'chips');
  for (const [v, label] of items) {
    const b = button(label, () => { const on = !b.classList.contains('on'); for (const x of box.children) x.classList.remove('on'); b.classList.toggle('on', on); onPick(on ? v : ''); }, 'chip');
    b.classList.toggle('on', v === value);
    box.append(b);
  }
  return box;
}
function askForm(i, open) {
  const a = i.ask ||= {};
  const q = inp('text', i.question, { placeholder: '안 써도 돼요. 아래 자주 하는 질문을 눌러도 돼요' });
  q.addEventListener('input', () => { i.question = q.value; });
  const text = (key, ph) => { const e = inp('text', a[key], { placeholder: ph }); e.addEventListener('input', () => { a[key] = e.value.trim(); }); return e; };
  const date = inp('date', a.date);
  date.addEventListener('change', () => { a.date = date.value; });
  const faq = h('div', 'chips');
  const showFaq = () => faq.replaceChildren(...(ASK_KINDS[a.kind]?.[2] || []).map(t => button(t, () => { q.value = i.question = t; }, 'chip')));
  showFaq();
  const box = h('details', 'ask', h('summary', '', '❓ 질문 (다 안 넣어도 돼요)'),
    h('div', 'field', '종류', pick(Object.entries(ASK_KINDS).map(([k, [e, n]]) => [k, `${e} ${n}`]), a.kind, v => { a.kind = v; showFaq(); })),
    h('div', 'field', '기간', pick(ASK_PERIODS.map(p => [p, p]), a.period, v => { a.period = v; })),
    h('div', 'form-grid', field('날짜 (시험·면접·약속 날)', date), field('상대', text('who', '예: 썸 상대, 팀장님')), field('상황', text('situation', '예: 연락이 뜸해졌어요'))),
    field('세부 질문', q), faq);
  box.open = open;
  return box;
}
// 질문 한 줄: "📚 시험·공부 · 2026-11-15 · 이번 달 — 이번 시험에 붙을까?"
function askText(i) {
  const a = i.ask || {}, k = ASK_KINDS[a.kind];
  const tags = [k && `${k[0]} ${k[1]}`, a.date, a.period, a.who && `상대: ${a.who}`, a.situation].filter(Boolean).join(' · ');
  return [tags, (i.question || '').trim()].filter(Boolean).join(' — ');
}
const askName = i => ((i.question || '').trim() || askText(i)).slice(0, 60); // 저장할 때 이름 칸에 미리 넣을 것

// ---------- 🤖 Claude로 읽기 ----------
// ⚙️에 넣은 API 키로 브라우저에서 바로 부름(서버 없음). 키는 이 브라우저 설정(localStorage)에만 있음
// 판이 바뀌면(새로 뽑기·날짜 바꾸기) 지난 읽기는 지우고, 받는 중이던 읽기는 버림
function fresh(st) { st.gen = (st.gen || 0) + 1; delete st.input.ai; delete st.input.aiParts; delete st.input.aiCharts; st.aiBusy = false; st.aiErr = ''; st.recName = null; st.recId = null; }

const AI_RULES = `
- 앱이 계산해 준 판 값을 그대로 쓰고 다시 계산하지 말아요.
- 공부하는 사람이 따라 읽을 수 있게, 결론만큼 읽는 과정(어느 칸의 무엇을 보고 그렇게 읽는지)을 보여 줘요.
- 쉬운 해요체로 쓰고, 정해진 미래처럼 단정하지 말아요.
- 마크다운 기호(#, *, -, 표)는 쓰지 말고 문단 사이는 빈 줄 하나로 나눠요.
- 용어는 처음 나올 때 한글(한자)로 써요. 예: 개문(開門), 천임(天任), 부(父)·인수.`;
const ASK_RULE = `
- 질문은 [질문] 칸에 넣은 것만 와요. 세부 질문이 없으면 종류·날짜·기간·상대·상황으로 무엇을 묻는지 짐작해 읽고, 아무것도 없으면 '요즘의 나'로 읽어요.`;
// 질문 칸 → 글
function askLines(i) {
  const a = i.ask || {};
  return ['[질문]', a.kind && `종류: ${ASK_KINDS[a.kind][1]}`, a.date && `날짜: ${a.date}`, a.period && `기간: ${a.period}`,
    a.who && `상대: ${a.who}`, a.situation && `상황: ${a.situation}`, `세부 질문: ${(i.question || '').trim() || '(없음)'}`].filter(Boolean).join('\n');
}
// 판 → 글 (과목마다)
function myeongriText(i, r) {
  const yr = +nowInput().date.slice(0, 4), s = seun(yr, r.dayGan);
  return [`${i.male ? '남(건명)' : '여(곤명)'} · ${birthText(i)} ${r.unknownHour ? '(시 모름)' : i.time} · 오늘 ${nowInput().date}`,
    '[원국]', ...r.pillars.map(p => `${p.pos}주 ${p.gan}${p.zhi}: 천간 ${p.gan}(${p.ganSs}) · 지지 ${p.zhi}(${p.zhiSs}) · 지장간 ${p.jjg.map(j => `${j.g}(${j.ss})`).join(' ')} · 12운성 ${p.unseong}`),
    `오행 개수: ${Object.entries(r.count).map(([k, v]) => `${OH_KO[k]} ${v}`).join(' ')}`,
    `합충: ${r.relations.map(x => x.text).join(', ') || '없음'} · 공망: ${r.kong.join('')}`,
    `[대운] ${r.forward ? '순행' : '역행'}, 대운수 ${r.daeunsu}: ${r.daeun.map(d => `${d.age}세 ${d.gz}(${d.ganSs}/${d.zhiSs}, ${d.unseong})`).join(' · ')}`,
    `[올해 세운] ${s.year} ${s.gz}(${s.ganSs}/${s.zhiSs}, ${s.unseong})`].join('\n');
}
function hongText(hk, r) {
  const yr = q => r.hv?.years?.[q] ? ` · ${r.hv.years[q]}년 소운` : '', won = r.hv?.won;
  return [`[홍국] 천반수 / 육친${won ? ' / 대운' : ''} · 지반수 / 육친${won ? ' / 대운' : ''} · 유년 · 12운성 · 형충 · 신살`,
    '육친 다른 이름: 父=부모·인수(인성), 兄=형제·비겁, 孫=자손·식상, 財=처재·재성, 官=정관, 鬼=편관·칠살',
    `중궁 ${HK_GUK_KO[hk.guk]}(${hk.guk}): 천반 ${hk.ch}(${hk.palaces[5].relH}) · 지반 ${hk.ce}(${hk.palaces[5].relE}) · 世 ${QM_GUNG[hk.se]}(지반수 ${hk.seNum}) · 일공 ${hk.kongDay.join('')}`,
    ...[1, 2, 3, 4, 6, 7, 8, 9, 5].map(q => {
      const x = hk.palaces[q];
      return `${QM_GUNG[q]}: 천${x.heaven}/${x.relH}${won ? `/${x.daeun.heaven.join('~')}세` : ''} · 지${x.earth}/${x.relE}${won ? `/${x.daeun.earth.join('~')}세` : ''}${x.yunyeon ? ` · ${x.yunyeon}` : ''}${x.unseong.length ? ` · ${x.unseong.map(u => u.z + u.u).join(' ')}` : ''}${x.label ? ` · ${x.label}` : ''}${x.sinsal.length ? ` · 신살 ${x.sinsal.map(t => (t.fu ? '伏' : '') + t.name).join(' ')}` : ''}${yr(q)}`;
    }),
    won ? `소운: 올해 ${new Date().getFullYear()}년은 ${QM_GUNG[hkSoun(new Date().getFullYear(), hk.male)]}` : '',
    r.hv?.haeng ? `행년(${r.hv.haengYear}): ${QM_GUNG[r.hv.haeng]}` : ''].filter(Boolean).join('\n');
}
function qimenText(r) {
  const m = r.marks, p = r.pillars;
  return [`사주 ${p.year} ${p.month} ${p.day} ${p.hour} (년 월 일 시)`,
    `${r.term} ${r.yuan}(부두 ${r.futou}) · ${r.dun} ${r.ju}국 · 시 ${r.shi} · 순수 ${r.xun}(부의 ${r.fuYi}) · 직부 ${r.zhifu} → ${QM_GUNG[r.zhifuTo]} · 직사 ${r.zhishi} → ${QM_GUNG[r.zhishiTo]} · 공망 ${r.kong.join('')}`,
    '[9궁] 천반 / 지반 / 구성 / 팔문 / 팔신 / 사주 표시(년·월·일·시의 천간이 지반에 든 궁, 지지가 속한 궁)',
    ...Object.entries(r.palaces).map(([n, c]) => `${QM_GUNG[n]}: ${c.heaven || '-'} / ${c.earth || '-'} / ${c.star || '-'} / ${c.door || '-'} / ${c.god || '-'}` +
      (m[n] ? ` / ${[m[n].gan.length && `천간 ${m[n].gan.join('·')}`, m[n].ji.length && `지지 ${m[n].ji.join('·')}`].filter(Boolean).join(', ')}` : '')), r.hk ? hongText(r.hk, r) : ''].filter(Boolean).join('\n');
}
function liurenText(i, r) {
  const p = r.pillars;
  return [`점친 시각 ${fmtDT(i)} · 사주 ${p.year} ${p.month} ${p.day} ${p.hour}`,
    `월장 ${r.woljang}(${r.junggi}) · ${r.daynight} · 귀인 ${r.gui}(지반 ${r.guiOn}에 앉아 ${r.guiDir}) · 공망 ${r.kong.join('')}`,
    `천지반(지반 위 천반): ${[...JI].map(z => `${z}↑${r.plate[z]}`).join(' ')}`,
    `천장(천반 기준): ${Object.entries(r.jiang).map(([z, n]) => `${z} ${n}`).join(' · ')}`,
    `사과: ${r.ke.map(k => `${k.n}과 ${k.down} 위 ${k.up}(${k.jiang}, 둔간 ${k.dun || '-'})`).join(' / ')}`,
    `과체: ${r.method} — ${r.how}`,
    `삼전: ${r.san.map(s => `${s.name} ${s.zhi}(${s.rel}, ${s.jiang}, 둔간 ${s.dun || '-'}${s.kong ? ', 공망' : ''})`).join(' / ')}`].join('\n');
}
const AI = { // 과목별: 버튼 이름, 읽는 법, 판 → 글, 질문 칸을 쓰는지
  tarot: { label: '질문에 맞춰 읽기', ask: true,
    sys: `타로를 공부하는 사람이 뽑은 카드를 질문에 맞춰 읽어 주세요.
- 카드마다 한 문단: 자리의 뜻과 카드의 뜻(정·역방향)을 짚고, 그래서 이 질문에서는 무엇을 말하는지 구체적으로 써요. 문단은 "1. 과거 · 펜타클 4 역방향 —"처럼 시작해요.
- 끝에 카드들이 서로 어떻게 이어지는지 묶어 한 문단, 그리고 해 볼 만한 일 한두 가지를 써요.
- 카드 뜻은 함께 주는 앱의 풀이를 바탕으로 해요.`,
    text: (i, cards) => [`뽑은 날 ${i.drawnAt || nowInput().date} · 스프레드: ${i.spreadName || SPREADS[i.spread].name}`, ...cards.map((c, k) => {
      const t = TERMS.get(c.card);
      return `\n${k + 1}. ${c.pos} — ${t.term} ${c.reversed ? '역방향' : '정방향'}\n키워드: ${t.keywords}\n뜻: ${c.reversed ? t.reversed : t.upright}`;
    })].join('\n') },
  liuren: { label: '질문에 맞춰 읽기', ask: true,
    sys: `대육임을 공부하는 사람이 뽑은 과전을 질문에 맞춰 읽어 주세요.
- 먼저 질문 종류에 맞춰 무엇을 용신(볼 자리)으로 삼는지 근거와 함께 짧게 정해요.
- 순서: 과체(어떤 과이고 무슨 뜻인지) → 사과(일간은 나, 일지는 상대·일로 보고 간상·지상의 생극) → 삼전 초전·중전·말전의 흐름(육친·천장·둔간·공망) → 질문에 대한 정리와 해 볼 일.`,
    text: liurenText },
  qimen: { label: '질문에 맞춰 읽기', ask: true,
    sys: `연국(시가)기문을 공부하는 사람이 뽑은 시가 포국을 질문에 맞춰 읽어 주세요.
- 일간이 든 궁을 나, 시간이 든 궁을 묻는 일로 보고, 질문 종류에 맞춰 무엇을 용신으로 볼지 근거와 함께 먼저 정해요.
- 그 궁들의 팔문·구성·팔신·천반·지반, 궁끼리의 생극, 직부·직사, 공망을 짚어요.
- 끝에 질문에 대한 정리와 해 볼 일을 써요.`,
    text: (i, r) => `점친 시각 ${fmtDT(i)}\n${qimenText(r)}` },
  myeongri: { label: '해석하기',
    sys: `명리를 공부하는 사람에게 이 사주 원국을 풀어 주세요.
- 순서: 일간과 월령으로 본 강약(근거) → 오행 분포(많고 적은 것) → 십신 배치로 본 성향(일·사람·돈) → 합충·공망 → 지금 대운과 올해 세운의 흐름 → 정리.
- 용신·격국은 하나로 단정하지 말고 후보와 근거를 말해요.`,
    text: myeongriText },
  qimenBirth: { label: '해석하기',
    sys: `연국기문을 공부하는 사람에게 이 명국(태어난 시각의 시가 포국)을 풀어 주세요.
- 일간이 든 궁(나)을 중심으로 그 궁의 팔문·구성·팔신·천반·지반을 짚고, 년·월·시 간지가 든 궁과의 관계, 직부·직사, 공망을 봐요.
- 끝에 성향·강점·조심할 점을 정리해요.`,
    text: (i, r) => `${r.chartLabel && r.chartDate ? `[${r.chartLabel}] ${r.chartDate} — 이 사람의 그 시기 운을 보는 판이에요. 홍국 世·육친도 이 판 기준이에요.\n` : ''}${i.male ? '남(건명)' : '여(곤명)'} · ${birthText(i)} ${i.time}\n${qimenText(r)}` },
  compare: { label: '비교해서 읽기',
    sys: `명리·기문을 공부하는 사람이 저장한 판 둘(A, B)을 비교하려고 해요.
- 같은 사람(생년월일시·성별이 같음)의 명리 원국과 기문 명국이면: 같은 사주를 두 체계가 어떻게 다르게 보는지 개념마다 짚어요(일간과 나의 자리, 오행·십신 대 궁의 팔문·구성·팔신, 공망을 일주 순과 시주 순으로 잡는 차이, 대운 등). 두 체계가 같은 말을 하는 곳과 엇갈리는 곳을 정리해요.
- 다른 두 사람이면: 같은 항목끼리 나란히 놓고 공통점과 차이, 두 사람이 서로 어떻게 맞물리는지(일간·오행·합충, 기문이면 서로의 일간 궁)를 짚어요.
- 같은 사람의 같은 판이면 그렇다고 말하고 그 판을 짧게 정리해요.`,
    text: (i, pair) => {
      const [x, y] = pair.map(({ rec }) => rec.input);
      const same = x.date === y.date && x.time === y.time && x.male === y.male;
      return [`같은 사람(생년월일시·성별 같음): ${same ? '예' : '아니오'}`, ...pair.map(({ rec, r }, k) =>
        `[${'AB'[k]}: ${rec.name} · ${rec.kind === 'myeongri' ? '명리 원국' : '기문 명국'}]\n${rec.kind === 'myeongri' ? myeongriText(rec.input, r) : AI.qimenBirth.text(rec.input, r)}`)].join('\n\n');
    } },
};
// 판 머리의 🤖 버튼(읽기 전에만)과 판 아래 결과 칸
const aiGet = st => (st.slot ? st.input.aiCharts?.[st.slot] : st.input.ai);
function aiButton(key, st, board) {
  return !st.aiBusy && !aiGet(st) ? button(`🤖 ${AI[key].label}`, () => askClaude(key, st, board), 'btn no-print') : null;
}
function aiBox(key, st, board) {
  const text = aiGet(st);
  const body = Object.assign(h('div', 'ai-text', st.aiBusy ? st.aiText : text), { id: 'aiText' });
  body.hidden = !st.aiBusy && !!st.aiFold;
  const fold = button(st.aiFold ? '펼치기' : '접기', () => { st.aiFold = !st.aiFold; body.hidden = st.aiFold; fold.textContent = st.aiFold ? '펼치기' : '접기'; }, 'btn no-print');
  return [
    st.aiErr ? h('p', 'hint', `⚠️ ${st.aiErr}`) : null,
    st.aiBusy || text ? h('div', 'panel',
      h('div', 'panel-head', h('h3', '', st.aiBusy ? '🤖 Claude가 읽는 중…' : `🤖 ${AI[key].label}`), h('span', 'grow'),
        st.aiBusy ? null : button('🔄 다시', () => askClaude(key, st, board), 'btn no-print'),
        st.aiBusy ? null : button('🗑 지우기', () => clearAI(st), 'btn no-print'), st.aiBusy ? null : fold),
      body) : null,
  ].filter(Boolean); // replaceChildren에 null을 넘기면 "null" 글자가 찍힘
}
// 🤖 읽은 글 지우기 (저장한 판이면 거기서도 지움)
function clearAI(st, part) {
  if (!confirm('이 AI 읽기를 지울까요?')) return false;
  const i = st.input;
  if (part) delete i.aiParts?.[part];
  else if (st.slot) delete i.aiCharts?.[st.slot];
  else delete i.ai;
  rememberAI(st);
  if (!part && route.sub === 'read') render();
  return true;
}
// Claude 한 번 부르기 (스트리밍): 글자가 올 때마다 onText(지금까지 글), live()가 거짓이 되면 그만둠
async function claudeStream({ sys, content, onText, live = () => true }) {
  const ctrl = new AbortController();
  let text = '', stop = null;
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
        system: sys, messages: [{ role: 'user', content }],
      }),
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => null))?.error?.message || '';
      throw new Error({ 401: 'API 키가 맞지 않아요. ⚙️에서 다시 넣어 주세요.', 429: '요청이 많아요. 조금 뒤에 다시 해 보세요.', 529: 'Claude가 붐벼요. 조금 뒤에 다시 해 보세요.' }[res.status] || `읽지 못했어요 (${res.status}) ${msg}`);
    }
    // 스트리밍(SSE): 글자가 오는 대로 붙임
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (!live()) { ctrl.abort(); return { aborted: true }; }
      if (done) break;
      buf += value.replaceAll('\r', '');
      let n;
      while ((n = buf.indexOf('\n\n')) >= 0) {
        const data = buf.slice(0, n).split('\n').find(l => l.startsWith('data:'));
        buf = buf.slice(n + 2);
        const e = data ? JSON.parse(data.slice(5)) : {};
        if (e.type === 'content_block_delta' && e.delta.type === 'text_delta') text += e.delta.text;
        else if (e.type === 'message_delta') stop = e.delta.stop_reason;
        else if (e.type === 'error') throw new Error(`읽다가 끊겼어요: ${e.error.message}`);
      }
      onText(text);
    }
    if (stop === 'refusal') throw new Error('Claude가 이 판은 읽지 않았어요. 질문을 바꿔 다시 해 보세요.');
    return { text: text + (stop === 'max_tokens' ? '\n\n(길이 제한에 걸려 여기서 끊겼어요)' : '') };
  } catch (e) {
    return { err: e instanceof TypeError ? '인터넷에 연결돼 있는지 확인해 주세요.' : e.message };
  }
}
const needKey = () => { if (prefs.claudeKey) return false; toast('⚙️ 설정에 Claude API 키를 넣어 주세요', 3000); $('settingsBtn').click(); return true; };
// 저장한 판(열어 둔 것이든 방금 저장한 것이든)이면 🤖 읽기를 그 판에 바로 기억시킴 — 다시 💾 안 눌러도 됨
function rememberAI(st) {
  const rec = st.recId && db.recs.find(r => r.id === st.recId && !r.deleted);
  if (!rec) return;
  Object.assign(rec.input, { ai: st.input.ai, aiParts: st.input.aiParts, aiCharts: st.input.aiCharts });
  rec.updatedAt = Date.now();
  persist();
}
// 💾 저장 → 저장된 판과 지금 판을 이어 둠(그 뒤 🤖 읽기도 그 판에 기억)
function saveBoard(st, kind, input, result, name) {
  openSave(kind, input, result, name, rec => { st.recId = rec.id; st.recName = rec.name; });
}
async function askClaude(key, st, board) {
  if (needKey()) return;
  const conf = AI[key], i = st.input, gen = st.gen, slot = st.slot;
  const live = () => READ[key] === st && st.gen === gen; // 판이 바뀌거나 다른 판을 열면 그만둠
  const redraw = () => { if (route.sub === 'read') render(); };
  Object.assign(st, { aiBusy: true, aiText: '', aiErr: '' });
  redraw();
  const r = await claudeStream({
    sys: conf.sys + AI_RULES + (conf.ask ? ASK_RULE : ''),
    content: [conf.text(i, board), conf.ask ? askLines(i) : ''].filter(Boolean).join('\n\n'),
    live, onText: t => { st.aiText = t; const el = $('aiText'); if (el) el.textContent = t; },
  });
  if (r.aborted || !live()) return;
  if (r.err) st.aiErr = r.err; else { if (slot) (i.aiCharts ||= {})[slot] = r.text; else i.ai = r.text; rememberAI(st); }
  st.aiBusy = false;
  redraw();
}
// 칸 하나 해석 (칸 설명 창 안에서): 판 전체는 참고로 주고 그 칸에 집중
const PART_SUBJ = { qimenBirth: '기문 명국', qimen: '기문 시가 포국', liuren: '대육임 과전' };
function aiPart(key, st, board, part, focus) {
  const conf = AI[key], i = st.input, el = h('div', 'ai-part');
  const show = () => {
    if (!i.aiParts?.[part]) return el.replaceChildren(button('🤖 이 칸 해석하기', run, 'btn'));
    const text = h('div', 'ai-text', i.aiParts[part]);
    const fold = button('접기', () => { text.hidden = !text.hidden; fold.textContent = text.hidden ? '펼치기' : '접기'; }, 'btn');
    el.replaceChildren(h('div', 'row', h('b', '', '🤖 이 칸 읽기'), h('span', 'grow'), button('🔄 다시', run, 'btn'), button('🗑 지우기', () => clearAI(st, part) && show(), 'btn'), fold), text);
  };
  async function run() {
    if (needKey()) return;
    const gen = st.gen, out = h('div', 'ai-text', '🤖 Claude가 읽는 중…');
    el.replaceChildren(out);
    const r = await claudeStream({
      sys: `${PART_SUBJ[key]}을 공부하는 사람이 판의 한 칸을 눌렀어요. 판 전체를 참고로 주니 [읽을 칸] 하나에 집중해 풀어 주세요.
- 그 칸에 있는 것(글자·별·문·신·표시 등)이 각각 무슨 뜻인지 짚고, 서로 어떻게 맞물리는지 말해요.
- 그래서 이 판에서 이 칸이 무엇을 말하는지(명국이면 그 사람에게, 점이면 그 질문에) 정리해요.
- 다른 칸은 이 칸과 바로 이어질 때만 짧게 말하고, 3~5문단으로 짧게 써요.` + AI_RULES + (conf.ask ? ASK_RULE : ''),
      content: [conf.text(i, board), conf.ask ? askLines(i) : '', `[읽을 칸]\n${focus}`].filter(Boolean).join('\n\n'),
      live: () => READ[key] === st && st.gen === gen, onText: t => { out.textContent = t; },
    });
    if (r.aborted || READ[key] !== st || st.gen !== gen) return;
    if (r.err) return el.replaceChildren(h('p', 'hint', `⚠️ ${r.err}`), button('🤖 다시 해 보기', run, 'btn'));
    (i.aiParts ||= {})[part] = r.text;
    rememberAI(st);
    show();
  }
  show();
  return el;
}

// ---------- ⚖️ 저장한 판 비교: 명리 원국·기문 명국 둘 (다른 사람끼리, 같은 사람의 명리↔기문도) ----------
const isMr = rec => rec.kind === 'myeongri';
const qmGungOf = (r, who) => +Object.keys(r.marks).find(n => r.marks[n].gan.includes(who)) || 0; // 년·월·일·시 천간이 든 궁
const qmCell = (r, n) => { const c = r.palaces[n]; return n ? `${QM_GUNG[n]} · ${c.door || '-'} ${c.star || '-'} ${c.god || '-'} · 천반 ${c.heaven || '-'} 지반 ${c.earth || '-'}` : '—'; };
const CMP_ROWS = [ // [이름, (저장한 판, 계산한 판) → 칸 글] — 두 칸 모두 '—'인 줄은 숨김
  ['판', rec => isMr(rec) ? '🀄 명리 원국' : '🧭 기문 명국'],
  ['이름', rec => rec.name],
  ['생년월일시', rec => `${rec.input.male ? '남' : '여'} · ${birthText(rec.input)} ${rec.input.unknownHour ? '(시 모름)' : rec.input.time}`],
  ['사주 (년 월 일 시)', (rec, r) => { const p = isMr(rec) ? r.info : r.pillars; return [p.year, p.month, p.day, rec.input.unknownHour ? '' : p.hour].filter(Boolean).join(' '); }],
  ['일간', (rec, r) => { const g = isMr(rec) ? r.dayGan : r.pillars.day[0]; return `${g} (${OH_KO[ohOf(g)]})`; }],
  ['공망', (rec, r) => `${r.kong.join('')} (${isMr(rec) ? '일주' : '시주'} 순)`],
  ['오행 개수', (rec, r) => isMr(rec) ? Object.entries(r.count).map(([k, v]) => `${OH_KO[k]}${v}`).join(' ') : '—'],
  ['천간 십신 (년·월·시)', (rec, r) => isMr(rec) ? r.pillars.filter(p => p.pos !== '일').map(p => p.ganSs).join(' · ') : '—'],
  ['합충', (rec, r) => isMr(rec) ? r.relations.map(x => x.text).join(', ') || '없음' : '—'],
  ['대운', (rec, r) => isMr(rec) ? `${r.forward ? '순행' : '역행'} · 대운수 ${r.daeunsu} · ${r.daeun.slice(0, 4).map(d => `${d.age}세 ${d.gz}`).join(' ')} …` : '—'],
  ['국', (rec, r) => isMr(rec) ? '—' : `${r.term} ${r.yuan} · ${r.dun} ${r.ju}국`],
  ['일간 궁 (나)', (rec, r) => isMr(rec) ? '—' : qmCell(r, qmGungOf(r, '일'))],
  ['시간 궁', (rec, r) => isMr(rec) ? '—' : qmCell(r, qmGungOf(r, '시'))],
  ['직부 · 직사', (rec, r) => isMr(rec) ? '—' : `${r.zhifu} → ${QM_GUNG[r.zhifuTo]} · ${r.zhishi} → ${QM_GUNG[r.zhishiTo]}`],
];
function readCompare(top, out) {
  const st = READ.compare ||= { input: {} };
  const i = st.input;
  const recs = db.recs.filter(r => !r.deleted && (isMr(r) || (r.kind === 'qimen' && r.input?.mode === 'birth'))).sort((a, b) => b.updatedAt - a.updatedAt);
  if (recs.length < 2) return out.replaceChildren(h('p', 'empty', `명리 원국이나 기문 명국을 💾 저장해 두면 둘을 골라 표로 비교할 수 있어요. (지금 ${recs.length}개)`));
  if (!recs.some(r => r.id === i.a)) i.a = recs[0].id;
  if (!recs.some(r => r.id === i.b)) i.b = recs.find(r => r.id !== i.a).id;
  const sel = key => {
    const s = h('select', '', ...recs.map(r => Object.assign(h('option', '', `${KIND_NAME[r.kind].split(' ')[0]} ${r.name} · ${savedSummary(r)}`), { value: r.id })));
    s.value = i[key];
    s.addEventListener('change', () => { i[key] = s.value; fresh(st); draw(); });
    return s;
  };
  function draw() {
    const pair = [i.a, i.b].map(id => { const rec = recs.find(r => r.id === id); return { rec, r: isMr(rec) ? myeongriOf(rec.input) : qimenAt(...parseDT(rec.input), qmOpt()) }; });
    const rows = CMP_ROWS.map(([label, f]) => [label, ...pair.map(x => f(x.rec, x.r))]).filter(([, a, b]) => a !== '—' || b !== '—');
    out.replaceChildren(h('div', 'panel',
      h('div', 'panel-head', h('h3', '', '⚖️ A · B 비교'), h('span', 'grow'), aiButton('compare', st, pair)),
      h('table', 'cmp', h('tr', '', h('th', ''), h('th', '', 'A'), h('th', '', 'B')),
        ...rows.map(([label, a, b]) => h('tr', a === b ? 'same' : '', h('th', '', label), h('td', '', a), h('td', '', b))))),
      ...aiBox('compare', st, pair),
      h('p', 'hint', '💡 흐린 줄은 A와 B가 같은 줄이에요. 기문 명국의 대운·소운은 아직 없어요.'));
  }
  top.append(h('div', 'form-grid', field('A', sel('a')), field('B', sel('b'))));
  draw();
}

// ---------- 🔧 보정: 과목마다 다른 계산 기준 (여러 과목에 같이 쓰는 시각 보정·야자시는 ⚙️) ----------
const CALIB_NOTES = {
  myeongri: ['해는 입춘, 달은 절입(12절) 시각으로 나눠요.', '대운: 양남음녀 순행, 음남양녀 역행. 대운수 = 절입까지(역행은 지난 절입부터) 날 수 ÷ 3, 반올림(최소 1).',
    '음력 생일은 천문연 음력표로 양력으로 바꿔서 계산해요(윤달 포함).'],
  liuren: ['귀인: 甲戊庚 丑/未 · 乙己 子/申 · 丙丁 亥/酉 · 壬癸 卯/巳 · 辛 午/寅 (주점/야점).', '귀인이 앉은 지반이 亥~辰이면 순행, 巳~戌이면 역행.',
    '섭해는 간편법(맹 → 중 → 양일은 간상·음일은 지상).', '주점·야점 "자동"은 卯~申시를 낮으로 봐요. 판마다 보기에서 바꿀 수 있어요.'],
  qimen: ['연국(시가)기문 · 전반식. 중5궁은 곤2궁에 기궁.', '명국의 음력 생일은 천문연 음력표로 양력으로 바꿔요(윤달 포함).'],
  tarot: ['78장을 섞어 위에서부터 자리 수만큼 뽑아요.', '역방향을 쓰면 카드마다 반반 확률로 뒤집혀요.'],
};
// 기문 유파·규칙 고르기 (보기·비교·저장한 판 모두 이 설정으로 다시 계산)
function qimenRules() {
  const row = (label, items, key, def, notes) => {
    const note = h('p', 'hint');
    const show = v => { note.textContent = notes[v]; };
    show(prefs[key] || def);
    return h('div', 'calib-row', h('div', 'field', label, seg(items, prefs[key] || def, v => { prefs[key] = v; savePrefs(); show(v); })), note);
  };
  return h('div', 'panel', h('div', 'panel-head', h('h3', '', '🧭 기문 규칙')),
    row('국 정하는 법', [['chaibo', '절기중심법 (拆補)'], ['zhirun', '초신접기 (置閏)']], 'qmJu', 'chaibo', {
      chaibo: '그날이 든 절기와 그날의 부두(직전 甲·己일)로 상·중·하원을 정해요. 중국 연국 기문에서 흔한 방식이에요.',
      zhirun: '상원 부두부터 절기마다 15일씩 붙이고, 초신이 9일 이상 쌓이면 망종·대설에 윤국을 둬요. 한국 홍연기문 계열에서 많이 쓰고, 참고 앱과 같아요.' }),
    row('양둔 팔신', [['hm', '백호·현무'], ['jj', '구진·주작']], 'qmGods', 'hm', {
      hm: '양둔·음둔 모두 직부 등사 태음 육합 백호 현무 구지 구천.',
      jj: '양둔은 직부 등사 태음 육합 구진 주작 구지 구천, 음둔은 백호·현무(陽遁用勾陳朱雀). 참고 앱과 같아요.' }),
    h('p', 'hint', '📖 용어: ', termChip('qm-chaibo'), ' ', termChip('qm-chosin'), ' ', termChip('qm-g-gujin')));
}
function renderCalib(view, subj) {
  const rev = inp('checkbox', ''); rev.checked = prefs.tarotRev;
  rev.addEventListener('change', () => { prefs.tarotRev = rev.checked; savePrefs(); });
  view.replaceChildren(
    subj === 'qimen' ? qimenRules() : '',
    subj === 'tarot'
      ? h('div', 'panel', h('div', 'panel-head', h('h3', '', '🃏 뽑기')), h('label', 'check', rev, '역방향 카드 쓰기'))
      : h('div', 'panel', h('div', 'panel-head', h('h3', '', '⚙️ 공통 설정'), h('span', 'grow'), button('⚙️ 바꾸기', () => $('settingsBtn').click(), 'btn')),
        h('p', '', `시각 ${prefs.correct === 'lon' ? `경도 ${prefs.lon}° 보정` : '보정 안 함'} · 야자시 ${prefs.yajasi ? '씀' : '안 씀'}`),
        h('p', 'hint', '시각 보정·야자시는 명리·육임·기문에 같이 써서 ⚙️ 설정에 있어요.')),
    h('div', 'panel', h('div', 'panel-head', h('h3', '', '📐 이 앱의 계산 기준')), h('ul', 'calib-notes', ...CALIB_NOTES[subj].map(n => h('li', '', n)))),
  );
}
