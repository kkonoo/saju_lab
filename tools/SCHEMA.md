# data/<subject>.json 형식

```json
{
  "id": "liuren", "name": "육임", "emoji": "🌀",
  "intro": "탭 맨 위 한두 문장",
  "concepts": [   // 📘 기본 개념: 순서대로 읽는 짧은 글 6~8개
    { "id": "lr-c-what", "title": "육임은 무엇을 보나요", "body": ["문단", "문단"], "terms": ["lr-sagwa"] }
  ],
  "categories": [ { "id": "plate", "name": "🗺️ 천지반" } ],   // 용어 테마 4~6개, 이모지로 시작
  "terms": [
    { "id": "lr-sagwa", "cat": "plate", "term": "사과", "hanja": "四課", "aka": "네 과 사과법",
      "short": "한 줄 설명(40자 안팎)", "body": ["문단", "문단"], "example": "예시(선택)", "see": ["lr-samjeon"] }
  ],
  "cases": [      // 🧩 사례
    { "id": "lr-case-1", "title": "", "summary": "한두 문장", "board": { ...tools/boards.json에서 그대로 복사... },
      "steps": [ { "title": "1. 천지반 펴기", "body": ["문단"], "terms": ["lr-wolajang"] } ],
      "note": "유파 차이 등 주의(선택)" }
  ]
}
```

- id: 영어 소문자·숫자·하이픈. 과목 접두어 필수 — base-, mr-, lr-, qm-, tr-. 개념은 `<접두어>c-…`, 사례는 `<접두어>case-…`.
- 본문 안 용어 링크: `[[lr-samjeon]]` 또는 `[[lr-samjeon|삼전]]` (표시 글자 바꾸기). 다른 과목 용어도 링크 가능.
- `see`/`terms`에는 존재하는 용어 id만. `python3 tools/validate.py`로 검사.
- 글자만(HTML·마크다운 없음). 한자는 `hanja` 칸 또는 괄호로.
- board.type: pillars(명리 원국) · liuren(육임) · qimen(기문 9궁) · spread(타로).
  spread 형식: `{ "type": "spread", "name": "쓰리 카드", "question": "질문", "cards": [ { "pos": "과거", "card": "tr-tower", "reversed": false } ] }` (card는 타로 용어 id)

## 사례 board (앱이 계산해서 그림 — 판 값을 JSON에 손으로 쓰지 않음)

- 명리: `{ "type": "pillars", "pillars": ["庚午","戊子","甲寅","庚午"] }` 또는 `{ "type": "pillars", "at": "1990-05-15 14:30", "male": false }`
- 육임: `{ "type": "liuren", "day": "甲子", "woljang": "亥", "shi": "卯", "daytime": true }` 또는 `{ "type": "liuren", "at": "2026-10-12 10:14" }`
- 기문: `{ "type": "qimen", "yang": true, "ju": 1, "shi": "庚午" }` 또는 `{ "type": "qimen", "at": "2026-10-12 10:14" }`
- 타로: `{ "type": "spread", "name": "쓰리 카드", "question": "질문", "cards": [ { "pos": "과거", "card": "tr-m16", "reversed": false } ] }`
- 계산 결과는 `node tools/dump-cases.js`로 확인.

## 타로 카드 용어 (추가 칸)

`{ "id": "tr-m00", "cat": "major", "term": "0 바보 (The Fool)", "keywords": "시작 · 자유 · 모험", "short": "…", "body": ["카드 그림 묘사·상징"], "upright": "정방향 뜻", "reversed": "역방향 뜻", "see": [] }`

## 앱 화면이 링크하는 고정 id (반드시 이 id로 만들 것)

- base: base-eumyang base-ohaeng base-sangsaeng base-sanggeuk base-cheongan base-jiji base-ganji60 base-gongmang base-ganhap base-yukhap base-samhap base-chung base-hyeong base-jeolgi base-nakseo base-palgwae base-yeokma
- myeongri: mr-ilgan mr-sipsin mr-bigyeon mr-geopjae mr-siksin mr-sanggwan mr-pyeonjae mr-jeongjae mr-pyeongwan mr-jeonggwan mr-pyeonin mr-jeongin mr-jijanggan mr-12unseong mr-daeun mr-seun mr-wollyeong mr-singang mr-yongsin mr-ohaeng-balance
- liuren: lr-cheonjiban lr-woljang lr-jeomsi lr-gigung lr-sagwa lr-samjeon lr-chojeon lr-dungan lr-yukchin lr-cheonjang lr-gwiin lr-deungsa lr-jujak lr-yukhap lr-gujin lr-cheongnyong lr-cheongong lr-baekho lr-taesang lr-hyeonmu lr-taeeum lr-cheonhu lr-jujeom-yajeom lr-gujongbeop lr-jeokgeuk lr-biyong lr-seophae lr-yogeuk lr-myoseong lr-byeolchaek lr-paljeon lr-bogeum lr-baneum
- qimen: qm-gugung qm-samgi-yugui qm-jiban qm-cheonban qm-guseong qm-palmun qm-palsin qm-jikbu qm-jiksa qm-yangdun-eumdun qm-guksu qm-samwon qm-budu qm-jeonban qm-gigung qm-gongmang
  - 구성: qm-s-bong(천봉) qm-s-ye(천예) qm-s-chung(천충) qm-s-bo(천보) qm-s-geum(천금) qm-s-sim(천심) qm-s-ju(천주) qm-s-im(천임) qm-s-yeong(천영)
  - 팔문: qm-d-hyu(휴) qm-d-saeng(생) qm-d-sang(상) qm-d-du(두) qm-d-gyeong9(景) qm-d-sa(사) qm-d-gyeong7(驚) qm-d-gae(개)
  - 팔신: qm-g-jikbu qm-g-deungsa qm-g-taeeum qm-g-yukhap qm-g-baekho qm-g-hyeonmu qm-g-guji qm-g-gucheon
- tarot: 메이저 tr-m00 … tr-m21, 마이너 tr-w01…tr-w14(완드) tr-c01…(컵) tr-s01…(소드) tr-p01…(펜타클) — 01 에이스, 02~10 숫자, 11 페이지, 12 나이트, 13 퀸, 14 킹. 개념: tr-major tr-minor tr-wands tr-cups tr-swords tr-pentacles tr-court tr-reversed tr-spread
