# Word Roots — 프로젝트 전체 작업 요약

> 재부팅 또는 다른 AI에게 컨텍스트를 전달하기 위한 문서입니다.
> 최종 업데이트: 2026-07-15

---

## 1. 프로젝트 기본 정보

| 항목 | 내용 |
|---|---|
| 앱 이름 | Word Roots |
| 패키지명 | `com.etymologyapp` |
| 플랫폼 | Android (Expo bare workflow, React Native) |
| Expo SDK | 52 / React Native 0.76 |
| 개발 언어 | JavaScript (React Native) |
| 프로젝트 경로 | `E:\MyApp\etymology` |
| GitHub | https://github.com/Kim-KH/wordroots |
| 개발자 이메일 | gforwinning@gmail.com |
| EAS 계정 | forwinning |
| EAS 프로젝트 ID | `ce5ee984-f792-4cc6-8e81-f632539fffa4` |

---

## 2. 앱 기능 개요

- 어원(Etymology)으로 영어 단어를 학습하는 단어장 앱
- 921개 어원 그룹 (접두어·어근·접미어·어원 4개 카테고리)
- **5개 언어 지원**: 한국어(ko), English(en), 日本語(ja), 中文(zh), Français(fr)
- 기기 언어 자동 감지, 앱 내에서 언어 변경 가능
- 언어 선택 버튼은 언어와 무관하게 항상 영어로 표시 (`Language`)

---

## 3. 프리미엄 모델 (인앱 결제)

| 항목 | 내용 |
|---|---|
| 무료 범위 | A 서브카테고리 전체 (76개 그룹) |
| 유료 잠금 | B, C, D... 이후 모든 그룹 |
| 인앱 상품 ID | `unlock_full` |
| 가격 | ₩4,900 (일회성, 영구) |
| IAP 라이브러리 | `react-native-iap@12.16.4` |
| 구매 저장 | AsyncStorage `etym_purchased = 'true'` |

### 개발자 시크릿 잠금해제
- 앱 상단 타이틀을 **3초 안에 7번 탭** → 전체 콘텐츠 잠금해제
- 5번째 탭부터 카운트다운 토스트 표시
- AsyncStorage에 영구 저장 (`etym_purchased = 'true'`)
- 구현 위치: `src/components/TopBar.js` `handleTitlePress()`

---

## 4. 주요 파일 구조

```
E:\MyApp\etymology\
├── App.js                          # 앱 루트, 언어/결제/사이드바 상태 관리
├── app.json                        # Expo 설정 (versionCode는 build.gradle이 우선)
├── eas.json                        # EAS 빌드 프로파일
├── android/
│   ├── app/
│   │   ├── build.gradle            # ★ versionCode/versionName 실제 관리 위치
│   │   └── keystore.properties     # 🔒 git 제외 (비밀번호 포함)
│   └── build.gradle                # targetSdkVersion 등 SDK 설정
├── src/
│   ├── components/
│   │   ├── TopBar.js               # 언어 선택, 7탭 시크릿 잠금해제
│   │   ├── Sidebar.js              # 어원 그룹 목록, 잠금 표시
│   │   ├── EtymologyView.js        # 단어 카드 뷰
│   │   ├── NoteCard.js             # 메모 (다중 메모 지원)
│   │   └── PaywallModal.js         # 결제 유도 모달
│   ├── hooks/
│   │   └── usePurchase.js          # IAP 로직
│   ├── data/
│   │   ├── structure.json          # 카테고리/폴더 구조
│   │   └── etymologyData.json      # 단어 데이터
│   └── lang/
│       ├── ko.json / en.json / ja.json / zh.json / fr.json
├── assets/
│   ├── icon-512.png                # Play Store 아이콘
│   ├── feature-graphic-1024x500.png
│   └── screenshot1~5.png           # 한국어 스크린샷 (전 언어 공용)
└── docs/
    ├── privacy-policy.html         # GitHub Pages로 배포
    ├── playstore-guide.md          # Play Store 등록 가이드
    └── project-summary.md          # 이 파일
```

---

## 5. 빌드 방법 (EAS Build)

> ⚠️ 이 프로젝트는 **bare workflow**입니다. `app.json`의 versionCode는 무시되고, `android/app/build.gradle`의 값이 실제 빌드에 사용됩니다.

### APK (기기 직접 설치 테스트용)
```
eas build --platform android --profile preview
```

### AAB (Play Store 업로드용)
```
eas build --platform android --profile production
```

### 기기 설치
```
adb install -r <apk 경로>
```

### 앱 데이터 초기화 (테스트용)
```
adb shell pm clear com.etymologyapp
```

---

## 6. 버전 업데이트 방법

새 버전 출시 시 반드시 `android/app/build.gradle`을 수정해야 합니다:

```groovy
// android/app/build.gradle
versionCode 3       // ← 1씩 증가 (절대 재사용 불가)
versionName "1.1.0" // ← 사용자에게 표시되는 버전
```

이후:
1. `git add android/app/build.gradle && git commit && git push`
2. `eas build --platform android --profile production`
3. Play Console → 새 버전 만들기 → AAB 업로드

---

## 7. 메모 기능 (NoteCard.js)

