'use strict';
// 판 그리기: 명리 원국 · 육임 과전 · 기문 9궁 · 타로 스프레드. 칸을 누르면 풀이 힌트

const SS_ID = { 비견: 'mr-bigyeon', 겁재: 'mr-geopjae', 식신: 'mr-siksin', 상관: 'mr-sanggwan', 편재: 'mr-pyeonjae', 정재: 'mr-jeongjae', 편관: 'mr-pyeongwan', 정관: 'mr-jeonggwan', 편인: 'mr-pyeonin', 정인: 'mr-jeongin' };
const JIANG_ID = { 귀인: 'lr-gwiin', 등사: 'lr-deungsa', 주작: 'lr-jujak', 육합: 'lr-yukhap', 구진: 'lr-gujin', 청룡: 'lr-cheongnyong', 천공: 'lr-cheongong', 백호: 'lr-baekho', 태상: 'lr-taesang', 현무: 'lr-hyeonmu', 태음: 'lr-taeeum', 천후: 'lr-cheonhu' };
const STAR_ID = { 천봉: 'qm-s-bong', 천예: 'qm-s-ye', 천충: 'qm-s-chung', 천보: 'qm-s-bo', 천금: 'qm-s-geum', 천심: 'qm-s-sim', 천주: 'qm-s-ju', 천임: 'qm-s-im', 천영: 'qm-s-yeong' };
const DOOR_ID = { 휴문: 'qm-d-hyu', 생문: 'qm-d-saeng', 상문: 'qm-d-sang', 두문: 'qm-d-du', '경문(景)': 'qm-d-gyeong9', 사문: 'qm-d-sa', '경문(驚)': 'qm-d-gyeong7', 개문: 'qm-d-gae' };
const GOD_ID = { 직부: 'qm-g-jikbu', 등사: 'qm-g-deungsa', 태음: 'qm-g-taeeum', 육합: 'qm-g-yukhap', 백호: 'qm-g-baekho', 현무: 'qm-g-hyeonmu', 구지: 'qm-g-guji', 구천: 'qm-g-gucheon' };
const METHOD_ID = [['중심과', 'lr-jeokgeuk'], ['원수과', 'lr-jeokgeuk'], ['지일과', 'lr-biyong'], ['섭해', 'lr-seophae'], ['요극', 'lr-yogeuk'], ['묘성', 'lr-myoseong'], ['별책', 'lr-byeolchaek'], ['팔전', 'lr-paljeon'], ['복음', 'lr-bogeum'], ['반음', 'lr-baneum']];
const short = id => TERMS.get(id)?.short || '';
const ohCls = c => `oh-${ohOf(c)}`;
const yy = c => (GAN.includes(c) ? (isYangGan(c) ? '양' : '음') : (isYangJi(c) ? '양' : '음'));
const charInfo = c => `${c}(${ko(c)}) · ${OH_KO[ohOf(c)]} · ${yy(c)}`;
function cell(cls, kids, onClick) {
  const b = h('button', `cell-btn ${cls}`, kids);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

// ================= 명리 =================
function drawPillars(r) {
  const cols = [...r.pillars].reverse(); // 시 일 월 년 (오른쪽이 년)
  const g = h('div', `pillars${cols.length === 3 ? ' three' : ''}`);
  const row = (label, f) => { g.append(h('div', 'lbl', label), ...cols.map(f)); };
  row('', p => h('div', 'head', `${p.pos}주`));
  row('십신', p => cell('ss', p.ganSs, () => ssHint(p.ganSs, `${p.pos}간 ${p.gan}`)));
  row('천간', p => cell(`big glyph oh-tile ${ohCls(p.gan)}`, p.gan, () => ganHint(p, r)));
  row('지지', p => cell(`big glyph oh-tile ${ohCls(p.zhi)}`, p.zhi, () => zhiHint(p, r)));
  row('십신', p => cell('ss', p.zhiSs, () => ssHint(p.zhiSs, `${p.pos}지 ${p.zhi}의 정기`)));
  row('지장간', p => cell('jjg', p.jjg.map(x => x.g).join(''), () => zhiHint(p, r)));
  row('12운성', p => cell('ss', p.unseong, () => openHint(`12운성 · ${p.unseong}`, [`일간 ${r.dayGan}이(가) ${p.pos}지 ${p.zhi}에서 '${p.unseong}'이에요.`, short('mr-12unseong')], ['mr-12unseong'])));
  const ohbar = h('div', 'ohbar', ...Object.entries(r.count).map(([o, n]) => cell(`oh-tile oh-${o}`, `${o} ${OH_KO[o]} ${n}`, () => openHint(`${OH_KO[o]}(${o}) ${n}개`, [`천간·지지 겉글자만 센 개수예요(지장간 제외). 일간 ${r.dayGan}(${OH_KO[ohOf(r.dayGan)]}) 기준으로 ${ohRole(ohOf(r.dayGan), o)}이에요.`, short('mr-ohaeng-balance')], ['mr-ohaeng-balance', 'base-ohaeng']))));
  const rel = r.relations.length ? h('div', 'chips', h('span', 'hint', '🔗 합·충'), ...r.relations.map(x => button(x.text, () => openTermDlg(x.term), 'chip'))) : null;
  const meta = h('div', 'board-meta', h('span', '', '공망 ', h('b', 'kong', r.kong.join(''))), h('span', '', '일간 ', h('b', '', charInfo(r.dayGan))));
  const parts = [g, ohbar, rel, meta];
  if (r.daeun) parts.push(...daeunStrip(r));
  return h('div', 'board', ...parts);
}
function ohRole(me, o) {
  if (me === o) return '비겁(나와 같은 기운)';
  if (SAENG[me] === o) return '식상(내가 생하는 것)';
  if (GEUK[me] === o) return '재성(내가 극하는 것)';
  if (GEUK[o] === me) return '관성(나를 극하는 것)';
  return '인성(나를 생하는 것)';
}
function ssHint(ss, where) {
  if (ss === '일간') return openHint('일간 — 나', [short('mr-ilgan'), '다른 글자의 십신은 모두 일간을 기준으로 정해요.'], ['mr-ilgan', 'mr-sipsin']);
  openHint(`${ss} · ${where}`, [short(SS_ID[ss]), ...(TERMS.get(SS_ID[ss])?.body || []).slice(0, 1)], [SS_ID[ss], 'mr-sipsin']);
}
function ganHint(p, r) {
  const lines = [charInfo(p.gan)];
  if (p.pos === '일') lines.push('일간이에요. 이 원국의 \'나\'예요.', short('mr-ilgan'));
  else lines.push(`일간 ${r.dayGan} 기준 십신은 '${p.ganSs}'이에요. ${short(SS_ID[p.ganSs])}`);
  openHint(`${p.pos}간 ${p.gan}`, lines, [p.pos === '일' ? 'mr-ilgan' : SS_ID[p.ganSs], 'base-cheongan']);
}
function zhiHint(p, r) {
  const lines = [charInfo(p.zhi), `지장간: ${p.jjg.map(x => `${x.g}(${x.ss})`).join(' · ')} — 마지막이 정기(본기)예요.`, `12운성: ${p.unseong}`];
  if (p.pos === '월') lines.push(`월지는 계절이라 힘이 가장 커요(월령). ${short('mr-wollyeong')}`);
  if (r.kong.includes(p.zhi)) lines.push(`일주 기준 공망(${r.kong.join('')})에 들어요.`);
  openHint(`${p.pos}지 ${p.zhi}`, lines, ['mr-jijanggan', SS_ID[p.zhiSs], p.pos === '월' ? 'mr-wollyeong' : 'base-jiji', 'mr-12unseong'].filter(Boolean));
}
function daeunStrip(r) {
  const nowYear = new Date().getFullYear(), age = nowYear - new Date(r.info.utc).getUTCFullYear() + 1; // 세는 나이
  const strip = h('div', 'daeun');
  for (const d of r.daeun) {
    const now = age >= d.age && age < d.age + 10;
    strip.append(cell(now ? 'now' : '', [h('div', 'age', d.age), h('div', `gz glyph`, h('span', `oh-cell ${ohCls(d.gz[0])}`, d.gz[0]), h('br'), h('span', `oh-cell ${ohCls(d.gz[1])}`, d.gz[1])), h('div', 'ss2', `${d.ganSs}·${d.zhiSs}`)],
      () => openHint(`대운 ${d.gz} (${d.age}~${d.age + 9}세)`, [`천간 ${d.gz[0]}은 ${d.ganSs}, 지지 ${d.gz[1]}는 ${d.zhiSs}(정기 기준), 12운성 ${d.unseong}이에요.`, '대운은 보통 앞 5년은 천간, 뒤 5년은 지지를 더 본다고 하지만 10년을 하나로 보는 쪽도 있어요.'], ['mr-daeun', SS_ID[d.ganSs], SS_ID[d.zhiSs]])));
  }
  const seunRow = h('div', 'daeun');
  for (let y = nowYear; y < nowYear + 10; y++) {
    const s = seun(y, r.dayGan);
    seunRow.append(cell(y === nowYear ? 'now' : '', [h('div', 'age', y), h('div', 'gz glyph', h('span', `oh-cell ${ohCls(s.gz[0])}`, s.gz[0]), h('br'), h('span', `oh-cell ${ohCls(s.gz[1])}`, s.gz[1])), h('div', 'ss2', `${s.ganSs}·${s.zhiSs}`)],
      () => openHint(`${y}년 세운 ${s.gz}`, [`입춘부터 다음 입춘 전까지예요. 천간 ${s.gz[0]} ${s.ganSs}, 지지 ${s.gz[1]} ${s.zhiSs}, 12운성 ${s.unseong}.`], ['mr-seun', SS_ID[s.ganSs], SS_ID[s.zhiSs]])));
  }
  return [
    h('h3', '', `📈 대운 `, h('span', 'hint', `${r.forward ? '순행' : '역행'} · 대운수 ${r.daeunsu} (절입까지 ${r.daeunDays.toFixed(1)}일 ÷ 3) · 지금 ${age}세(세는 나이)`)),
    strip,
    h('h3', '', '📅 세운'), seunRow,
  ];
}

// ================= 육임 =================
function drawLiuren(r) {
  const jShort = j => LR_JIANG_SHORT[j] || '';
  const sanRow = h('div', 'lr-row three', ...r.san.map(s => cell('lr-box', [
    h('div', 't', s.name), h('div', 'dun glyph', s.dun || (s.kong ? '○' : '')),
    h('div', 'up glyph', h('span', 'jg', jShort(s.jiang)), h('span', `oh-cell ${ohCls(s.zhi)}`, s.zhi)),
    h('div', 'rel', `${s.rel}${s.kong ? ' · 공망' : ''}`),
  ], () => sanHint(s, r))));
  const keRow = h('div', 'lr-row four', ...r.ke.map(k => cell('lr-box', [
    h('div', 't', `${'一二三四'[k.n - 1]}課`), h('div', 'dun glyph', k.dun || (r.kong.includes(k.up) ? '○' : '')),
    h('div', 'up glyph', h('span', 'jg', jShort(k.jiang)), h('span', `oh-cell ${ohCls(k.up)}`, k.up)),
    h('div', 'down glyph', k.down),
  ], () => keHint(k, r))));
  // 천지반: 위 巳午未申, 오른쪽 酉戌, 아래 亥子丑寅(오른쪽→왼쪽), 왼쪽 卯辰(아래→위)
  const pos = { 巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4], 酉: [2, 4], 戌: [3, 4], 亥: [4, 4], 子: [4, 3], 丑: [4, 2], 寅: [4, 1], 卯: [3, 1], 辰: [2, 1] };
  const plate = h('div', 'lr-plate');
  for (const e of JI) {
    const t = r.plate[e], b = cell('lr-box', [
      h('div', 'dun glyph', r.dunPlate[e] || (r.kong.includes(t) ? '○' : '')),
      h('div', 'up glyph', h('span', 'jg', jShort(r.jiang[t])), h('span', `oh-cell ${ohCls(t)}`, t)),
      h('div', 'down glyph', e, e === r.shi ? h('span', 'tag', '점시') : null),
    ], () => openHint(`지반 ${e} 위 천반 ${t}`, [
      `천반 ${charInfo(t)} · 천장 ${r.jiang[t]} · 둔간 ${r.dunPlate[e] || '없음(공망)'}`,
      `일간 ${r.day[0]} 기준 육친: ${lrRel(r.day[0], t)}`,
      short(JIANG_ID[r.jiang[t]]),
    ], [JIANG_ID[r.jiang[t]], 'lr-cheonjiban', 'lr-yukchin']));
    b.style.gridRow = pos[e][0]; b.style.gridColumn = pos[e][1];
    plate.append(b);
  }
  const mid = METHOD_ID.find(([k]) => r.method.includes(k));
  plate.append(h('div', 'center',
    h('div', 'wj', `${r.woljang} 월장 · ${r.shi}시`),
    button(r.method, () => openHint(r.method, [r.how, mid ? short(mid[1]) : ''], [mid?.[1], 'lr-gujongbeop'].filter(Boolean)), 'link mth'),
    h('div', 'small muted', `${r.daynight} · 귀인 ${r.gui}(${r.guiDir})`),
    h('div', 'small', '공망 ', h('b', 'kong', r.kong.join(''))),
  ));
  const meta = r.pillars ? h('div', 'board-meta',
    h('span', '', `${r.pillars.year}년 ${r.pillars.month}월 `, h('b', '', `${r.day}일 ${r.pillars.hour}시`)),
    h('span', '', `월장 ${r.woljang} (${r.junggi} 뒤)`)) : h('div', 'board-meta', h('span', '', h('b', '', `${r.day}일`), ` ${r.woljang}장 ${r.shi}시 ${r.daynight}`));
  return h('div', 'board', meta, h('h3', '', '삼전'), sanRow, h('h3', '', '사과'), keRow, h('h3', '', '천지반'), plate);
}
function sanHint(s, r) {
  const what = { 초전: '일의 발단·시작', 중전: '일이 진행되는 과정', 말전: '일의 결말' }[s.name];
  openHint(`${s.name} ${s.dun}${s.zhi}`, [
    `${s.name}은 흔히 ${what}으로 읽어요.`,
    `${charInfo(s.zhi)} · 천장 ${s.jiang} · 육친 ${s.rel}${s.dun ? ` · 둔간 ${s.dun}` : ''}`,
    s.kong ? `일진 공망(${r.kong.join('')})에 들어요. 공망이면 허하거나 늦어진다고 보는 경우가 많아요.` : '',
    short(JIANG_ID[s.jiang]),
  ], [s.name === '초전' ? 'lr-chojeon' : 'lr-samjeon', JIANG_ID[s.jiang], 'lr-yukchin', s.kong ? 'base-gongmang' : null].filter(Boolean));
}
function keHint(k, r) {
  const g = (x, y) => GEUK[ohOf(x)] === ohOf(y);
  const rel = g(k.down, k.up) ? '아래가 위를 극해요(하적상).' : g(k.up, k.down) ? '위가 아래를 극해요(상극하).' : '서로 극하지 않아요.';
  const what = ['일간과 그 위(간상신)', '간상신과 그 위', '일지와 그 위(지상신)', '지상신과 그 위'][k.n - 1];
  openHint(`${k.n}과 ${k.up}/${k.down}`, [`${k.n}과는 ${what}예요. 1·2과는 나(일간), 3·4과는 상대·일(일지) 쪽으로 읽어요.`, `${k.up}(${OH_KO[ohOf(k.up)]}) / ${k.down}(${OH_KO[ohOf(k.down)]}) — ${rel}`, `천장 ${k.jiang}`],
    ['lr-sagwa', k.n === 1 ? 'lr-gigung' : null, JIANG_ID[k.jiang], 'lr-jeokgeuk'].filter(Boolean));
}

