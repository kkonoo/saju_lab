'use strict';
// 판 그리기: 명리 원국 · 육임 과전 · 기문 9궁 · 타로 스프레드. 칸을 누르면 풀이 힌트

const SS_ID = { 비견: 'mr-bigyeon', 겁재: 'mr-geopjae', 식신: 'mr-siksin', 상관: 'mr-sanggwan', 편재: 'mr-pyeonjae', 정재: 'mr-jeongjae', 편관: 'mr-pyeongwan', 정관: 'mr-jeonggwan', 편인: 'mr-pyeonin', 정인: 'mr-jeongin' };
const JIANG_ID = { 귀인: 'lr-gwiin', 등사: 'lr-deungsa', 주작: 'lr-jujak', 육합: 'lr-yukhap', 구진: 'lr-gujin', 청룡: 'lr-cheongnyong', 천공: 'lr-cheongong', 백호: 'lr-baekho', 태상: 'lr-taesang', 현무: 'lr-hyeonmu', 태음: 'lr-taeeum', 천후: 'lr-cheonhu' };
const STAR_ID = { 천봉: 'qm-s-bong', 천예: 'qm-s-ye', 천충: 'qm-s-chung', 천보: 'qm-s-bo', 천금: 'qm-s-geum', 천심: 'qm-s-sim', 천주: 'qm-s-ju', 천임: 'qm-s-im', 천영: 'qm-s-yeong' };
const DOOR_ID = { 휴문: 'qm-d-hyu', 생문: 'qm-d-saeng', 상문: 'qm-d-sang', 두문: 'qm-d-du', '경문(景)': 'qm-d-gyeong9', 사문: 'qm-d-sa', '경문(驚)': 'qm-d-gyeong7', 개문: 'qm-d-gae' };
const GOD_ID = { 직부: 'qm-g-jikbu', 등사: 'qm-g-deungsa', 태음: 'qm-g-taeeum', 육합: 'qm-g-yukhap', 백호: 'qm-g-baekho', 현무: 'qm-g-hyeonmu', 구진: 'qm-g-gujin', 주작: 'qm-g-jujak', 구지: 'qm-g-guji', 구천: 'qm-g-gucheon' };
const JIANG_HJ = { 귀인: ['貴人', '土'], 등사: ['螣蛇', '火'], 주작: ['朱雀', '火'], 육합: ['六合', '木'], 구진: ['勾陳', '土'], 청룡: ['靑龍', '木'], 천공: ['天空', '土'], 백호: ['白虎', '金'], 태상: ['太常', '土'], 현무: ['玄武', '水'], 태음: ['太陰', '金'], 천후: ['天后', '水'] };
const SS_HJ = { 비견: '比肩', 겁재: '劫財', 식신: '食神', 상관: '傷官', 편재: '偏財', 정재: '正財', 편관: '偏官', 정관: '正官', 편인: '偏印', 정인: '正印', 일간: '日干' };
const LR_REL_HJ = { 부모: '父母', 형제: '兄弟', 자손: '子孫', 처재: '妻財', 관귀: '官鬼' };
const khs = (k, hj) => (hj ? [k, h('span', 'hj', `(${hj})`)] : k); // 칸 안 한글(한자): 한자는 작게
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
// 칩으로 켜고 끄는 층(뼈대인 천간·지지는 늘 보임). show가 없으면(개념 사례 판) 기본값 = 다 켬
const MR_CHIPS = [['ss', '십신'], ['jjg', '지장간'], ['un', '12운성'], ['oh', '오행 개수'], ['rel', '합·충'], ['daeun', '대운'], ['seun', '세운']];
const MR_SHOW_DEF = Object.fromEntries(MR_CHIPS.map(([k]) => [k, true]));
function drawPillars(r, show = MR_SHOW_DEF) {
  const cols = [...r.pillars].reverse(); // 시 일 월 년 (오른쪽이 년)
  const g = h('div', `pillars${cols.length === 3 ? ' three' : ''}`);
  const row = (label, f, k) => { if (!k || show[k]) g.append(h('div', 'lbl', label), ...cols.map(f)); };
  row('', p => h('div', 'head', `${p.pos}주`));
  row('십신', p => cell('ss', khs(p.ganSs, SS_HJ[p.ganSs]), () => ssHint(p.ganSs, `${p.pos}간 ${p.gan}`)), 'ss');
  row('천간', p => cell(`big glyph oh-tile ${ohCls(p.gan)}`, p.gan, () => ganHint(p, r)));
  row('지지', p => cell(`big glyph oh-tile ${ohCls(p.zhi)}`, p.zhi, () => zhiHint(p, r)));
  row('십신', p => cell('ss', khs(p.zhiSs, SS_HJ[p.zhiSs]), () => ssHint(p.zhiSs, `${p.pos}지 ${p.zhi}의 정기`)), 'ss');
  row('지장간', p => cell('jjg', p.jjg.map(x => x.g).join(''), () => zhiHint(p, r)), 'jjg');
  row('12운성', p => cell('ss', khs(p.unseong, UN_HJ[p.unseong]?.[0]), () => openHint(`12운성 · ${p.unseong}(${UN_HJ[p.unseong]?.[0]})`, [`일간 ${r.dayGan}이(가) ${p.pos}지 ${p.zhi}에서 '${p.unseong}'이에요.`, short('mr-12unseong')], ['mr-12unseong'])), 'un');
  const ohbar = show.oh && h('div', 'ohbar', ...Object.entries(r.count).map(([o, n]) => cell(`oh-tile oh-${o}`, `${o} ${OH_KO[o]} ${n}`, () => openHint(`${OH_KO[o]}(${o}) ${n}개`, [`천간·지지 겉글자만 센 개수예요(지장간 제외). 일간 ${r.dayGan}(${OH_KO[ohOf(r.dayGan)]}) 기준으로 ${ohRole(ohOf(r.dayGan), o)}이에요.`, short('mr-ohaeng-balance')], ['mr-ohaeng-balance', 'base-ohaeng']))));
  const rel = show.rel && r.relations.length ? h('div', 'chips', h('span', 'hint', '🔗 합·충'), ...r.relations.map(x => button(x.text, () => openTermDlg(x.term), 'chip'))) : null;
  const meta = h('div', 'board-meta', h('span', '', '공망 ', h('b', 'kong', r.kong.join(''))), h('span', '', '일간 ', h('b', '', charInfo(r.dayGan))));
  const parts = [g, ohbar, rel, meta];
  if (r.daeun) parts.push(...daeunStrip(r, show));
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
  if (ss === '일간') return openHint('일간(日干) — 나', [short('mr-ilgan'), '다른 글자의 십신은 모두 일간을 기준으로 정해요.'], ['mr-ilgan', 'mr-sipsin']);
  openHint(`${ss}(${SS_HJ[ss]}) · ${where}`, [short(SS_ID[ss]), ...(TERMS.get(SS_ID[ss])?.body || []).slice(0, 1)], [SS_ID[ss], 'mr-sipsin']);
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
function daeunStrip(r, show) {
  const nowYear = new Date().getFullYear(), age = nowYear - new Date(r.info.utc).getUTCFullYear() + 1; // 세는 나이
  const strip = h('div', 'daeun');
  for (const d of r.daeun) {
    const now = age >= d.age && age < d.age + 10;
    strip.append(cell(now ? 'now' : '', [h('div', 'age', d.age), h('div', `gz glyph`, h('span', `oh-cell ${ohCls(d.gz[0])}`, d.gz[0]), h('br'), h('span', `oh-cell ${ohCls(d.gz[1])}`, d.gz[1])), show.ss && h('div', 'ss2', `${d.ganSs}·${d.zhiSs}`)],
      () => openHint(`대운 ${d.gz} (${d.age}~${d.age + 9}세)`, [`천간 ${d.gz[0]}은 ${d.ganSs}, 지지 ${d.gz[1]}는 ${d.zhiSs}(정기 기준), 12운성 ${d.unseong}이에요.`, '대운은 보통 앞 5년은 천간, 뒤 5년은 지지를 더 본다고 하지만 10년을 하나로 보는 쪽도 있어요.'], ['mr-daeun', SS_ID[d.ganSs], SS_ID[d.zhiSs]])));
  }
  const seunRow = h('div', 'daeun');
  for (let y = nowYear; y < nowYear + 10; y++) {
    const s = seun(y, r.dayGan);
    seunRow.append(cell(y === nowYear ? 'now' : '', [h('div', 'age', y), h('div', 'gz glyph', h('span', `oh-cell ${ohCls(s.gz[0])}`, s.gz[0]), h('br'), h('span', `oh-cell ${ohCls(s.gz[1])}`, s.gz[1])), show.ss && h('div', 'ss2', `${s.ganSs}·${s.zhiSs}`)],
      () => openHint(`${y}년 세운 ${s.gz}`, [`입춘부터 다음 입춘 전까지예요. 천간 ${s.gz[0]} ${s.ganSs}, 지지 ${s.gz[1]} ${s.zhiSs}, 12운성 ${s.unseong}.`], ['mr-seun', SS_ID[s.ganSs], SS_ID[s.zhiSs]])));
  }
  return [
    ...(show.daeun ? [h('h3', '', `📈 대운 `, h('span', 'hint', `${r.forward ? '순행' : '역행'} · 대운수 ${r.daeunsu} (절입까지 ${r.daeunDays.toFixed(1)}일 ÷ 3) · 지금 ${age}세(세는 나이)`)), strip] : []),
    ...(show.seun ? [h('h3', '', '📅 세운'), seunRow] : []),
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
// 칩으로 켜고 끄는 층(뼈대인 천반·지반은 늘 보임). show가 없으면(개념 사례 판) 기본값
const LR_CHIPS = [['jiang', '천장'], ['dun', '둔간'], ['rel', '육친'], ['un', '12운성'], ['ss', '신살']];
const LR_SHOW_DEF = { jiang: true, dun: true, rel: true };
const LR_SS = { // 신살 → [한글, 한자, 뜻] (日·歲 붙은 것은 둘째 글자로)
  祿: ['일록', '日祿', '일간의 녹 — 먹고사는 힘·자리·봉급'], 德: ['일덕', '日德', '일간의 덕 — 흉을 누그러뜨리고 돕는 힘'],
  刃: ['양인', '羊刃', '녹이 지나쳐 날이 선 자리 — 다툼·다침·과감함'], 馬: ['역마', '驛馬', '이동·변동·바깥 활동'],
  桃: ['도화', '桃花·咸池', '매력·인기·이성, 흐트러짐'], 華: ['화개', '華蓋', '예술·종교·학문, 홀로 깊어짐'],
  劫: ['겁살', '劫煞', '빼앗기거나 갑자기 꺾이는 일'], 亡: ['망신', '亡神', '체면이 깎이거나 구설·잃음'],
  丁馬: ['정마', '丁馬', '갑작스러운 움직임·변동'], 天馬: ['천마', '天馬', '이동·승진이 순조로움'], 天喜: ['천희', '天喜', '경사·혼인·좋은 소식'],
};
const LR_INN = { rok: '녹 앞 한 자리(10간 모두)', yang: '양간만', back: '음간은 녹 뒤 한 자리' };
function drawLiuren(r, aiFor, show = LR_SHOW_DEF) {
  const jShort = j => LR_JIANG_SHORT[j] || '';
  const dg = r.day[0], dz = r.day[1], on = k => !!show[k];
  const ssBy = n => { // 신살이 무엇 기준인지
    if (n === '丁馬') return `일진 ${r.day}의 순(旬)에서 丁이 붙는 지지`;
    if (n[0] === '天') return `월건 ${r.pillars.month[1]} 기준${n === '天馬' ? '(寅·申월 午, 卯·酉월 申, 辰·戌월 戌, 巳·亥월 子, 午·子월 寅, 未·丑월 辰)' : '(봄 戌, 여름 丑, 가을 辰, 겨울 未)'}`;
    if (n === '羊刃') return `일간 ${dg}의 녹(${HK_ROK[dg]}) 기준, ${LR_INN[r.rules.inn]}`;
    if ('祿德'.includes(n[1])) return `일간 ${dg} 기준`;
    const z = n[0] === '歲' ? r.pillars.year[1] : dz;
    return `${n[0] === '歲' ? '태세(연지)' : '일지'} ${z}의 삼합 ${HK_SAMHAP[z]} 기준`;
  };
  const ssName = n => { const [k, hj] = LR_SS[n] || LR_SS[n[1]]; return `${n[0] === '歲' ? '태세 ' : ''}${k}(${hj})`; };
  const ssOf = z => (r.sinsal?.[z] || []).map(ssName).join(' · ');
  const ssLine = z => on('ss') && r.sinsal?.[z] && h('div', 'lr-ss', ...r.sinsal[z].flatMap(n => [tip('', n, `${n} · ${ssName(n)}`, [
    `${ssName(n)}: ${z} — ${ssBy(n)}.`, `뜻: ${(LR_SS[n] || LR_SS[n[1]])[2]}.`,
    `신살은 천반 글자에 붙여 읽어요. 이 글자가 삼전·간상·지상에 오면 그 일에 이 성질이 붙는다고 봐요.`, '기준은 🔧 보정에서 바꿀 수 있어요.', short('lr-sinsal')],
    ['lr-sinsal', { 馬: 'base-yeokma', 桃: 'base-dohwa', 華: 'base-hwagae' }[n[1]]]), ' ']));
  const unLine = z => on('un') && tip('un', khs(r.un[z], UN_HJ[r.un[z]][0]), `12운성 ${r.un[z]}(${UN_HJ[r.un[z]][0]})`, [
    `일간 ${dg} 기준, 천반 ${z} → ${r.un[z]}(${UN_HJ[r.un[z]][0]}).`,
    r.rules.un === 'gan' ? '10간 기준(음간은 거꾸로 세는 명리 방식)으로 셌어요.' : `오행 기준으로 셌어요. 음양을 안 나누고 ${OH_KO[ohOf(dg)]} 오행의 장생 자리부터 순서대로 세요.`,
    '기준은 🔧 보정에서 바꿀 수 있어요.', short('mr-12unseong')], ['mr-12unseong']);
  const more = z => `천반 ${z}: 12운성 ${r.un[z]}(${UN_HJ[r.un[z]][0]})${ssOf(z) ? ` · 신살 ${ssOf(z)}` : ''}`; // 칸 통째 설명에
  const jiang = j => on('jiang') && tip('jg', jShort(j), `천장 ${j}(${JIANG_HJ[j]?.[0]})`, [short(JIANG_ID[j]), ...(TERMS.get(JIANG_ID[j])?.body || []).slice(0, 1)], [JIANG_ID[j], 'lr-cheonjang']);
  const dun = (d, z) => !on('dun') ? null : d
    ? tip('dun glyph', d, `둔간 ${d}`, [`${z}에 붙는 둔간이에요. 일진 ${r.day}의 순(旬) 안에서 이 지지와 짝이 되는 천간이에요.`, charInfo(d), short('lr-dungan')], ['lr-dungan'])
    : tip('dun glyph', r.kong.includes(z) ? '○' : '', '공망', [`${z}는 일진 공망(${r.kong.join('')})이라 둔간이 없어요. 허하거나 늦어진다고 보는 경우가 많아요.`], ['base-gongmang']);
  // 사과·천지반의 위(천반)·아래(지반 또는 일간)는 한 쌍으로 읽음(상신·하신의 생극, 가림): 어느 쪽을 눌러도 짝 설명
  const pair = (u, d, j, ke) => {
    const o = ohOf(u), od = ohOf(d), sk = (x, y) => SAENG[ohOf(x)] === ohOf(y);
    const rel = o === od ? '비화(比和) — 같은 오행이에요' : lrGeuk(u, d) ? '상극하(上剋下) — 위가 아래를 극해요' : lrGeuk(d, u) ? '하적상(下賊上) — 아래가 위를 극해요'
      : sk(u, d) ? '위가 아래를 생해요(상생하)' : '아래가 위를 생해요(하생상)';
    const jr = JI.includes(d) ? hkJiRel(u, d) : {};
    const jiRel = Object.entries(jr).map(([k, v]) => `${ko(v)}${{ 沖: '충', 怨嗔: '원진', 刑: '형', 破: '파', 害: '해', 合: '합', 自刑: '자형' }[k]}(${v}${k})`).join(' · ');
    const [jh, jo] = JIANG_HJ[j] || [];
    const jw = jo && (GEUK[jo] === o ? `천장 ${j}(${jh}, ${OH_KO[jo]})가 탄 지지 ${u}를 극해요` : GEUK[o] === jo ? `탄 지지 ${u}가 천장 ${j}(${jh}, ${OH_KO[jo]})를 극해요` : '');
    return { title: ke ? `${ke.n}과 ${u}/${d} — ${rel.split(' — ')[0]}` : `${u} 가(加) ${d} — ${rel.split(' — ')[0]}`, lines: [
      `위(천반) ${charInfo(u)} · 일간 ${dg} 기준 ${lrRel(dg, u)}(${LR_REL_HJ[lrRel(dg, u)]})${r.kong.includes(u) ? ' · 공망' : ''}`,
      `아래(${ke?.n === 1 ? '일간' : '지반'}) ${charInfo(d)}${JI.includes(d) && d === r.shi ? ' · 점시' : ''}`,
      `둘 사이: ${rel}${o !== od && (lrGeuk(u, d) || lrGeuk(d, u)) ? '. 천반과 지반이 극하니 외전(外戰)이라고도 해요' : ''}.${jiRel ? ` 지지로는 ${jiRel}.` : ''}`,
      ke ? `${ke.n}과는 ${['일간과 그 위(간상신)', '간상신과 그 위', '일지와 그 위(지상신)', '지상신과 그 위'][ke.n - 1]}예요. 사과의 위아래 극(상극하·하적상)으로 초전을 고르는 게 적극법이에요.`
        : `천반 ${u}가 지반 ${d} 위에 얹혀(가림, 加臨) 있어요. 위아래를 한 쌍으로 '${u} 가 ${d}'라고 읽어요.`,
      jw ? `${jw}. 천장과 탄 지지가 극하면 내전(內戰)이라 해서 안에서 다툼이 있다고 봐요.` : '', short(ke ? 'lr-sagwa' : 'lr-cheonjiban')],
      ids: [ke ? 'lr-sagwa' : 'lr-cheonjiban', ke ? 'lr-jeokgeuk' : null, 'lr-yukchin', jiRel ? 'base-hyeong' : null] };
  };
  const pairTip = (cls, kids, u, d, j, ke) => { const x = pair(u, d, j, ke); return tip(`${cls} lr-pair`, kids, x.title, x.lines, x.ids); };
  const up = z => tip(`oh-cell ${ohCls(z)}`, z, `천반 ${z}`, [charInfo(z), `일간 ${dg} 기준 육친: ${lrRel(dg, z)}${r.kong.includes(z) ? ' · 공망' : ''}`], ['lr-cheonjiban', 'lr-yukchin']);
  const rel = (rl, kong) => on('rel') && tip('rel', [...[khs(rl, LR_REL_HJ[rl])].flat(), kong ? ' · 공망' : ''], `육친 ${rl}(${LR_REL_HJ[rl]})`, [`일간 ${dg}(${OH_KO[ohOf(dg)]}) 기준으로 본 관계예요.`, short('lr-yukchin'), kong ? `일진 공망(${r.kong.join('')})에 들어요.` : ''], ['lr-yukchin', kong ? 'base-gongmang' : null]);
  const sanRow = h('div', 'lr-row three', ...r.san.map(s => box('lr-box', [
    h('div', 't', s.name), dun(s.dun, s.zhi),
    h('div', 'up glyph', jiang(s.jiang), up(s.zhi)),
    rel(s.rel, s.kong), unLine(s.zhi), ssLine(s.zhi),
  ], () => sanHint(s, r, more(s.zhi), aiFor?.(`san${s.name}`, `삼전 ${s.name}: ${s.dun || '-'}${s.zhi} (육친 ${s.rel}, 천장 ${s.jiang}${s.kong ? ', 공망' : ''})`)))));
  const keRow = h('div', 'lr-row four', ...r.ke.map(k => box('lr-box', [
    h('div', 't', `${'一二三四'[k.n - 1]}課`), dun(k.dun, k.up),
    h('div', 'up glyph', jiang(k.jiang), pairTip(`oh-cell ${ohCls(k.up)}`, k.up, k.up, k.down, k.jiang, k)),
    pairTip('down glyph', k.down, k.up, k.down, k.jiang, k),
    rel(lrRel(dg, k.up), r.kong.includes(k.up)), unLine(k.up), ssLine(k.up),
  ], () => keHint(k, r, more(k.up), aiFor?.(`ke${k.n}`, `사과 ${k.n}과: ${k.down} 위 ${k.up} (천장 ${k.jiang}, 둔간 ${k.dun || '-'})`)))));
  // 천지반: 위 巳午未申, 오른쪽 酉戌, 아래 亥子丑寅(오른쪽→왼쪽), 왼쪽 卯辰(아래→위)
  const pos = { 巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4], 酉: [2, 4], 戌: [3, 4], 亥: [4, 4], 子: [4, 3], 丑: [4, 2], 寅: [4, 1], 卯: [3, 1], 辰: [2, 1] };
  const plate = h('div', 'lr-plate');
  for (const e of JI) {
    const t = r.plate[e], b = box('lr-box', [
      dun(r.dunPlate[e], t),
      h('div', 'up glyph', jiang(r.jiang[t]), pairTip(`oh-cell ${ohCls(t)}`, t, t, e, r.jiang[t])),
      pairTip('down glyph', [e, e === r.shi ? h('span', 'tag', '점시') : null], t, e, r.jiang[t]),
      rel(lrRel(dg, t), r.kong.includes(t)), unLine(t), ssLine(t),
    ], () => openHint(`지반 ${e} 위 천반 ${t}`, [
      `천반 ${charInfo(t)} · 천장 ${r.jiang[t]} · 둔간 ${r.dunPlate[e] || '없음(공망)'}`,
      `일간 ${dg} 기준 육친: ${lrRel(dg, t)}`, more(t), e === r.shi ? '점시 자리예요.' : '',
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
function sanHint(s, r, more, ai) {
  const what = { 초전: '일의 발단·시작', 중전: '일이 진행되는 과정', 말전: '일의 결말' }[s.name];
  openHint(`${s.name} ${s.dun}${s.zhi}`, [
    `${s.name}은 흔히 ${what}으로 읽어요.`,
    `${charInfo(s.zhi)} · 천장 ${s.jiang} · 육친 ${s.rel}${s.dun ? ` · 둔간 ${s.dun}` : ''}`, more,
    s.kong ? `일진 공망(${r.kong.join('')})에 들어요. 공망이면 허하거나 늦어진다고 보는 경우가 많아요.` : '',
    short(JIANG_ID[s.jiang]), ai,
  ].filter(Boolean), [s.name === '초전' ? 'lr-chojeon' : s.name === '중전' ? 'lr-jungjeon' : 'lr-maljeon', 'lr-samjeon'].filter(Boolean));
}
function keHint(k, r, more, ai) {
  const g = (x, y) => GEUK[ohOf(x)] === ohOf(y);
  const rel = g(k.down, k.up) ? '아래가 위를 극해요(하적상).' : g(k.up, k.down) ? '위가 아래를 극해요(상극하).' : '서로 극하지 않아요.';
  const what = ['일간과 그 위(간상신)', '간상신과 그 위', '일지와 그 위(지상신)', '지상신과 그 위'][k.n - 1];
  openHint(`${k.n}과 ${k.up}/${k.down}`, [`${k.n}과는 ${what}예요. 1·2과는 나(일간), 3·4과는 상대·일(일지) 쪽으로 읽어요.`, `${k.up}(${OH_KO[ohOf(k.up)]}) / ${k.down}(${OH_KO[ohOf(k.down)]}) — ${rel}`,
    `천장 ${k.jiang}${k.dun ? ` · 둔간 ${k.dun}` : ''} · 육친 ${lrRel(r.day[0], k.up)}`, more, ai].filter(Boolean),
    ['lr-sagwa', k.n === 1 ? 'lr-gigung' : null, JIANG_ID[k.jiang], 'lr-jeokgeuk'].filter(Boolean));
}

// ================= 기문 =================
const GIL_DOOR = ['개문', '휴문', '생문'], HYUNG_DOOR = ['상문', '사문', '경문(驚)'];
const QM_GUA = { 1: ['감(坎)', '水', '북'], 8: ['간(艮)', '土', '북동'], 3: ['진(震)', '木', '동'], 4: ['손(巽)', '木', '남동'], 9: ['리(離)', '火', '남'], 2: ['곤(坤)', '土', '남서'], 7: ['태(兌)', '金', '서'], 6: ['건(乾)', '金', '북서'], 5: ['중궁', '土', '가운데'] };
const QM_WHO = { 세: '윗사람·조상·나라', 월: '형제·동료·부모 세대', 일: '나(일지는 배우자 자리)', 시: '자녀·아랫사람·말년, 점에서는 묻는 일' }; // 자리 뜻은 남녀 같음
// 한자: 칸 안에서는 한 글자(한자만), 이름·설명에서는 한글(한자)
const STAR_HJ = { 천봉: '天蓬', 천예: '天芮', 천충: '天沖', 천보: '天輔', 천금: '天禽', 천심: '天心', 천주: '天柱', 천임: '天任', 천영: '天英' };
const DOOR_HJ = { 휴문: '休門', 생문: '生門', 상문: '傷門', 두문: '杜門', '경문(景)': '景門', 사문: '死門', '경문(驚)': '驚門', 개문: '開門' };
const GOD_HJ = { 직부: '直符', 등사: '螣蛇', 태음: '太陰', 육합: '六合', 백호: '白虎', 현무: '玄武', 구진: '勾陳', 주작: '朱雀', 구지: '九地', 구천: '九天' };
const GOD_1 = { 직부: '符', 등사: '蛇', 태음: '陰', 육합: '合', 백호: '虎', 현무: '武', 구진: '陳', 주작: '雀', 구지: '地', 구천: '天' };
const kh = (k, hj) => `${k.replace(/\(.\)$/, '')}(${hj})`; // '경문(景)' + '景門' → '경문(景門)'
const starKh = s => s.split('·').map(n => kh(n, STAR_HJ[n])).join('·');

// ---------- 홍국 (기문 명국 · 年局 · 月局 · 日局) ----------
const HK_YUN = { 生氣: ['생기', '氣', '살아나는 기운 — 시작·활력'], 天宜: ['천의', '宜', '하늘이 돕는 자리 — 건강·도와주는 사람'], 絶體: ['절체', '體', '몸이 끊기는 자리 — 막힘·지침'],
  遊魂: ['유혼', '魂', '떠도는 혼 — 이동·들뜸'], 禍害: ['화해', '害', '재앙과 해 — 다툼·손해'], 福德: ['복덕', '德', '복과 덕 — 안정·복'],
  絶命: ['절명', '命', '목숨이 끊기는 자리 — 가장 흉하게 봐요'], 歸魂: ['귀혼', '歸', '돌아오는 혼 — 본자리·마무리'] };
const UN_HJ = { 장생: ['長生', '生'], 목욕: ['沐浴', '浴'], 관대: ['冠帶', '帶'], 건록: ['建祿', '建'], 제왕: ['帝旺', '旺'], 쇠: ['衰', '衰'], 병: ['病', '病'], 사: ['死', '死'], 묘: ['墓', '墓'], 절: ['絶', '胞'], 태: ['胎', '胎'], 양: ['養', '養'] }; // 둘째는 홍국 칸 글자(절은 참고 앱처럼 胞)
// 육친 다른 이름: 명리 십신 무리·육임 육친과 같은 자리
const HK_REL_NAME = { 兄: '형제(兄弟) · 명리의 비겁(比劫)', 孫: '자손(子孫) · 명리의 식상(食傷)', 財: '처재(妻財) · 명리의 재성(財星)', 官: '관(官) · 명리의 정관(正官)',
  鬼: '귀(鬼) · 명리의 편관(偏官)·칠살(七殺)', 父: '부모(父母) · 명리의 인성(印星)·인수(印綬)', 世: '나의 자리' };
const HK_REL_MEAN = { // [남자, 여자] — 유파마다 조금씩 달라요
  兄: ['형제·친구·동료, 경쟁자', '형제·친구·동료, 경쟁자'], 孫: ['자녀·아랫사람, 재주·표현 (장모로 보기도)', '자녀·아랫사람, 재주·표현'],
  財: ['아내·재물 (아버지로 보기도)', '재물·시어머니 (아버지로 보기도)'], 官: ['직장·명예·윗사람 (딸로 보기도)', '남편·직장·명예'],
  鬼: ['질병·관재·경쟁자 (아들로 보기도)', '애인(남편 아닌 남자)·질병·관재'], 父: ['부모·윗사람·문서·학업', '부모·윗사람·문서·학업'], 世: ['나 자신', '나 자신'] };
const HK_REL_WHY = { 兄: '같은 오행', 孫: '내가 생하는 오행', 財: '내가 극하는 오행', 官: '나를 극하고 음양이 다른 것', 鬼: '나를 극하고 음양이 같은 것', 父: '나를 생하는 오행' };
const HK_YUK_STEP = { 兄: 0, 世: 0, 孫: 1, 財: 2, 官: 3, 鬼: 3, 父: 4 };
const HK_YUK_SAENG = { // 생하는 쪽 → [이름, 뜻]
  0: ['비겁생식(比劫生食)', '나·형제의 힘이 재주·표현·자녀로 흘러가요'], 1: ['식상생재(食傷生財)', '재주·표현이 재물로 이어져요'],
  2: ['재생관(財生官)', '재물이 직장·명예(鬼면 관재·병)를 키워요'], 3: ['관인상생(官印相生)', '직장·윗사람이 문서·도움·공부로 이어져요'], 4: ['인수생신(印綬生身)', '문서·윗사람의 도움이 나를 받쳐 줘요'] };
const HK_YUK_GEUK = { // 극하는 쪽 → [이름, 뜻]
  0: ['비겁극재(比劫剋財)', '나·형제가 재물을 다투거나 쥐려 해요(世면 내가 재물을 다스림)'], 1: ['식상극관(食傷剋官)', '재주·말이 직장·윗사람과 부딪혀요(鬼를 누르면 흉을 막음)'],
  2: ['재극인(財剋印)', '재물 일이 문서·공부·윗사람을 흔들어요'], 3: ['관살극신(官殺剋身)', '직장·책임(鬼면 병·관재·경쟁)이 나·형제를 눌러요'], 4: ['인극식(印剋食)', '문서·윗사람이 재주·표현·자녀를 막아요(도식)'] };
const bat = r => (HK_REL_KO[r].charCodeAt(0) - 0xAC00) % 28 !== 0; // 육친 읽는 소리에 받침이 있나(관·손·형 / 재·부·귀·세) — 조사 고르기
function hkYukPair(u, l) { // 위 u, 아래 l
  const a = HK_YUK_STEP[u], b = HK_YUK_STEP[l];
  if (a === b) return { name: '비화(比和)', text: `둘이 같은 오행이라 기운을 보태요(겹침).` };
  const say = (t, from, to, dir) => ({ name: t[0], text: `${dir} ${from}${bat(from) ? '이' : '가'} ${to}${bat(to) ? '을' : '를'} ${t === HK_YUK_SAENG[HK_YUK_STEP[from]] ? '생' : '극'}해요 → ${t[0]}: ${t[1]}.` });
  if ((a + 1) % 5 === b) return say(HK_YUK_SAENG[a], u, l, '위의');
  if ((b + 1) % 5 === a) return say(HK_YUK_SAENG[b], l, u, '아래의');
  if ((a + 2) % 5 === b) return say(HK_YUK_GEUK[a], u, l, '위의');
  return say(HK_YUK_GEUK[b], l, u, '아래의');
}
const HK_GUK_KO = { 和局: '화국', 戰局: '전국', 沖局: '충국', 怨嗔局: '원진국', 刑破害局: '형파해국' };
const HK_GUK_MEAN = { 和局: '천반·지반이 서로 생하거나 같은 기운이라 순하게 흘러요.', 戰局: '천반·지반이 음양이 다른 채로 서로 극해서(가극) 부딪히고 바뀌는 판으로 봐요.',
  沖局: '천반·지반이 같은 수이거나, 같은 음양끼리 극하거나(진극), 지지로 충이라 부딪힘·이동이 큰 판으로 봐요.', 怨嗔局: '천반·지반 지지가 원진이라 원망·애증이 얽히는 판으로 봐요.',
  刑破害局: '천반·지반 지지가 형·해·파 관계라 꺾이고 깨지는 일을 조심하는 판으로 봐요.' };
const HK_SS_KIND = { 劫: ['겁살', '劫殺', '빼앗기거나 갑자기 꺾이는 일'], 馬: ['역마', '驛馬', '이동·변동·바깥 활동'], 亡: ['망신', '亡身', '체면이 깎이거나 구설'],
  年: ['연살', '年殺', '도화 — 매력·인기·이성'], 華: ['화개', '華蓋', '예술·종교·학문, 홀로 깊어짐'] };
const HK_SS_ONE = { 日祿: ['일록', '일간의 녹(祿) — 먹고사는 힘·자리'], 天乙: ['천을귀인', '도와주는 귀인'], 天馬: ['천마', '좋은 말 — 승진·이동이 순조로움'] };
const ssKo = n => HK_SS_ONE[n]?.[0] || `${n[0] === '歲' ? '세' : '일'}${HK_SS_KIND[n[1]][0].slice(0, 1)}`;
const HK_REL_SUF = [['怨嗔', '원진'], ['自刑', '자형'], ['沖', '충'], ['刑', '형'], ['破', '파'], ['殺', '살']];
const relKo = l => { if (l === '九金殺') return '구금살'; const b = l.replace('(害)', ''); return ko(b.slice(0, 2)) + HK_REL_SUF.find(([a]) => b.endsWith(a))[1] + (b !== l ? '(해)' : ''); };
// 칩으로 켜고 끄는 것(기본은 연도·천반·홍국수와 위아래 육친). 묶음: 때 | 연국 칸 글자 | 홍국 칸 글자·표시 | 칸 칠하기
const QM_CHIPS = [[['daeun', '대운'], ['soun', '소운']], [['door', '팔문'], ['star', '구성'], ['god', '팔신'], ['jiban', '지반']],
  [['yun', '유년'], ['un', '12운성'], ['rel', '형충'], ['sinsal', '신살']], [['dong', '동처']]];

function hkParts(p, r, hv) { // 홍국 한 궁의 조각들 + 칸 통째 설명 줄 + AI에 줄 요약
  const hk = hv.hk, x = hk.palaces[p], g = hk.male ? 0 : 1, sOh = HK_OH(hk.seNum), on = k => !!hv.show?.[k];
  const yinyang = n => (n % 2 ? '양' : '음');
  // 두 숫자는 한 짝: 천반수·지반수 어느 쪽을 눌러도 짝 설명(하도 짝·생극·형충·어떻게 나왔는지)
  const numLine = (n, side) => `${side}반수 ${HK_HAN[n]}(${n}) — ${OH_KO[HK_OH(n)]}(${HK_OH(n)})·${yinyang(n)}, 지지로는 ${ko(hkJiOf(n, p))}(${hkJiOf(n, p)}), 하도 짝 ${HK_HADO[HK_OH(n)]}`;
  const pr = hkPair(x.heaven, x.earth);
  const pairLines = [numLine(x.heaven, '천'), numLine(x.earth, '지'),
    `두 수: ${pr.text}`, /^[진가][생극]/.test(pr.kind) ? '통기(通氣)는 진생 → 진극 → 가생 → 가극 차례로 힘이 세다고 봐요.' : '',
    x.label ? `${relKo(x.label)}(${x.label})이기도 해요 — ${x.label === '九金殺' ? '사(四)와 오(五)가 만나 구금살' : x.label === '辰辰自刑' ? '손4궁의 五는 辰으로 봐서 辰辰 자형' : '두 수를 지지로 바꾼 관계'}.` : '',
    p === 5 ? `중궁의 두 수라 판 전체의 국을 정해요: ${HK_GUK_KO[hk.guk]}(${hk.guk}).` : '',
    `어떻게 나왔나: 천반은 천간수 합 ${hk.sumG} → 중궁 ${hk.ch}${p === 5 ? '' : `에서 궁 번호 ${p}를 빼고`}, 지반은 지지수 합 ${hk.sumJ} → 중궁 ${hk.ce}${p === 5 ? '' : `에 궁 번호 ${p}를 더해`} 일의 자리만 써요(0은 十).`,
    x.heaven === 10 || x.earth === 10 ? `십(十)은 형충을 볼 때 未로 보고, 대운 햇수를 셀 때는 빠진 수(천반 ${hk.missH || '-'}, 지반 ${hk.missE || '-'})의 몫을 해요.` : '', short('qm-hk-pair')];
  const num = (n, side) => tip(`hk-num ${side} oh-tile oh-${HK_OH(n)}`, HK_HAN[n], `홍국수 짝 ${HK_HAN[x.heaven]}·${HK_HAN[x.earth]} — ${pr.kind}`, pairLines, ['qm-hk-pair', 'qm-hk-su', x.label ? 'qm-hk-rel' : null]);
  // 위(천반)·아래(지반) 육친도 한 쌍: 어느 쪽을 눌러도 둘의 뜻과 둘 사이의 생극을 함께
  const relLine = (rl, n, side) => `${side} ${HK_REL_KO[rl]}(${rl}) — ${HK_REL_NAME[rl]}. ${rl === '世'
    ? `일지 ${ko(hk.dayJi)}(${hk.dayJi})가 속한 궁이라 나의 자리예요(육친은 모두 世의 지반수 ${HK_HAN[hk.seNum]}(${OH_KO[sOh]}·${yinyang(hk.seNum)}) 기준).`
    : `${HK_HAN[n]}(${OH_KO[HK_OH(n)]}·${yinyang(n)})는 世 기준 ${HK_REL_WHY[rl]}. ${hk.male ? '남자' : '여자'}에게는 ${HK_REL_MEAN[rl][g]}.`}`;
  const yp = hkYukPair(x.relH, x.relE);
  const relLines = [relLine(x.relH, x.heaven, '위(천반)'), relLine(x.relE, x.earth, '아래(지반)'), `둘 사이: ${yp.text}`,
    x.relE === '世' ? `世 위에 ${HK_REL_KO[x.relH]}(${x.relH})${bat(x.relH) ? '을' : '를'} 얹은 자리예요. 홍국에서는 世 위에 무엇이 얹혔는지(예: 父를 얹으면 인수를 머리에 인 것)를 특히 중요하게 봐요.` : '',
    '위는 천반이라 겉으로 드러난 일·바깥·상대 쪽, 아래는 지반이라 속·바탕·내 쪽으로 읽는 경우가 많아요. 유파마다 조금씩 달라요.',
    `${hk.male ? '여자' : '남자'}라면 뜻이 달라져요: ${[...new Set([x.relH, x.relE])].filter(r => r !== '世').map(r => `${r} ${HK_REL_MEAN[r][1 - g]}`).join(' · ') || '—'}`];
  const rel = rl => tip(`hk-rel${rl === '世' ? ' se' : ''}`, rl, `육친 짝 ${x.relH}·${x.relE} — ${yp.name}`, relLines,
    ['qm-hk-yuk', 'base-yukchin', x.relE === '世' ? 'qm-hk-se' : null]);
  const du = (a, side) => (on('daeun') && hv.won && a ? tip('hk-du', `${a[0]}~${a[1]}`, `대운(大運) ${a[0]}~${a[1]}세 · ${side}반`, [
    `1~45세는 세(世) 궁(${QM_GUNG[hk.se]})부터 낙서 순서로 차례로 돌며 지반수만큼, 46~90세는 다시 世 궁부터 거꾸로 돌며 천반수만큼 해를 나눠요(남녀 같음).`,
    `십(十)은 빠진 수만큼(천반 ${hk.missH || '-'}, 지반 ${hk.missE || '-'}), 아홉 궁을 다 돌면 1+2+…+9 = 45년이에요.`, short('qm-hk-daeun')], ['qm-hk-daeun']) : '');
  const yun = on('yun') && x.yunyeon ? tip('hk-s yun', HK_YUN[x.yunyeon][1], `유년 ${HK_YUN[x.yunyeon][0]}(${x.yunyeon})`, [HK_YUN[x.yunyeon][2],
    `지반 중궁수 ${hk.ce} → ${QM_GUNG[hk.base]}의 괘를 본괘로 삼고, 효를 위·가운데·아래·가운데… 차례로 바꿔 가며 생기(生氣)·천의(天宜)·절체(絶體)·유혼(遊魂)·화해(禍害)·복덕(福德)·절명(絶命)·귀혼(歸魂)을 붙여요(본괘 자리가 귀혼).`, short('qm-hk-yunyeon')], ['qm-hk-yunyeon', 'base-palgwae']) : '';
  const un = on('un') && x.unseong.length ? tip('hk-s un', x.unseong.map(u => UN_HJ[u.u][1]).join(''), `12운성(十二運星) ${x.unseong.map(u => `${u.z} ${u.u}(${UN_HJ[u.u][0]})`).join(' · ')}`, [
    ...x.unseong.map(u => `${ko(u.z)}(${u.z}): ${u.u}(${UN_HJ[u.u][0]})`), x.unseong.some(u => u.u === '절') ? '절(絶)은 포(胞)라고도 해서 칸에는 胞로 적어요(참고 앱과 같게).' : '', `世의 지반수 ${HK_HAN[hk.seNum]}를 천간 ${ko(hk.seGan)}(${hk.seGan})로 보고(${OH_KO[ohOf(hk.seGan)]}·${isYangGan(hk.seGan) ? '양' : '음'}), 이 궁의 지지에서 12운성을 매겨요.`], ['mr-12unseong', 'qm-hk-se']) : '';
  const lab = on('rel') && x.label ? tip('hk-lab', x.label, `${relKo(x.label)}(${x.label})`, [
    x.label === '九金殺' ? '천반·지반에 사(四)와 오(五)가 함께 있어요(4+5=9, 金). 구금살(九金殺)이라 해서 다치거나 꺾이는 일을 조심해요.'
      : x.label === '辰辰自刑' ? '천반·지반이 모두 오(五)예요. 손4궁(辰巳)의 五는 辰으로 봐서 辰辰 자형(自刑)이라 스스로 꺾이는 일을 조심해요.'
      : `천반수 ${HK_HAN[x.heaven]}를 ${ko(hkJiOf(x.heaven, p))}(${hkJiOf(x.heaven, p)}), 지반수 ${HK_HAN[x.earth]}를 ${ko(hkJiOf(x.earth, p))}(${hkJiOf(x.earth, p)})로 보면 둘이 ${relKo(x.label).slice(2)}(${x.label.slice(2)}) 관계예요.`,
    '충(沖)은 부딪힘·이동, 원진(怨嗔)은 원망·애증, 형(刑)은 꺾임·다툼, 파(破)는 깨짐·틀어짐으로 봐요. 해(害)는 방해·손해라 곁들면 (害)로, 해만 있으면 살(殺)로 적어요(예: 申亥殺).', short('qm-hk-rel')], ['qm-hk-rel', 'base-chung', 'base-wonjin', 'base-hyeong']) : '';
  const ss = on('sinsal') && x.sinsal.length ? h('div', 'hk-ss', ...x.sinsal.map(s => tip(s.fu ? 'fu' : '', (s.fu ? '伏' : '') + s.name, `${s.fu ? '복' : ''}${ssKo(s.name)}(${s.fu ? '伏' : ''}${s.name})`, [
    HK_SS_ONE[s.name] ? HK_SS_ONE[s.name][1] : `${s.name[0] === '歲' ? `연지 ${ko(hv.P.year[1])}(${hv.P.year[1]})` : `일지 ${ko(hv.P.day[1])}(${hv.P.day[1]})`} 기준 ${HK_SS_KIND[s.name[1]][0]}(${HK_SS_KIND[s.name[1]][1]}) — ${HK_SS_KIND[s.name[1]][2]}`,
    `이 신살의 지지는 ${ko(s.z)}(${s.z})예요. ${'劫馬亡'.includes(s.name[1]) || HK_SS_ONE[s.name] ? `지지의 홍국수(${HK_JI_NUM[s.z]})가 지반수인 궁에 놓아요.` : '그 지지가 속한 궁에 놓아요.'}`,
    s.fu ? '그 수가 이 판 지반에 없어서 숨은(伏) 채로 중궁에 둬요.' : '', short('qm-hk-sinsal')], ['qm-hk-sinsal', 'base-sinsal'])), ' ') : '';
  const ages = on('soun') && hv.won && x.ages.length ? tip('hk-ages', x.ages.join(','), '소운(小運) 나이', [`이 나이에 소운이 이 궁에 머물러요(세는 나이, ${hk.sajuYear}년이 1세).`,
    `원명국이 ${hk.born.yang ? '양둔' : '음둔'} ${hk.born.ju}국이라 甲子년(1984·2044)을 ${QM_GUNG[hk.born.ju]}에 두고 해마다 한 궁씩 낙서 순서로 ${hk.born.yang ? '차례로' : '거꾸로'} 옮겨요(남녀 같음). 60년마다 甲子년에 처음 궁으로 돌아와서 나이가 한 번 건너뛰어요.`, short('qm-hk-soun')], ['qm-hk-soun']) : '';
  const yr = hv.years?.[p] ? tip(`hk-yr${hv.years[p] === hv.thisYear ? ' now' : ''}`, String(hv.years[p]), `${hv.years[p]}년 (${hv.years[p] - hk.sajuYear + 1}세)`, [
    `소운이 이 궁에 드는 해예요. 올해부터 9년을 아홉 궁에 하나씩 적었어요${hv.years[p] === hv.thisYear ? ' — 올해예요' : ''}.`, short('qm-hk-soun')], ['qm-hk-soun']) : '';
  const mo = hv.months?.[p]?.length ? tip(`hk-yr${hv.months[p].includes(hv.nowMonth) ? ' now' : ''}`, `${hv.months[p].join('·')}월`, `음력 ${hv.months[p].join('·')}월`, [
    `이 달의 월지(${hv.months[p].map(m => `${m}월 ${JI[(m + 1) % 12]}`).join(', ')})가 속한 궁이에요. 달은 해마다 같은 궁에 들어요(1월 寅은 간8궁, 5월 午는 리9궁 …).`, short('qm-hk-gukgi')], ['qm-hk-gukgi']) : '';
  const kong = p !== 5 && [...QM_GUNG_JI[p]].some(z => hk.kongDay.includes(z)) ? tip('hk-kong', '○', `일공(日空) ${hk.kongDay.join('')}`, [`일주 순(旬)의 공망 ${hk.kongDay.join('')}이 이 궁 지지에 들어요. 이 궁의 일은 비거나 늦어진다고 봐요.`], ['base-gongmang']) : '';
  const lines = [
    `홍국: 천반수 ${HK_HAN[x.heaven]} ${HK_REL_KO[x.relH]}(${x.relH}) · 지반수 ${HK_HAN[x.earth]} ${HK_REL_KO[x.relE]}(${x.relE})`,
    `두 수의 짝: ${HK_HAN[x.heaven]}·${HK_HAN[x.earth]} — ${pr.text}`,
    hv.won && x.daeun ? `대운: 천반 ${x.daeun.heaven.join('~')}세 · 지반 ${x.daeun.earth.join('~')}세` : '',
    x.yunyeon ? `유년 ${HK_YUN[x.yunyeon][0]}(${x.yunyeon}) — ${HK_YUN[x.yunyeon][2]}` : '', x.unseong.length ? `12운성 ${x.unseong.map(u => `${ko(u.z)}(${u.z}) ${u.u}`).join(' · ')}` : '',
    x.label ? `${relKo(x.label)}(${x.label})` : '', x.sinsal.length ? `신살 ${x.sinsal.map(s => `${s.fu ? '복' : ''}${ssKo(s.name)}(${s.fu ? '伏' : ''}${s.name})`).join(' · ')}` : '',
    hv.years?.[p] ? `${hv.years[p]}년 소운이 이 궁` : '', hv.months?.[p]?.length ? `음력 ${hv.months[p].join('·')}월이 이 궁` : ''].filter(Boolean);
  const focus = `홍국 천반수 ${x.heaven}(${x.relH}) 지반수 ${x.earth}(${x.relE})${hv.won ? ` 대운 ${x.daeun.heaven.join('~')}/${x.daeun.earth.join('~')}세` : ''}${x.yunyeon ? ` ${x.yunyeon}` : ''}${x.label ? ` ${x.label}` : ''}${x.sinsal.length ? ` 신살 ${x.sinsal.map(s => (s.fu ? '伏' : '') + s.name).join(' ')}` : ''}`;
  return { x, numH: num(x.heaven, 'up'), numE: num(x.earth, 'dn'), relH: rel(x.relH), relE: rel(x.relE),
    duH: du(x.daeun?.heaven, '천'), duE: du(x.daeun?.earth, '지'), yun, un, lab, ss, ages, top: [yr, mo].filter(Boolean), kong, lines, focus };
}
// 4칸 짜리 격자(왼쪽 작은 글자 | 홍국수 | 연국 천간 | 오른쪽 작은 글자), 빈 줄·빈 칸은 접음.
// 육친 줄(span)은 셋째 칸 글자(대운 나이)를 오른쪽 끝까지 늘려 칸 폭을 덜 씀
function hkGrid(rows) {
  const used = [0, 1, 2, 3].filter(c => rows.some(r => r[c]));
  const g = h('div', 'hkg');
  g.style.gridTemplateColumns = used.map(() => 'auto').join(' ');
  for (const r of rows.filter(r => used.some(c => r[c]))) {
    for (const c of used) {
      if (r.span && c > 2) continue;
      const el = r[c] ? h('div', `c${c}`, r[c]) : h('span');
      if (r.span && c === 2) el.style.gridColumn = `span ${used.filter(k => k >= 2).length}`;
      if (!r.span || c <= 2 || !used.includes(2)) g.append(el);
    }
    if (r.span && !used.includes(2) && used.includes(3)) g.append(r[2] ? h('div', 'c3', r[2]) : h('span'));
  }
  return g;
}
function drawQimen(r, aiFor, hv) { // hv: 명국이면 홍국 { hk, layer, show, years, months, won, … }
  const grid = h('div', 'qm-grid');
  const P = r.pillars ? { 세: r.pillars.year, 월: r.pillars.month, 일: r.pillars.day, 시: r.pillars.hour } : {};
  const hong = hv && hv.layer !== 'yeon', yeon = !hv || hv.layer !== 'hong', on = k => !hv || !!hv.show?.[k];
  const hkDoor = hong; // 명국에서 홍국을 보면 팔문은 홍국 팔문(참고 앱과 같게), 연국만 볼 때는 연국 팔문
  for (const p of [4, 9, 2, 3, 5, 7, 8, 1, 6]) {
    const x = r.palaces[p], door = hkDoor ? hv.hk.palaces[p].door : x.door;
    const kong = p !== 5 && [...(QM_GUNG_JI[p] || '')].some(z => r.kong.includes(z));
    const mk = r.marks?.[p];
    const [gua, oh, dir] = QM_GUA[p];
    const gungLine = `${gua} · 오행 ${OH_KO[oh]}(${oh}) · ${dir}${QM_GUNG_JI[p] ? ` · 지지 ${[...QM_GUNG_JI[p]].map(z => `${ko(z)}(${z})`).join('·')}` : ''}`;
    const gname = h('div', 'gname', QM_GUNG[p]); // 이름을 누르면 칸 통째 설명(칸 클릭)
    const doorKh = door && kh(door, DOOR_HJ[door]), godKh = x.god && kh(x.god, GOD_HJ[x.god]), starName = x.star?.split('·')[0];
    const hp = hong ? hkParts(p, r, hv) : null;
    const marks = h('div', 'marks',
      hv && hv.haeng === p ? tip('tag warn', '行年', `행년(行年) ${hv.haengYear}`, [`${hv.haengYear}년(${hv.haengYear - hv.hk.sajuYear + 1}세) 행년이 드는 궁이에요${hv.haengFrom5 ? '(중5궁 → 곤2궁 기궁)' : ''}.`, short('qm-hk-haeng')], ['qm-hk-haeng']) : null,
      p === r.zhifuTo ? tip('tag', '직부', `직부(直符) ${starKh(r.zhifu)}`, [`순수 ${r.xun}의 의(${r.fuYi})가 지반에 있던 궁의 별 ${starKh(r.zhifu)}가 직부가 되어 시간(時干) 자리로 와요. 이 궁이 그 자리예요.`, short('qm-jikbu')], ['qm-jikbu', 'qm-sunsu']) : null,
      p === r.zhishiTo && !hkDoor ? tip('tag', '직사', `직사(直使) ${kh(r.zhishi, DOOR_HJ[r.zhishi])}`, [`순수 궁의 문 ${kh(r.zhishi, DOOR_HJ[r.zhishi])}가 직사가 되어 시지까지 센 만큼 옮겨 와요. 이 궁이 그 자리예요.`, short('qm-jiksa')], ['qm-jiksa', 'qm-sunsu']) : null,
      kong && !hong ? tip('tag bad', '공망', `공망(空亡) ${r.kong.join('')}`, [`시순 공망(${r.kong.join('')})이 이 궁의 지지(${[...QM_GUNG_JI[p]].join('·')})에 들어요. 이 궁의 일은 비거나 늦어진다고 봐요.`, short('qm-gongmang')], ['qm-gongmang']) : null,
      mk?.gan.length ? tip('tag ink', `${mk.gan.join('')}간`, `${mk.gan.map(w => `${w}간 ${P[w]?.[0] || ''}`).join(' · ')}`, [
        `${mk.gan.join('·')} 천간이 지반에 앉은 궁이에요(甲은 그 기둥의 순수 의로 찾아요).`,
        ...mk.gan.map(w => `${w}간 — ${QM_WHO[w]}`)], ['qm-jiban', 'qm-samgi-yugui']) : null,
      mk?.ji.length ? tip('tag soft', `${mk.ji.join('')}지`, `${mk.ji.map(w => `${w}지 ${P[w]?.[1] || ''}`).join(' · ')}`, [
        `${mk.ji.join('·')} 지지가 속한 궁이에요(${gua}: ${[...(QM_GUNG_JI[p] || '')].join('·')}).`, ...mk.ji.map(w => `${w}지 — ${QM_WHO[w]}`)], ['qm-gugung']) : null,
      hp?.kong || null);
    const earth = tip(hv ? 'hk-stem e' : 'e', x.earth, `지반 ${x.earth}(${ko(x.earth)})`, [charInfo(x.earth), `${r.dun} ${r.ju}국이라 이 궁 지반에 ${x.earth}가 놓여요. 지반은 국수로 정해지고 시가 바뀌어도 그대로예요.`, short('qm-jiban')], ['qm-jiban', 'qm-guksu', 'qm-samgi-yugui']);
    const now = hv && ((hv.years?.[p] && hv.years[p] === hv.thisYear) || (hv.months?.[p] || []).includes(hv.nowMonth));
    const yeonLines = p === 5 ? [`지반 ${x.earth}. 중궁은 문·신이 없고, 이 앱에서는 곤2궁에 붙여(기궁) 움직여요.`] : [
      `천반 ${x.heaven}(${ko(x.heaven)}) / 지반 ${x.earth}(${ko(x.earth)})`,
      `구성 ${starKh(x.star)} — ${short(STAR_ID[starName])}`, `${hkDoor ? '홍국 팔문' : '팔문'} ${doorKh} — ${short(DOOR_ID[door])}`, `팔신 ${godKh} — ${short(GOD_ID[x.god])}`,
      p === r.zhifuTo ? `직부(${starKh(r.zhifu)})가 와 있는 궁이에요.` : '', p === r.zhishiTo && !hkDoor ? `직사(${kh(r.zhishi, DOOR_HJ[r.zhishi])})가 와 있는 궁이에요.` : '',
      kong ? `시순 공망(${r.kong.join('')})이 든 궁이에요.` : ''];
    const markLines = [mk?.gan.length ? `${mk.gan.join('·')} 천간이 지반에 앉은 궁이에요. ${mk.gan.map(w => `${w}간 — ${QM_WHO[w]}`).join(' · ')}` : '', mk?.ji.length ? `${mk.ji.join('·')}지가 속한 궁이에요.` : ''];
    const yeonFocus = p === 5 ? `지반 ${x.earth}` : `천반 ${x.heaven} / 지반 ${x.earth} / ${x.star} / ${hkDoor ? '홍국 ' : ''}${door} / ${x.god}`;
    const flags = [p === r.zhifuTo && '직부', p === r.zhishiTo && !hkDoor && '직사', kong && '공망', mk?.gan.length && `${mk.gan.join('')}간`, mk?.ji.length && `${mk.ji.join('')}지`].filter(Boolean);
    const palaceHint = () => openHint(`${QM_GUNG[p]} · 칸 전체`, [gungLine,
      p === 5 && hong ? `${HK_GUK_KO[hv.hk.guk]}(${hv.hk.guk}) — ${HK_GUK_MEAN[hv.hk.guk]}` : '',
      ...(yeon ? yeonLines : []), !yeon && door ? `홍국 팔문 ${doorKh} — ${short(DOOR_ID[door])}` : '', ...markLines, ...(hp ? hp.lines : []),
      p === 5 && yeon ? (r.term ? `${r.term} ${r.yuan}(부두 ${r.futou}) · ${r.dun} ${r.ju}국 · ${r.shi}시` : `${r.dun} ${r.ju}국 · ${r.shi}시`) : '',
      aiFor?.(`p${p}`, `${QM_GUNG[p]}: ${[yeon ? yeonFocus : '', ...flags, p === 5 && hong ? hv.hk.guk : '', hp?.focus].filter(Boolean).join(' / ')}`)].filter(Boolean),
      [...(yeon && p !== 5 ? [STAR_ID[starName], DOOR_ID[door], GOD_ID[x.god], 'qm-cheonban'] : []), hkDoor && p !== 5 ? 'qm-hk-palmun' : null, p === 5 ? 'qm-gigung' : null, p === 5 && hong ? 'qm-hk-guk' : null, kong ? 'qm-gongmang' : null].filter(Boolean));
    const doorCls = GIL_DOOR.includes(door) ? 'gil' : HYUNG_DOOR.includes(door) ? 'hyung' : '';
    const doorTip = big => tip(`${big ? 'door' : 'hk-s door'} ${doorCls}`, big ? doorKh : DOOR_HJ[door][0], `${hkDoor ? '홍국 팔문' : '팔문'} ${doorKh}`, [short(DOOR_ID[door]), ...(TERMS.get(DOOR_ID[door])?.body || []).slice(0, 1),
      hkDoor ? `홍국 팔문이에요: ${hv.hk.yang ? '양둔' : '음둔'} 甲子일의 틀에서 일진 ${hv.P.day}까지 하루에 ${hv.hk.yang ? '2칸' : '5칸'}씩, 문 이름을 휴·생·상·두·경(景)·사·경(驚)·개 차례로 돌려요(참고 앱 판 여덟 장과 맞춘 규칙). 연국 팔문은 ${x.door ? kh(x.door, DOOR_HJ[x.door]) : '-'}이에요.` : ''],
      [hkDoor ? 'qm-hk-palmun' : null, DOOR_ID[door], 'qm-palmun', 'qm-gilmun'].filter(Boolean));
    const starTip = big => tip(big ? 'star' : 'hk-s star', big ? starKh(x.star) : STAR_HJ[starName][1], `구성 ${starKh(x.star)}`, [short(STAR_ID[starName]), x.star.includes('·') ? '천금성(天禽星)은 중5궁의 별이라 곤2궁의 천예(天芮)와 함께 움직여요(기궁).' : ''], [STAR_ID[starName], 'qm-guseong', x.star.includes('·') ? 'qm-gigung' : null]);
    const godTip = big => tip(big ? 'god' : 'hk-s god', big ? godKh : GOD_1[x.god], `팔신 ${godKh}`, [short(GOD_ID[x.god]), ...(TERMS.get(GOD_ID[x.god])?.body || []).slice(0, 1)], [GOD_ID[x.god], 'qm-palsin']);
    const heavenTip = cls => tip(`${cls}${x.heaven?.length > 1 ? ' two' : ''} oh-cell ${ohCls(x.heaven[0])}`, x.heaven, `천반 ${x.heaven}(${ko(x.heaven)})`, [...[...x.heaven].map(charInfo), `지반 ${x.earth} 위에 얹힌 천반이에요. 천반은 직부를 따라 시마다 돌아요.`,
      x.heaven.length > 1 ? `뒤 글자 ${x.heaven[1]}는 중5궁 지반 천간이 곤2궁에 기궁해 함께 온 거예요.` : '', short('qm-cheonban')], ['qm-cheonban', 'qm-jeonban', x.heaven.length > 1 ? 'qm-gigung' : null]);
    if (hv) { // 명국: 기본(연도·천반·홍국수+위아래 육친) + 칩으로 켠 것
      const center = p === 5, hk = hv.hk;
      const head = h('div', 'hk-head', h('div', 'gname', QM_GUNG[p].replace(/\(.*\)/, '')), h('span', 'grow'), marks);
      const top = h('div', 'hk-top',
        center && hong ? tip('hk-guk', hk.guk, `${HK_GUK_KO[hk.guk]}(${hk.guk})`, [`중궁 천반수 ${HK_HAN[hk.ch]}(${OH_KO[HK_OH(hk.ch)]}·${hk.ch % 2 ? '양' : '음'}) · 지반수 ${HK_HAN[hk.ce]}(${OH_KO[HK_OH(hk.ce)]}·${hk.ce % 2 ? '양' : '음'})`, HK_GUK_MEAN[hk.guk],
          '정하는 순서: 같은 수이거나 같은 음양끼리 극(진극)이거나 지지 충이면 충국(沖局) → 원진이면 원진국(怨嗔局) → 음양이 다른 극(가극)이면 전국(戰局) → 형·해·파(육합 짝은 빼고)면 형파해국(刑破害局) → 아니면 화국(和局). 참고 앱 판과 맞춘 규칙이에요.', short('qm-hk-guk')], ['qm-hk-guk']) : '',
        ...(hp ? hp.top : []));
      const stemH = yeon && !center ? heavenTip('hk-stem') : '', stemE = yeon && (center || on('jiban')) ? earth : '';
      const relRow = (rl, du) => Object.assign(['', rl, du, ''], { span: true });
      const rows = [
        relRow(hp?.relH, hp?.duH),
        [!center && on('door') ? doorTip() : '', hp?.numH, stemH, yeon && !center && on('star') ? starTip() : ''],
        [hp?.yun, hp?.numE, stemE, yeon && !center && on('god') ? godTip() : ''],
        Object.assign(relRow(hp?.relE, hp?.duE), { 0: hp?.un }),
      ];
      // 동처: 세·월·시 지지가 속한 궁과 중궁은 음영, 世(일지) 궁은 분홍 — 천간 표시만 있는 궁은 안 칠함(참고 앱 판 다섯 장과 같음)
      const dong = on('dong') && (center || (mk?.ji || []).some(w => w !== '일')), seCell = on('dong') && hong && p === hk.se;
      grid.append(box(`qm-cell hk${center ? ' center' : ''}${now ? ' now' : ''}${dong ? ' dong' : ''}${seCell ? ' se-cell' : ''}`, [head, top.children.length ? top : '', hkGrid(rows),
        hp?.lab ? h('div', 'hk-foot', hp.lab) : '', hp?.ss || '', hp?.ages || ''], palaceHint));
      continue;
    }
    if (p === 5) {
      grid.append(box('qm-cell center', [gname, marks, h('div', 'stems glyph', earth),
        h('div', '', tip('small muted', `${r.dun} ${r.ju}국`, `${r.dun} ${r.ju}국`, [r.term ? `${r.term} ${r.yuan}(부두 ${r.futou})이라 ${r.dun} ${r.ju}국이에요.` : '', short('qm-guksu')], ['qm-guksu', 'qm-yangdun-eumdun', 'qm-samwon', 'qm-budu'])),
        h('div', '', tip('small muted', `${r.shi}시`, `${r.shi}시 · 순수 ${r.xun}`, [`시주 ${r.shi}는 ${r.xun} 순이라 순수 의는 ${r.fuYi}예요. 직부 ${starKh(r.zhifu)}, 직사 ${kh(r.zhishi, DOOR_HJ[r.zhishi])}.`, short('qm-sunsu')], ['qm-sunsu', 'qm-jikbu', 'qm-jiksa']))], palaceHint));
      continue;
    }
    grid.append(box('qm-cell', [gname, marks, h('div', '', godTip(true)), h('div', '', starTip(true)),
      h('div', 'stems glyph', heavenTip(''), ' ', earth), h('div', '', doorTip(true))], palaceHint));
  }
  const meta = h('div', 'board-meta',
    r.term ? h('span', '', h('b', '', `${r.zr?.leap ? '윤' : ''}${r.term} ${r.yuan}`), ` (부두 ${r.futou})`) : null,
    r.zr ? tip('', r.zr.d > 0 ? `초신 ${r.zr.d}일` : r.zr.d < 0 ? `접기 ${-r.zr.d}일` : '정수', '초신접기(超神接氣)', [
      `이 판은 🔧 보정의 초신접기법(置閏法)으로 국을 정했어요. ${r.term} 국은 상원 부두일부터 시작하는데, ${r.zr.d > 0 ? `부두가 절입보다 ${r.zr.d}일 먼저 와서 초신이에요` : r.zr.d < 0 ? `부두가 절입보다 ${-r.zr.d}일 늦게 와서 접기예요` : '부두와 절입이 같은 날이라 정수예요'}.`,
      r.zr.leap ? `초신이 9일 이상 쌓여서 ${r.term}을 한 번 더 쓰는 윤국이에요.` : '', short('qm-chosin')], ['qm-chosin', 'qm-chaibo']) : null,
    h('span', '', h('b', '', `${r.dun} ${r.ju}국`), ` · ${r.shi}시`),
    h('span', '', `순수 ${r.xun}${r.fuYi} → 직부 ${starKh(r.zhifu)}, 직사 ${kh(r.zhishi, DOOR_HJ[r.zhishi])}`),
    h('span', '', '공망 ', h('b', 'kong', r.kong.join(''))),
    r.pillars ? h('span', '', `${r.pillars.year}년 ${r.pillars.month}월 ${r.pillars.day}일`) : null);
  return h('div', 'board', meta, grid, h('p', 'hint', hv
    ? `기본으로 ${hv.won ? '연도' : hv.months ? '달' : ''}${hong ? '·홍국수(가운데 두 숫자)와 위아래 육친(위는 천반수, 아래는 지반수의 육친)' : ''}${yeon ? '·연국 천반 천간' : ''}을 보여 줘요. 나머지는 위 칩으로 켜고 꺼요. `
    : '칸마다 위에서부터 팔신 · 구성 · 천반간(큰 글자)과 지반간 · 팔문. ',
    '위쪽이 남쪽이에요. 글자·표시를 하나씩 누르면 그것만, 궁 이름이나 빈 곳을 누르면 그 궁을 통째로 보여 줘요.',
    r.marks ? ' 진한 표시(예: 시일간)는 세(년)·월·일·시 천간이 지반에 있는 궁(甲은 순수 의), 연한 표시(예: 세지)는 그 지지가 속한 궁이에요.' : '',
    hv && on('dong') ? ` 동처(세지·월지·시지가 든 궁)와 중궁은 음영${hong ? ', 世 궁은 분홍' : ''}으로 칠했어요.` : '',
    hv && hkDoor && on('door') ? ' 팔문은 홍국 팔문이에요(연국 팔문은 연국 보기에서).' : ''));
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
