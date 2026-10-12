'use strict';
// 📘 개념 · 📖 용어 · 🧩 사례 (data/<과목>.json)

const openTerms = new Set();
let learnQuery = '', learnCat = {};
const norm = s => String(s || '').toLowerCase().replace(/\s+/g, '');

function renderLearn(view, subj, sub, item, focus) {
  const d = CONTENT[subj];
  const head = h('div', '', h('p', 'subj-intro', d.intro));
  if (sub === 'concepts') view.replaceChildren(head, ...conceptList(d, focus));
  if (sub === 'terms') view.replaceChildren(head, termList(subj, d, focus));
  if (sub === 'cases') view.replaceChildren(...(item ? caseDetail(d, item) : [head, ...caseList(subj, d)]));
  if (focus) requestAnimationFrame(() => {
    const el = $(`t-${focus}`);
    if (!el) return;
    el.open = true;
    el.scrollIntoView({ block: 'start' });
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1200);
  });
}

// ---------- 개념: 순서대로 읽는 글 ----------
function conceptList(d) {
  return d.concepts.map((c, i) => {
    const el = h('details', 'term panel');
    el.id = `t-${c.id}`;
    el.open = openTerms.has(c.id) || (i === 0 && !openTerms.size);
    el.addEventListener('toggle', () => (el.open ? openTerms.add(c.id) : openTerms.delete(c.id)));
    const chips = (c.terms || []).map(id => termChip(id)).filter(Boolean);
    el.append(
      h('summary', '', h('span', 'concept-n', i + 1), h('strong', '', c.title)),
      h('div', 'term-body', ...paras(c.body), chips.length ? h('div', 'chips', h('span', 'hint', '📖 이 글의 용어'), ...chips) : null),
    );
    return el;
  });
}

// ---------- 용어: 검색 + 테마 칩 ----------
function termList(subj, d, focus) {
  const wrap = h('div');
  const search = Object.assign(h('input', 'learn-search'), { type: 'search', value: learnQuery, placeholder: '🔎 용어 찾기 (모든 과목에서 찾아요)' });
  search.setAttribute('aria-label', '용어 찾기');
  search.addEventListener('input', () => { learnQuery = search.value; draw(); });
  if (focus) { learnQuery = ''; search.value = ''; learnCat[subj] = ''; openTerms.add(focus); }
  const cats = h('div', 'chips');
  const catBtn = (id, name) => {
    const b = button(name, () => { learnCat[subj] = id; for (const x of cats.children) x.classList.toggle('on', x === b); draw(); }, 'chip');
    b.classList.toggle('on', (learnCat[subj] || '') === id);
    return b;
  };
  cats.append(catBtn('', '전체'), ...d.categories.map(c => catBtn(c.id, c.name)));
  const list = h('div');
  function draw() {
    const q = norm(learnQuery);
    list.replaceChildren();
    if (q) {
      const hit = t => norm([t.term, t.hanja, t.aka, t.short, t.keywords, ...(t.body || [])].join(' ')).includes(q);
      let n = 0;
      for (const s of SUBJECTS) {
        const terms = CONTENT[s.id].terms.filter(hit);
        n += terms.length;
        if (terms.length) list.append(h('h3', 'term-cat', s.name), ...terms.map(t => termCard(t, terms.length <= 3)));
      }
      if (!n) list.append(h('p', 'empty', `'${learnQuery}'에 맞는 용어가 없어요.`));
      return;
    }
    for (const c of d.categories) {
      if (learnCat[subj] && learnCat[subj] !== c.id) continue;
      const terms = d.terms.filter(t => t.cat === c.id);
      if (terms.length) list.append(h('h3', 'term-cat', c.name), ...terms.map(t => termCard(t)));
    }
  }
  function termCard(t, forceOpen) {
    const el = h('details', 'term panel');
    el.id = `t-${t.id}`;
    el.open = forceOpen || openTerms.has(t.id);
    el.addEventListener('toggle', () => (el.open ? openTerms.add(t.id) : openTerms.delete(t.id)));
    const see = (t.see || []).map(id => {
      const s = TERMS.get(id);
      return s ? button(s.term, () => (s.subj === subj && !learnQuery ? jump(id) : openTermDlg(id)), 'chip') : null;
    }).filter(Boolean);
    el.append(
      h('summary', '', h('strong', '', t.term), t.hanja ? h('span', 'hanja', t.hanja) : null, h('span', 'muted', t.short)),
      h('div', 'term-body',
        t.keywords ? h('p', 'small', `🔑 ${t.keywords}`) : null,
        ...paras(t.body),
        t.upright || t.reversed ? h('div', 'meaning', h('b', '', '⬆️ 정방향'), h('span', '', t.upright || ''), h('b', '', '⬇️ 역방향'), h('span', '', t.reversed || '')) : null,
        t.example ? h('p', 'example', '💡 ', ...rich(t.example)) : null,
        see.length ? h('div', 'chips', h('span', 'hint', '🔗 함께 보기'), ...see) : null),
    );
    return el;
  }
  function jump(id) {
    learnCat[subj] = '';
    for (const x of cats.children) x.classList.toggle('on', x === cats.firstChild);
    openTerms.add(id);
    draw();
    const el = $(`t-${id}`);
    el?.scrollIntoView({ block: 'start' });
    el?.classList.add('flash');
    setTimeout(() => el?.classList.remove('flash'), 1200);
  }
  draw();
  wrap.append(search, cats, list, h('p', 'hint', '✏️ 용어는 GitHub의 data 폴더 JSON에서 더하거나 고칠 수 있어요.'));
  return wrap;
}

