const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT 토큰 검증 미들웨어
exports.authenticate = async (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 제공되지 않았습니다.',
      });
    }

    // Bearer 토큰 형식 확인
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 제공되지 않았습니다.',
      });
    }

    // JWT 토큰 검증
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET);

    // 토큰에서 사용자 ID 추출
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
      });
    }

    // 사용자 정보 조회
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    // 요청 객체에 사용자 정보 추가
    req.user = user;
    req.userId = userId;

    next();
  } catch (error) {
    // JWT 검증 실패
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
      });
    }

    // 토큰 만료
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다.',
      });
    }

    // 기타 오류
    console.error('인증 미들웨어 오류:', error);
    return res.status(500).json({
      success: false,
      message: '인증 처리 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 관리자 권한 체크 미들웨어 (authenticate 미들웨어 이후에 사용)
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  if (req.user.user_type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.',
    });
  }

  next();
};

