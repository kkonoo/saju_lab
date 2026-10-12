'use strict';
// 명리 원국: 십신·지장간·12운성·오행 개수·합충·대운·세운
// 지장간은 여기·중기·정기 순 (자평진전 계열 흔한 표)

const MR_JJG = { 子: '壬癸', 丑: '癸辛己', 寅: '戊丙甲', 卯: '甲乙', 辰: '乙癸戊', 巳: '戊庚丙', 午: '丙己丁', 未: '丁乙己', 申: '戊壬庚', 酉: '庚辛', 戌: '辛丁戊', 亥: '戊甲壬' };
const MR_UNSEONG = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];
const MR_CHANGSHENG = { 甲: '亥', 丙: '寅', 戊: '寅', 庚: '巳', 壬: '申', 乙: '午', 丁: '酉', 己: '酉', 辛: '子', 癸: '卯' };
const MR_GANHAP = { 甲己: '토', 乙庚: '금', 丙辛: '수', 丁壬: '목', 戊癸: '화' };
const MR_YUKHAP = { 子丑: '토', 寅亥: '목', 卯戌: '화', 辰酉: '금', 巳申: '수', 午未: '화' };
const MR_SAMHAP = [['申子辰', '수국'], ['亥卯未', '목국'], ['寅午戌', '화국'], ['巳酉丑', '금국']];

function sipsin(day, s) {
  const a = ohOf(day), b = ohOf(s), same = isYangGan(day) === isYangGan(s);
  if (a === b) return same ? '비견' : '겁재';
  if (SAENG[a] === b) return same ? '식신' : '상관';
  if (GEUK[a] === b) return same ? '편재' : '정재';
  if (GEUK[b] === a) return same ? '편관' : '정관';
  return same ? '편인' : '정인';
}
const mrBon = z => MR_JJG[z].slice(-1); // 정기(본기)
function unseong(day, z) {
  const c = JI.indexOf(MR_CHANGSHENG[day]), i = JI.indexOf(z);
  return MR_UNSEONG[isYangGan(day) ? mod(i - c, 12) : mod(c - i, 12)];
}
const pairKey = (a, b, table) => table[a + b] ? a + b : table[b + a] ? b + a : null;

function mrRelations(pillars) {
  const pos = ['년', '월', '일', '시'], out = [];
  const g = pillars.map(p => p[0]), z = pillars.map(p => p[1]);
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const gk = pairKey(g[i], g[j], MR_GANHAP);
    if (gk) out.push({ kind: '천간합', text: `${pos[i]}간 ${g[i]}·${pos[j]}간 ${g[j]} 합(${MR_GANHAP[gk]})`, term: 'base-ganhap' });
    if (['甲庚', '乙辛', '丙壬', '丁癸'].some(k => k === g[i] + g[j] || k === g[j] + g[i])) out.push({ kind: '천간충', text: `${pos[i]}간 ${g[i]}·${pos[j]}간 ${g[j]} 충`, term: 'base-chung' });
    const zk = pairKey(z[i], z[j], MR_YUKHAP);
    if (zk) out.push({ kind: '육합', text: `${pos[i]}지 ${z[i]}·${pos[j]}지 ${z[j]} 육합(${MR_YUKHAP[zk]})`, term: 'base-yukhap' });
    if (mod(JI.indexOf(z[i]) - JI.indexOf(z[j]), 12) === 6) out.push({ kind: '충', text: `${pos[i]}지 ${z[i]}·${pos[j]}지 ${z[j]} 충`, term: 'base-chung' });
  }
  for (const [set, name] of MR_SAMHAP) {
    const has = [...set].filter(c => z.includes(c));
    if (has.length === 3) out.push({ kind: '삼합', text: `${set} 삼합 ${name}`, term: 'base-samhap' });
    else if (has.length === 2 && has.includes(set[1])) out.push({ kind: '반합', text: `${has.join('')} 반합(${name})`, term: 'base-samhap' });
  }
  return out;
}

/* 원국 + 대운. male: true/false */
function myeongriAt(y, m, d, h, mi, male, opt = {}, unknownHour = false) {
  const p = fourPillars(y, m, d, h, mi, opt);
  const cols = unknownHour ? [p.year, p.month, p.day] : [p.year, p.month, p.day, p.hour];
  const base = myeongriFromPillars(cols);
  const dayGan = base.dayGan;
  // 대운: 양남음녀 순행, 음남양녀 역행. 대운수 = 절입까지(또는 지난 절입부터) 날수 ÷ 3
  const forward = isYangGan(p.year[0]) === male;
  const ref = forward ? p.nextJeol : p.jeol;
  const days = Math.abs(ref.utcMin - p.utc / 60000) / 1440;
  const dsu = Math.max(1, Math.round(days / 3));
  const mi0 = gzIndex(p.month);
  const daeun = Array.from({ length: 10 }, (_, i) => {
    const gz = gz60(mi0 + (forward ? i + 1 : -(i + 1)));
    return { age: dsu + i * 10, gz, ganSs: sipsin(dayGan, gz[0]), zhiSs: sipsin(dayGan, mrBon(gz[1])), unseong: unseong(dayGan, gz[1]) };
  });
  return { ...base, male, forward, daeunsu: dsu, daeunDays: days, daeun, info: p, unknownHour };
}
// 기둥만으로 원국 (사례·가상 원국용)
function myeongriFromPillars(cols) {
  const dayGan = cols[2][0];
  const cnt = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const pillars = cols.map((gz, i) => {
    cnt[ohOf(gz[0])]++; cnt[ohOf(gz[1])]++;
    return {
      pos: ['년', '월', '일', '시'][i], gan: gz[0], zhi: gz[1],
      ganSs: i === 2 ? '일간' : sipsin(dayGan, gz[0]), zhiSs: sipsin(dayGan, mrBon(gz[1])),
      jjg: [...MR_JJG[gz[1]]].map(s => ({ g: s, ss: sipsin(dayGan, s) })), unseong: unseong(dayGan, gz[1]),
    };
  });
  return { type: 'pillars', pillars, count: cnt, dayGan, relations: mrRelations(cols), kong: xunOf(cols[2]).kong };
}
// 세운: 그해 입춘 기준 연주
function seun(year, dayGan) {
  const gz = gz60(year - 1984);
  return { year, gz, ganSs: sipsin(dayGan, gz[0]), zhiSs: sipsin(dayGan, mrBon(gz[1])), unseong: unseong(dayGan, gz[1]) };
}