- 그룹당 메모를 **여러 개** 추가 가능 (메모 1, 메모 2, ...)
- AsyncStorage 키: `etym_note_${folderPath}` → JSON 배열로 저장
- **마이그레이션**: 구버전 plain string → 자동으로 첫 번째 메모로 변환
- 메모 추가: "+ 메모 추가" 버튼
- 메모 삭제: × 버튼 (메모가 2개 이상일 때 표시)
- 자동 저장: 600ms 디바운스

---

## 8. 언어 파일 키 목록 (src/lang/*.json)

모든 언어 파일에 아래 키가 포함되어야 합니다:

```
appName, sidebarTitle, menuLang, welcomeTitle, welcomeMessage,
category_part_origin, category_part_prefixes, category_part_roots, category_part_suffixes,
etymologyLabel, meaningLabel, noteLabel,
typePrefix, typeSuffix, typeRoot, typeOrigin,
errorTitle, errorMessage, exitTitle, exitMessage, exitConfirm, exitCancel,
memoTitle, memoPlaceholder, memoSaved, memoAdd,
paywallTitle, paywallSubtitle, paywallFeature1, paywallFeature2, paywallFeature3,
paywallBuyBtn, paywallRestoreBtn
```

---

## 9. 개인정보처리방침

- 파일: `docs/privacy-policy.html`
- URL: https://kim-kh.github.io/wordroots/privacy-policy.html
- 내용: 개인정보 미수집, 로컬 저장만 사용 (언어설정 + 메모 + 구매상태)
- 5개 언어 탭 전환 지원

---

## 10. Play Store 현황 (2026-07-15 기준)

| 항목 | 상태 |
|---|---|
| 비공개 테스트 (Alpha) | 검토 중 (제출일: 2026-07-13) |
| 현재 versionCode | 2 |
| 현재 versionName | 1.0.1 |
| targetSdkVersion | 35 |
| 인앱 상품 | `unlock_full` 등록 완료 |

### Play Store 등록 정보
- 앱 소개 텍스트: 5개 언어 등록 완료 (`docs/playstore-guide.md` 참고)
- 스크린샷: 한국어 스크린샷 5장 전 언어 공용 사용
- 콘텐츠 등급: 전체 이용가 (교육)

---

## 11. 트러블슈팅 기록

### EAS 빌드 오류들

#### ① `path may not be null or empty string. path='null'`
- **원인**: `keystore.properties`가 `.gitignore`에 있어 EAS 서버에 없음
- **해결**: `android/app/build.gradle`의 signingConfig를 조건부로 변경
```groovy
release {
    if (keystorePropertiesFile.exists()) {
        storeFile file(keystoreProperties['RELEASE_STORE_FILE'])
        ...
    }
}
```

#### ② `1 버전 코드는 이미 사용되었습니다`
- **원인**: Play Store는 한번 사용된 versionCode 재사용 불가
- **원인2**: bare workflow에서 `app.json`의 versionCode는 무시됨. `android/app/build.gradle`을 수정해야 함
- **해결**: `android/app/build.gradle`에서 `versionCode` 증가

#### ③ `targetSdkVersion 34` 오류
- **원인**: Play Store가 targetSdkVersion 35 이상 요구
- **해결**: `android/build.gradle`에서 `'34'` → `'35'`

#### ④ react-native-iap 빌드 오류 (Kotlin 버전)
- **원인**: react-native-iap v15는 Kotlin 2.x 필요, 프로젝트는 1.9.x 사용
- **해결**: `react-native-iap@12.16.4`로 다운그레이드

#### ⑤ react-native-iap flavor 오류
- **원인**: amazon/play 두 flavor 중 선택 불가
- **해결**: `android/app/build.gradle` defaultConfig에 추가
```groovy
missingDimensionStrategy 'store', 'play'
```

### 데이터 관련

#### 앱 재설치 후에도 구매/메모 유지되는 이유
- `adb install -r`은 앱 데이터 유지
- 완전 초기화: `adb shell pm clear com.etymologyapp`

---

## 12. 주요 의존성

```json
"react-native-iap": "12.16.4",
"@react-native-async-storage/async-storage": "...",
"expo-speech": "...",
"expo": "~52.x"
```

---

## 13. git 커밋 히스토리

```
71842a5 chore: eas.json appVersionSource local 설정
c65d3b3 chore: versionCode 1→2, versionName 1.0.0→1.0.1 (build.gradle)
07feba5 chore: versionCode 1→2 (app.json)
6da4d43 fix: targetSdkVersion 34→35
400d9df fix: EAS 빌드 signingConfig null 오류 수정
9deaf1d feat: 메모 다중 지원
f688424 Fix: 언어 선택 버튼 항상 영어로 표시
89ff03c Add: playstore-guide.md
2cfe58c Add: 인앱 결제, 페이월, Play Store 가이드
7731616 Add: 개인정보처리방침, 아이콘, 메모 UI 개선
f06b754 fix: async-storage Gradle 8 빌드 오류 패치
8c8c593 fix: release 서명 설정 복구
53a7c09 feat: 앱 아이콘 업데이트
6701123 feat: 어원 그룹별 메모 기능 추가
8a9f81e fix: 사이드바 폴더 이름 번역 키 오류 수정
5c0523c Initial commit
```
