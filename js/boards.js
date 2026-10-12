'use strict';
// 판 그리기: 명리 원국 · 육임 과전 · 기문 9궁 · 타로 스프레드. 칸을 누르면 풀이 힌트

const SS_ID = { 비견: 'mr-bigyeon', 겁재: 'mr-geopjae', 식신: 'mr-siksin', 상관: 'mr-sanggwan', 편재: 'mr-pyeonjae', 정재: 'mr-jeongjae', 편관: 'mr-pyeongwan', 정관: 'mr-jeonggwan', 편인: 'mr-pyeonin', 정인: 'mr-jeongin' };
const JIANG_ID = { 귀인: 'lr-gwiin', 등사: 'lr-deungsa', 주작: 'lr-jujak', 육합: 'lr-yukhap', 구진: 'lr-gujin', 청룡: 'lr-cheongnyong', 천공: 'lr-cheongong', 백호: 'lr-baekho', 태상: 'lr-taesang', 현무: 'lr-hyeonmu', 태음: 'lr-taeeum', 천후: 'lr-cheonhu' };
const STAR_ID = { 천봉: 'qm-s-bong', 천예: 'qm-s-ye', 천충: 'qm-s-chung', 천보: 'qm-s-bo', 천금: 'qm-s-geum', 천심: 'qm-s-sim', 천주: 'qm-s-ju', 천임: 'qm-s-im', 천영: 'qm-s-yeong' };
const DOOR_ID = { 휴문: 'qm-d-hyu', 생문: 'qm-d-saeng', 상문: 'qm-d-sang', 두문: 'qm-d-du', '경문(景)': 'qm-d-gyeong9', 사문: 'qm-d-sa', '경문(驚)': 'qm-d-gyeong7', 개문: 'qm-d-gae' };
const GOD_ID = { 직부: 'qm-g-jikbu', 등사: 'qm-g-deungsa', 태음: 'qm-g-taeeum', 육합: 'qm-g-yukhap', 백호: 'qm-g-baekho', 현무: 'qm-g-hyeonmu', 구진: 'qm-g-gujin', 주작: 'qm-g-jujak', 구지: 'qm-g-guji', 구천: 'qm-g-gucheon' };
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
// 일주 풀이: 일간·일지(배우자 자리·바탕)·십신·지장간·12운성 + 이름 붙은 일주
const UNSEONG_NOTE = { 장생: '막 태어나 자라기 시작하는 자리', 목욕: '씻고 드러나는 자리(감각·꾸밈, 들뜨기 쉬움)', 관대: '갓 쓰고 띠를 맨 자리(자신감·의욕)',
  건록: '스스로 녹을 먹는 자리(자립·안정된 힘)', 제왕: '기운이 가장 왕성한 자리', 쇠: '기운이 기울기 시작하는 자리(노련함·차분함)', 병: '기운이 약해지는 자리(섬세함·예민함)',
  사: '움직임이 멈추는 자리(깊은 생각)', 묘: '거두어 갈무리하는 자리(모으고 지킴)', 절: '끊어지고 바뀌는 자리(변화·새 출발)', 태: '잉태되는 자리(가능성·구상)', 양: '뱃속에서 길러지는 자리(준비·보살핌)' };
const iye = w => w + ((w.charCodeAt(w.length - 1) - 0xAC00) % 28 ? '이에요' : '예요'); // 받침 따라 이에요/예요
const SS_FLOW = { 비견: '나와 같은 기운이 바탕을 받쳐 줘요', 겁재: '나와 같은 기운이 바탕을 받쳐 줘요', 식신: '내가 바탕을 생해 기운을 내보내요(표현·재주)', 상관: '내가 바탕을 생해 기운을 내보내요(표현·재주)',
  편재: '내가 바탕을 극해 다스리고 써요(재물·현실)', 정재: '내가 바탕을 극해 다스리고 써요(재물·현실)', 편관: '바탕이 나를 극해 다잡아요(규율·책임·압박)', 정관: '바탕이 나를 극해 다잡아요(규율·책임·압박)',
  편인: '바탕이 나를 생해 길러 줘요(배움·보호)', 정인: '바탕이 나를 생해 길러 줘요(배움·보호)' };
