const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 모든 사용자 조회
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // 비밀번호 제외
    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '사용자 목록 조회 실패',
      error: error.message,
    });
  }
};

// 특정 사용자 조회
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '사용자 조회 실패',
      error: error.message,
    });
  }
};

// 새 사용자 생성
exports.createUser = async (req, res) => {
  try {
    console.log('=== 회원가입 요청 받음 ===');
    console.log('요청 본문:', req.body);
    console.log('요청 헤더:', req.headers);
    
    const { email, name, password, user_type, address } = req.body;

    // 필수 필드 검증
    if (!email || !name || !password) {
      console.log('필수 필드 누락:', { email: !!email, name: !!name, password: !!password });
      return res.status(400).json({
        success: false,
        message: '이메일, 이름, 비밀번호는 필수입니다.',
      });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 이메일입니다.',
      });
    }

    // 비밀번호 암호화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 새 사용자 생성
    const user = new User({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password: hashedPassword, // 암호화된 비밀번호 저장
      user_type: user_type || 'customer',
      address: address ? address.trim() : '',
    });

    // 데이터베이스에 저장
    const savedUser = await user.save();
    
    // 비밀번호를 제외한 사용자 정보 생성
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    // 성공 응답
    console.log(`새 사용자 생성 성공: ${savedUser.email} (ID: ${savedUser._id})`);
    
    res.status(201).json({
      success: true,
      message: '사용자가 성공적으로 생성되었습니다.',
      data: userResponse,
    });
  } catch (error) {
    console.error('사용자 생성 오류:', error);

    // Mongoose 유효성 검사 오류
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '유효성 검사 실패',
        errors: messages,
      });
    }

    // MongoDB 중복 키 오류 (이메일 unique 제약조건)
    if (error.code === 11000 || error.code === 11001) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 이메일입니다.',
      });
    }

    // 기타 오류
    res.status(500).json({
      success: false,
      message: '사용자 생성 실패',
      error: error.message,
    });
  }
};

// 사용자 정보 수정 (PUT)
exports.updateUser = async (req, res) => {
  try {
    const { email, name, password, user_type, address } = req.body;

    // 이메일 변경 시 중복 확인
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '이미 존재하는 이메일입니다.',
        });
      }
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (password) updateData.password = password;
    if (user_type) updateData.user_type = user_type;
    if (address !== undefined) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '사용자 정보가 성공적으로 수정되었습니다.',
      data: user,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '유효성 검사 실패',
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: '사용자 정보 수정 실패',
      error: error.message,
    });
  }
};

// 사용자 정보 부분 수정 (PATCH)
exports.patchUser = async (req, res) => {
  try {
    // 이메일 변경 시 중복 확인
    if (req.body.email) {
      const existingUser = await User.findOne({ 
        email: req.body.email, 
        _id: { $ne: req.params.id } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '이미 존재하는 이메일입니다.',
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '사용자 정보가 성공적으로 수정되었습니다.',
      data: user,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '유효성 검사 실패',
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: '사용자 정보 수정 실패',
      error: error.message,
    });
  }
};

// 사용자 로그인
exports.loginUser = async (req, res) => {
  try {
    console.log('=== 로그인 요청 받음 ===');
    // 보안: 비밀번호는 로그에 남기지 않음
    const { email, password } = req.body;
    console.log('요청 이메일:', email ? email.toLowerCase().trim() : '없음');
    
    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호는 필수입니다.',
      });
    }

    // 이메일 기본 형식 검증
    const emailRegex = /^\S+@\S+\.\S+$/;
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: '올바른 이메일 형식이 아닙니다.',
      });
    }

    // 이메일로 사용자 찾기 (비밀번호 포함)
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      console.log(`로그인 실패: 사용자를 찾을 수 없음 (이메일: ${normalizedEmail})`);
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    // 비밀번호 확인 (비밀번호는 trim하지 않음 - 공백이 의도된 경우도 있음)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log(`로그인 실패: 비밀번호 불일치 (이메일: ${normalizedEmail}, 사용자 ID: ${user._id})`);
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    // 비밀번호를 제외한 사용자 정보 생성
    const userResponse = user.toObject();
    delete userResponse.password;

    // JWT 토큰 생성
    const JWT_SECRET = process.env.JWT_SECRET;
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        user_type: user.user_type,
      },
      JWT_SECRET,
      {
        expiresIn: '7d', // 토큰 유효기간: 7일
      }
    );

    console.log(`로그인 성공: ${user.email} (ID: ${user._id}, 유형: ${user.user_type})`);

    res.json({
      success: true,
      message: '로그인에 성공했습니다.',
      data: userResponse,
      token: token, // JWT 토큰 반환
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '로그인 처리 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 토큰으로 현재 사용자 정보 조회
exports.getCurrentUser = async (req, res) => {
  try {
    // 인증 미들웨어에서 req.user에 사용자 정보가 이미 설정되어 있음
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    res.json({
      success: true,
      message: '사용자 정보를 성공적으로 조회했습니다.',
      data: req.user,
    });
  } catch (error) {
    console.error('현재 사용자 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 실패',
      error: error.message,
    });
  }
};

// 사용자 삭제
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '사용자가 성공적으로 삭제되었습니다.',
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '사용자 삭제 실패',
      error: error.message,
    });
  }
};

