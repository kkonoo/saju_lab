'use strict';
// 상태·저장·화면 이동·설정. 과목 화면은 learn.js(공부), reading.js(보기)가 그림

const $ = id => document.getElementById(id);
const KEY = 'saju-lab';
const PKEY = 'saju-lab-prefs';
const VERSION = 1;

const SUBJECTS = [
  { id: 'myeongri', name: '🀄 명리' }, { id: 'liuren', name: '🌀 육임' }, { id: 'qimen', name: '🧭 기문' },
  { id: 'tarot', name: '🃏 타로' }, { id: 'base', name: '🌱 기초' },
];
const SUBS = [
  { id: 'read', name: '🔮 보기' }, { id: 'concepts', name: '📘 개념' }, { id: 'terms', name: '📖 용어' }, { id: 'cases', name: '🧩 사례' },
];

let db = { version: VERSION, recs: [] }, idb = null;
const readJSON = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
let prefs = Object.assign({ theme: 'auto', fs: 1, correct: 'lon', lon: 127.5, yajasi: false, tarotRev: true, subj: 'myeongri', sub: 'read' }, readJSON(PKEY) || {});
const savePrefs = () => { try { localStorage.setItem(PKEY, JSON.stringify(prefs)); } catch { /* 저장 못 해도 화면은 그대로 */ } };
const timeOpt = () => ({ correct: prefs.correct, lon: +prefs.lon || 127.5, yajasi: prefs.yajasi });

const dbReady = new Promise(ok => {
  let r;
  try { r = indexedDB.open(KEY, 1); } catch { fallback(); return ok(); }
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onsuccess = () => {
    idb = r.result;
    const get = idb.transaction('kv').objectStore('kv').get('db');
    get.onsuccess = () => { if (get.result) db = migrate(JSON.parse(get.result)); ok(); };
    get.onerror = () => ok();
  };
  r.onerror = () => { fallback(); ok(); };
});
function fallback() { const v = readJSON(KEY); if (v) db = migrate(v); }
function migrate(v) { v.recs ||= []; v.version = VERSION; return v; }
function persist() {
  const s = JSON.stringify(db);
  const done = idb
    ? new Promise(ok => { try { const t = idb.transaction('kv', 'readwrite'); t.objectStore('kv').put(s, 'db'); t.oncomplete = ok; t.onerror = ok; } catch { ok(); } })
    : Promise.resolve((() => { try { localStorage.setItem(KEY, s); } catch { /* 없음 */ } })());
  window.onSave?.();
  return done;
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- 작은 도우미 ----------
function h(tag, cls, ...kids) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k instanceof Node ? k : String(k));
  return el;
}
function button(label, fn, cls = 'btn') {
  const b = h('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', fn);
  return b;
}
function seg(items, value, onPick) {
  const s = h('div', 'seg');
  for (const [v, label] of items) {
    const b = button(label, () => { for (const x of s.children) x.classList.toggle('on', x === b); onPick(v); }, '');
    b.classList.toggle('on', v === value);
    s.append(b);
  }
  return s;
}
let toastTimer;
function toast(text, ms = 2000) {
  $('toast').textContent = text;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), ms);
}
function applyTheme() {
  if (prefs.theme === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = prefs.theme;
  document.documentElement.style.setProperty('--fs', prefs.fs);
  $('themeColor')?.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
}
const pad2 = n => String(n).padStart(2, '0');

// ---------- 내용(JSON) ----------
const CONTENT = {};
const TERMS = new Map(); // id → { ...term, subj }
let contentError = null;
const contentReady = Promise.all([
  fetch('data/jeolgi.json').then(r => r.json()).then(j => { JEOLGI = j; }),
  ...SUBJECTS.map(s => fetch(`data/${s.id}.json`).then(r => r.json()).then(d => {
    CONTENT[s.id] = d;
    for (const t of d.terms) TERMS.set(t.id, { ...t, subj: s.id });
    for (const c of [...d.concepts, ...d.cases]) TERMS.set(c.id, { ...c, term: c.title, subj: s.id, isDoc: true });
  })),
]).catch(e => { contentError = e; console.error(e); });

// 본문 속 [[id]] / [[id|표시]] → 누르면 용어 창
function rich(text) {
  const out = [], re = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    out.push(text.slice(last, m.index));
    const t = TERMS.get(m[1]);
    out.push(t ? button(m[2] || t.term.replace(/\s*\(.*\)$/, ''), () => openTermDlg(m[1]), 'link') : (m[2] || m[1]));
    last = re.lastIndex;
  }
  out.push(text.slice(last));
  return out;
}
const paras = list => (list || []).map(p => h('p', '', rich(p)));
function termChip(id, label) {
  const t = TERMS.get(id);
  return t ? button(label || t.term, () => openTermDlg(id), 'chip') : null;
}