function iljuHint(gz) {
  const [g, z] = gz, ss = sipsin(g, mrBon(z)), un = unseong(g, z);
  const named = [
    ohOf(g) === ohOf(z) && '간여지동 — 천간과 지지가 같은 오행이라 자기 기운이 단단하고 주관이 뚜렷하다고 봐요. 배우자 자리에 나와 같은 기운이 있어 부딪히기 쉽다고도 해요.',
    ['庚辰', '庚戌', '壬辰', '壬戌'].includes(gz) && '괴강 일주 — 기운이 세고 결단력이 있다고 보는 일주예요. 극단으로 흐르기 쉽다고도 해요(戊戌을 넣는 유파도 있어요).',
    ['甲辰', '乙未', '丙戌', '丁丑', '戊辰', '壬戌', '癸丑'].includes(gz) && '백호 일주 — 예전엔 사고·피를 보는 살로 읽었고, 요즘은 강한 추진력·전문성으로 풀기도 해요.',
    isYangGan(g) && un === '제왕' && '양인 일주 — 일지가 일간의 양인(제왕) 자리라 기운이 아주 강하고 승부욕이 있다고 봐요.',
    un === '건록' && '건록 일주(전록) — 일지가 일간의 건록 자리라 스스로 서는 힘이 있다고 봐요.',
  ].filter(Boolean);
  openHint(`일주 ${gz} (${ko(gz)})`, [
    `일간 ${g}(${OH_KO[ohOf(g)]}·${isYangGan(g) ? '양' : '음'}) · 일지 ${z}(${OH_KO[ohOf(z)]}). 일간은 나, 일지는 배우자 자리이자 내가 서 있는 바탕(생활·몸)으로 봐요.`,
    `일지는 일간에게 ${iye(ss)}(정기 기준). ${SS_FLOW[ss]}. ${short(SS_ID[ss])}`,
    `지장간 ${[...MR_JJG[z]].map(s => `${s}(${sipsin(g, s)})`).join(' · ')} — 마지막이 정기예요.`,
    `12운성 ${un}: ${UNSEONG_NOTE[un]}.`,
    ...named,
  ], ['mr-ilgan', SS_ID[ss], 'mr-jijanggan', 'mr-12unseong', 'mr-gungwi', named.length ? 'mr-sinsal' : null].filter(Boolean));
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

// 칸 안의 글자 하나하나를 따로 누르게: 누르면 그 항목만 설명
const tip = (cls, kids, title, lines, ids = []) => cell(cls, kids, e => { e.stopPropagation(); openHint(title, lines.filter(Boolean), ids.filter(Boolean)); });
// 칸(궁·상자) 전체: 빈 곳이나 이름을 누르면 칸 통째 설명 (+ aiFor가 있으면 🤖 이 칸 해석하기)
function box(cls, kids, onClick) {
  const b = h('div', `${cls} clickable`, ...kids);
  b.addEventListener('click', onClick);
  return b;
}

// ================= 육임 =================
function drawLiuren(r, aiFor) {
  const jShort = j => LR_JIANG_SHORT[j] || '';
  const dg = r.day[0];
  const jiang = j => tip('jg', jShort(j), `천장 ${j}`, [short(JIANG_ID[j]), ...(TERMS.get(JIANG_ID[j])?.body || []).slice(0, 1)], [JIANG_ID[j], 'lr-cheonjang']);
  const dun = (d, z) => d
    ? tip('dun glyph', d, `둔간 ${d}`, [`${z}에 붙는 둔간이에요. 일진 ${r.day}의 순(旬) 안에서 이 지지와 짝이 되는 천간이에요.`, charInfo(d), short('lr-dungan')], ['lr-dungan'])
    : tip('dun glyph', r.kong.includes(z) ? '○' : '', '공망', [`${z}는 일진 공망(${r.kong.join('')})이라 둔간이 없어요. 허하거나 늦어진다고 보는 경우가 많아요.`], ['base-gongmang']);
  const up = z => tip(`oh-cell ${ohCls(z)}`, z, `천반 ${z}`, [charInfo(z), `일간 ${dg} 기준 육친: ${lrRel(dg, z)}${r.kong.includes(z) ? ' · 공망' : ''}`], ['lr-cheonjiban', 'lr-yukchin']);
  const down = (z, extra) => tip('down glyph', [z, extra], `지반 ${z}`, [charInfo(z), '지반은 움직이지 않는 열두 자리예요. 그 위에 월장을 점시에 맞춰 돌린 천반이 얹혀요.', z === r.shi ? '점친 시의 지지(점시)예요. 월장이 여기 얹혀요.' : ''], ['lr-cheonjiban', z === r.shi ? 'lr-jeomsi' : null]);
  const rel = (rl, kong) => tip('rel', `${rl}${kong ? ' · 공망' : ''}`, `육친 ${rl}`, [`일간 ${dg}(${OH_KO[ohOf(dg)]}) 기준으로 본 관계예요.`, short('lr-yukchin'), kong ? `일진 공망(${r.kong.join('')})에 들어요.` : ''], ['lr-yukchin', kong ? 'base-gongmang' : null]);
  const sanRow = h('div', 'lr-row three', ...r.san.map(s => box('lr-box', [
    h('div', 't', s.name), dun(s.dun, s.zhi),
    h('div', 'up glyph', jiang(s.jiang), up(s.zhi)),
    rel(s.rel, s.kong),
  ], () => sanHint(s, r, aiFor?.(`san${s.name}`, `삼전 ${s.name}: ${s.dun || '-'}${s.zhi} (육친 ${s.rel}, 천장 ${s.jiang}${s.kong ? ', 공망' : ''})`)))));
  const keRow = h('div', 'lr-row four', ...r.ke.map(k => box('lr-box', [
    h('div', 't', `${'一二三四'[k.n - 1]}課`), dun(k.dun, k.up),
    h('div', 'up glyph', jiang(k.jiang), up(k.up)),
    k.n === 1 ? tip('down glyph', k.down, `일간 ${k.down}`, [charInfo(k.down), '1과 아래는 일간이에요. 일간은 기궁(寄宮)한 지지 자리에 앉혀서 그 위를 봐요.'], ['lr-gigung', 'lr-sagwa']) : down(k.down),
  ], () => keHint(k, r, aiFor?.(`ke${k.n}`, `사과 ${k.n}과: ${k.down} 위 ${k.up} (천장 ${k.jiang}, 둔간 ${k.dun || '-'})`)))));
  // 천지반: 위 巳午未申, 오른쪽 酉戌, 아래 亥子丑寅(오른쪽→왼쪽), 왼쪽 卯辰(아래→위)
  const pos = { 巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4], 酉: [2, 4], 戌: [3, 4], 亥: [4, 4], 子: [4, 3], 丑: [4, 2], 寅: [4, 1], 卯: [3, 1], 辰: [2, 1] };
  const plate = h('div', 'lr-plate');
  for (const e of JI) {
    const t = r.plate[e], b = box('lr-box', [
      dun(r.dunPlate[e], t),
      h('div', 'up glyph', jiang(r.jiang[t]), up(t)),
      down(e, e === r.shi ? h('span', 'tag', '점시') : null),
    ], () => openHint(`지반 ${e} 위 천반 ${t}`, [
      `천반 ${charInfo(t)} · 천장 ${r.jiang[t]} · 둔간 ${r.dunPlate[e] || '없음(공망)'}`,
      `일간 ${dg} 기준 육친: ${lrRel(dg, t)}`, e === r.shi ? '점시 자리예요.' : '',
      short(JIANG_ID[r.jiang[t]]), aiFor?.(`plate${e}`, `천지반: 지반 ${e} 위 천반 ${t} (천장 ${r.jiang[t]}, 둔간 ${r.dunPlate[e] || '공망'}, 육친 ${lrRel(dg, t)})`),
    ].filter(Boolean), [JIANG_ID[r.jiang[t]], 'lr-cheonjiban', 'lr-yukchin']));
    b.style.gridRow = pos[e][0]; b.style.gridColumn = pos[e][1];
    plate.append(b);
  }
  const mid = METHOD_ID.find(([k]) => r.method.includes(k));
  plate.append(h('div', 'center',
    tip('wj', `${r.woljang} 월장 · ${r.shi}시`, `월장 ${r.woljang}`, [`${r.junggi} 뒤라 월장이 ${r.woljang}예요. 월장 ${r.woljang}을 점시 ${r.shi} 위에 얹고 열두 자리를 같이 돌려 천반을 만들어요.`, short('lr-woljang')], ['lr-woljang', 'lr-jeomsi']),
    button(r.method, () => openHint(r.method, [r.how, mid ? short(mid[1]) : ''], [mid?.[1], 'lr-gujongbeop'].filter(Boolean)), 'link mth'),
    tip('small muted', `${r.daynight} · 귀인 ${r.gui}(${r.guiDir})`, `${r.daynight} · 귀인 ${r.gui}`, [`${r.daynight}이라 일간 ${dg}의 귀인은 ${r.gui}예요.`, `귀인이 지반 ${r.guiOn}에 앉아 ${r.guiDir}해요(지반 亥~辰이면 순행, 巳~戌이면 역행).`, short('lr-gwiin')], ['lr-gwiin', 'lr-jujeom-yajeom', 'lr-sunyeok']),
    tip('small', ['공망 ', h('b', 'kong', r.kong.join(''))], `공망 ${r.kong.join('')}`, [`일진 ${r.day}의 순(旬)에서 빠진 두 지지예요. 이 글자가 삼전·사과에 오면 허하거나 늦어진다고 봐요.`], ['base-gongmang']),
  ));
  const meta = r.pillars ? h('div', 'board-meta',
    h('span', '', `${r.pillars.year}년 ${r.pillars.month}월 `, h('b', '', `${r.day}일 ${r.pillars.hour}시`)),
    h('span', '', `월장 ${r.woljang} (${r.junggi} 뒤)`)) : h('div', 'board-meta', h('span', '', h('b', '', `${r.day}일`), ` ${r.woljang}장 ${r.shi}시 ${r.daynight}`));
  return h('div', 'board', meta, h('h3', '', '삼전'), sanRow, h('h3', '', '사과'), keRow, h('h3', '', '천지반'), plate,
    h('p', 'hint', '💡 글자마다 따로 눌러 볼 수 있어요(둔간 · 천장 · 천반 · 지반 · 육친). 칸의 빈 곳이나 이름(초전·一課)을 누르면 그 칸을 통째로 보여 줘요.'));
}
function sanHint(s, r, ai) {
  const what = { 초전: '일의 발단·시작', 중전: '일이 진행되는 과정', 말전: '일의 결말' }[s.name];
  openHint(`${s.name} ${s.dun}${s.zhi}`, [
    `${s.name}은 흔히 ${what}으로 읽어요.`,
    `${charInfo(s.zhi)} · 천장 ${s.jiang} · 육친 ${s.rel}${s.dun ? ` · 둔간 ${s.dun}` : ''}`,
    s.kong ? `일진 공망(${r.kong.join('')})에 들어요. 공망이면 허하거나 늦어진다고 보는 경우가 많아요.` : '',
    short(JIANG_ID[s.jiang]), ai,
  ].filter(Boolean), [s.name === '초전' ? 'lr-chojeon' : s.name === '중전' ? 'lr-jungjeon' : 'lr-maljeon', 'lr-samjeon'].filter(Boolean));
}
function keHint(k, r, ai) {
  const g = (x, y) => GEUK[ohOf(x)] === ohOf(y);
  const rel = g(k.down, k.up) ? '아래가 위를 극해요(하적상).' : g(k.up, k.down) ? '위가 아래를 극해요(상극하).' : '서로 극하지 않아요.';
  const what = ['일간과 그 위(간상신)', '간상신과 그 위', '일지와 그 위(지상신)', '지상신과 그 위'][k.n - 1];
  openHint(`${k.n}과 ${k.up}/${k.down}`, [`${k.n}과는 ${what}예요. 1·2과는 나(일간), 3·4과는 상대·일(일지) 쪽으로 읽어요.`, `${k.up}(${OH_KO[ohOf(k.up)]}) / ${k.down}(${OH_KO[ohOf(k.down)]}) — ${rel}`,
    `천장 ${k.jiang}${k.dun ? ` · 둔간 ${k.dun}` : ''}`, ai].filter(Boolean),
    ['lr-sagwa', k.n === 1 ? 'lr-gigung' : null, JIANG_ID[k.jiang], 'lr-jeokgeuk'].filter(Boolean));
}

