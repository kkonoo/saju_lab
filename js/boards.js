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
function drawQimen(r, aiFor) {
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
    const earth = tip('e', x.earth, `지반 ${x.earth}`, [charInfo(x.earth), `${r.dun} ${r.ju}국이라 이 궁 지반에 ${x.earth}가 놓여요. 지반은 국수로 정해지고 시가 바뀌어도 그대로예요.`, short('qm-jiban')], ['qm-jiban', 'qm-guksu', 'qm-samgi-yugui']);
    if (p === 5) {
      grid.append(box('qm-cell center', [gname, marks, h('div', 'stems glyph', earth),
        h('div', '', tip('small muted', `${r.dun} ${r.ju}국`, `${r.dun} ${r.ju}국`, [r.term ? `${r.term} ${r.yuan}(부두 ${r.futou})이라 ${r.dun} ${r.ju}국이에요.` : '', short('qm-guksu')], ['qm-guksu', 'qm-yangdun-eumdun', 'qm-samwon', 'qm-budu'])),
        h('div', '', tip('small muted', `${r.shi}시`, `${r.shi}시 · 순수 ${r.xun}`, [`시주 ${r.shi}는 ${r.xun} 순이라 순수 의는 ${r.fuYi}예요. 직부 ${r.zhifu}, 직사 ${r.zhishi}.`, short('qm-sunsu')], ['qm-sunsu', 'qm-jikbu', 'qm-jiksa']))],
        () => openHint(QM_GUNG[5], [gungLine, `지반 ${x.earth}. 중궁은 문·신이 없고, 이 앱에서는 곤2궁에 붙여(기궁) 움직여요.`, r.term ? `${r.term} ${r.yuan}(부두 ${r.futou}) · ${r.dun} ${r.ju}국 · ${r.shi}시` : `${r.dun} ${r.ju}국 · ${r.shi}시`,
          mk?.gan.length ? `${mk.gan.join('·')} 천간이 지반에 앉은 궁이에요. ${mk.gan.map(w => `${w}간 — ${QM_WHO[w]}`).join(' · ')}` : '',
          aiFor?.('p5', `중5궁: 지반 ${x.earth}${mk?.gan.length ? ` · ${mk.gan.join('')}간` : ''}`)].filter(Boolean), ['qm-gigung', 'qm-gugung', 'qm-guksu'])));
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
      aiFor?.(`p${p}`, `${QM_GUNG[p]}: 천반 ${x.heaven} / 지반 ${x.earth} / ${x.star} / ${x.door} / ${x.god}` +
        [p === r.zhifuTo && '직부', p === r.zhishiTo && '직사', kong && '공망', mk?.gan.length && `${mk.gan.join('')}간`, mk?.ji.length && `${mk.ji.join('')}지`].filter(Boolean).map(t => ` / ${t}`).join('')),
    ].filter(Boolean), [STAR_ID[starName], DOOR_ID[x.door], GOD_ID[x.god], 'qm-cheonban', kong ? 'qm-gongmang' : null].filter(Boolean));
    grid.append(box('qm-cell', [gname, marks,
      h('div', '', tip('god', x.god, `팔신 ${x.god}`, [short(GOD_ID[x.god]), ...(TERMS.get(GOD_ID[x.god])?.body || []).slice(0, 1)], [GOD_ID[x.god], 'qm-palsin'])),
      h('div', '', tip('star', x.star, `구성 ${x.star}`, [short(STAR_ID[starName]), x.star.includes('·') ? '천금성은 중5궁의 별이라 곤2궁의 천예와 함께 움직여요(기궁).' : ''], [STAR_ID[starName], 'qm-guseong', x.star.includes('·') ? 'qm-gigung' : null])),
      h('div', 'stems glyph', tip(`oh-cell ${ohCls(x.heaven[0])}`, x.heaven, `천반 ${x.heaven}`, [...[...x.heaven].map(charInfo), `지반 ${x.earth} 위에 얹힌 천반이에요. 천반은 직부를 따라 시마다 돌아요.`,
        x.heaven.length > 1 ? `뒤 글자 ${x.heaven[1]}는 중5궁 지반 천간이 곤2궁에 기궁해 함께 온 거예요.` : '', short('qm-cheonban')], ['qm-cheonban', 'qm-jeonban', x.heaven.length > 1 ? 'qm-gigung' : null]), ' ', earth),
      h('div', '', tip(`door ${doorCls}`, x.door, `팔문 ${x.door}`, [short(DOOR_ID[x.door]), ...(TERMS.get(DOOR_ID[x.door])?.body || []).slice(0, 1)], [DOOR_ID[x.door], 'qm-palmun', 'qm-gilmun']))], palaceHint));
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
  return h('div', 'board', meta, grid, h('p', 'hint', '칸마다 위에서부터 팔신 · 구성 · 천반간(큰 글자)과 지반간 · 팔문. 위쪽이 남쪽이에요. 글자·표시를 하나씩 누르면 그것만, 궁 이름이나 빈 곳을 누르면 그 궁을 통째로 보여 줘요.',
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
