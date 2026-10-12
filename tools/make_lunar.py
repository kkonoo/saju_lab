"""음력표 만들기 (PyEphem 합삭 + data/jeolgi.json 중기). python3 tools/make_lunar.py → data/lunar.json
한국 음력 규칙: 합삭이 든 날(한국 시각)이 초하루, 동지가 든 달이 11월, 동지~동지 사이에 달이 13개면 중기 없는 첫 달이 윤달.
한 해 = [음력 1월 1일의 양력 날짜(1970-01-01부터 날 수), 윤달(0=없음), 달 길이 비트(윤달 포함 순서대로, 1=30일)]"""
import ephem, json, pathlib, datetime
ROOT = pathlib.Path(__file__).resolve().parent.parent
FROM, TO = 1900, 2100
J = json.loads((ROOT / 'data' / 'jeolgi.json').read_text(encoding='utf-8'))

def offset_min(utc):
    # 천문연 음력의 날짜 기준 시각: 1911년까지 동경 120도(UTC+8), 1954~1961 동경 127.5도(UTC+8:30), 그 밖은 UTC+9
    # (korean_lunar_calendar 패키지(천문연 자료)와 1900~2050년 모든 달을 대조해 맞춤)
    if utc < datetime.datetime(1911, 12, 31, 16): return 480
    if datetime.datetime(1954, 3, 20, 15, 30) <= utc < datetime.datetime(1961, 8, 9, 15, 30): return 510
    return 540

EPOCH = datetime.date(1970, 1, 1)
def kst_day(utc):  # UTC datetime → 한국 날짜의 1970-01-01부터 날 수
    return ((utc + datetime.timedelta(minutes=offset_min(utc))).date() - EPOCH).days

# 합삭: FROM-1년 10월부터 TO+2년 2월까지 (마지막 해를 닫으려면 TO+1년 동지 다음 달까지 있어야 함)
starts, d = [], ephem.Date(f'{FROM - 1}/10/1')
while True:
    d = ephem.next_new_moon(d)
    t = d.datetime()
    if t.year > TO + 2 or (t.year == TO + 2 and t.month > 2): break
    starts.append(kst_day(t))
    d = ephem.Date(d + 1)

# 중기(대한·우수·춘분…동지 = jeolgi 홀수 번): 한국 날짜 → 달 번호(우수 1월 … 동지 11월, 대한 12월)
zhongqi = {}
for yi, row in enumerate(J['min']):
    for k in range(1, 24, 2):
        utc = datetime.datetime(1970, 1, 1) + datetime.timedelta(minutes=row[k])
        zhongqi[kst_day(utc)] = (k - 3) // 2 % 12 + 1

def zq_in(i):  # i번째 달(starts[i] ~ starts[i+1]-1)에 든 중기 달 번호들
    return [n for day, n in zhongqi.items() if starts[i] <= day < starts[i + 1]]

# 동지가 든 달(11월)끼리 사이를 채움
eleven = [i for i in range(len(starts) - 1) if 11 in zq_in(i)]
num = {}  # 달 인덱스 → (달 번호, 윤달?)
for a, b in zip(eleven, eleven[1:]):
    leap_i = next((j for j in range(a + 1, b) if not zq_in(j)), None) if b - a == 13 else None
    n = 11
    for j in range(a, b):
        if j == leap_i: num[j] = ((n - 2) % 12 + 1, True); continue  # 윤달은 앞 달 번호를 한 번 더
        num[j] = (n, False)
        n = n % 12 + 1

rows = []
for y in range(FROM, TO + 1):
    first = next(i for i in sorted(num) if num[i] == (1, False) and datetime.date.fromordinal(EPOCH.toordinal() + starts[i]).year == y)
    leap, bits, k, i = 0, 0, 0, first
    while True:
        n, is_leap = num[i]
        if is_leap: leap = n
        if starts[i + 1] - starts[i] == 30: bits |= 1 << k
        k, i = k + 1, i + 1
        if num[i] == (1, False): break
    assert k == 12 + (1 if leap else 0), (y, k, leap)
    rows.append([starts[first], leap, bits])

p = ROOT / 'data' / 'lunar.json'
p.write_text(json.dumps({'from': FROM, 'rows': rows}, separators=(',', ':')))
print(p, p.stat().st_size)
