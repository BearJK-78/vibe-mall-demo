# Shopping Mall Server

Node.js, Express, MongoDB를 사용한 쇼핑몰 API 서버입니다.

## 설치 방법

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정:
`env.example` 파일을 복사하여 `.env` 파일을 생성하고, 필요한 환경 변수를 설정하세요.

Windows PowerShell:
```bash
Copy-Item env.example .env
```

Linux/Mac:
```bash
cp env.example .env
```

`.env` 파일을 열어 MongoDB 연결 정보를 수정하세요:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shopping-mall
```

## 실행 방법

### 개발 모드 (nodemon 사용)
```bash
npm run dev
```

### 프로덕션 모드
```bash
npm start
```

서버가 성공적으로 시작되면 `http://localhost:5000`에서 API를 사용할 수 있습니다.

## 프로젝트 구조

```
server/
├── config/          # 설정 파일들
│   └── database.js  # MongoDB 연결 설정
├── models/          # Mongoose 모델들
├── routes/          # Express 라우트들
├── server.js        # 메인 서버 파일
├── package.json     # 프로젝트 의존성
└── .env            # 환경 변수 (git에 포함되지 않음)
```

## MongoDB 설정

### 로컬 MongoDB 사용
로컬에 MongoDB가 설치되어 있어야 합니다. 기본 포트는 27017입니다.

### MongoDB Atlas 사용
MongoDB Atlas 클러스터의 연결 문자열을 `.env` 파일의 `MONGODB_URI`에 설정하세요.

## API 엔드포인트

현재 기본 엔드포인트:
- `GET /` - 서버 상태 확인
- `GET /api` - API 라우트 확인

추가 라우트를 `routes/index.js`에 추가하여 확장할 수 있습니다.
