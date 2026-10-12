"""data/*.json 검사: python3 tools/validate.py  (id 중복, 없는 용어 링크, 형식)"""
import json, re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SUBJECTS = ["base", "myeongri", "liuren", "qimen", "tarot"]
PREFIX = {"base": "base-", "myeongri": "mr-", "liuren": "lr-", "qimen": "qm-", "tarot": "tr-"}
LINK = re.compile(r"\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]")
errs, data, ids = [], {}, {}
PREFIX_OF = lambda i: {'base': 'base', 'mr': 'myeongri', 'lr': 'liuren', 'qm': 'qimen', 'tr': 'tarot'}[i.split('-')[0]]
for s in SUBJECTS:
    p = ROOT / "data" / f"{s}.json"
    if not p.exists():
        print(f"(없음) {p.name}"); continue
    try: d = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e: errs.append(f"{p.name}: JSON 형식 오류 {e}"); continue
    data[s] = d
    for k in ["id", "name", "emoji", "intro", "concepts", "categories", "terms", "cases"]:
        if k not in d: errs.append(f"{s}: '{k}' 없음")
    cats = {c["id"] for c in d.get("categories", [])}
    for t in d.get("terms", []):
        for k in ["id", "cat", "term", "short", "body"]:
            if k not in t: errs.append(f"{s}/{t.get('id')}: '{k}' 없음")
        if not t.get("id", "").startswith(PREFIX[s]): errs.append(f"{s}: id '{t.get('id')}'는 {PREFIX[s]}로 시작해야 해요")
        if t.get("cat") not in cats: errs.append(f"{s}/{t['id']}: 없는 cat '{t.get('cat')}'")
        if t["id"] in ids: errs.append(f"id 중복: {t['id']}")
        ids[t["id"]] = s
    for c in d.get("concepts", []) + d.get("cases", []):
        if c.get("id") in ids: errs.append(f"id 중복: {c.get('id')}")
        ids[c.get("id")] = s
def walk(o, where):
    if isinstance(o, str):
        for m in LINK.findall(o):
            if m not in ids: errs.append(f"{where}: 없는 링크 [[{m}]]")
    elif isinstance(o, list): [walk(x, where) for x in o]
    elif isinstance(o, dict):
        for k, v in o.items():
            if k in ("see", "terms") and isinstance(v, list):
                for x in v:
                    if x not in ids: errs.append(f"{where}: {k}에 없는 id '{x}'")
            elif k != "board": walk(v, where)
for s, d in data.items():
    for sec in ("concepts", "terms", "cases"):
        for item in d.get(sec, []): walk(item, f"{s}/{item.get('id')}")
    for i, c in enumerate(d.get("cases", [])):
        if "board" in c and c["board"].get("type") not in ("pillars", "liuren", "qimen", "spread"):
            errs.append(f"{s}/{c['id']}: board.type 이상")
schema = (ROOT / "tools" / "SCHEMA.md").read_text(encoding="utf-8")
fixed = set(re.findall(r"\b((?:base|mr|lr|qm)-[a-z0-9-]+)\b", schema.split("## 앱 화면이 링크하는 고정 id")[1]))
fixed |= {f"tr-m{i:02d}" for i in range(22)} | {f"tr-{s_}{i:02d}" for s_ in "wcsp" for i in range(1, 15)}
fixed -= {"base-xxx"}
for f in sorted(fixed):
    if f not in ids and PREFIX_OF(f) in data: errs.append(f"고정 id 없음: {f}")
print("\n".join(errs) if errs else f"✅ 문제 없음 — 용어 {sum(len(d['terms']) for d in data.values())}개, 사례 {sum(len(d['cases']) for d in data.values())}개")
sys.exit(1 if errs else 0)