// ================= 기문 =================
const GIL_DOOR = ['개문', '휴문', '생문'], HYUNG_DOOR = ['상문', '사문', '경문(驚)'];
const QM_GUA = { 1: ['감(坎)', '水', '북'], 8: ['간(艮)', '土', '북동'], 3: ['진(震)', '木', '동'], 4: ['손(巽)', '木', '남동'], 9: ['리(離)', '火', '남'], 2: ['곤(坤)', '土', '남서'], 7: ['태(兌)', '金', '서'], 6: ['건(乾)', '金', '북서'], 5: ['중궁', '土', '가운데'] };
const QM_WHO = { 년: '윗사람·조상·나라', 월: '형제·동료·부모 세대', 일: '나', 시: '자녀·아랫사람, 점에서는 묻는 일' };

// ---------- 홍국 칸 (기문 명국 · 年局 · 月局 · 日局) ----------
const HK_YUN_MEAN = { 生氣: '살아나는 기운 — 시작·활력', 天宜: '하늘이 돕는 자리 — 건강·도와주는 사람', 絶體: '몸이 끊기는 자리 — 막힘·지침', 遊魂: '떠도는 혼 — 이동·들뜸',
  禍害: '재앙과 해 — 다툼·손해', 福德: '복과 덕 — 안정·복', 絶命: '목숨이 끊기는 자리 — 가장 흉하게 봐요', 歸魂: '돌아오는 혼 — 본자리·마무리' };
