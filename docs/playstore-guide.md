# Word Roots — Google Play Store 출시 가이드

## 앱 정보

| 항목 | 내용 |
|---|---|
| 앱 이름 | Word Roots |
| 패키지명 | com.etymologyapp |
| 가격 | 무료 (인앱 결제) |
| 인앱 상품 ID | `unlock_full` |
| 인앱 상품 가격 | ₩4,900 (일회성, 영구) |
| 무료 체험 범위 | A 서브카테고리 전체 (76개 그룹) |
| 개인정보처리방침 | https://kim-kh.github.io/wordroots/privacy-policy.html |
| 개발자 이메일 | gforwinning@gmail.com |

---

## 빌드 명령어 (EAS Build)

> 키스토어는 EAS가 관리합니다. 로컬 keystore 불필요.

### APK (기기 직접 설치 테스트용)
```
eas build --platform android --profile preview
```

### AAB (Play Store 업로드용)
```
eas build --platform android --profile production
```

빌드 완료 후 EAS 대시보드 또는 터미널 링크에서 AAB 다운로드.

### 기기 설치
```
adb install -r <다운로드한 apk 경로>
```

> **주의**: 새 버전 업로드 시 `app.json`의 `expo.android.versionCode`를 1씩 증가시켜야 합니다.

---

## Play Console 출시 순서

### 1단계 — 앱 만들기
- **play.google.com/console** → 앱 만들기
- 앱 이름: `Word Roots`
- 기본 언어: 한국어
- 종류: 앱
- 유료/무료: **무료**
- 정책 동의 → 앱 만들기

---

### 2단계 — 스토어 등록정보

**경로**: 스토어 등록정보 → 기본 스토어 등록정보

| 항목 | 내용 |
|---|---|
| 앱 이름 | Word Roots |
| 아이콘 | `assets/icon-512.png` (512×512px) |
| 피처드 이미지 | `assets/feature-graphic-1024x500.png` (1024×500px) |
| 스크린샷 | `assets/screenshot1~5.png` |

저장 후 **번역 추가**로 5개 언어 각각 등록 (아래 앱 소개 텍스트 참고)

---

### 3단계 — 앱 소개 텍스트

#### 한국어
**간단한 설명** (80자 이내)
```
어원으로 배우는 영어 단어장 — 한국어·영어·일본어·중국어·프랑스어 5개 언어 지원
```

**자세한 설명**
```
어원(Etymology)으로 영어 단어를 체계적으로 학습하는 단어장입니다.

단어를 하나씩 외우는 것이 아니라, 단어의 뿌리인 어원을 이해하면
수백 개의 단어가 자연스럽게 읽힙니다.

예를 들어 'a-, an-'이 "없다, 아니다"라는 뜻임을 알면,
atheist(무신론자), anarchy(무정부), anonymous(익명),
apathy(무관심)의 의미가 어원으로부터 저절로 이해됩니다.

■ 주요 기능
• 어원별로 묶인 단어 그룹
• 단어 카드: 접두사·어근·접미사 분석표 + 예문 + 번역
• 그룹별 메모: 나만의 학습 노트를 남길 수 있음
• 접두사·어근·접미사 카테고리별 탐색
• 알파벳순 빠른 이동
• 발음 듣기 (TTS)

■ 5개 언어 완전 지원
한국어 · English · 日本語 · 中文 · Français
기기 설정 언어에 따라 자동으로 표시되며,
앱 내 언어 메뉴에서 언제든지 변경할 수 있습니다.

■ 이런 분께 추천합니다
• 영어 단어를 통째로 외우는 것이 지겨운 분
• 단어 속 패턴을 파악해 어휘력을 늘리고 싶은 분
• 한국어·일본어·중국어·프랑스어로 영어를 공부하는 분
```

#### English
**Short description**
```
Etymology vocabulary app — Learn English word roots in 5 languages
```

