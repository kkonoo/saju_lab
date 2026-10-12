'use strict';
// 달력 계산: 24절기(data/jeolgi.json), 간지(년·월·일·시), 시각 보정
// 브라우저와 node(테스트)에서 같이 씀

const GAN = '甲乙丙丁戊己庚辛壬癸', JI = '子丑寅卯辰巳午未申酉戌亥';
const GAN_KO = '갑을병정무기경신임계', JI_KO = '자축인묘진사오미신유술해';
const OH_GAN = '木木火火土土金金水水', OH_JI = '水土木木土火火土金金土水';
const OH_KO = { 木: '목', 火: '화', 土: '토', 金: '금', 水: '수' };
const SAENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }; // 생
const GEUK = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };  // 극
const ohOf = c => (GAN.includes(c) ? OH_GAN[GAN.indexOf(c)] : OH_JI[JI.indexOf(c)]);
const isYangGan = g => GAN.indexOf(g) % 2 === 0;
const isYangJi = z => JI.indexOf(z) % 2 === 0;
const ko = s => [...s].map(c => (GAN.includes(c) ? GAN_KO[GAN.indexOf(c)] : JI.includes(c) ? JI_KO[JI.indexOf(c)] : c)).join('');
const gz60 = i => GAN[((i % 60) + 60) % 60 % 10] + JI[((i % 60) + 60) % 60 % 12];
const gzIndex = gz => { for (let i = 0; i < 60; i++) if (gz60(i) === gz) return i; return -1; };
const mod = (a, n) => ((a % n) + n) % n;

let JEOLGI = null; // { from, names, min: [[24개 UTC분]] }
const JEOLGI_NAMES = '소한 대한 입춘 우수 경칩 춘분 청명 곡우 입하 소만 망종 하지 소서 대서 입추 처서 백로 추분 한로 상강 입동 소설 대설 동지'.split(' ');

// 서울 벽시계 시각 → UTC(ms). 서머타임·UTC+8:30 시절도 브라우저 시간대 자료로 처리
function seoulOffsetMin(utcMs) {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
      .formatToParts(new Date(utcMs)).map(x => [x.type, +x.value]));
    return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(utcMs / 60000) * 60000) / 60000;
  } catch { return 540; }
}
function seoulToUtc(y, m, d, h, mi) {
  const wall = Date.UTC(y, m - 1, d, h, mi);
  let off = seoulOffsetMin(wall - 540 * 60000);
  off = seoulOffsetMin(wall - off * 60000);
  return wall - off * 60000;
}

// 절기: utc(ms) 직전에 들어온 절기 { idx(0=소한…23=동지), year, utcMin }
function jeolgiList(year) {
  const r = JEOLGI.min[year - JEOLGI.from];
  return r ? r.map((m, i) => ({ idx: i, year, utcMin: m, name: JEOLGI_NAMES[i] })) : [];
}
function lastJeolgi(utcMs, onlyJeol = false) {
  const t = utcMs / 60000, y = new Date(utcMs).getUTCFullYear();
  const all = [...jeolgiList(y - 1), ...jeolgiList(y), ...jeolgiList(y + 1)].filter(j => !onlyJeol || j.idx % 2 === 0);
  let prev = null, next = null;
  for (const j of all) { if (j.utcMin <= t) prev = j; else if (!next) next = j; }
  return { prev, next };
}

/* 사주 네 기둥.
   opt.correct: 'lon'(경도 보정, 기본) | 'none'(시계 그대로) · opt.lon: 경도(기본 127.5) · opt.yajasi: 23~24시를 그날 일주로 둘지 */
