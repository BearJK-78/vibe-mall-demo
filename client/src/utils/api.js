import axios from 'axios';

// Vite 프록시를 사용: /api로 시작하는 요청은 자동으로 http://localhost:5000으로 프록시됨
// 배포 환경에서는 VITE_API_URL에 백엔드 주소를 지정 (예: https://my-api.com 또는 https://my-api.com/api)
const RAW_API_URL = import.meta.env.VITE_API_URL || '';
const NORMALIZED_BASE_URL = RAW_API_URL ? RAW_API_URL.replace(/\/+$/, '') : '';
const BASE_HAS_API_PATH = NORMALIZED_BASE_URL.endsWith('/api');

const api = axios.create({
  baseURL: NORMALIZED_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CORS credentials 허용
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    if (BASE_HAS_API_PATH && typeof config.url === 'string' && config.url.startsWith('/api')) {
      config.url = config.url.replace(/^\/api/, '');
    }

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
