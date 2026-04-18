# 📸 추억 사진관 (Nostalgia Photo Studio)

> **내 사진을 한국 근현대사 8개 시대의 모습으로 시간 여행!**
> Google Gemini 2.5 Flash Image(나노 바나나)를 활용한 웹 기반 시대별 인물사진 생성기.
> 대한제국 황실부터 2000년대 싸이월드 감성까지, 한국의 의상·분위기·사진 기술을 정교하게 재현합니다.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Try%20Now-black?logo=vercel)](https://nostalgia-photo-studio.vercel.app/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash%20Image-blue)](https://ai.google.dev/gemini-api/docs/image-generation)
[![BYOK](https://img.shields.io/badge/Bring%20Your%20Own-API%20Key-orange)](https://aistudio.google.com/apikey)

---

## 🤔 기획 동기

> "만약 내가 100년 전에 태어났다면 어떤 모습이었을까?"

빛바랜 흑백 사진 속 인물에는 그 시대의 분위기가 고스란히 담겨 있습니다. 최신 멀티모달 AI를 활용해 **현재의 내 사진을 한국 근현대사의 특정 시대 스타일로 재현**합니다. 단순한 빈티지 필터를 넘어, 각 시대를 대표하는 의상·표정·구도·사진 기술까지 반영하여 진짜 시간 여행을 떠난 듯한 경험을 제공합니다.

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 📤 **간편한 사진 업로드** | 얼굴 사진 한 장으로 즉시 시작 |
| 🕰️ **8개 시대 동시 생성** | 한 번 클릭으로 한국 근현대사 8장면을 동시에 생성 |
| 🖼️ **결과물 상세 확인** | 그리드 + 모달 확대 보기 |
| 💾 **개별/전체 다운로드** | 마음에 드는 한 장 저장 또는 ZIP 일괄 다운로드 |
| 🔐 **BYOK 방식** | 사용자 본인의 Gemini API 키 사용 (브라우저 내에서만 사용, 외부 저장 없음) |
| 🚫 **텍스트 출력 방지** | Negative Prompt로 한글/문자 삽입 차단 |

---

## 🚀 바로 사용하기

👉 **[https://nostalgia-photo-studio.vercel.app/](https://nostalgia-photo-studio.vercel.app/)**

### 사용 단계
1. **사진 업로드** - 얼굴이 잘 보이는 정면 사진 권장
2. **API 키 입력** - [Google AI Studio](https://aistudio.google.com/apikey)에서 무료 발급
3. **"시간 여행 시작!"** 클릭 → 8개 시대 동시 생성 (수십 초 소요)
4. **결과 저장** - 개별 다운로드 또는 ZIP 일괄 다운로드

> ⚠️ AI는 얼굴 특징을 항상 완벽히 반영하진 못합니다. 마음에 드는 결과를 위해 여러 번 시도해 보세요.

---

## 🕰️ 지원 시대 목록

| # | 시대 | 분위기 키워드 |
|---|------|--------------|
| 1 | **대한제국 황실** | 격조 있는 궁중 의상, 격식 있는 정면 인물 사진 |
| 2 | **일제강점기 그림엽서** | 세피아톤, 엽서 스타일 채색 |
| 3 | **1920년대 경성 모던** | 모던보이/모던걸, 경성 거리 |
| 4 | **1950년대 전후 흑백** | 전후 복구기 흑백 인물 사진 |
| 5 | **1970년대 새마을 운동** | 푸른 작업복, 시대상 컬러 사진 |
| 6 | **1980년대 졸업 사진** | 부드러운 헤이지 조명, 클래식 스튜디오 배경 |
| 7 | **1990년대 스티커 사진** | 일본식 푸리쿠라, 컬러풀 프레임 |
| 8 | **2000년대 싸이월드 감성** | 셀카 각도, 보정 톤, 미니홈피 감성 |

---

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| **프론트엔드** | Vanilla JavaScript (단일 `index.html` 파일) |
| **스타일링** | Tailwind CSS (CDN) |
| **AI 모델** | Google **Gemini 2.5 Flash Image** (`gemini-2.5-flash-image`) |
| **압축 다운로드** | [JSZip](https://stuk.github.io/jszip/) |
| **호스팅** | Vercel (정적 웹사이트, GitHub 연동 자동 배포) |

> 💡 백엔드 서버 없이 모든 요청이 사용자 브라우저에서 Google Gemini API로 직접 전송됩니다.

---

## 📦 로컬 실행

```bash
# 저장소 복제
git clone https://github.com/tigerjk9/nostalgia-photo-studio.git
cd nostalgia-photo-studio

# 정적 서버 실행 (Python 3 기준)
python -m http.server 8000

# 브라우저에서 http://localhost:8000 접속
```

> 💡 별도 빌드 과정 없음. `index.html`을 브라우저에서 직접 열어도 동작합니다.

---

## 💡 핵심 노하우: 프롬프트 엔지니어링

각 시대의 특징을 AI가 정확히 표현하도록 **시대별 영문 프롬프트**를 정교하게 설계했습니다.

### 예시: 1980년대 졸업 사진 프롬프트
> *"An 1980s South Korean graduation album style studio portrait... soft, hazy lighting effect and a plain, classic studio backdrop... formal but slightly awkward pose..."*

### 공통 Negative Prompt
모든 프롬프트에 다음 부정 프롬프트를 포함하여 AI가 임의로 한글/텍스트를 삽입하는 것을 차단했습니다.

```
"The image must not contain any text or letters."
```

---

## 🔑 API 키 발급 가이드

1. [Google AI Studio](https://aistudio.google.com/apikey) 접속
2. Google 계정 로그인
3. **"Create API Key"** 클릭 → 키 복사
4. 본 앱 입력란에 붙여넣기

> 🔒 **보안:** API 키는 사용자 브라우저 내에서만 사용되며, 외부 서버로 전송·저장되지 않습니다.
> 단, 입력 필드에 잠시 보관되므로 **공용 PC 사용 후에는 새로고침** 권장.

---

## 📁 저장소 구성

```
nostalgia-photo-studio/
├── README.md       # 본 문서
└── index.html      # 단일 파일 웹앱 (HTML + CSS + JS 통합)
```

---

## 📝 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-19 | Vercel(`nostalgia-photo-studio.vercel.app`) 배포 + README 현행화 |
| 2026-04-19 | Gemini 모델명 GA 전환: `gemini-2.5-flash-image-preview` → `gemini-2.5-flash-image` (404 오류 해결) |

---

## 🐛 알려진 제약

- 얼굴 인식이 어려운 사진(측면, 가림, 저해상도)은 결과 품질 저하
- 모델 응답 시간: 8개 시대 동시 생성 시 수십 초 소요
- API 무료 할당량 초과 시 429 오류 (자동 재시도 3회)

---

## 🙏 크레딧

- **Google Gemini 2.5 Flash Image (Nano Banana)** - 멀티모달 이미지 생성 모델
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **JSZip** - 클라이언트 사이드 ZIP 생성
- **나노 바나나 프롬프트 참고** - [tigerjk9.github.io/ai/nano-banana](https://tigerjk9.github.io/ai/nano-banana/)

---

## 📝 라이선스

MIT License - 자유롭게 사용·수정·재배포 가능합니다.

---

## 👤 제작자

**김진관 (닷커넥터)**
- GitHub: [@tigerjk9](https://github.com/tigerjk9)
- Project Link: [nostalgia-photo-studio](https://github.com/tigerjk9/nostalgia-photo-studio)

---

> 📸 **지금 바로 [추억 사진관](https://nostalgia-photo-studio.vercel.app/)에서 한국 근현대사로 시간 여행을 떠나보세요!**
