import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './RegisterPage.css';

function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    name: '', // 아이디로 사용
    password: '',
    confirmPassword: '',
    user_type: 'customer',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // 약관 동의 상태
  const [terms, setTerms] = useState({
    all: false,
    privacy: false,
    service: false,
    marketing: false,
    age: false,
  });

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
  };

  const handleTermsChange = (termName) => {
    if (termName === 'all') {
      const newValue = !terms.all;
      setTerms({
        all: newValue,
        privacy: newValue,
        service: newValue,
        marketing: newValue,
        age: newValue,
      });
    } else {
      const newTerms = {
        ...terms,
        [termName]: !terms[termName],
      };
      // 필수 약관이 모두 체크되면 전체 동의도 체크
      if (newTerms.privacy && newTerms.service && newTerms.age) {
        newTerms.all = true;
      } else {
        newTerms.all = false;
      }
      setTerms(newTerms);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // 아이디 검증 (5~11자)
    if (!formData.name) {
      newErrors.name = '아이디는 필수입니다.';
    } else if (formData.name.length < 5 || formData.name.length > 11) {
      newErrors.name = '아이디는 5~11자로 입력해주세요.';
    }
    
    // 비밀번호 검증 (숫자, 영문, 특수문자 조합 최소 8자)
    if (!formData.password) {
      newErrors.password = '비밀번호는 필수입니다.';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.password)) {
      newErrors.password = '숫자, 영문, 특수문자를 조합하여 입력해주세요.';
    }
    
    // 비밀번호 확인
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인은 필수입니다.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }
    
    // 이메일 검증
    if (!formData.email) {
      newErrors.email = '이메일은 필수입니다.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }
    
    // 필수 약관 동의 확인
    if (!terms.privacy || !terms.service || !terms.age) {
      newErrors.terms = '필수 약관에 동의해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        email: formData.email.trim(),
        name: formData.name.trim(), // 아이디
        password: formData.password,
        user_type: formData.user_type,
        address: formData.address.trim(),
      };

      console.log('회원가입 요청 전송:', requestData);
      console.log('API URL:', api.defaults.baseURL);

      // 서버에 회원가입 데이터 전송
      const response = await api.post('/api/users', requestData);

      console.log('서버 응답:', response);

      // 성공 응답 처리
      if (response && response.data && response.data.success) {
        console.log('회원가입 성공:', response.data.data);
        alert('회원가입이 성공적으로 완료되었습니다!');
        navigate('/');
      } else {
        console.error('예상치 못한 응답 형식:', response);
        setErrors((prevErrors) => ({ 
          ...prevErrors, 
          general: '서버 응답이 올바르지 않습니다.' 
        }));
      }
    } catch (error) {
      console.error('회원가입 실패 - 전체 에러:', error);
      console.error('에러 응답:', error.response);
      console.error('에러 메시지:', error.message);
      console.error('에러 스택:', error.stack);
      
      // 네트워크 에러인 경우
      if (!error.response) {
        console.error('네트워크 에러 또는 CORS 에러 발생');
        setErrors((prevErrors) => ({ 
          ...prevErrors, 
          general: '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.' 
        }));
        alert('서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
        return;
      }
      
      // 서버 에러 응답이 있는 경우
      if (error.response?.data) {
        const errorData = error.response.data;
        console.error('서버 에러 데이터:', errorData);
        
        if (errorData.message === '이미 존재하는 이메일입니다.') {
          setErrors((prevErrors) => ({ 
            ...prevErrors, 
            email: '이미 등록된 이메일입니다.' 
          }));
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          const serverErrors = {};
          errorData.errors.forEach((err) => {
            if (err.includes('이메일')) serverErrors.email = err;
            if (err.includes('이름') || err.includes('아이디')) serverErrors.name = err;
            if (err.includes('비밀번호')) serverErrors.password = err;
          });
          setErrors((prevErrors) => ({ ...prevErrors, ...serverErrors }));
        } else {
          setErrors((prevErrors) => ({ 
            ...prevErrors, 
            general: errorData.message || '회원가입 중 오류가 발생했습니다.' 
          }));
        }
        alert(`회원가입 실패: ${errorData.message || '알 수 없는 오류가 발생했습니다.'}`);
      } else {
        const statusCode = error.response?.status || '알 수 없음';
        setErrors((prevErrors) => ({ 
          ...prevErrors, 
          general: `서버 오류 (${statusCode})` 
        }));
        alert(`서버 오류가 발생했습니다. (상태 코드: ${statusCode})`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        {/* 헤더 */}
        <div className="register-header">
          <button 
            className="back-button" 
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="brand-name">SHOPPING MALL</div>
          <h1>회원가입</h1>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {/* 아이디 */}
          <div className="form-group">
            <label htmlFor="name">아이디</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="아이디 입력(5~11자)"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <p className="error-message">{errors.name}</p>}
          </div>

          {/* 비밀번호 */}
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <div className="password-input-container">
              <input
                type={passwordVisible ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="비밀번호(숫자,영문,특수문자 조합 최소 8자)"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'input-error' : ''}
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

          {/* 비밀번호 확인 */}
          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <div className="password-input-container">
              <input
                type={confirmPasswordVisible ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="비밀번호 확인"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'input-error' : ''}
              />
              <button
                type="button"
                className="password-toggle-icon"
                onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                aria-label={confirmPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {confirmPasswordVisible ? (
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
            {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
          </div>

          {/* 이메일 */}
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="이메일"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          {/* 사용자 유형 */}
          <div className="form-group">
            <label htmlFor="user_type">사용자 유형</label>
            <select
              id="user_type"
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              className={errors.user_type ? 'input-error' : ''}
            >
              <option value="customer">고객 (customer)</option>
              <option value="admin">관리자 (admin)</option>
            </select>
            {errors.user_type && <p className="error-message">{errors.user_type}</p>}
          </div>

          {/* 주소 */}
          <div className="form-group">
            <label htmlFor="address">주소 (선택)</label>
            <input
              type="text"
              id="address"
              name="address"
              placeholder="주소를 입력하세요"
              value={formData.address}
              onChange={handleChange}
              className={errors.address ? 'input-error' : ''}
            />
            {errors.address && <p className="error-message">{errors.address}</p>}
          </div>

          {/* 약관 동의 */}
          <div className="terms-section">
            <div className="terms-all">
              <input
                type="checkbox"
                id="terms-all"
                checked={terms.all}
                onChange={() => handleTermsChange('all')}
              />
              <label htmlFor="terms-all">약관 전체동의</label>
            </div>

            <div className="terms-list">
              <div className="term-item">
                <input
                  type="checkbox"
                  id="terms-privacy"
                  checked={terms.privacy}
                  onChange={() => handleTermsChange('privacy')}
                />
                <label htmlFor="terms-privacy">
                  개인정보 수집 이용동의(필수)
                </label>
                <span className="term-link">약관보기</span>
              </div>

              <div className="term-item">
                <input
                  type="checkbox"
                  id="terms-service"
                  checked={terms.service}
                  onChange={() => handleTermsChange('service')}
                />
                <label htmlFor="terms-service">
                  쇼핑몰 이용약관(필수)
                </label>
                <span className="term-link">약관보기</span>
              </div>

              <div className="term-item">
                <input
                  type="checkbox"
                  id="terms-marketing"
                  checked={terms.marketing}
                  onChange={() => handleTermsChange('marketing')}
                />
                <label htmlFor="terms-marketing">
                  마케팅 활용 및 광고성 정보 수신 동의(선택)
                </label>
                <span className="term-link">약관보기</span>
              </div>

              <div className="term-item">
                <input
                  type="checkbox"
                  id="terms-age"
                  checked={terms.age}
                  onChange={() => handleTermsChange('age')}
                />
                <label htmlFor="terms-age">
                  만 14세 미만 가입 제한(필수)
                </label>
                <span className="term-link">약관보기</span>
              </div>
            </div>
            {errors.terms && <p className="error-message">{errors.terms}</p>}
          </div>

          {errors.general && <p className="error-message general-error">{errors.general}</p>}

          {/* 본인인증하고 회원가입 버튼 */}
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '처리 중...' : '본인인증하고 회원가입'}
          </button>

          <p className="non-member-text">
            본인인증이 어려운 경우, 아래의 서비스를 통해 주문하실 수 있습니다.
          </p>
          <button 
            type="button"
            className="non-member-button"
            onClick={() => navigate('/')}
          >
            비회원 구매하기
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
