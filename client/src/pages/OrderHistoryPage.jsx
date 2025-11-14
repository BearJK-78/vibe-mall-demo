import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../utils/api';
import './OrderHistoryPage.css';

const formatCurrency = (value) =>
  (value || 0).toLocaleString('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  });

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const getStatusLabel = (status) => {
  const statusMap = {
    pending: '처리중',
    processing: '처리중',
    paid: '처리중',
    shipped: '배송중',
    shipping: '배송중',
    completed: '완료',
    cancelled: '취소',
  };
  return statusMap[status] || status;
};

const getStatusClass = (status) => {
  const statusClassMap = {
    pending: 'processing',
    processing: 'processing',
    paid: 'processing',
    shipped: 'shipping',
    shipping: 'shipping',
    completed: 'completed',
    cancelled: 'cancelled',
  };
  return statusClassMap[status] || 'processing';
};

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const user = outletContext?.user ?? null;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    if (!user && outletContext?.userLoading === false) {
      navigate('/login', { replace: true });
      return;
    }
    
    if (user) {
      fetchOrders();
    }
  }, [activeTab, user, outletContext?.userLoading]);

  const fetchOrders = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const params = {};
      
      // 탭에 따른 상태 매핑 (서버에서 인증된 사용자의 주문만 자동으로 필터링)
      if (activeTab !== 'all') {
        const statusMap = {
          processing: 'paid', // 처리중: paid 상태
          shipping: 'shipped', // 배송중: shipped 상태
          completed: 'completed', // 완료: completed 상태
        };
        params.status = statusMap[activeTab] || activeTab;
      }

      const response = await api.get('/api/orders', { params });
      
      if (response.data?.success) {
        setOrders(response.data.data || []);
      } else {
        setError('주문 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('주문 목록 조회 오류:', err);
      setError('주문 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 서버에서 이미 필터링된 주문을 받으므로 클라이언트에서 추가 필터링 불필요
  // 하지만 'all' 탭의 경우 여러 상태를 포함해야 하므로 필터링 유지
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    
    // 서버에서 이미 상태별로 필터링했지만, 'all' 탭의 경우 모든 상태 표시
    const statusMap = {
      processing: ['pending', 'processing', 'paid'],
      shipping: ['shipped', 'shipping'],
      completed: ['completed'],
    };
    
    const statuses = statusMap[activeTab] || [];
    return statuses.includes(order.status);
  });

  return (
    <div className="order-history-page">
      <header className="order-history-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <span>←</span>
        </button>
        <h1>주문 내역</h1>
        <div className="header-spacer"></div>
      </header>

      <div className="order-tabs">
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          전체
        </button>
        <button
          className={`tab ${activeTab === 'processing' ? 'active' : ''}`}
          onClick={() => setActiveTab('processing')}
        >
          처리중
        </button>
        <button
          className={`tab ${activeTab === 'shipping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shipping')}
        >
          배송중
        </button>
        <button
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          완료
        </button>
      </div>

      <div className="order-history-content">
        {loading ? (
          <div className="loading-message">주문 목록을 불러오는 중...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-message">주문 내역이 없습니다.</div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div key={order._id || order.orderId} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <div className="order-number">
                      <span className="clock-icon">🕐</span>
                      <span>주문 #{order.orderId}</span>
                    </div>
                    <div className="order-date">
                      주문일: {formatDate(order.orderDate || order.createdAt || order.payment?.paidAt)}
                    </div>
                  </div>
                  <div className="order-status-section">
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <div className="order-total">
                      {formatCurrency(order.grandTotal || order.payment?.amount || 0)}
                    </div>
                  </div>
                </div>

                <div className="order-items">
                  {order.items?.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-image">
                        {item.productImage || item.product?.image ? (
                          <img src={item.productImage || item.product?.image} alt={item.productName || item.product?.name} />
                        ) : (
                          <div className="image-placeholder"></div>
                        )}
                      </div>
                      <div className="item-details">
                        <div className="item-name">{item.productName || item.product?.name || '상품명 없음'}</div>
                        {item.variant && (
                          <div className="item-variant">{item.variant}</div>
                        )}
                        {!item.variant && (item.size || item.color) && (
                          <div className="item-variant">
                            {item.size && `사이즈: ${item.size}`}
                            {item.size && item.color && ' · '}
                            {item.color && `색상: ${item.color}`}
                          </div>
                        )}
                        <div className="item-quantity">수량: {item.quantity}</div>
                      </div>
                      <div className="item-price">
                        {formatCurrency(item.lineTotal || item.unitPrice * item.quantity || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;