// ================= 기문 =================
const GUNG_JI = { 1: '子', 8: '丑寅', 3: '卯', 4: '辰巳', 9: '午', 2: '未申', 7: '酉', 6: '戌亥' };
const GIL_DOOR = ['개문', '휴문', '생문'], HYUNG_DOOR = ['상문', '사문', '경문(驚)'];
function drawQimen(r) {
  const grid = h('div', 'qm-grid');
  for (const p of [4, 9, 2, 3, 5, 7, 8, 1, 6]) {
    const x = r.palaces[p];
    const kong = p !== 5 && [...(GUNG_JI[p] || '')].some(z => r.kong.includes(z));
    const marks = h('div', 'marks', p === r.zhifuTo ? h('span', 'tag', '직부') : null, p === r.zhishiTo ? h('span', 'tag', '직사') : null, kong ? h('span', 'tag bad', '공망') : null);
    if (p === 5) {
      grid.append(cell('qm-cell center', [h('div', 'gname', QM_GUNG[5]), h('div', 'stems glyph', h('span', 'e', x.earth)), h('div', 'small muted', `${r.dun} ${r.ju}국`), h('div', 'small muted', `${r.shi}시`)],
        () => openHint('중5궁', [`지반 ${x.earth}. 중궁은 문·신이 없고, 이 앱에서는 곤2궁에 붙여(기궁) 움직여요.`], ['qm-gigung', 'qm-gugung'])));
      continue;
    }
    const doorCls = GIL_DOOR.includes(x.door) ? 'gil' : HYUNG_DOOR.includes(x.door) ? 'hyung' : '';
    grid.append(cell('qm-cell', [
      h('div', 'gname', QM_GUNG[p]), marks,
      h('div', 'god', x.god), h('div', 'star', x.star),
      h('div', 'stems glyph', h('span', `oh-cell ${ohCls(x.heaven[0])}`, x.heaven), ' ', h('span', 'e', x.earth)),
      h('div', `door ${doorCls}`, x.door),
    ], () => qmHint(p, x, r, kong)));
  }
  const meta = h('div', 'board-meta',
    r.term ? h('span', '', h('b', '', `${r.term} ${r.yuan}`), ` (부두 ${r.futou})`) : null,
    h('span', '', h('b', '', `${r.dun} ${r.ju}국`), ` · ${r.shi}시`),
    h('span', '', `순수 ${r.xun}${r.fuYi} → 직부 ${r.zhifu}, 직사 ${r.zhishi}`),
    h('span', '', '공망 ', h('b', 'kong', r.kong.join(''))),
    r.pillars ? h('span', '', `${r.pillars.year}년 ${r.pillars.month}월 ${r.pillars.day}일`) : null);
  return h('div', 'board', meta, grid, h('p', 'hint', '칸마다 위에서부터 팔신 · 구성 · 천반간(큰 글자)과 지반간 · 팔문. 위쪽이 남쪽이에요.'));
}
function qmHint(p, x, r, kong) {
  const starName = x.star.split('·')[0];
  openHint(`${QM_GUNG[p]}`, [
    `천반 ${x.heaven} / 지반 ${x.earth}`,
    `구성 ${x.star} — ${short(STAR_ID[starName])}`,
    `팔문 ${x.door} — ${short(DOOR_ID[x.door])}`,
    `팔신 ${x.god} — ${short(GOD_ID[x.god])}`,
    p === r.zhifuTo ? `직부(${r.zhifu})가 와 있는 궁이에요.` : '',
    p === r.zhishiTo ? `직사(${r.zhishi})가 와 있는 궁이에요.` : '',
    kong ? `시순 공망(${r.kong.join('')})이 든 궁이에요.` : '',
  ], [STAR_ID[starName], DOOR_ID[x.door], GOD_ID[x.god], 'qm-cheonban', kong ? 'qm-gongmang' : null].filter(Boolean));
}

