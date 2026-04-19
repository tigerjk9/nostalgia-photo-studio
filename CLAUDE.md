# CLAUDE.md — 시간 여행 사진관 (Nostalgia Photo Studio)

## 한 줄 정의
사진 한 장 → 한국 근현대사 8개 시대(대한제국~2000년대 싸이월드)의 인물 사진으로 시간 여행.

## 라이브 / 저장소
- 🌐 https://nostalgia-photo-studio.vercel.app/
- 🐙 https://github.com/tigerjk9/nostalgia-photo-studio

## 기술 스택
- 단일 `index.html` (Vanilla JS)
- Tailwind CSS CDN + JSZip
- Gemini 2.5 Flash Image (`gemini-2.5-flash-image`, BYOK)

## 핵심 데이터
- 8개 시대 영문 프롬프트: 대한제국 황실 / 일제강점기 그림엽서 / 1920 경성 모던 / 1950 전후 흑백 / 1970 새마을 / 1980 졸업 / 1990 스티커 사진 / 2000 싸이월드
- 공통 negative prompt: `"The image must not contain any text or letters"` (한글 자동 삽입 방지)

## 핵심 결정
- 8개 시대 동시 생성 (현재) — 추후 사용자 선택 모드 도입 검토
- 한국 의상·구도·사진 기술 정밀 묘사로 "시대 진짜 같은 느낌"

## 변경 핵심 이력
- 2026-04-19: Gemini 모델명 GA 전환 (`-preview` 제거) + Vercel 호스팅 (Netlify 종료) + README 현행화

## 부스 등록
🍌 나노 바나나 시리즈 4번 카드 (`nanoBananaApps[3]` in 부스 index.html)
