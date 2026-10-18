'use strict';
// 연국(시가) 기문둔갑 포국 — 전반(轉盤)식, 중5궁은 곤2궁에 기궁
// 국수: 절기중심법(拆補法) 또는 초신접기법(置閏法) — opt.ju === 'zhirun' (앱 기본은 🔧 보정의 초신접기, 사례 판은 拆補)
// 팔신: 양둔·음둔 모두 백호·현무, 또는 양둔만 구진·주작 — opt.gods === 'jj' (앱 기본은 구진·주작)

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

// 세(년)·월·일·시가 놓이는 궁: 천간은 지반에서 그 글자가 있는 궁(甲은 그 기둥의 순수 의), 지지는 그 지지가 속한 궁
const QM_GUNG_JI = { 1: '子', 8: '丑寅', 3: '卯', 4: '辰巳', 9: '午', 2: '未申', 7: '酉', 6: '戌亥' };
function qimenMarks(r, p) {
  const marks = {};
  const add = (palace, kind, who) => { ((marks[palace] ||= { gan: [], ji: [] })[kind]).push(who); };
  [['세', p.year], ['월', p.month], ['일', p.day], ['시', p.hour]].forEach(([who, gz]) => {
    const stem = gz[0] === '甲' ? QM_XUN_YI[xunOf(gz).start[1]] : gz[0];
    const gp = +Object.keys(r.palaces).find(k => r.palaces[k].earth === stem);
    if (gp) add(gp, 'gan', who);
    const jp = +Object.keys(QM_GUNG_JI).find(k => QM_GUNG_JI[k].includes(gz[1]));
    add(jp, 'ji', who);
  });
  return marks;
}

// ================= 홍국(洪局) =================
// 참고 앱 판(1993-01-29 09:00 곤명, 1992-12-29 12:00 건명의 원명국·年局·日局)과 맞춰 정한 규칙.
// 홍국수: 천간수 甲1…癸10, 지지수 子1…亥12. 천반 중궁 = 천간수 합 ÷ 9 나머지(0이면 9), 바깥은 중궁수 − 궁 번호(역포)
// 지반 중궁 = 지지수 합 ÷ 9 나머지, 바깥은 중궁수 + 궁 번호(순포). 10의 자리는 버리고 0은 十.
const HK_OH = n => '水火木金土'[(n - 1) % 5];                  // 1·6 水, 2·7 火, 3·8 木, 4·9 金, 5·10 土 (하도)
const HK_GAN = { 1: '壬', 2: '丁', 3: '甲', 4: '辛', 5: '戊', 6: '癸', 7: '丙', 8: '乙', 9: '庚', 10: '己' }; // 홀수 양, 짝수 음
const HK_JI = { 1: '子', 2: '巳', 3: '寅', 4: '酉', 5: '戌', 6: '亥', 7: '午', 8: '卯', 9: '申', 10: '未' };
const HK_JI_NUM = { 子: 1, 巳: 2, 寅: 3, 酉: 4, 辰: 5, 戌: 5, 亥: 6, 午: 7, 卯: 8, 申: 9, 丑: 10, 未: 10 }; // 신살 자리 찾기용(辰戌 5, 丑未 10)
const HK_HAN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const HK_REL_KO = { 兄: '형', 孫: '손', 財: '재', 官: '관', 鬼: '귀', 父: '부', 世: '세' };
const HK_YUNYEON = ['生氣', '天宜', '絶體', '遊魂', '禍害', '福德', '絶命', '歸魂'];
const HK_GUA_BITS = { 1: 2, 2: 0, 3: 1, 4: 6, 6: 7, 7: 3, 8: 4, 9: 5 }; // 궁 → 괘(아래·가운데·위 효, 양=1)
const HK_FLIP = [4, 2, 1, 2, 4, 2, 1, 2];                         // 위 → 가운데 → 아래 → 가운데 …
// 홍국 팔문: 甲子일의 틀(양둔·음둔 따로)에서, 일진이 甲子에서 하나 갈 때마다 문 이름을 휴·생·상·두·경(景)·사·경(驚)·개 차례로
// 양둔은 2칸, 음둔은 5칸씩 돌림. 참고 앱 판 여덟 장과 맞음(마지막 두 장은 미리 맞힘)
const HK_DOOR = ['휴문', '생문', '상문', '두문', '경문(景)', '사문', '경문(驚)', '개문'];
const HK_DOOR_JZ = { yang: { 1: 2, 2: 5, 3: 4, 4: 0, 6: 3, 7: 7, 8: 6, 9: 1 },  // 甲子일 양둔: 감1 傷 곤2 死 진3 景 손4 休 건6 杜 태7 開 간8 驚 리9 生
  yin: { 1: 0, 2: 5, 3: 6, 4: 2, 6: 7, 7: 3, 8: 4, 9: 1 } };                     // 甲子일 음둔: 감1 休 곤2 死 진3 驚 손4 傷 건6 開 태7 杜 간8 景 리9 生