const HK_REL_MEAN = { // [남자, 여자] — 유파마다 조금씩 달라요
  兄: ['형제·친구·동료, 경쟁자', '형제·친구·동료, 경쟁자'], 孫: ['자녀·아랫사람, 재주·표현 (장모로 보기도)', '자녀·아랫사람, 재주·표현'],
  財: ['아내·재물 (아버지로 보기도)', '재물·시어머니 (아버지로 보기도)'], 官: ['직장·명예·윗사람 (딸로 보기도)', '남편·직장·명예'],
  鬼: ['질병·관재·경쟁자 (아들로 보기도)', '애인(남편 아닌 남자)·질병·관재'], 父: ['부모·윗사람·문서·학업', '부모·윗사람·문서·학업'], 世: ['나 자신', '나 자신'] };
const HK_REL_WHY = { 兄: '같은 오행', 孫: '내가 생하는 오행', 財: '내가 극하는 오행', 官: '나를 극하고 음양이 다른 것', 鬼: '나를 극하고 음양이 같은 것', 父: '나를 생하는 오행' };
const HK_GUK_MEAN = { 和局: '천반·지반이 서로 생하거나 같은 기운이라 순하게 흘러요.', 戰局: '천반·지반 오행이 서로 극해서 부딪히고 바뀌는 판으로 봐요.', 沖局: '천반·지반 지지가 충이라 부딪힘·이동이 많은 판으로 봐요.',
  怨嗔局: '천반·지반 지지가 원진이라 원망·애증이 얽히는 판으로 봐요.', 刑破害局: '천반·지반 지지가 형·파·해 관계라 꺾이고 깨지는 일을 조심하는 판으로 봐요.' };
