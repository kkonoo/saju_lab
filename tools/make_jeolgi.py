"""24절기 시각표 만들기 (PyEphem, VSOP87). python3 tools/make_jeolgi.py → data/jeolgi.json
각 해 1월 소한부터 24개, 값은 UTC 기준 '분' (1970-01-01부터). 0번=소한(285°), 1=대한(300°), 2=입춘(315°) …"""
import ephem, math, json, pathlib
def lon(d):
    # PyEphem 황경에 광행차(-20.5")와 황경 장동(근사)을 더해 겉보기 황경으로 맞춤 (천문연 발표값과 1분 안쪽)
    s = ephem.Sun(d); L = math.degrees(ephem.Ecliptic(s, epoch=d).lon)
    T = (ephem.julian_date(d) - 2451545) / 36525; om = math.radians(125.04 - 1934.136 * T)
    return (L - 0.00569 - 0.00478 * math.sin(om)) % 360
def find(target, guess):
    d = ephem.Date(guess)
    for _ in range(50):
        diff = (target - lon(d) + 180) % 360 - 180
        if abs(diff) < 1e-7: break
        d = ephem.Date(d + diff / 0.9856)
    return d
EPOCH = ephem.Date('1970/1/1 00:00')
out = {}
for y in range(1899, 2102):
    row = []
    for i in range(24):
        deg = (285 + 15 * i) % 360
        guess = ephem.Date(f'{y}/1/6') + i * 15.22
        d = find(deg, guess)
        row.append(round((d - EPOCH) * 1440))
    out[y] = row
p = pathlib.Path(__file__).resolve().parent.parent / 'data' / 'jeolgi.json'
p.write_text(json.dumps({"from": 1899, "names": "소한 대한 입춘 우수 경칩 춘분 청명 곡우 입하 소만 망종 하지 소서 대서 입추 처서 백로 추분 한로 상강 입동 소설 대설 동지".split(), "min": [out[y] for y in range(1899, 2102)]}, separators=(',', ':')))
print(p, p.stat().st_size)
