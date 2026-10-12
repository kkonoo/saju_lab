// 사례 판을 계산해서 글로 보여 줌 (사례 해설 쓸 때 참고): node tools/dump-cases.js
const c = require('./load.js')(['js/calendar.js', 'js/myeongri-engine.js', 'js/liuren-engine.js', 'js/qimen-engine.js']);
const at = s => s.split(/[- :]/).map(Number);
const specs = {
  myeongri: [{ type: 'pillars', pillars: ['庚午', '戊子', '甲寅', '庚午'] }, { type: 'pillars', pillars: ['癸酉', '乙卯', '丙申', '庚寅'] }, { type: 'pillars', at: '1990-05-15 14:30', male: false }],
  liuren: [{ type: 'liuren', day: '甲子', woljang: '亥', shi: '卯', daytime: true }, { type: 'liuren', day: '壬申', woljang: '亥', shi: '午', daytime: true }, { type: 'liuren', at: '2026-10-12 10:14' }],
  qimen: [{ type: 'qimen', yang: true, ju: 1, shi: '庚午' }, { type: 'qimen', at: '2026-10-12 10:14' }, { type: 'qimen', yang: true, ju: 1, shi: '丁未' }],
};
for (const [subj, list] of Object.entries(specs)) for (const s of list) {
  let r;
  if (s.type === 'pillars') r = s.at ? c.myeongriAt(...at(s.at), s.male) : c.myeongriFromPillars(s.pillars);
  if (s.type === 'liuren') r = s.at ? c.liurenAt(...at(s.at)) : c.liurenCalc(s.day, s.woljang, s.shi, s.daytime);
  if (s.type === 'qimen') r = s.at ? c.qimenAt(...at(s.at)) : c.qimenCalc(s.yang, s.ju, s.shi);
  if (r.info) { r.info = { year: r.info.year, month: r.info.month, day: r.info.day, hour: r.info.hour, jeol: r.info.jeol.name, nextJeol: r.info.nextJeol.name }; }
  if (r.pillars && r.pillars.utc) r.pillars = { year: r.pillars.year, month: r.pillars.month, day: r.pillars.day, hour: r.pillars.hour };
  console.log(`\n### ${subj} — board 스펙: ${JSON.stringify(s)}\n${JSON.stringify(r)}`);
}
