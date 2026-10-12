'use strict';
// 연국(시가) 기문둔갑 포국 — 전반(轉盤)식, 중5궁은 곤2궁에 기궁
// 국수: 절기중심법(拆補法, 기본) 또는 초신접기법(置閏法) — opt.ju === 'zhirun'
// 팔신: 양둔·음둔 모두 백호·현무(기본), 또는 양둔만 구진·주작 — opt.gods === 'jj'

const QM_YI = '戊己庚辛壬癸丁丙乙'; // 삼기육의 배치 순서
const QM_STAR = { 1: '천봉', 2: '천예', 3: '천충', 4: '천보', 5: '천금', 6: '천심', 7: '천주', 8: '천임', 9: '천영' };
const QM_DOOR = { 1: '휴문', 2: '사문', 3: '상문', 4: '두문', 6: '개문', 7: '경문(驚)', 8: '생문', 9: '경문(景)' };
const QM_RING = [1, 8, 3, 4, 9, 2, 7, 6]; // 시계 방향: 감 간 진 손 리 곤 태 건
const QM_GOD = ['직부', '등사', '태음', '육합', '백호', '현무', '구지', '구천'];
const QM_GOD_JJ = ['직부', '등사', '태음', '육합', '구진', '주작', '구지', '구천']; // 양둔에 백호·현무 대신 구진·주작을 쓰는 유파
const QM_XUN_YI = { 子: '戊', 戌: '己', 申: '庚', 午: '辛', 辰: '壬', 寅: '癸' };
const QM_GUNG = { 1: '감1궁(북)', 2: '곤2궁(남서)', 3: '진3궁(동)', 4: '손4궁(남동)', 5: '중5궁', 6: '건6궁(북서)', 7: '태7궁(서)', 8: '간8궁(북동)', 9: '리9궁(남)' };
// 절기별 상·중·하원 국수 (양둔: 동지~망종, 음둔: 하지~대설)
const QM_JU = {
  동지: [1, 7, 4], 소한: [2, 8, 5], 대한: [3, 9, 6], 입춘: [8, 5, 2], 우수: [9, 6, 3], 경칩: [1, 7, 4],
  춘분: [3, 9, 6], 청명: [4, 1, 7], 곡우: [5, 2, 8], 입하: [4, 1, 7], 소만: [5, 2, 8], 망종: [6, 3, 9],
  하지: [9, 3, 6], 소서: [8, 2, 5], 대서: [7, 1, 4], 입추: [2, 5, 8], 처서: [1, 4, 7], 백로: [9, 3, 6],
  추분: [7, 1, 4], 한로: [6, 9, 3], 상강: [5, 8, 2], 입동: [6, 9, 3], 소설: [5, 8, 2], 대설: [4, 7, 1],
};
const QM_YANG_TERMS = '동지 소한 대한 입춘 우수 경칩 춘분 청명 곡우 입하 소만 망종'.split(' ');

function qimenCalc(yang, ju, shiGz, gods = QM_GOD) {
  const earth = {};
  [...QM_YI].forEach((s, i) => { earth[yang ? mod(ju - 1 + i, 9) + 1 : mod(ju - 1 - i, 9) + 1] = s; });
  const sg = shiGz[0], sz = shiGz[1];
  const xun = xunOf(shiGz).start; // 예: 甲子
  const fuYi = QM_XUN_YI[xun[1]];
  const fuPalace = +Object.keys(earth).find(p => earth[p] === fuYi);
  const starFrom = fuPalace === 5 ? 2 : fuPalace;
  const target = sg === '甲' ? fuYi : sg;
  let tp = +Object.keys(earth).find(p => earth[p] === target);
  if (tp === 5) tp = 2;
  const shift = mod(QM_RING.indexOf(tp) - QM_RING.indexOf(starFrom), 8);
  const heaven = {}, stars = {};
  for (const p of QM_RING) {
    const np = QM_RING[(QM_RING.indexOf(p) + shift) % 8];
    stars[np] = QM_STAR[p] + (p === 2 ? '·천금' : '');
    heaven[np] = earth[p] + (p === 2 ? earth[5] : '');
  }
  // 직사: 순수 甲의 시지부터 지금 시지까지 k시진, 낙서 숫자 순서로(양둔 +, 음둔 −)
  const k = mod(JI.indexOf(sz) - JI.indexOf(xun[1]), 12);
  let dp = fuPalace;
  for (let i = 0; i < k; i++) dp = yang ? (dp % 9) + 1 : mod(dp - 2, 9) + 1;
  if (dp === 5) dp = 2;
  const dshift = mod(QM_RING.indexOf(dp) - QM_RING.indexOf(starFrom), 8);
  const doors = {};
  for (const p of QM_RING) doors[QM_RING[(QM_RING.indexOf(p) + dshift) % 8]] = QM_DOOR[p];
  const godAt = {}, start = QM_RING.indexOf(tp);
  gods.forEach((g, j) => { godAt[QM_RING[mod(start + (yang ? j : -j), 8)]] = g; });
  const palaces = {};
  for (let p = 1; p <= 9; p++) palaces[p] = { earth: earth[p], heaven: heaven[p] || '', star: stars[p] || '', door: doors[p] || '', god: godAt[p] || '' };
  return {
    type: 'qimen', dun: yang ? '양둔' : '음둔', ju, shi: shiGz, xun, fuYi, fuPalace,
    zhifu: QM_STAR[fuPalace], zhishi: QM_DOOR[starFrom], zhifuTo: tp, zhishiTo: dp, steps: k,
    kong: xunOf(shiGz).kong, palaces,
  };
}

