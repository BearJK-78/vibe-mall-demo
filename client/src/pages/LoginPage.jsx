import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import api from '../utils/api';
import './LoginPage.css';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [autoLogin, setAutoLogin] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const refreshUser = outletContext?.refreshUser;
  const refreshCart = outletContext?.refreshCart;

  const syncContext = useCallback(async () => {
    if (typeof refreshUser === 'function') {
      await refreshUser();
    }
    if (typeof refreshCart === 'function') {
      await refreshCart();
    }
  }, [refreshUser, refreshCart]);

  // 컴포넌트 마운트 시 토큰 확인 및 유저 정보 검증
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setAlreadyLoggedIn(false);
        setIsCheckingAuth(false);
        return;
      }

      try {
        // 토큰이 있으면 유저 정보 확인
        const response = await api.get('/api/users/me');
        
        if (response.data && response.data.success) {
          setAlreadyLoggedIn(true);
        } else {
          setAlreadyLoggedIn(false);
        }
      } catch (error) {
        // 토큰이 유효하지 않으면 제거하고 로그인 페이지 유지
        console.log('토큰이 유효하지 않습니다:', error.response?.status);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('autoLogin');
        setAlreadyLoggedIn(false);
        await syncContext();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [syncContext]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // 입력 시 에러 메시지 초기화
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    }
    if (errors.general) {
      setErrors((prevErrors) => ({ ...prevErrors, general: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 클라이언트 측 기본 검증
    const newErrors = {};
    const trimmedEmail = formData.email.trim();
    
    if (!trimmedEmail) {
      newErrors.email = '이메일을 입력해주세요.';
    } else {
      // 이메일 형식 검증 (서버와 동일한 검증)
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = '올바른 이메일 형식이 아닙니다.';
      }
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // 서버에 로그인 요청 전송
      const response = await api.post('/api/users/login', {
        email: trimmedEmail,
        password: formData.password,
      });

      // 서버 응답 확인
      if (response.data && response.data.success === true) {
        // JWT 토큰 저장
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          console.log('토큰이 저장되었습니다.');
        }

        // 사용자 정보 저장
        if (response.data.data) {
          localStorage.setItem('user', JSON.stringify(response.data.data));
          console.log('사용자 정보가 저장되었습니다:', response.data.data);
        }

        // 자동 로그인 옵션 저장
        if (autoLogin) {
          localStorage.setItem('autoLogin', 'true');
        } else {
          localStorage.removeItem('autoLogin');
        }

        console.log('로그인 성공:', response.data.message);
        await syncContext();
        
        // 홈 페이지로 리다이렉트
        navigate('/', { replace: true });
      } else {
        // 서버에서 success: false로 응답한 경우
        setErrors({
          general: response.data?.message || '로그인에 실패했습니다.',
        });
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      
      const newErrors = {};

      // 네트워크 오류 또는 서버 연결 실패
      if (!error.response) {
        // 보안: 사용자에게는 인증 실패 메시지만 표시
        newErrors.general = '이메일 또는 비밀번호가 올바르지 않습니다.';
        setErrors(newErrors);
        setIsSubmitting(false);
        return;
      }

      // 서버 에러 응답 처리
      const errorData = error.response?.data;
      const statusCode = error.response?.status;

      if (errorData && errorData.message) {
        const errorMessage = errorData.message;
        
        // 400 Bad Request: 필수 필드 누락 또는 이메일 형식 오류
        if (statusCode === 400) {
          // 이메일 형식 오류만 email 필드에 표시
          if (errorMessage === '올바른 이메일 형식이 아닙니다.') {
            newErrors.email = errorMessage;
          } 
          // 필수 필드 누락은 general에 표시
          else if (errorMessage.includes('필수')) {
            newErrors.general = errorMessage;
          } 
          // 기타 400 에러는 인증 실패 메시지로 통일
          else {
            newErrors.general = '이메일 또는 비밀번호가 올바르지 않습니다.';
          }
        } 
        // 401 Unauthorized: 인증 실패 (이메일/비밀번호 불일치)
        else if (statusCode === 401) {
          newErrors.general = '이메일 또는 비밀번호가 올바르지 않습니다.';
        }
        // 500 Internal Server Error 및 기타 서버 오류
        else {
          // 보안: 사용자에게는 인증 실패 메시지만 표시
          newErrors.general = '이메일 또는 비밀번호가 올바르지 않습니다.';
        }
      } else {
        // 에러 데이터가 없는 경우도 인증 실패 메시지로 통일
        newErrors.general = '이메일 또는 비밀번호가 올바르지 않습니다.';
      }

      setErrors(newErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceLogout = useCallback(async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('autoLogin');
    setAlreadyLoggedIn(false);
    await syncContext();
  }, [syncContext]);

  // 인증 확인 중이면 로딩 표시
  if (isCheckingAuth) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>확인 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* 상단 네비게이션 */}
        <div className="login-nav">
          <Link to="/" className="nav-link">로그인/회원가입</Link>
        </div>

        {/* 브랜드 로고 섹션 */}
        <div className="brand-section">
        <div className="brand-logo">
          <span className="brand-name">VIBE</span>
          <span className="brand-separator">|</span>
          <span className="brand-name">MALL</span>
        </div>
        <p className="brand-description">
          VIBE MALL 계정 하나로 모든 서비스를 이용하세요.
        </p>
        </div>

        {alreadyLoggedIn && (
          <div className="login-alert">
            <p>이미 VIBE MALL에 로그인되어 있습니다.</p>
            <div className="login-alert-actions">
              <button
                type="button"
                className="login-button secondary"
                onClick={() => navigate('/', { replace: true })}
              >
                홈으로 이동
              </button>
              <button
                type="button"
                className="login-button"
                onClick={handleForceLogout}
              >
                로그아웃 후 다시 로그인
              </button>
            </div>
          </div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* 이메일 입력 */}
          <div className="form-group">
            <input
              type="text"
              name="email"
              placeholder="통합계정 또는 이메일"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
              autoComplete="username"
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          {/* 비밀번호 입력 */}
          <div className="form-group">
            <div className="password-input-container">
              <input
                type={passwordVisible ? 'text' : 'password'}
                name="password"
                placeholder="비밀번호"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'input-error' : ''}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-icon"
                onClick={() => setPasswordVisible(!passwordVisible)}
                aria-label={passwordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {passwordVisible ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>

          {/* 일반 에러 메시지 (로그인 실패 등) */}
          {errors.general && (
            <p className="error-message general-error">{errors.general}</p>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>

          {/* 하단 옵션 */}
          <div className="login-options">
            <label className="auto-login-checkbox">
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
              />
              <span>자동 로그인</span>
            </label>
            <div className="find-links">
              <button type="button" className="find-link">
                아이디 찾기
              </button>
              <span className="link-separator">|</span>
              <button type="button" className="find-link">
                비밀번호 찾기
              </button>
            </div>
          </div>
        </form>

        {/* 회원가입 섹션 */}
        <div className="signup-section">
          <p className="signup-text">VIBE MALL이 처음이신가요?</p>
          <Link to="/register" className="signup-button">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