const HK_PAIRS = { // 지지 관계(지지 순서대로 적음)
  沖: ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'], 怨嗔: ['子未', '丑午', '寅酉', '卯申', '辰亥', '巳戌'],
  刑: ['寅巳', '巳申', '寅申', '丑戌', '戌未', '丑未', '子卯'], 破: ['子酉', '卯午', '丑辰', '未戌', '寅亥', '巳申'], 害: ['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌'],
  合: ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未'],
};
function hkJiRel(a, b) { // { 沖: '子午', 刑: '寅巳', … } 있는 것만
  const out = {};
  for (const [k, list] of Object.entries(HK_PAIRS)) { const hit = list.find(x => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a)); if (hit) out[k] = hit; }
  if (a === b && '辰午酉亥'.includes(a)) out.自刑 = a + a;
  return out;
}
// 칸 표시: 수를 지지로 바꿔(五는 戌이되 손4궁에서는 辰, 十은 未) 沖 > 怨嗔 > 刑·自刑 > 破(육합 짝은 빼고) 중 하나, 害가 곁들면 (害)를 붙이고 害뿐이면 殺.
// 四·五는 九金殺. 참고 앱 1988-10-10 판(寅巳刑(害)·卯午破·戌未刑·申亥殺·子酉破), 1964-12-06 판(손4궁 五·五 辰辰自刑), 1985-09-20 판(곤2궁 五·五 표시 없음)과 맞춤
const hkJiOf = (n, q) => (n === 5 && q === 4 ? '辰' : HK_JI[n]);
function hkRelLabel(n1, n2, q) {
  if ((n1 === 4 && n2 === 5) || (n1 === 5 && n2 === 4)) return '九金殺';
  const r = hkJiRel(hkJiOf(n1, q), hkJiOf(n2, q));
  const main = r.沖 ? `${r.沖}沖` : r.怨嗔 ? `${r.怨嗔}怨嗔` : r.刑 ? `${r.刑}刑` : r.自刑 ? `${r.自刑}自刑` : r.破 && !r.合 ? `${r.破}破` : '';
  return main ? main + (r.害 ? '(害)' : '') : r.害 ? `${r.害}殺` : '';
}
// 중궁 局: 같은 수이거나(참고 앱 1975-05-23 판 四·四) 같은 음양끼리 극(진극)이거나 지지 沖이면 沖局 > 怨嗔局 > 음양이 다른 극(가극)이면 戰局 > 刑·害·破(육합 짝은 빼고)면 刑破害局 > 和局
function hkGuk(nh, ne) {
  const a = HK_OH(nh), b = HK_OH(ne), geuk = GEUK[a] === b || GEUK[b] === a;
  const r = hkJiRel(HK_JI[nh], HK_JI[ne]);
  if (nh === ne || r.沖 || (geuk && nh % 2 === ne % 2)) return '沖局';
  if (r.怨嗔) return '怨嗔局';
  if (geuk) return '戰局';
  return r.刑 || r.自刑 || r.害 || (r.破 && !r.合) ? '刑破害局' : '和局';
}
// 두 수의 짝 읽기 (천반 a → 지반 b): 하도 생성수 짝(一六·二七·三八·四九·五十), 같은 수, 생극(양음이 다르면 진생·가극, 같으면 가생·진극)
const HK_HADO = { 水: '일육공종(一六共宗)', 火: '이칠동도(二七同道)', 木: '삼팔위붕(三八爲朋)', 金: '사구위우(四九爲友)', 土: '오십동도(五十同途)' };
function hkPair(a, b) {
  const oa = HK_OH(a), ob = HK_OH(b), diff = a % 2 !== b % 2;
  if (a === b) return { kind: '같은 수', text: '같은 수끼리라 기운이 겹쳐요(비화).' };
  if (oa === ob) return { kind: '생성 짝', text: `${HK_HADO[oa]} — 같은 ${oa}의 생수·성수 짝이라 합으로 봐요.` };
  const who = SAENG[oa] === ob ? ['천반이 지반을 생', '생'] : SAENG[ob] === oa ? ['지반이 천반을 생', '생'] : GEUK[oa] === ob ? ['천반이 지반을 극', '극'] : ['지반이 천반을 극', '극'];
  const kind = who[1] === '생' ? (diff ? '진생(眞生)' : '가생(假生)') : (diff ? '가극(假剋)' : '진극(眞剋)');
  return { kind, text: `${who[0]}하고(${who[1] === '생' ? '相生' : '相剋'}), 음양이 ${diff ? '달라' : '같아'} ${kind}이에요.` };
}
function hkYuk(s, n) { // 世 수 s 기준 n의 육친
  const a = HK_OH(s), b = HK_OH(n);
  if (a === b) return '兄';
  if (SAENG[a] === b) return '孫';
  if (GEUK[a] === b) return '財';
  if (GEUK[b] === a) return s % 2 === n % 2 ? '鬼' : '官';
  return '父';
}
// 소운: 그해가 드는 궁(낙서 순서, 중5궁 포함). 甲子년을 원명국 국수의 궁에 두고 양둔은 해마다 한 궁씩 차례로, 음둔은 거꾸로(남녀 같음).
// 60년마다(甲子년) 다시 처음 궁에서. born: 원명국 { yang, ju }. 참고 앱 판 다섯 장(양둔 8·2국, 음둔 1·6·6국)과 맞춤
const hkSoun = (Y, born) => { const n = mod(Y - 1984, 60); return mod(born.ju - 1 + (born.yang ? n : -n), 9) + 1; };
// 본명성(九星): 남자 1992년 八白에서 해마다 하나씩 거꾸로, 여자 1992년 七赤에서 하나씩 차례로 (입춘 기준 해)
const hkBonmyeong = (Y0, male) => (male ? mod(7 - (Y0 - 1992), 9) : mod(6 + (Y0 - 1992), 9)) + 1;
// 행년(年局의 行年): 1세를 본명성 궁에 두고 한 살마다 한 궁씩 차례로. 중5궁이면 곤2궁에 기궁
const hkHaengnyeon = (Y, male, Y0) => mod(hkBonmyeong(Y0, male) - 1 + (Y - Y0), 9) + 1;
// 신살: 年支(歲)·日支(日) 기준 劫殺·亡身·驛馬·年殺·華蓋 + 日祿·天乙·天馬.
// 劫·亡·馬·祿·天乙·天馬는 그 지지의 홍국수가 지반수인 궁에(판에 없는 수면 伏으로 중5궁), 年殺·華蓋는 그 지지가 속한 궁에
const HK_SAMHAP = { 申: '申子辰', 子: '申子辰', 辰: '申子辰', 寅: '寅午戌', 午: '寅午戌', 戌: '寅午戌', 巳: '巳酉丑', 酉: '巳酉丑', 丑: '巳酉丑', 亥: '亥卯未', 卯: '亥卯未', 未: '亥卯未' };
const HK_SS_OF = { 申子辰: { 劫: '巳', 馬: '寅', 亡: '亥', 年: '酉', 華: '辰' }, 寅午戌: { 劫: '亥', 馬: '申', 亡: '巳', 年: '卯', 華: '戌' },
  巳酉丑: { 劫: '寅', 馬: '亥', 亡: '申', 年: '午', 華: '丑' }, 亥卯未: { 劫: '申', 馬: '巳', 亡: '寅', 年: '子', 華: '未' } };
