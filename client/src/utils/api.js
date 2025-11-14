import axios from 'axios';

// Vite 프록시를 사용: /api로 시작하는 요청은 자동으로 http://localhost:5000으로 프록시됨
// baseURL을 빈 문자열로 설정하여 상대 경로 사용 (프록시가 /api를 처리)
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CORS credentials 허용
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    // 토큰이 있다면 헤더에 추가
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 인증 오류 처리
      localStorage.removeItem('token');
      // 로그인 페이지로 리다이렉트 등
    }
    return Promise.reject(error);
  }
);

export default api;
