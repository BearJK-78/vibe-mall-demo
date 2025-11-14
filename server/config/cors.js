// CORS 설정
const corsOptions = {
  origin: function (origin, callback) {
    // 개발 환경에서는 모든 origin 허용 (또는 특정 origin만 허용)
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173', // Vite 기본 포트
      'http://127.0.0.1:5173'
    ];
    
    // origin이 없으면 (같은 origin 요청) 허용
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // 개발 환경에서는 모든 origin 허용
      // 프로덕션에서는 아래 주석 해제
      // callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

module.exports = corsOptions;

