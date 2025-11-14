require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { connectDB, setupMongoEventListeners, getConnectionStatus } = require('./config/database');
const corsOptions = require('./config/cors');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS 설정
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body Parser 미들웨어
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 요청 로깅 미들웨어 (개발용)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (Object.keys(req.body).length > 0) {
    console.log('요청 본문:', req.body);
  }
  next();
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'Shopping Mall API 서버가 실행 중입니다.' });
});

// MongoDB 연결 상태 확인
app.get('/health', (req, res) => {
  res.json(getConnectionStatus());
});

// API 라우트
app.use('/api', routes);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: '서버 오류가 발생했습니다.',
    message: err.message 
  });
});

// MongoDB 연결 및 서버 시작
const startServer = async () => {
  // MongoDB 이벤트 리스너 설정
  setupMongoEventListeners();
  
  // MongoDB 연결 시도
  await connectDB();
  
  // 서버 시작
  app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  });
};

startServer();