// 초신접기법(置閏法): 절기마다 상원 부두(甲子·己卯·甲午·己酉일)부터 상·중·하원 15일을 이어 붙임.
// 부두가 절입보다 먼저 오면 초신, 늦게 오면 접기. 초신이 9일 이상인 채로 망종·대설을 만나면 그 절기를 한 번 더(윤국, 30일).
// 기준점이 없어도 몇 해 안에 같은 흐름으로 모이고, 참고 앱(1993-01-29 입춘 상원, 2026-02-23 우수 상원)과 맞춰 봄
const QM_ZR_TH = 9;
let QM_ZR = null; // [{ name, t: 절입 날, f: 그 절기 국이 시작하는 날, len, d: 초신(+)·접기(-) 날 수 }]
function qmZhirun() {
  if (QM_ZR) return QM_ZR;
  const list = [];
  JEOLGI.min.forEach(row => row.forEach((m, i) => list.push({ name: JEOLGI_NAMES[i], t: Math.floor((m + 540) / 1440) }))); // 절입 날(한국 날짜)
  const isFu = D => mod(D + 2440588 + 49, 15) === 0; // 상원 부두일
  let F = list[0].t - 9;
  while (!isFu(F)) F++;
  QM_ZR = list.map(j => {
    const d = j.t - F, len = (j.name === '망종' || j.name === '대설') && d >= QM_ZR_TH ? 30 : 15;
    const seg = { ...j, f: F, len, d };
    F += len;
    return seg;
  });
  return QM_ZR;
}
function qmZhirunAt(dayNum) {
  const seg = qmZhirun().find(s => s.f <= dayNum && dayNum < s.f + s.len);
  return { term: seg.name, yuan: Math.floor((dayNum - seg.f) / 5) % 3, d: seg.d, leap: seg.len === 30 && dayNum - seg.f >= 15 };
}

// 날짜·시각 → 국수 정하고 포국
function qimenAt(y, m, d, h, mi, opt = {}) {
  const p = fourPillars(y, m, d, h, mi, opt);
  const di = gzIndex(p.day), futou = gz60(di - (di % 5)); // 부두: 직전 甲·己일
  let term = p.jeolgi.name, yuan = '子午卯酉'.includes(futou[1]) ? 0 : '寅申巳亥'.includes(futou[1]) ? 1 : 2, zr = null;
  if (opt.ju === 'zhirun') { zr = qmZhirunAt(p.dayNum); term = zr.term; yuan = zr.yuan; }
  const yang = QM_YANG_TERMS.includes(term);
  const ju = QM_JU[term][yuan];
  const r = qimenCalc(yang, ju, p.hour, yang && opt.gods === 'jj' ? QM_GOD_JJ : QM_GOD);
  return { ...r, pillars: p, term, futou, yuan: ['상원', '중원', '하원'][yuan], zr, marks: qimenMarks(r, p) };
}