const HK_ROK = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };
const HK_CHEONMA = { 寅: '午', 卯: '申', 辰: '戌', 巳: '子', 午: '寅', 未: '辰', 申: '午', 酉: '申', 戌: '戌', 亥: '子', 子: '寅', 丑: '辰' }; // 月支 기준
const HK_GWI = { 陽: { 甲: '未', 乙: '申', 丙: '酉', 丁: '亥', 戊: '丑', 己: '子', 庚: '丑', 辛: '寅', 壬: '卯', 癸: '巳' },  // 양둔은 陽貴, 음둔은 陰貴
  陰: { 甲: '丑', 乙: '子', 丙: '亥', 丁: '酉', 戊: '未', 己: '申', 庚: '未', 辛: '午', 壬: '巳', 癸: '卯' } };
const HK_UN_ORDER = { 4: '巳辰', 8: '寅丑' }; // 12운성 적는 순서(참고 앱과 같게)
const HK_SS_ORDER = ['天乙', '天馬', '歲劫', '歲馬', '歲亡', '歲年', '歲華', '日劫', '日馬', '日亡', '日年', '日華', '日祿'];
function hkSinsal(p, earth, yang) { // → { 궁: [{ name, z, fu }] }
  const at = {}, put = (q, name, z, fu = false) => (at[q] ||= []).push({ name, z, fu });
  const byNum = (name, z) => { const n = HK_JI_NUM[z], q = +Object.keys(earth).find(k => earth[k] === n); q ? put(q, name, z) : put(5, name, z, true); };
  const byGung = (name, z) => put(+Object.keys(QM_GUNG_JI).find(k => QM_GUNG_JI[k].includes(z)), name, z);
  for (const [w, zi] of [['歲', p.year[1]], ['日', p.day[1]]]) {
    const t = HK_SS_OF[HK_SAMHAP[zi]];
    byNum(w + '劫', t.劫); byNum(w + '馬', t.馬); byNum(w + '亡', t.亡); byGung(w + '年', t.年); byGung(w + '華', t.華);
  }
  byNum('日祿', HK_ROK[p.day[0]]); byNum('天乙', HK_GWI[yang ? '陽' : '陰'][p.day[0]]); byNum('天馬', HK_CHEONMA[p.month[1]]);
  for (const q in at) at[q].sort((a, b) => a.fu - b.fu || HK_SS_ORDER.indexOf(a.name) - HK_SS_ORDER.indexOf(b.name));
  return at;
}
// p: 사주 { year, month, day, hour }, sajuYear: 태어난 해(입춘 기준) — 소운·행년 나이 계산용, yang: 이 판이 양둔인지(天乙·팔문), born: 원명국 { yang, ju }(소운)
function honggukCalc(p, male, sajuYear, yang, born) {
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
  const jz = HK_DOOR_JZ[yang ? 'yang' : 'yin'], dk = gzIndex(p.day) * (yang ? 2 : 5), doors = {};
  for (const q in jz) doors[q] = HK_DOOR[mod(jz[q] + dk, 8)];
  // 대운: 1~45세는 世부터 낙서 순서로 차례로 돌며 지반수만큼, 46~90세는 다시 世부터 거꾸로 천반수만큼 (남녀 같음)
  const step = (q, dir) => mod(q - 1 + dir, 9) + 1;
  const daeun = {};
  let age = 1, q = se;
  for (let k = 0; k < 9; k++, q = step(q, 1)) { const n = yrs(earth[q], missE); (daeun[q] ||= {}).earth = [age, age + n - 1]; age += n; }
  q = se;
  for (let k = 0; k < 9; k++, q = step(q, -1)) { const n = yrs(heaven[q], missH); daeun[q].heaven = [age, age + n - 1]; age += n; }
  const sinsal = hkSinsal(p, earth, yang);
  const palaces = {};
  for (let k = 1; k <= 9; k++) palaces[k] = {
    heaven: heaven[k], earth: earth[k],
    relH: hkYuk(s, heaven[k]), relE: k === se ? '世' : hkYuk(s, earth[k]),
    yunyeon: yunyeon[k] || '', door: doors[k] || '', unseong: k === 5 ? [] : [...(HK_UN_ORDER[k] || QM_GUNG_JI[k])].map(z => ({ z, u: unseong(seGan, z) })),
    daeun: daeun[k], label: hkRelLabel(heaven[k], earth[k], k), ages: [], sinsal: sinsal[k] || [],
  };
  for (let a = 1; a <= 100; a++) palaces[hkSoun(sajuYear + a - 1, born)].ages.push(a); // 참고 앱은 90세 넘게도 적음(93세까지 봄)
  return { type: 'hongguk', sumG, sumJ, ch, ce, missH, missE, se, seNum: s, seGan, base, guk: hkGuk(ch, ce), palaces, kongDay: xunOf(p.day).kong, dayJi: p.day[1], male, sajuYear, bon: hkBonmyeong(sajuYear, male), yang, born };
}