// ---------- 용어 창 ----------
let termDlgId = null;
function openTermDlg(id) {
  const t = TERMS.get(id);
  if (!t) return;
  if (t.isDoc) { closeDialogs(); go(t.subj, t.id.includes('case') ? 'cases' : 'concepts', t.id.includes('case') ? t.id : null, t.id); return; }
  termDlgId = id;
  $('termTitle').textContent = `${t.term}${t.hanja ? ` ${t.hanja}` : ''}`;
  $('termBody').replaceChildren(termContent(t));
  if (!$('termDlg').open) $('termDlg').showModal();
  $('termDlg').scrollTop = 0;
}
function termContent(t) {
  const see = (t.see || []).map(id => termChip(id)).filter(Boolean);
  return h('div', '',
    h('p', 'muted', t.short),
    t.keywords ? h('p', 'small', `🔑 ${t.keywords}`) : null,
    ...paras(t.body),
    t.upright || t.reversed ? h('div', 'meaning', h('b', '', '⬆️ 정방향'), h('span', '', t.upright || ''), h('b', '', '⬇️ 역방향'), h('span', '', t.reversed || '')) : null,
    t.example ? h('p', 'example', '💡 ', ...rich(t.example)) : null,
    see.length ? h('div', 'chips', h('span', 'hint', '🔗 함께 보기'), ...see) : null,
  );
}
$('termGo').addEventListener('click', () => {
  const t = TERMS.get(termDlgId);
  closeDialogs();
  if (t) go(t.subj, 'terms', null, t.id);
});

// 판 칸을 눌렀을 때: 제목 + 설명 줄 + 용어 칩
function openHint(title, lines, termIds = []) {
  $('hintTitle').textContent = title;
  $('hintBody').replaceChildren(
    ...lines.filter(Boolean).map(l => (l instanceof Node ? l : h('p', '', rich(l)))),
    termIds.length ? h('div', 'chips', h('span', 'hint', '📖 용어'), ...termIds.map(id => termChip(id)).filter(Boolean)) : '',
  );
  $('hintDlg').showModal();
}

function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(d => d.close()); }
document.addEventListener('click', e => {
  if (e.target.matches('[data-close]')) e.target.closest('dialog').close();
  if (e.target.tagName === 'DIALOG') e.target.close(); // 바깥(배경) 누르면 닫기
});

// ---------- 화면 이동: #/과목/보기방식/사례id ----------
let route = { subj: prefs.subj, sub: prefs.sub, item: null }, focusId = null;
function go(subj, sub, item = null, focus = null) {
  focusId = focus;
  const hash = `#/${subj}/${sub}${item ? `/${item}` : ''}`;
  if (location.hash === hash) render(); else location.hash = hash;
}
function readHash() {
  const [, subj, sub, item] = location.hash.split('/');
  const s = SUBJECTS.some(x => x.id === subj) ? subj : prefs.subj;
  let b = SUBS.some(x => x.id === sub) ? sub : prefs.sub;
  if (s === 'base' && b === 'read') b = 'concepts';
  route = { subj: s, sub: b, item: item || null };
  prefs.subj = s; prefs.sub = b; savePrefs();
}
addEventListener('hashchange', () => { readHash(); render(); scrollTo(0, 0); });

function renderNav() {
  $('subjNav').replaceChildren(...SUBJECTS.map(s => {
    const b = button(s.name, () => go(s.id, s.id === 'base' && route.sub === 'read' ? 'concepts' : route.sub), '');
    b.classList.toggle('on', s.id === route.subj);
    return b;
  }));
  $('subNav').replaceChildren(...SUBS.filter(x => !(route.subj === 'base' && x.id === 'read')).map(x => {
    const b = button(x.id === 'read' && route.subj === 'tarot' ? '🔮 뽑기' : x.name, () => go(route.subj, x.id), '');
    b.classList.toggle('on', x.id === route.sub);
    return b;
  }));
}

function render() {
  renderNav();
  const view = $('view');
  if (contentError) return view.replaceChildren(h('p', 'empty', '⚠️ 내용 파일을 못 읽었어요. 새로고침해 보세요.'));
  if (route.sub === 'read') renderReading(view, route.subj);
  else renderLearn(view, route.subj, route.sub, route.item, focusId);
  focusId = null;
}

