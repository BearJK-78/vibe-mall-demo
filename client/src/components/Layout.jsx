import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import HomeNavbar from './HomeNavbar';
import api from '../utils/api';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setUser(null);
      setUserLoading(false);
      return;
    }

    try {
      setUserLoading(true);
      const response = await api.get('/api/users/me');

      if (response.data?.success) {
        setUser(response.data.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setUser(null);
    } finally {
      setUserLoading(false);
    }
  }, []);

  const fetchCartCount = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setCartCount(0);
      return 0;
    }

    try {
      const response = await api.get('/api/cart');
      if (response.data?.success) {
        const total = response.data.meta?.totalQuantity ?? 0;
        setCartCount(total);
        return total;
      } else {
        setCartCount(0);
        return 0;
      }
    } catch {
      setCartCount(0);
      return 0;
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      fetchCartCount();
    } else if (!userLoading) {
      setCartCount(0);
    }
  }, [user, userLoading, fetchCartCount]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('autoLogin');
    setUser(null);
    setCartCount(0);
    navigate('/login', { replace: true });
  }, [navigate]);

  const outletContext = {
    user,
    setUser,
    userLoading,
    refreshUser: fetchUser,
    cartCount,
    refreshCart: fetchCartCount,
  };

  return (
    <div className={location.pathname === '/' ? 'layout-home' : 'layout-default'}>
      <HomeNavbar user={user} loading={userLoading} onLogout={handleLogout} cartCount={cartCount} />
      <main>
        <Outlet context={outletContext} />
      </main>
    </div>
  );
};

export default Layout;
