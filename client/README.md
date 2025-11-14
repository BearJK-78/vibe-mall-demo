# Shopping Mall Client

Vite와 React를 사용한 쇼핑몰 클라이언트 애플리케이션입니다.

## 설치 방법

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정 (선택사항):
`env.example` 파일을 복사하여 `.env` 파일을 생성하고, API 서버 URL을 설정하세요.

Windows PowerShell:
```bash
Copy-Item env.example .env
```

Linux/Mac:
```bash
cp env.example .env
```

`.env` 파일에서 API 서버 URL을 수정하세요:
```
VITE_API_URL=http://localhost:5000
```

## 실행 방법

### 개발 모드
```bash
npm run dev
```

개발 서버가 `http://localhost:3000`에서 실행됩니다.

### 프로덕션 빌드
```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 빌드 미리보기
```bash
npm run preview
```

## 프로젝트 구조

```
client/
├── public/          # 정적 파일들
├── src/
│   ├── components/  # 재사용 가능한 컴포넌트
│   ├── pages/       # 페이지 컴포넌트
│   ├── utils/       # 유틸리티 함수들
│   ├── App.jsx      # 메인 App 컴포넌트
│   ├── main.jsx     # 엔트리 포인트
│   ├── App.css      # App 스타일
│   └── index.css    # 글로벌 스타일
├── index.html       # HTML 템플릿
├── vite.config.js   # Vite 설정
└── package.json     # 프로젝트 의존성
```

## 주요 기능

- ⚡️ Vite로 빠른 개발 환경
- ⚛️ React 18
- 🛣️ React Router DOM (라우팅)
- 📡 Axios (HTTP 클라이언트)
- 🔧 ESLint (코드 품질 관리)

## 개발 팁

- Hot Module Replacement (HMR)로 파일 변경 시 즉시 반영됩니다.
- API 호출은 `src/utils/api.js`의 axios 인스턴스를 사용하세요.
- 컴포넌트는 `src/components/`에, 페이지는 `src/pages/`에 추가하세요.

## 환경 변수

Vite에서는 환경 변수 앞에 `VITE_` 접두사를 붙여야 클라이언트에서 사용할 수 있습니다.

예: `VITE_API_URL` → `import.meta.env.VITE_API_URL`