// ---------- 저장한 판 ----------
const KIND_NAME = { myeongri: '🀄 명리', liuren: '🌀 육임', qimen: '🧭 기문', tarot: '🃏 타로' };
let saveTarget = null; // { rec } 또는 { kind, input, result }
function openSave(kind, input, result, suggested = '') {
  saveTarget = { kind, input, result };
  $('saveName').value = suggested;
  $('saveMemo').value = '';
  $('saveDel').hidden = true;
  $('saveDlg').showModal();
}
function editSaved(rec) {
  saveTarget = { rec };
  $('saveName').value = rec.name;
  $('saveMemo').value = rec.memo || '';
  $('saveDel').hidden = false;
  $('saveDlg').showModal();
}
$('saveOk').addEventListener('click', () => {
  const name = $('saveName').value.trim() || '이름 없음', memo = $('saveMemo').value.trim(), now = Date.now();
  if (saveTarget.rec) Object.assign(saveTarget.rec, { name, memo, updatedAt: now });
  else db.recs.push({ id: uid(), kind: saveTarget.kind, name, memo, input: saveTarget.input, result: saveTarget.result ?? null, createdAt: now, updatedAt: now });
  persist();
  $('saveDlg').close();
  toast('저장했어요');
  if ($('savedDlg').open) drawSaved();
});
$('saveDel').addEventListener('click', () => {
  const r = saveTarget.rec;
  if (!r || !confirm(`'${r.name}'을(를) 지울까요?`)) return;
  Object.keys(r).forEach(k => { if (!['id', 'kind', 'createdAt'].includes(k)) delete r[k]; });
  Object.assign(r, { deleted: true, updatedAt: Date.now() });
  persist();
  $('saveDlg').close();
  toast('지웠어요');
  drawSaved();
});
let savedKind = '';
function drawSaved() {
  $('savedFilter').replaceChildren(...seg([['', '전체'], ...Object.entries(KIND_NAME)], savedKind, v => { savedKind = v; drawSaved(); }).children);
  const list = db.recs.filter(r => !r.deleted && (!savedKind || r.kind === savedKind)).sort((a, b) => b.updatedAt - a.updatedAt);
  $('savedList').replaceChildren(...(list.length ? list.map(r => h('div', 'saved-item',
    h('span', '', KIND_NAME[r.kind].split(' ')[0]),
    h('div', 'grow', h('div', 't', r.name), h('div', 's', [savedSummary(r), r.memo].filter(Boolean).join(' · '))),
    button('✎', () => editSaved(r), 'icon-btn small'),
    button('열기', () => { closeDialogs(); openSavedRec(r); }, 'btn'),
  )) : [h('p', 'empty', '아직 저장한 판이 없어요. 판을 뽑고 💾 저장을 눌러요.')]));
}
function savedSummary(r) {
  const i = r.input || {};
  if (r.kind === 'tarot') return `${i.spreadName || ''} ${i.question ? `· ${i.question}` : ''}`;
  if (r.kind === 'qimen' && i.mode === 'birth') return `명국 · ${i.date || ''} ${i.time || ''}${i.male ? ' · 남' : ' · 여'}`;
  return `${i.date || ''} ${i.time || ''}${r.kind === 'myeongri' ? (i.male ? ' · 남' : ' · 여') : ''}${i.question ? ` · ${i.question}` : ''}`;
}
$('savedBtn').addEventListener('click', () => { drawSaved(); $('savedDlg').showModal(); });

// ---------- 설정 ----------
function bindSeg(id, key, conv = v => v, after) {
  const s = $(id);
  for (const b of s.children) {
    b.classList.toggle('on', String(prefs[key]) === b.dataset.v);
    b.onclick = () => { prefs[key] = conv(b.dataset.v); savePrefs(); for (const x of s.children) x.classList.toggle('on', x === b); after?.(); };
  }
}
$('settingsBtn').addEventListener('click', () => {
  bindSeg('setTheme', 'theme', v => v, applyTheme);
  bindSeg('setFs', 'fs', Number, applyTheme);
  bindSeg('setCorrect', 'correct', v => v, () => { $('lonRow').hidden = prefs.correct !== 'lon'; render(); });
  $('lonRow').hidden = prefs.correct !== 'lon';
  $('setLon').value = prefs.lon;
  $('setYaja').checked = prefs.yajasi;
  $('setRev').checked = prefs.tarotRev;
  $('settingsDlg').showModal();
});
$('setLon').addEventListener('change', e => { const v = +e.target.value; if (v >= 100 && v <= 150) { prefs.lon = v; savePrefs(); render(); } });
$('setYaja').addEventListener('change', e => { prefs.yajasi = e.target.checked; savePrefs(); render(); });
$('setRev').addEventListener('change', e => { prefs.tarotRev = e.target.checked; savePrefs(); });
$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ app: 'saju-lab', version: VERSION, recs: db.recs.filter(r => !r.deleted) }, null, 1)], { type: 'application/json' });
  const a = h('a');
  a.href = URL.createObjectURL(blob);
  const d = new Date();
  a.download = `saju-lab-${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', async e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const v = JSON.parse(await f.text());
    if (!Array.isArray(v.recs)) throw new Error('형식');
    if (!confirm(`저장한 판 ${v.recs.length}개를 불러올까요? 같은 판은 덮어쓰고, 나머지는 그대로 둬요.`)) return;
    for (const r of v.recs) {
      const i = db.recs.findIndex(x => x.id === r.id);
      r.updatedAt = Date.now();
      if (i >= 0) db.recs[i] = r; else db.recs.push(r);
    }
    persist();
    toast(`${v.recs.length}개를 불러왔어요`);
  } catch { alert('이 앱의 백업 파일이 아니에요. 📤 백업 파일 저장으로 만든 .json을 골라 주세요.'); }
});

// ---------- 폰 뒤로가기: 창 먼저 닫기 ----------
addEventListener('keydown', e => { if (e.key === 'Escape') closeDialogs(); });

applyTheme();
addEventListener('DOMContentLoaded', () => Promise.all([dbReady, contentReady]).then(() => { readHash(); render(); }));
