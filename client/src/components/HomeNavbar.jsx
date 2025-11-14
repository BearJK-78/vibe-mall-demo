import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const HomeNavbar = ({ user, loading, onLogout, cartCount = 0 }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const isLoggedIn = !!user;
  const isAdmin = user?.user_type === 'admin';

  const toggleDropdown = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleNavigate = useCallback(
    (path) => () => {
      navigate(path);
    },
    [navigate]
  );

  const handleAdminClick = useCallback(() => {
    navigate('/admin');
  }, [navigate]);

  const handleLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  return (
    <header className="home-header">
      <nav className="home-nav">
        <div className="nav-left">
          <button className="brand" onClick={handleNavigate('/')}>
            VIBE MALL
          </button>
          <ul className="nav-menu">
            <li>남성</li>
            <li>여성</li>
            <li>스타일</li>
            <li>브랜드</li>
            <li>스포츠</li>
            <li>뷰티</li>
            <li>라이프</li>
          </ul>
        </div>

        <div className="nav-right" ref={dropdownRef}>
          <button className="nav-icon-button" aria-label="검색">
            🔍
          </button>
          <button
            className="nav-icon-button"
            aria-label="장바구니"
            onClick={handleNavigate('/cart')}
          >
            🛒
            {cartCount > 0 && (
              <span className="nav-cart-badge">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          {!loading && isLoggedIn && isAdmin && (
            <button className="nav-admin-button" onClick={handleAdminClick}>
              어드민
            </button>
          )}

          {!loading && !isLoggedIn && (
            <button className="nav-login-button" onClick={handleLogin}>
              로그인
            </button>
          )}

          {!loading && isLoggedIn && (
            <div className="nav-user">
              <button className="user-greeting-button" onClick={toggleDropdown}>
                {user.name}님 환영합니다.
              </button>
              {showDropdown && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={handleNavigate('/order-history')}>
                    주문 내역
                  </button>
                  {isAdmin && (
                    <button className="dropdown-item admin-button" onClick={handleAdminClick}>
                      어드민 페이지
                    </button>
                  )}
                  <button className="dropdown-item logout-button" onClick={onLogout}>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default HomeNavbar;