const UN_KO = { 장생: '생', 목욕: '욕', 관대: '대', 건록: '록', 제왕: '왕', 쇠: '쇠', 병: '병', 사: '사', 묘: '묘', 절: '절', 태: '태', 양: '양' };
function hkCell(p, hv) {
  const hk = hv.hk, x = hk.palaces[p], g = hk.male ? 0 : 1, sOh = HK_OH(hk.seNum);
  const num = (n, side) => tip(`hk-num oh-tile oh-${HK_OH(n)}`, HK_HAN[n], `${side}반수 ${HK_HAN[n]}(${n})`, [
    `${OH_KO[HK_OH(n)]}(${HK_OH(n)})·${n % 2 ? '양' : '음'}, 지지로는 ${HK_JI[n]}`,
    side === '천' ? `천간수(甲1…癸10) 합 ${hk.sumG}을 9로 나눈 나머지 ${hk.ch}가 천반 중궁수예요. 바깥 궁은 ${hk.ch}에서 궁 번호를 빼서 놓아요(역포, 0은 十).`
      : `지지수(子1…亥12) 합 ${hk.sumJ}을 9로 나눈 나머지 ${hk.ce}가 지반 중궁수예요. 바깥 궁은 ${hk.ce}에 궁 번호를 더해 놓아요(순포, 일의 자리만, 0은 十).`,
    n === 10 ? `十은 빠진 수 ${side === '천' ? hk.missH : hk.missE}의 몫을 해요(대운 햇수).` : '', short('qm-hk-su')], ['qm-hk-su']);
  const rel = (r, n) => tip(`hk-rel${r === '世' ? ' se' : ''}`, r, `${r} — ${HK_REL_KO[r]}`, [
    r === '世' ? `일지 ${hk.dayJi}가 속한 궁이라 世(나의 자리)예요. 육친은 모두 世의 지반수 ${HK_HAN[hk.seNum]}(${OH_KO[sOh]})를 기준으로 봐요.`
      : `世의 지반수 ${HK_HAN[hk.seNum]}(${OH_KO[sOh]}·${hk.seNum % 2 ? '양' : '음'}) 기준으로 ${HK_HAN[n]}(${OH_KO[HK_OH(n)]}·${n % 2 ? '양' : '음'})는 ${HK_REL_WHY[r]}라 ${r}예요.`,
    `${hk.male ? '남자' : '여자'}에게는 ${HK_REL_MEAN[r][g]}`, r === '世' ? '' : `(${hk.male ? '여자' : '남자'}라면 ${HK_REL_MEAN[r][1 - g]}) 유파마다 조금씩 달라요.`], [r === '世' ? 'qm-hk-se' : 'qm-hk-yuk']);
  const du = (a, side) => a && hv.daeun ? tip('hk-du', `${a[0]}~${a[1]}`, `대운 ${a[0]}~${a[1]}세 (${side}반)`, [
    `1~45세는 世 궁(${QM_GUNG[hk.se]})부터 낙서 순서로 ${hk.male ? '거꾸로(남자, 추정)' : '차례로'} 돌며 지반수만큼 해를 나눠요. 46~90세는 다시 世 궁부터 ${hk.male ? '차례로(추정)' : '거꾸로'} 천반수만큼 나눠요.`,
    `十은 빠진 수만큼(천반 ${hk.missH || '-'}, 지반 ${hk.missE || '-'}), 아홉 궁을 다 돌면 1+2+…+9 = 45년이에요.`, short('qm-hk-daeun')], ['qm-hk-daeun']) : '';
  const rowH = h('div', 'hk-row', num(x.heaven, '천'), rel(x.relH, x.heaven), du(x.daeun?.heaven, '천'));
  const rowE = h('div', 'hk-row', num(x.earth, '지'), rel(x.relE, x.earth), du(x.daeun?.earth, '지'));
  const yun = x.yunyeon ? tip('hk-yun', x.yunyeon, `${x.yunyeon}`, [HK_YUN_MEAN[x.yunyeon],
    `지반 중궁수 ${hk.ce} → ${QM_GUNG[hk.base]}의 괘를 본괘로 삼고, 효를 위·가운데·아래·가운데… 차례로 바꿔 가며 생기·천의·절체·유혼·화해·복덕·절명·귀혼을 붙여요(본괘 자리가 귀혼).`, short('qm-hk-yunyeon')], ['qm-hk-yunyeon', 'base-palgwae']) : '';
  const un = x.unseong.length ? tip('hk-un', x.unseong.map(u => `${u.z}${UN_KO[u.u]}`).join(' '), '12운성 (홍국)', [
    ...x.unseong.map(u => `${u.z}: ${u.u}`), `世의 지반수 ${HK_HAN[hk.seNum]}를 천간 ${hk.seGan}(${OH_KO[ohOf(hk.seGan)]}·${isYangGan(hk.seGan) ? '양' : '음'})으로 보고, 이 궁의 지지에서 12운성을 매겨요.`], ['mr-12unseong', 'qm-hk-se']) : '';
  const lab = x.label ? tip('hk-lab', x.label, x.label, [`천반수 ${HK_HAN[x.heaven]}를 지지 ${HK_JI[x.heaven]}, 지반수 ${HK_HAN[x.earth]}를 ${HK_JI[x.earth]}로 보면 둘이 ${x.label.slice(2)} 관계예요.`,
    '형(刑)은 꺾임·다툼, 파(破)는 깨짐, 해·살(害·殺)은 해침·손해, 충(沖)은 부딪힘·이동으로 봐요.', short('qm-hk-rel')], ['qm-hk-rel', 'base-hyeong', 'base-chung']) : '';
  const kong = p !== 5 && [...QM_GUNG_JI[p]].some(z => hk.kongDay.includes(z)) ? tip('hk-kong', '○', `일공 ${hk.kongDay.join('')}`, [`일주 순(旬)의 공망 ${hk.kongDay.join('')}이 이 궁 지지에 들어요. 이 궁의 일은 비거나 늦어진다고 봐요.`], ['base-gongmang']) : '';
  const yr = hv.years?.[p] ? tip(`hk-yr${hv.years[p] === hv.thisYear ? ' now' : ''}`, String(hv.years[p]), `${hv.years[p]}년 (${hv.years[p] - hk.sajuYear + 1}세)`, [
    `행년이 이 궁에 드는 해예요. 올해부터 9년을 아홉 궁에 하나씩 적었어요${hv.years[p] === hv.thisYear ? ' — 올해예요' : ''}.`, short('qm-hk-haeng')], ['qm-hk-haeng']) : '';
  const mo = hv.months?.[p]?.length ? tip(`hk-yr${hv.months[p].includes(hv.nowMonth) ? ' now' : ''}`, `${hv.months[p].join('·')}월`, `음력 ${hv.months[p].join('·')}월`, [
    `이 해의 달이 머무는 궁이에요. 행년 궁에서 1월을 시작해 행년과 같은 방향으로 한 궁씩 옮겨요.`, '(추정 규칙 — 참고 앱과 아직 맞춰 보지 못했어요.)', short('qm-hk-haeng')], ['qm-hk-haeng', 'qm-hk-gukgi']) : '';
  const ages = hv.ages && x.ages.length ? tip('hk-ages', x.ages.join(','), '행년 나이', [`이 나이에 운이 이 궁에 머물러요(세는 나이, ${hk.sajuYear}년이 1세).`,
    hk.male ? '남자: 甲子년(1984·2044)을 태7궁에 두고 해마다 한 궁씩 거꾸로(추정 — 참고 앱과 아직 못 맞춤).' : '여자: 甲子년(1984·2044)을 간8궁에 두고 해마다 한 궁씩 차례로(참고 앱과 맞춤).', short('qm-hk-haeng')], ['qm-hk-haeng']) : '';
  const hint = [
    `홍국: 천반수 ${HK_HAN[x.heaven]}(${x.relH}) · 지반수 ${HK_HAN[x.earth]}(${x.relE})`, x.daeun ? `대운: 천반 ${x.daeun.heaven.join('~')}세 · 지반 ${x.daeun.earth.join('~')}세` : '',
    x.yunyeon ? `유년 ${x.yunyeon} — ${HK_YUN_MEAN[x.yunyeon]}` : '', x.unseong.length ? `12운성 ${x.unseong.map(u => `${u.z} ${u.u}`).join(' · ')}` : '',
    x.label ? `${x.label}` : '', hv.years?.[p] ? `${hv.years[p]}년이 이 궁` : '', hv.months?.[p]?.length ? `음력 ${hv.months[p].join('·')}월이 이 궁(추정)` : ''].filter(Boolean);
  const focus = `홍국 천반수 ${x.heaven}(${x.relH}) 지반수 ${x.earth}(${x.relE})${x.daeun ? ` 대운 ${x.daeun.heaven.join('~')}/${x.daeun.earth.join('~')}세` : ''}${x.yunyeon ? ` ${x.yunyeon}` : ''}${x.label ? ` ${x.label}` : ''}`;
  return { top: h('div', 'hk-top', yr, mo, h('span', 'grow'), kong), lab: lab ? h('div', 'hk-top', lab) : '', rowH, rowE, rowY: h('div', 'hk-row small', yun, ' ', un), ages, hint, focus };
}
function drawQimen(r, aiFor, hv) { // hv: 홍국 { hk, years, months, ages, layer }
  const grid = h('div', 'qm-grid');
  const P = r.pillars ? { 년: r.pillars.year, 월: r.pillars.month, 일: r.pillars.day, 시: r.pillars.hour } : {};
  for (const p of [4, 9, 2, 3, 5, 7, 8, 1, 6]) {
    const x = r.palaces[p];
    const kong = p !== 5 && [...(QM_GUNG_JI[p] || '')].some(z => r.kong.includes(z));
    const mk = r.marks?.[p];
    const [gua, oh, dir] = QM_GUA[p];
    const gungLine = `${gua} · 오행 ${OH_KO[oh]}(${oh}) · ${dir}${QM_GUNG_JI[p] ? ` · 지지 ${[...QM_GUNG_JI[p]].join('·')}` : ''}`;
    const gname = h('div', 'gname', QM_GUNG[p]); // 이름을 누르면 칸 통째 설명(칸 클릭)
    const marks = h('div', 'marks',
      p === r.zhifuTo ? tip('tag', '직부', `직부 ${r.zhifu}`, [`순수 ${r.xun}의 의(${r.fuYi})가 지반에 있던 궁의 별 ${r.zhifu}가 직부가 되어 시간(時干) 자리로 와요. 이 궁이 그 자리예요.`, short('qm-jikbu')], ['qm-jikbu', 'qm-sunsu']) : null,
      p === r.zhishiTo ? tip('tag', '직사', `직사 ${r.zhishi}`, [`순수 궁의 문 ${r.zhishi}가 직사가 되어 시지까지 센 만큼 옮겨 와요. 이 궁이 그 자리예요.`, short('qm-jiksa')], ['qm-jiksa', 'qm-sunsu']) : null,
      kong ? tip('tag bad', '공망', `공망 ${r.kong.join('')}`, [`시순 공망(${r.kong.join('')})이 이 궁의 지지(${[...QM_GUNG_JI[p]].join('·')})에 들어요. 이 궁의 일은 비거나 늦어진다고 봐요.`, short('qm-gongmang')], ['qm-gongmang']) : null,
      mk?.gan.length ? tip('tag ink', `${mk.gan.join('')}간`, `${mk.gan.map(w => `${w}간 ${P[w]?.[0] || ''}`).join(' · ')}`, [
        `${mk.gan.join('·')} 천간이 지반에 앉은 궁이에요(甲은 그 기둥의 순수 의로 찾아요).`,
        ...mk.gan.map(w => `${w}간 — ${QM_WHO[w]}`)], ['qm-jiban', 'qm-samgi-yugui']) : null,
      mk?.ji.length ? tip('tag soft', `${mk.ji.join('')}지`, `${mk.ji.map(w => `${w}지 ${P[w]?.[1] || ''}`).join(' · ')}`, [
        `${mk.ji.join('·')} 지지가 속한 궁이에요(${gua}: ${[...(QM_GUNG_JI[p] || '')].join('·')}).`, ...mk.ji.map(w => `${w}지 — ${QM_WHO[w]}`)], ['qm-gugung']) : null);
    const hc = hv && hv.layer !== 'yeon' ? hkCell(p, hv) : null, yeon = !hc || hv.layer === 'both';
    const now = hc && ((hv.years?.[p] && hv.years[p] === hv.thisYear) || (hv.months?.[p] || []).includes(hv.nowMonth));
    if (hc && hv.haeng === p) marks.prepend(tip('tag warn', '行年', `행년 ${hv.haengYear}`, [`${hv.haengYear}년(${hv.haengYear - hv.hk.sajuYear + 1}세) 행년이 드는 궁이에요${hv.haengFrom5 ? '(중5궁 → 곤2궁 기궁)' : ''}.`, short('qm-hk-haeng')], ['qm-hk-haeng']));
    const earth = tip('e', x.earth, `지반 ${x.earth}`, [charInfo(x.earth), `${r.dun} ${r.ju}국이라 이 궁 지반에 ${x.earth}가 놓여요. 지반은 국수로 정해지고 시가 바뀌어도 그대로예요.`, short('qm-jiban')], ['qm-jiban', 'qm-guksu', 'qm-samgi-yugui']);
    if (p === 5) {
      const hk = hv?.hk;
      grid.append(box(`qm-cell center${hc ? ' hk' : ''}${now ? ' now' : ''}`, [gname, marks,
        hc ? h('div', 'hk-top', tip('hk-guk', hk.guk, hk.guk, [`중궁 천반수 ${HK_HAN[hk.ch]}(${OH_KO[HK_OH(hk.ch)]}) · 지반수 ${HK_HAN[hk.ce]}(${OH_KO[HK_OH(hk.ce)]})`, HK_GUK_MEAN[hk.guk],
          '바탕 다섯 국(和局·戰局·沖局·怨嗔局·刑破害局): 두 수의 오행이 서로 극하면 戰局, 아니면 두 수를 지지로 바꿨을 때의 충·원진·형파해로 정해요(참고 앱과 맞춘 규칙).', short('qm-hk-guk')], ['qm-hk-guk']),
          hc.top.querySelector('.hk-yr') || '', h('span', 'grow')) : '',
        hc ? hc.lab : '', hc ? hc.rowH : '', hc ? hc.rowE : '', yeon ? h('div', 'stems glyph', earth) : '',
        yeon ? h('div', '', tip('small muted', `${r.dun} ${r.ju}국`, `${r.dun} ${r.ju}국`, [r.term ? `${r.term} ${r.yuan}(부두 ${r.futou})이라 ${r.dun} ${r.ju}국이에요.` : '', short('qm-guksu')], ['qm-guksu', 'qm-yangdun-eumdun', 'qm-samwon', 'qm-budu'])) : '',
        yeon ? h('div', '', tip('small muted', `${r.shi}시`, `${r.shi}시 · 순수 ${r.xun}`, [`시주 ${r.shi}는 ${r.xun} 순이라 순수 의는 ${r.fuYi}예요. 직부 ${r.zhifu}, 직사 ${r.zhishi}.`, short('qm-sunsu')], ['qm-sunsu', 'qm-jikbu', 'qm-jiksa'])) : '', hc ? hc.ages : ''],
        () => openHint(QM_GUNG[5], [gungLine, hc ? `${hk.guk} — ${HK_GUK_MEAN[hk.guk]}` : '', ...(hc ? hc.hint : []), `지반 ${x.earth}. 중궁은 문·신이 없고, 이 앱에서는 곤2궁에 붙여(기궁) 움직여요.`, r.term ? `${r.term} ${r.yuan}(부두 ${r.futou}) · ${r.dun} ${r.ju}국 · ${r.shi}시` : `${r.dun} ${r.ju}국 · ${r.shi}시`,
          mk?.gan.length ? `${mk.gan.join('·')} 천간이 지반에 앉은 궁이에요. ${mk.gan.map(w => `${w}간 — ${QM_WHO[w]}`).join(' · ')}` : '',
          aiFor?.('p5', `중5궁: 지반 ${x.earth}${mk?.gan.length ? ` · ${mk.gan.join('')}간` : ''}${hc ? ` · ${hk.guk} · ${hc.focus}` : ''}`)].filter(Boolean), ['qm-gigung', 'qm-gugung', 'qm-guksu', hc ? 'qm-hk-guk' : null].filter(Boolean))));
      continue;
    }
    const doorCls = GIL_DOOR.includes(x.door) ? 'gil' : HYUNG_DOOR.includes(x.door) ? 'hyung' : '';
    const starName = x.star.split('·')[0];
    const palaceHint = () => openHint(`${QM_GUNG[p]} · 칸 전체`, [
      gungLine,
      `천반 ${x.heaven} / 지반 ${x.earth}`,
      `구성 ${x.star} — ${short(STAR_ID[starName])}`,
      `팔문 ${x.door} — ${short(DOOR_ID[x.door])}`,
      `팔신 ${x.god} — ${short(GOD_ID[x.god])}`,
      p === r.zhifuTo ? `직부(${r.zhifu})가 와 있는 궁이에요.` : '',
      p === r.zhishiTo ? `직사(${r.zhishi})가 와 있는 궁이에요.` : '',
      kong ? `시순 공망(${r.kong.join('')})이 든 궁이에요.` : '',
      mk?.gan.length ? `${mk.gan.join('·')} 천간이 지반에 앉은 궁이에요. ${mk.gan.map(w => `${w}간 — ${QM_WHO[w]}`).join(' · ')}` : '',
      mk?.ji.length ? `${mk.ji.join('·')}지가 속한 궁이에요.` : '',
      ...(hc ? hc.hint : []),
      aiFor?.(`p${p}`, `${QM_GUNG[p]}: 천반 ${x.heaven} / 지반 ${x.earth} / ${x.star} / ${x.door} / ${x.god}` +
        [p === r.zhifuTo && '직부', p === r.zhishiTo && '직사', kong && '공망', mk?.gan.length && `${mk.gan.join('')}간`, mk?.ji.length && `${mk.ji.join('')}지`, hc?.focus].filter(Boolean).map(t => ` / ${t}`).join('')),
    ].filter(Boolean), [STAR_ID[starName], DOOR_ID[x.door], GOD_ID[x.god], 'qm-cheonban', kong ? 'qm-gongmang' : null].filter(Boolean));
    grid.append(box(`qm-cell${hc ? ' hk' : ''}${now ? ' now' : ''}`, [gname, marks, ...(hc ? [hc.top, hc.lab, hc.rowH, hc.rowE, hc.rowY] : []),
      !yeon ? '' : h('div', '', tip('god', x.god, `팔신 ${x.god}`, [short(GOD_ID[x.god]), ...(TERMS.get(GOD_ID[x.god])?.body || []).slice(0, 1)], [GOD_ID[x.god], 'qm-palsin'])),
      !yeon ? '' : h('div', '', tip('star', x.star, `구성 ${x.star}`, [short(STAR_ID[starName]), x.star.includes('·') ? '천금성은 중5궁의 별이라 곤2궁의 천예와 함께 움직여요(기궁).' : ''], [STAR_ID[starName], 'qm-guseong', x.star.includes('·') ? 'qm-gigung' : null])),
      !yeon ? '' : h('div', 'stems glyph', tip(`oh-cell ${ohCls(x.heaven[0])}`, x.heaven, `천반 ${x.heaven}`, [...[...x.heaven].map(charInfo), `지반 ${x.earth} 위에 얹힌 천반이에요. 천반은 직부를 따라 시마다 돌아요.`,
        x.heaven.length > 1 ? `뒤 글자 ${x.heaven[1]}는 중5궁 지반 천간이 곤2궁에 기궁해 함께 온 거예요.` : '', short('qm-cheonban')], ['qm-cheonban', 'qm-jeonban', x.heaven.length > 1 ? 'qm-gigung' : null]), ' ', earth),
      !yeon ? '' : h('div', '', tip(`door ${doorCls}`, x.door, `팔문 ${x.door}`, [short(DOOR_ID[x.door]), ...(TERMS.get(DOOR_ID[x.door])?.body || []).slice(0, 1)], [DOOR_ID[x.door], 'qm-palmun', 'qm-gilmun'])), hc ? hc.ages : ''], palaceHint));
  }
  const meta = h('div', 'board-meta',
    r.term ? h('span', '', h('b', '', `${r.zr?.leap ? '윤' : ''}${r.term} ${r.yuan}`), ` (부두 ${r.futou})`) : null,
    r.zr ? tip('', r.zr.d > 0 ? `초신 ${r.zr.d}일` : r.zr.d < 0 ? `접기 ${-r.zr.d}일` : '정수', '초신접기(置閏法)', [
      `이 판은 🔧 보정의 초신접기법으로 국을 정했어요. ${r.term} 국은 상원 부두일부터 시작하는데, ${r.zr.d > 0 ? `부두가 절입보다 ${r.zr.d}일 먼저 와서 초신이에요` : r.zr.d < 0 ? `부두가 절입보다 ${-r.zr.d}일 늦게 와서 접기예요` : '부두와 절입이 같은 날이라 정수예요'}.`,
      r.zr.leap ? `초신이 9일 이상 쌓여서 ${r.term}을 한 번 더 쓰는 윤국이에요.` : '', short('qm-chosin')], ['qm-chosin', 'qm-chaibo']) : null,
    h('span', '', h('b', '', `${r.dun} ${r.ju}국`), ` · ${r.shi}시`),
    h('span', '', `순수 ${r.xun}${r.fuYi} → 직부 ${r.zhifu}, 직사 ${r.zhishi}`),
    h('span', '', '공망 ', h('b', 'kong', r.kong.join(''))),
    r.pillars ? h('span', '', `${r.pillars.year}년 ${r.pillars.month}월 ${r.pillars.day}일`) : null);
  return h('div', 'board', meta, grid, h('p', 'hint', hv && hv.layer !== 'yeon'
    ? '홍국: 위에서부터 연도(또는 달)·형충파해, 천반수·육친·대운, 지반수·육친·대운, 유년·12운성' + (hv.layer === 'both' ? ', 그 아래 연국(팔신·구성·천반간과 지반간·팔문)' : '') + ', 맨 아래 행년 나이. ' : '칸마다 위에서부터 팔신 · 구성 · 천반간(큰 글자)과 지반간 · 팔문. ',
    '위쪽이 남쪽이에요. 글자·표시를 하나씩 누르면 그것만, 궁 이름이나 빈 곳을 누르면 그 궁을 통째로 보여 줘요.',
    r.marks ? ' 진한 표시(예: 시일간)는 년·월·일·시 천간이 지반에 있는 궁(甲은 순수 의), 연한 표시(예: 년지)는 그 지지가 속한 궁이에요.' : ''));
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