**Full description**
```
Build your English vocabulary from the roots up.

Instead of memorizing words one by one, understanding etymology —
the origin and structure of a word — lets you decode hundreds
of new words naturally.

Once you know that 'a-, an-' means "not" or "without," words
like atheist, anarchy, anonymous, and apathy instantly make sense.

■ Key Features
• Words organized by etymology root
• Word cards: prefix / root / suffix breakdown + example sentence + translation
• Per-group memo: take your own study notes for each word family
• Browse by prefix, root, or suffix category
• Quick jump by alphabet
• Text-to-speech pronunciation

■ Full support for 5 languages
한국어 · English · 日本語 · 中文 · Français
The app matches your device language automatically.
Switch anytime from the in-app language menu.

■ Perfect for
• Anyone tired of rote memorization
• Learners who want to spot patterns across words
• Non-native English speakers studying in Korean, Japanese,
  Chinese, or French
```

#### 日本語
**簡単な説明**
```
語源で覚える英単語帳 — 日本語・英語・韓国語・中国語・フランス語の5言語対応
```

**詳しい説明**
```
語源（Etymology）をベースに英単語を体系的に学べる単語帳アプリです。

単語を丸暗記するのではなく、語源を理解することで
何百もの単語が自然と身についていきます。

「a-, an-」が「否定・ない」を意味すると知れば、
atheist（無神論者）、anarchy（無政府）、
anonymous（匿名）、apathy（無関心）がすぐにわかります。

■ 主な機能
• 語源別にまとめられた単語グループ
• 単語カード：接頭辞・語根・接尾辞の分析表 + 例文 + 翻訳
• グループごとのメモ機能：自分だけの学習ノートを残せる
• 接頭辞・語根・接尾辞カテゴリでの閲覧
• アルファベット順クイックジャンプ
• 発音読み上げ（TTS）

■ 5言語フル対応
한국어 · English · 日本語 · 中文 · Français
端末の設定言語に合わせて自動表示。
アプリ内の言語メニューからいつでも切り替えられます。

■ こんな方におすすめ
• 英単語の丸暗記に疲れた方
• 単語のパターンを語源から理解したい方
• 日本語・韓国語・中国語・フランス語で英語を学ぶ方
```

#### 中文
**简短说明**
```
词源英语单词本 — 支持中文·英语·韩语·日语·法语5种语言
```

**详细说明**
```
通过词源（Etymology）系统学习英语单词的应用程序。

与其死记硬背，不如理解词源——
掌握词根就能自然地理解数百个单词。

了解「a-, an-」表示"否定、无"之后，
atheist（无神论者）、anarchy（无政府）、
anonymous（匿名）、apathy（冷漠）一看就懂。

■ 主要功能
• 按词源分组的单词
• 单词卡片：前缀·词根·后缀分析表 + 例句 + 翻译
• 分组笔记：为每个词族留下学习笔记
• 按前缀、词根、后缀类别浏览
• 字母顺序快速跳转
• 文字转语音发音（TTS）

■ 完整支持5种语言
한국어 · English · 日本語 · 中文 · Français
根据设备语言自动显示，
也可随时在应用内语言菜单中切换。

■ 适合人群
• 厌倦死记硬背的学习者
• 想通过词源掌握单词规律的人
• 用中文·韩语·日语·法语学习英语的学习者
```

#### Français
**Description courte**
```
Vocabulaire anglais par étymologie — 5 langues : français, anglais, coréen, japonais, chinois
```

