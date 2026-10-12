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