// ---------- 사례 ----------
function caseList(subj, d) {
  if (!d.cases.length) return [h('p', 'empty', '아직 사례가 없어요.')];
  return d.cases.map(c => {
    const b = button('', () => go(subj, 'cases', c.id), 'panel case-card');
    b.append(h('strong', '', `🧩 ${c.title}`), h('p', 'muted', c.summary));
    return b;
  });
}
function caseDetail(d, id) {
  const c = d.cases.find(x => x.id === id);
  if (!c) return [h('p', 'empty', '이 사례를 찾지 못했어요.')];
  return [
    button('‹ 사례 목록', () => history.length > 1 ? history.back() : go(route.subj, 'cases'), 'btn no-print'),
    h('h2', '', c.title),
    h('p', 'muted', c.summary),
    c.board ? h('div', 'panel', boardFromSpec(c.board)) : null,
    ...c.steps.map(s => {
      const chips = (s.terms || []).map(t => termChip(t)).filter(Boolean);
      return h('div', 'step', h('h4', '', s.title), ...paras(s.body), chips.length ? h('div', 'chips', ...chips) : null);
    }),
    c.note ? h('p', 'panel hint', '📝 ', ...rich(c.note)) : null,
  ].filter(Boolean);
}

// 사례 board 스펙 → 계산해서 그리기
function boardFromSpec(s) {
  const at = s.at ? s.at.split(/[- :]/).map(Number) : null;
  const opt = { correct: 'lon', lon: 127.5, yajasi: false }; // 사례는 설정과 무관하게 같은 판
  if (s.type === 'pillars') return drawPillars(at ? myeongriAt(...at, s.male, opt) : myeongriFromPillars(s.pillars));
  if (s.type === 'liuren') return drawLiuren(at ? liurenAt(...at, opt) : liurenCalc(s.day, s.woljang, s.shi, s.daytime !== false));
  if (s.type === 'qimen') return drawQimen(at ? qimenAt(...at, opt) : qimenCalc(s.yang, s.ju, s.shi));
  if (s.type === 'spread') return drawSpread({ name: s.name, question: s.question, cards: s.cards });
  return h('p', 'hint', '판 형식을 모르겠어요.');
}
