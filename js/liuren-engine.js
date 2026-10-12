'use strict';
// 대육임 과전 계산: 천지반 → 사과 → 삼전(구종법) → 천장·둔간·공망·육친
// 따른 규칙: 귀인 = 甲戊庚 丑/未, 乙己 子/申, 丙丁 亥/酉, 壬癸 卯/巳, 辛 午/寅 (주/야)
//           귀인이 앉은 지반이 亥~辰이면 순행, 巳~戌이면 역행
//           섭해는 '맹(寅申巳亥)에 앉은 것 먼저, 그다음 중(子午卯酉), 같으면 양일 간상·음일 지상' 간편법

const LR_GIGUNG = { 甲: '寅', 乙: '辰', 丙: '巳', 丁: '未', 戊: '巳', 己: '未', 庚: '申', 辛: '戌', 壬: '亥', 癸: '丑' };
const LR_GUI_DAY = { 甲: '丑', 戊: '丑', 庚: '丑', 乙: '子', 己: '子', 丙: '亥', 丁: '亥', 壬: '卯', 癸: '卯', 辛: '午' };
const LR_GUI_NIGHT = { 甲: '未', 戊: '未', 庚: '未', 乙: '申', 己: '申', 丙: '酉', 丁: '酉', 壬: '巳', 癸: '巳', 辛: '寅' };
const LR_JIANG = ['귀인', '등사', '주작', '육합', '구진', '청룡', '천공', '백호', '태상', '현무', '태음', '천후'];
const LR_JIANG_SHORT = { 귀인: '貴', 등사: '蛇', 주작: '朱', 육합: '合', 구진: '勾', 청룡: '靑', 천공: '空', 백호: '白', 태상: '常', 현무: '玄', 태음: '陰', 천후: '后' };
// 월장: 직전 중기 → 월장 지지
const LR_WOLJANG = { 대한: '子', 우수: '亥', 춘분: '戌', 곡우: '酉', 소만: '申', 하지: '未', 대서: '午', 처서: '巳', 추분: '辰', 상강: '卯', 소설: '寅', 동지: '丑' };
const LR_HYEONG = { 子: '卯', 卯: '子', 寅: '巳', 巳: '申', 申: '寅', 丑: '戌', 戌: '未', 未: '丑', 辰: '辰', 午: '午', 酉: '酉', 亥: '亥' };
const LR_YEOKMA = { 申: '寅', 子: '寅', 辰: '寅', 寅: '申', 午: '申', 戌: '申', 巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳' };
const LR_GANHAP = { 甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙', 丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊' };
const LR_SAMHAP_NEXT = { 申: '子', 子: '辰', 辰: '申', 亥: '卯', 卯: '未', 未: '亥', 寅: '午', 午: '戌', 戌: '寅', 巳: '酉', 酉: '丑', 丑: '巳' };

function lrRel(dayGan, c) {
  const a = ohOf(dayGan), b = ohOf(c);
  if (a === b) return '형제';
  if (SAENG[a] === b) return '자손';
  if (GEUK[a] === b) return '처재';
  if (GEUK[b] === a) return '관귀';
  return '부모';
}
const lrGeuk = (x, y) => GEUK[ohOf(x)] === ohOf(y); // x가 y를 극
const lrYang = c => (GAN.includes(c) ? isYangGan(c) : isYangJi(c));

/* dayGz: '己未', woljang: '辰', shi: '巳', day: true(주점)/false(야점) */
function liurenCalc(dayGz, woljang, shi, day = true) {
  const dg = dayGz[0], dz = dayGz[1];
  const off = mod(JI.indexOf(woljang) - JI.indexOf(shi), 12);
  const up = e => JI[mod(JI.indexOf(e) + off, 12)];      // 지반 e 위의 천반
  const down = t => JI[mod(JI.indexOf(t) - off, 12)];    // 천반 t 아래의 지반
  const plate = Object.fromEntries([...JI].map(e => [e, up(e)]));
  const gUp = up(LR_GIGUNG[dg]);
  const ke = [[gUp, dg], [up(gUp), gUp], [up(dz), dz], [up(up(dz)), up(dz)]].map(([u, d], i) => ({ n: i + 1, up: u, down: d }));
  const ganUp = ke[0].up, jiUp = ke[2].up;
  const uniq = [];
  ke.forEach(k => { if (!uniq.some(u => u.up === k.up && u.down === k.down)) uniq.push(k); });
  const yangDay = isYangGan(dg);
  // 섭해 간편법
  const seophae = cands => {
    const meng = '寅申巳亥', jung = '子午卯酉';
    for (const grp of [meng, jung]) {
      const hit = [...new Set(cands.filter(k => grp.includes(down(k.up))).map(k => k.up))];
      if (hit.length === 1) return hit[0];
    }
    return yangDay ? ganUp : jiUp;
  };
  const pickByYang = (cands, kind) => {
    const ups = [...new Set(cands.map(k => k.up))];
    if (ups.length === 1) return { chu: ups[0], method: kind === 'xia' ? '중심과' : '원수과', how: kind === 'xia' ? '하적상이 하나뿐이라 그 상신이 초전' : '상극하가 하나뿐이라 그 상신이 초전' };
    const same = [...new Set(cands.filter(k => lrYang(k.up) === yangDay).map(k => k.up))];
    if (same.length === 1) return { chu: same[0], method: '지일과(비용)', how: '극이 여럿이라 일간과 음양이 같은 상신을 초전으로(비용법)' };
    return { chu: seophae(same.length ? cands.filter(k => same.includes(k.up)) : cands), method: '섭해과', how: '비용으로도 하나로 안 갈려 섭해(간편법: 맹→중→간상/지상)로 초전' };
  };
  const normalNext = c => [c, up(c), up(up(c))];
  let r = null;
  const xia = uniq.filter(k => lrGeuk(k.down, k.up)), shang = uniq.filter(k => lrGeuk(k.up, k.down));

  if (off === 0) { // 복음
    let chu, how;
    if (xia.length || shang.length) { const p = pickByYang(xia.length ? xia : shang, xia.length ? 'xia' : 'shang'); chu = p.chu; how = '복음이지만 극이 있어 극을 씀'; }
    else { chu = yangDay ? ganUp : jiUp; how = yangDay ? '극이 없는 양일 → 간상신이 초전' : '극이 없는 음일 → 지상신이 초전'; }
    let mid = LR_HYEONG[chu];
    if (mid === chu) mid = yangDay ? jiUp : ganUp;
    let end = LR_HYEONG[mid];
    if (end === mid || end === chu) end = JI[mod(JI.indexOf(mid) + 6, 12)];
    r = { san: [chu, mid, end], method: '복음과', how: how + '. 중전은 초전의 형, 말전은 중전의 형(자형이면 충)' };
  } else if (xia.length || shang.length) { // 적극(반음 유극 포함)
    const p = pickByYang(xia.length ? xia : shang, xia.length ? 'xia' : 'shang');
    r = { san: normalNext(p.chu), method: (off === 6 ? '반음과 · ' : '') + p.method, how: p.how + '. 중전은 초전 위 천반, 말전은 중전 위 천반' };
  } else if (off === 6) { // 반음 무극: 정란사
    r = { san: [LR_YEOKMA[dz], jiUp, ganUp], method: '반음과 · 정란사', how: '반음인데 극이 없어 일지의 역마가 초전, 중전 지상신, 말전 간상신' };
  } else {
    // 요극: 상신이 일간을 극(호시) 먼저, 없으면 일간이 상신을 극(탄사)
    const others = uniq.slice(1);
    const hosi = others.filter(k => lrGeuk(k.up, dg)), tansa = others.filter(k => lrGeuk(dg, k.up));
    if (hosi.length || tansa.length) {
      const cands = hosi.length ? hosi : tansa;
      const ups = [...new Set(cands.map(k => k.up))];
      const same = ups.filter(u => lrYang(u) === yangDay);
      const chu = ups.length === 1 ? ups[0] : (same.length === 1 ? same[0] : seophae(cands));
      r = { san: normalNext(chu), method: hosi.length ? '요극과 · 호시' : '요극과 · 탄사', how: (hosi.length ? '사과에 극이 없어 일간을 극하는 상신(호시)' : '사과에 극이 없어 일간이 극하는 상신(탄사)') + '을 초전으로' };
    } else if (LR_GIGUNG[dg] === dz) { // 팔전
      const chu = yangDay ? JI[mod(JI.indexOf(ganUp) + 2, 12)] : JI[mod(JI.indexOf(ke[3].up) - 2, 12)];
      r = { san: [chu, ganUp, ganUp], method: '팔전과', how: yangDay ? '팔전일, 극이 없어 간상신부터 순행 셋째가 초전, 중·말전은 간상신' : '팔전일, 극이 없어 4과 상신부터 역행 셋째가 초전, 중·말전은 간상신' };
    } else if (uniq.length < 4) { // 별책
      const chu = yangDay ? up(LR_GIGUNG[LR_GANHAP[dg]]) : LR_SAMHAP_NEXT[dz];
      r = { san: [chu, ganUp, ganUp], method: '별책과', how: yangDay ? '사과가 셋뿐이고 극이 없어 양일 → 간합한 천간의 기궁 위 천반이 초전' : '사과가 셋뿐이고 극이 없어 음일 → 일지 삼합의 앞 지지가 초전', };
    } else { // 묘성
      r = yangDay
        ? { san: [up('酉'), jiUp, ganUp], method: '묘성과 · 호시전봉', how: '사과가 온전하고 극이 없어 양일 → 지반 酉 위 천반이 초전, 중전 지상신, 말전 간상신' }
        : { san: [down('酉'), ganUp, jiUp], method: '묘성과 · 동사엄목', how: '사과가 온전하고 극이 없어 음일 → 천반 酉 아래 지반이 초전, 중전 간상신, 말전 지상신' };
    }
  }
  // 천장
  const gui = (day ? LR_GUI_DAY : LR_GUI_NIGHT)[dg];
  const guiOn = down(gui), fwd = '亥子丑寅卯辰'.includes(guiOn);
  const jiang = {};
  LR_JIANG.forEach((name, j) => { jiang[JI[mod(JI.indexOf(gui) + (fwd ? j : -j), 12)]] = name; });
  const { kong } = xunOf(dayGz);
  const san = r.san.map((z, i) => ({ name: ['초전', '중전', '말전'][i], zhi: z, rel: lrRel(dg, z), dun: dunGan(dayGz, z), jiang: jiang[z], kong: kong.includes(z) }));
  return {
    type: 'liuren', day: dayGz, woljang, shi, daynight: day ? '주점' : '야점', off, plate, jiang,
    ke: ke.map(k => ({ ...k, jiang: jiang[k.up], dun: dunGan(dayGz, k.up) })),
    san, method: r.method, how: r.how, kong, gui, guiOn, guiDir: fwd ? '순행' : '역행',
    dunPlate: Object.fromEntries([...JI].map(e => [e, dunGan(dayGz, plate[e])])),
  };
}

// 날짜·시각으로 바로
function liurenAt(y, m, d, h, mi, opt = {}, dayMode) {
  const p = fourPillars(y, m, d, h, mi, opt);
  const zg = lastJeolgi(p.utc).prev; // 중기 찾기: 직전 홀수 번호 절기
  let wj = null;
  for (let t = p.utc; !wj; t -= 5 * 86400000) { const j = lastJeolgi(t).prev; if (j.idx % 2 === 1) wj = j; }
  const shi = p.hour[1];
  const isDay = dayMode ?? '卯辰巳午未申'.includes(shi);
  return { ...liurenCalc(p.day, LR_WOLJANG[wj.name], shi, isDay), pillars: p, junggi: wj.name, jeolgi: zg.name };
}