// 년·월·일·시가 놓이는 궁: 천간은 지반에서 그 글자가 있는 궁(甲은 그 기둥의 순수 의), 지지는 그 지지가 속한 궁
const QM_GUNG_JI = { 1: '子', 8: '丑寅', 3: '卯', 4: '辰巳', 9: '午', 2: '未申', 7: '酉', 6: '戌亥' };
function qimenMarks(r, p) {
  const marks = {};
  const add = (palace, kind, who) => { ((marks[palace] ||= { gan: [], ji: [] })[kind]).push(who); };
  [['년', p.year], ['월', p.month], ['일', p.day], ['시', p.hour]].forEach(([who, gz]) => {
    const stem = gz[0] === '甲' ? QM_XUN_YI[xunOf(gz).start[1]] : gz[0];
    const gp = +Object.keys(r.palaces).find(k => r.palaces[k].earth === stem);
    if (gp) add(gp, 'gan', who);
    const jp = +Object.keys(QM_GUNG_JI).find(k => QM_GUNG_JI[k].includes(gz[1]));
    add(jp, 'ji', who);
  });
  return marks;
}

// ================= 홍국(洪局) =================
// 참고 앱 판(1993-01-29 09:00 곤명 원명국, 2026 年局)과 맞춰 정한 규칙. 남자 대운·행년 방향은 아직 맞춰 보지 못해 추정.
// 홍국수: 천간수 甲1…癸10, 지지수 子1…亥12. 천반 중궁 = 천간수 합 ÷ 9 나머지(0이면 9), 바깥은 중궁수 − 궁 번호(역포)
// 지반 중궁 = 지지수 합 ÷ 9 나머지, 바깥은 중궁수 + 궁 번호(순포). 10의 자리는 버리고 0은 十.
const HK_OH = n => '水火木金土'[(n - 1) % 5];                  // 1·6 水, 2·7 火, 3·8 木, 4·9 金, 5·10 土 (하도)
const HK_GAN = { 1: '壬', 2: '丁', 3: '甲', 4: '辛', 5: '戊', 6: '癸', 7: '丙', 8: '乙', 9: '庚', 10: '己' }; // 홀수 양, 짝수 음
const HK_JI = { 1: '子', 2: '巳', 3: '寅', 4: '酉', 5: '戌', 6: '亥', 7: '午', 8: '卯', 9: '申', 10: '未' };
const HK_HAN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const HK_REL_KO = { 兄: '형제', 孫: '자손', 財: '재', 官: '관', 鬼: '귀', 父: '부모', 世: '세(나)' };
const HK_YUNYEON = ['生氣', '天宜', '絶體', '遊魂', '禍害', '福德', '絶命', '歸魂'];
const HK_GUA_BITS = { 1: 2, 2: 0, 3: 1, 4: 6, 6: 7, 7: 3, 8: 4, 9: 5 }; // 궁 → 괘(아래·가운데·위 효, 양=1)
const HK_FLIP = [4, 2, 1, 2, 4, 2, 1, 2];                         // 위 → 가운데 → 아래 → 가운데 …
const HK_PAIRS = { // 지지 관계(표에 적힌 순서 그대로 보여 줌)
  沖: ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'], 怨嗔: ['子未', '丑午', '寅酉', '卯申', '辰亥', '巳戌'],
  刑: ['寅巳', '巳申', '申寅', '丑戌', '戌未', '未丑', '子卯'], 破: ['子酉', '卯午', '辰丑', '戌未', '寅亥', '巳申'], 害: ['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌'],
};
function hkJiRel(a, b) { // { 沖: '子午', 刑: '寅巳', … } 있는 것만
  const out = {};
  for (const [k, list] of Object.entries(HK_PAIRS)) { const hit = list.find(x => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a)); if (hit) out[k] = hit; }
  return out;
}
// 칸 표시: 沖 > 刑 > 破, 害만 있으면 殺, 刑과 害가 같이 있으면 刑(害). 원진(+害)은 칸에 안 씀(局 이름에만)
function hkRelLabel(n1, n2) {
  const r = hkJiRel(HK_JI[n1], HK_JI[n2]);
  if (r.沖) return `${r.沖}沖`;
  if (r.怨嗔) return '';
  if (r.刑) return `${r.刑}刑${r.害 ? '(害)' : ''}`;
  if (r.破) return `${r.破}破`;
  if (r.害) return `${r.害}殺`;
  return '';
}
function hkGuk(nh, ne) { // 중궁 천반·지반으로 局 이름
  const a = HK_OH(nh), b = HK_OH(ne);
  if (GEUK[a] === b || GEUK[b] === a) return '戰局';
  const r = hkJiRel(HK_JI[nh], HK_JI[ne]);
  return r.沖 ? '沖局' : r.怨嗔 ? '怨嗔局' : r.刑 || r.破 || r.害 ? '刑破害局' : '和局';
}
function hkYuk(s, n) { // 世 수 s 기준 n의 육친
  const a = HK_OH(s), b = HK_OH(n);
  if (a === b) return '兄';
  if (SAENG[a] === b) return '孫';
  if (GEUK[a] === b) return '財';
  if (GEUK[b] === a) return s % 2 === n % 2 ? '鬼' : '官';
  return '父';
}
// 행년: 그해가 드는 궁. 여자는 甲子년이 간8궁, 해마다 한 궁씩 순행(참고 앱과 맞춤). 남자는 태7궁에서 역행(추정)
function hkHaengnyeon(Y, male) { return hkHaengnyeon_(Y, male); }
const hkHaengnyeon_ = (Y, male) => { const k = mod(Y - 1984, 60); return male ? mod(6 - k, 9) + 1 : mod(k + 7, 9) + 1; };
// p: 사주 { year, month, day, hour }, sajuYear: 태어난 해(입춘 기준) — 행년 나이 계산용
function honggukCalc(p, male, sajuYear) {
  const gz = [p.year, p.month, p.day, p.hour];
  const sumG = gz.reduce((a, g) => a + GAN.indexOf(g[0]) + 1, 0), sumJ = gz.reduce((a, g) => a + JI.indexOf(g[1]) + 1, 0);
  const ch = sumG % 9 || 9, ce = sumJ % 9 || 9;
  const n10 = v => mod(v, 10) || 10;
  const heaven = {}, earth = {};
  for (let q = 1; q <= 9; q++) { heaven[q] = q === 5 ? ch : n10(ch - q); earth[q] = q === 5 ? ce : n10(ce + q); }
  const missH = mod(ch + 5, 10), missE = mod(ce + 5, 10); // 빠진 수(十이 그 몫을 함)
  const yrs = (n, miss) => (n === 10 ? miss : n);
  const se = +Object.keys(QM_GUNG_JI).find(k => QM_GUNG_JI[k].includes(p.day[1])); // 世: 일지가 속한 궁
  const s = earth[se], seGan = HK_GAN[s];
  const base = ce === 5 ? 2 : ce; // 유년 본괘: 지반 중궁수의 궁(5면 곤2궁에 기궁 — 추정)
  const yunyeon = {};
  let bits = HK_GUA_BITS[base];
  HK_FLIP.forEach((f, k) => { bits ^= f; yunyeon[+Object.keys(HK_GUA_BITS).find(q => HK_GUA_BITS[q] === bits)] = HK_YUNYEON[k]; });
  // 대운: 1~45세는 世부터 지반수만큼 해씩(여자 순행·남자 역행), 46~90세는 世부터 천반수만큼(여자 역행·남자 순행). 남자 방향은 추정
  const step = (q, dir) => mod(q - 1 + dir, 9) + 1;
  const daeun = {};
  let age = 1, q = se;
  for (let k = 0; k < 9; k++, q = step(q, male ? -1 : 1)) { const n = yrs(earth[q], missE); (daeun[q] ||= {}).earth = [age, age + n - 1]; age += n; }
  q = se;
  for (let k = 0; k < 9; k++, q = step(q, male ? 1 : -1)) { const n = yrs(heaven[q], missH); daeun[q].heaven = [age, age + n - 1]; age += n; }
  const palaces = {};
  for (let k = 1; k <= 9; k++) palaces[k] = {
    heaven: heaven[k], earth: earth[k],
    relH: hkYuk(s, heaven[k]), relE: k === se ? '世' : hkYuk(s, earth[k]),
    yunyeon: yunyeon[k] || '', unseong: k === 5 ? [] : [...QM_GUNG_JI[k]].map(z => ({ z, u: unseong(seGan, z) })),
    daeun: daeun[k], label: hkRelLabel(heaven[k], earth[k]), ages: [],
  };
  for (let a = 1; a <= 90; a++) palaces[hkHaengnyeon(sajuYear + a - 1, male)].ages.push(a);
  return { type: 'hongguk', sumG, sumJ, ch, ce, missH, missE, se, seNum: s, seGan, base, guk: hkGuk(ch, ce), palaces, kongDay: xunOf(p.day).kong, dayJi: p.day[1], male, sajuYear };
}