**Description complète**
```
Apprenez l'anglais par ses racines avec cette application
de vocabulaire basée sur l'étymologie.

Plutôt que de mémoriser les mots un par un, comprendre leur
origine vous permet d'en déduire naturellement des centaines d'autres.

Savoir que « a-, an- » signifie « sans, pas » suffit pour
comprendre atheist (athée), anarchy (anarchie),
anonymous (anonyme) et apathy (apathie).

■ Fonctionnalités principales
• Groupes de mots organisés par racine étymologique
• Fiches de mots : tableau préfixe·radical·suffixe + exemple + traduction
• Notes par groupe : créez vos propres notes d'apprentissage
• Navigation par catégorie (préfixe / radical / suffixe)
• Accès rapide par ordre alphabétique
• Prononciation par synthèse vocale (TTS)

■ 5 langues intégralement supportées
한국어 · English · 日本語 · 中文 · Français
La langue s'adapte automatiquement à votre appareil.
Changez à tout moment depuis le menu de langue intégré.

■ Pour qui ?
• Ceux qui en ont assez d'apprendre les mots par cœur
• Apprenants souhaitant comprendre les patterns lexicaux
• Personnes étudiant l'anglais en français, coréen,
  japonais ou chinois
```

---

### 4단계 — 콘텐츠 등급

**경로**: 정책 → 앱 콘텐츠 → 콘텐츠 등급
- 설문 시작 → 카테고리: **교육**
- 폭력/성인/도박 등 모두 "아니오"
- 제출 → 등급 자동 부여 (전체 이용가)

---

### 5단계 — 개인정보처리방침

**경로**: 정책 → 앱 콘텐츠 → 개인정보처리방침

```
https://kim-kh.github.io/wordroots/privacy-policy.html
```

---

### 6단계 — 인앱 상품 등록

**경로**: 수익 창출 → 인앱 상품 → 제품 만들기

| 항목 | 값 |
|---|---|
| 제품 ID | `unlock_full` (변경 불가) |
| 이름 | 전체 어원 잠금해제 |
| 설명 | 921개 어원 그룹 전체 이용권 (영구) |
| 가격 | ₩4,900 |
| 상태 | **활성** |

---

### 7단계 — 라이선스 테스터 등록

**경로**: 설정 → 라이선스 테스트

- `gforwinning@gmail.com` 추가 → 저장
- 등록 후 인앱 결제 시 실제 청구 없이 처리됨

---

### 8단계 — AAB 업로드 (내부 테스트)

**경로**: 테스트 → 내부 테스트 → 새 버전 만들기
- `app-release.aab` 업로드
- 출시 노트 작성
- 저장 → 검토 → 출시

---

### 9단계 — 인앱 결제 실기기 테스트

- Play Store에서 내부 테스트 앱 설치
- 사이드바에서 잠긴 항목(B, C, D...) 탭
- 결제창 확인 → 라이선스 테스터 계정으로 무료 구매
- 전체 콘텐츠 잠금해제 확인
- **복원하기** 버튼도 테스트 (앱 재설치 후)

---

### 10단계 — 프로덕션 출시

**경로**: 프로덕션 → 새 버전 만들기
- 동일한 AAB 업로드
- 출시 노트 작성 (한국어/영어)
- 심사 제출

> 심사 소요 시간: 보통 1~3일

---

## 개발자 시크릿 잠금해제

앱 상단 타이틀 **"어원 분석 단어장"** 을 **7번 빠르게 탭**하면 전체 콘텐츠 잠금해제.
- 5번째부터 카운트다운 토스트 표시
- 영구 저장 (AsyncStorage)

---

## 버전 업데이트 체크리스트

새 버전 출시 시:
1. `app.json` → `expo.android.versionCode` +1, `expo.version` 수정
2. `eas build --platform android --profile production`
3. Play Console → 프로덕션 → 새 버전 만들기 → AAB 업로드

---

## 주요 파일 위치

| 파일 | 설명 |
|---|---|
| `app.json` | versionCode, versionName 관리 |
| `eas.json` | EAS 빌드 프로파일 설정 |
| `assets/icon-512.png` | Play Store 아이콘 |
| `assets/feature-graphic-1024x500.png` | 피처드 이미지 |
| `assets/screenshot1~5.png` | 스크린샷 |
| `docs/privacy-policy.html` | 개인정보처리방침 |
| `src/hooks/usePurchase.js` | 인앱 결제 로직 |
| `src/components/PaywallModal.js` | 결제 유도 모달 |