function fourPillars(y, m, d, h, mi, opt = {}) {
  const utc = seoulToUtc(y, m, d, h, mi);
  // 시주·일주용 '지방시': 경도 보정이면 UTC + 경도×4분, 아니면 시계 시각
  const localMs = opt.correct === 'none' ? Date.UTC(y, m - 1, d, h, mi) : utc + (opt.lon ?? 127.5) * 4 * 60000;
  const L = new Date(localMs);
  const lh = L.getUTCHours(), lm = L.getUTCMinutes();
  let jdn = Math.floor(Date.UTC(L.getUTCFullYear(), L.getUTCMonth(), L.getUTCDate()) / 86400000) + 2440588;
  const lateZi = lh >= 23;
  if (lateZi && !opt.yajasi) jdn += 1;
  const dayIdx = mod(jdn + 49, 60);
  const hourZhi = Math.floor(((lh * 60 + lm) + 60) / 120) % 12;
  const stemDay = lateZi && opt.yajasi ? (dayIdx + 1) % 10 : dayIdx % 10; // 야자시: 다음 날 천간으로 시간
  const hourGan = mod((stemDay % 5) * 2 + hourZhi, 10);
  // 년·월: 절기(절입 시각) 기준, 보정과 무관하게 실제 시각으로 비교
  const { prev: jeol, next: nextJeol } = lastJeolgi(utc, true);
  let sy = new Date(utc).getUTCFullYear();
  const ipchun = JEOLGI.min[sy - JEOLGI.from][2];
  if (utc / 60000 < ipchun) sy -= 1;
  const yearIdx = mod(sy - 1984, 60); // 1984 甲子
  const monthZhi = mod(Math.floor(jeol.idx / 2) + 1, 12); // 소한→丑, 입춘→寅 …
  const k = mod(monthZhi - 2, 12); // 寅월부터 몇 번째
  const monthGan = mod((yearIdx % 5) * 2 + 2 + k, 10);
  return {
    utc, local: { h: lh, m: lm }, sajuYear: sy, dayNum: jdn - 2440588, // dayNum: 일주가 가리키는 날(1970-01-01부터 날 수)
    year: gz60(yearIdx), month: GAN[monthGan] + JI[monthZhi], day: gz60(dayIdx), hour: GAN[hourGan] + JI[hourZhi],
    jeol, nextJeol, jeolgi: lastJeolgi(utc).prev,
  };
}

// 순(旬)과 공망
function xunOf(gz) {
  const i = gzIndex(gz), start = i - (i % 10);
  return { start: gz60(start), kong: [JI[mod(start + 10, 12)], JI[mod(start + 11, 12)]] };
}
// 지지 → 둔간(순 안에서 붙는 천간), 공망이면 ''
function dunGan(gz, zhi) {
  const s = gzIndex(xunOf(gz).start);
  for (let j = 0; j < 10; j++) if (gz60(s + j)[1] === zhi) return gz60(s + j)[0];
  return '';
}
// 음력 → 양력 (data/lunar.json, 천문연 음력). { date: 'YYYY-MM-DD' } 또는 { err: 이유 }
let LUNAR = null; // { from, rows: [[음력 1월 1일의 양력(1970-01-01부터 날 수), 윤달(0=없음), 달 길이 비트(윤달 포함 순서, 1=30일)]] }
function lunarToSolar(y, m, d, leap = false) {
  const row = LUNAR.rows[y - LUNAR.from];
  if (!row) return { err: `음력은 ${LUNAR.from}~${LUNAR.from + LUNAR.rows.length - 1}년만 넣을 수 있어요.` };
  const [start, lp, bits] = row;
  if (!(m >= 1 && m <= 12)) return { err: '음력 월은 1~12로 넣어요.' };
  if (leap && lp !== m) return { err: `음력 ${y}년에는 윤${m}월이 없어요 (${lp ? `그해 윤달은 윤${lp}월` : '그해는 윤달이 없어요'}).` };
  const k = m - 1 + (lp && (m > lp || leap) ? 1 : 0); // 그해 몇 번째 달인지 (윤달 포함, 0부터)
  const len = 29 + ((bits >> k) & 1);
  if (!(d >= 1 && d <= len)) return { err: `음력 ${y}년 ${leap ? '윤' : ''}${m}월은 ${len}일까지예요.` };
  let days = start + d - 1;
  for (let j = 0; j < k; j++) days += 29 + ((bits >> j) & 1);
  const t = new Date(days * 86400000);
  return { date: `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}` };
}

// 양력 'YYYY-MM-DD' → 음력 { y, m, d, leap } (음력 1900~2100 안일 때)
function solarToLunar(date) {
  const D = Math.floor(Date.UTC(...date.split('-').map((v, k) => +v - (k === 1 ? 1 : 0))) / 86400000);
  for (let k = LUNAR.rows.length - 1; k >= 0; k--) {
    const [start, lp, bits] = LUNAR.rows[k];
    if (D < start) continue;
    let off = D - start;
    for (let j = 0; j < 12 + (lp ? 1 : 0); j++) {
      const len = 29 + ((bits >> j) & 1);
      if (off < len) return { y: LUNAR.from + k, m: j + 1 - (lp && j >= lp ? 1 : 0), d: off + 1, leap: !!lp && j === lp };
      off -= len;
    }
  }
  return null;
}

function fmtUtc(ms) {
  const d = new Date(ms + 540 * 60000);
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

if (typeof module !== 'undefined') module.exports = { GAN, JI, ko, gz60, gzIndex, ohOf, isYangGan, isYangJi, SAENG, GEUK, OH_KO, fourPillars, lastJeolgi, xunOf, dunGan, seoulToUtc, fmtUtc, setJeolgi: j => (JEOLGI = j), mod, JEOLGI_NAMES, lunarToSolar, solarToLunar, setLunar: j => (LUNAR = j) };