// ================= 타로 =================
const SUIT = { m: ['major', '✨'], w: ['w', '🪄'], c: ['c', '🏆'], s: ['s', '🗡️'], p: ['p', '🪙'] };
function drawSpread(sp, onFlip) {
  const grid = h('div', 'spread');
  sp.cards.forEach((c, i) => {
    const t = TERMS.get(c.card);
    if (!t) return;
    if (c.hidden) {
      grid.append(cell('tcard back', [h('div', 'pos', `${i + 1}. ${c.pos}`), h('div', 'face', '❔'), h('div', 'name', '눌러서 뒤집기')], () => onFlip?.(i)));
      return;
    }
    const [suit, emo] = SUIT[c.card[3]];
    grid.append(cell(`tcard suit-${suit}`, [
      h('div', 'pos', `${i + 1}. ${c.pos}`),
      h('div', `face${c.reversed ? ' rev' : ''}`, emo),
      h('div', 'name', t.term.replace(/\s*\(.*\)$/, ''), c.reversed ? h('span', 'small muted', ' (역)') : null),
      h('div', 'kw', t.keywords || ''),
    ], () => openHint(`${c.pos} · ${t.term}${c.reversed ? ' — 역방향' : ''}`, [
      h('p', 'small', `🔑 ${t.keywords || ''}`),
      h('p', '', h('b', '', c.reversed ? '⬇️ 역방향 ' : '⬆️ 정방향 '), c.reversed ? t.reversed : t.upright),
      h('p', 'muted small', c.reversed ? `정방향: ${t.upright}` : `역방향: ${t.reversed}`),
      ...paras(t.body),
    ], [c.card])));
  });
  return h('div', 'board', sp.question ? h('p', '', '❓ ', h('b', '', sp.question)) : null, h('div', 'board-meta', h('span', '', sp.name)), grid);
}
