const mongoose = require('mongoose');

// MongoDB 연결 URI 우선순위: MONGODB_ATLAS_URL > MONGODB_URI > 로컬 주소
// 주의: MONGODB_ATLAS_URL이 설정되어 있으면 Atlas에 연결되며, 로컬 DB의 데이터는 접근할 수 없습니다.
// 로컬 DB를 사용하려면 MONGODB_ATLAS_URL을 주석 처리하거나 삭제하세요.
const MONGODB_URI = process.env.MONGODB_ATLAS_URL || 
                    process.env.MONGODB_URI || 
                    'mongodb://localhost:27017/shopping-mall';

// MongoDB 연결 함수
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    const isAtlas = MONGODB_URI.includes('mongodb+srv://') || MONGODB_URI.includes('mongodb.net');
    
    // 연결 문자열에서 데이터베이스 이름 추출
    const uriDbMatch = MONGODB_URI.match(/\/([^/?]+)(\?|$)/);
    const uriDatabaseName = uriDbMatch ? uriDbMatch[1] : '기본값';
    const actualDatabaseName = conn.connection.name;
    
    console.log(`✅ MongoDB 연결 성공: ${conn.connection.host}`);
    console.log(`📊 실제 연결된 데이터베이스: ${actualDatabaseName}`);
    if (uriDatabaseName !== '기본값' && uriDatabaseName !== actualDatabaseName) {
      console.log(`⚠️  주의: 연결 문자열의 DB 이름(${uriDatabaseName})과 실제 연결된 DB(${actualDatabaseName})가 다릅니다.`);
    }
    console.log(`🔗 연결 타입: ${isAtlas ? 'MongoDB Atlas (클라우드)' : '로컬 MongoDB'}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB 연결 오류:', error.message);
    console.error('💡 해결 방법:');
    console.error('   1. MongoDB가 설치되어 있고 실행 중인지 확인하세요.');
    console.error('   2. MongoDB 서비스를 시작하세요: net start MongoDB (Windows)');
    console.error('   3. 또는 MongoDB Atlas를 사용하는 경우 .env 파일의 MONGODB_ATLAS_URL 또는 MONGODB_URI를 확인하세요.');
    console.error(`   4. 현재 연결 URI: ${MONGODB_URI}`);
    return null;
  }
};

// MongoDB 연결 이벤트 리스너 설정
const setupMongoEventListeners = () => {
  mongoose.connection.on('connected', () => {
    console.log('🟢 MongoDB 연결됨');
  });

  mongoose.connection.on('error', (err) => {
    console.error('🔴 MongoDB 연결 오류:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('🟡 MongoDB 연결 끊김');
  });

  // 프로세스 종료 시 MongoDB 연결 종료
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB 연결이 종료되었습니다.');
    process.exit(0);
  });
};

// MongoDB 연결 상태 확인
const getConnectionStatus = () => {
  const connectionState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    status: connectionState === 1 ? 'connected' : states[connectionState],
    readyState: connectionState,
    message: connectionState === 1 
      ? 'MongoDB에 연결되어 있습니다.' 
      : `MongoDB 연결 상태: ${states[connectionState]}`,
    host: mongoose.connection.host || 'N/A',
    database: mongoose.connection.name || 'N/A'
  };
};

module.exports = {
  connectDB,
  setupMongoEventListeners,
  getConnectionStatus
};
