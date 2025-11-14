import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../utils/api';
import './AdminOrderManagementPage.css';

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

const AdminOrderManagementPage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const user = outletContext?.user ?? null;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 각 상태별 주문 개수 계산
  const getOrderCounts = () => {
    const counts = {
      all: orders.length,
      processing: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      const status = order.status;
      if (['pending', 'processing', 'paid'].includes(status)) {
        counts.processing++;
      } else if (['shipped', 'shipping'].includes(status)) {
        counts.shipping++;
      } else if (status === 'completed') {
        counts.completed++;
      } else if (status === 'cancelled') {
        counts.cancelled++;
      }
    });

    return counts;
  };

  useEffect(() => {
    if (user?.user_type !== 'admin') {
      navigate('/admin', { replace: true });
      return;
    }
    fetchOrders();
  }, [activeTab, user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      
      // 관리자는 모든 주문 조회 (userId 파라미터 없이)
      // 'all' 탭이 아닌 경우에만 상태 필터링
      // 하지만 서버에서 정확한 상태 매핑을 위해 클라이언트에서 필터링하는 것이 더 정확함
      // 서버에서는 모든 주문을 가져오고 클라이언트에서 필터링

      const response = await api.get('/api/orders', { params });
      
      if (response.data?.success) {
        setOrders(response.data.data || []);
      } else {
        setError('주문 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('주문 목록 조회 오류:', err);
      if (err.response?.status === 401) {
        setError('인증이 필요합니다.');
      } else {
        setError('주문 목록을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      fetchOrders(); // 목록 새로고침
    } catch (err) {
      console.error('주문 상태 업데이트 오류:', err);
      alert('주문 상태 업데이트에 실패했습니다.');
    }
  };

  const handleShippingStart = (orderId) => {
    if (window.confirm('배송을 시작하시겠습니까?')) {
      handleStatusUpdate(orderId, 'shipped');
    }
  };

  const handleOrderCancel = (orderId) => {
    if (window.confirm('주문을 취소하시겠습니까?')) {
      handleStatusUpdate(orderId, 'cancelled');
    }
  };

  // 검색 필터링
  const filteredOrders = orders.filter((order) => {
    // 탭 필터링
    if (activeTab !== 'all') {
      const statusMap = {
        processing: ['pending', 'processing', 'paid'],
        shipping: ['shipped', 'shipping'],
        completed: ['completed'],
        cancelled: ['cancelled'],
      };
      const statuses = statusMap[activeTab] || [];
      if (!statuses.includes(order.status)) {
        return false;
      }
    }

    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const orderIdMatch = order.orderId?.toLowerCase().includes(query);
      const customerNameMatch = order.recipient?.name?.toLowerCase().includes(query) || 
                                order.userId?.name?.toLowerCase().includes(query);
      const customerEmailMatch = order.recipient?.email?.toLowerCase().includes(query) || 
                                 order.userId?.email?.toLowerCase().includes(query);
      
      return orderIdMatch || customerNameMatch || customerEmailMatch;
    }

    return true;
  });

  if (user?.user_type !== 'admin') {
    return null;
  }

  return (
    <div className="admin-order-management-page">
      <header className="admin-order-header">
        <button className="back-button" onClick={() => navigate('/admin')}>
          <span>←</span>
        </button>
        <h1>주문 관리</h1>
        <button className="filter-button">
          <span>▽</span>
          <span>필터</span>
        </button>
      </header>

      <div className="admin-order-search">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="주문번호 또는 고객명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-order-tabs">
        {(() => {
          const counts = getOrderCounts();
          return (
            <>
              <button
                className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                전체
                {counts.all > 0 && <span className="tab-count">({counts.all})</span>}
              </button>
              <button
                className={`tab ${activeTab === 'processing' ? 'active' : ''}`}
                onClick={() => setActiveTab('processing')}
              >
                처리중
                {counts.processing > 0 && <span className="tab-count">({counts.processing})</span>}
              </button>
              <button
                className={`tab ${activeTab === 'shipping' ? 'active' : ''}`}
                onClick={() => setActiveTab('shipping')}
              >
                배송중
                {counts.shipping > 0 && <span className="tab-count">({counts.shipping})</span>}
              </button>
              <button
                className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                완료
                {counts.completed > 0 && <span className="tab-count">({counts.completed})</span>}
              </button>
              <button
                className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
                onClick={() => setActiveTab('cancelled')}
              >
                취소
                {counts.cancelled > 0 && <span className="tab-count">({counts.cancelled})</span>}
              </button>
            </>
          );
        })()}
      </div>

      <div className="admin-order-content">
        {loading ? (
          <div className="loading-message">주문 목록을 불러오는 중...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-message">주문 내역이 없습니다.</div>
        ) : (
          <div className="admin-orders-list">
            {filteredOrders.map((order) => (
              <div key={order._id || order.orderId} className="admin-order-card">
                <div className="admin-order-card-header">
                  <div className="admin-order-info-left">
                    <div className="admin-order-number">
                      <span className="clock-icon">🕐</span>
                      <span>{order.orderId}</span>
                    </div>
                    <div className="admin-order-customer">
                      {order.userId?.name || order.recipient?.name || '고객명 없음'} · {formatDate(order.orderDate || order.createdAt || order.payment?.paidAt)}
                    </div>
                  </div>
                  <div className="admin-order-info-right">
                    <span className={`admin-status-badge ${getStatusClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <div className="admin-order-total">
                      {formatCurrency(order.grandTotal || order.payment?.amount || 0)}
                    </div>
                    <button className="admin-detail-button">
                      <span>👁️</span>
                      <span>상세보기</span>
                    </button>
                  </div>
                </div>

                <div className="admin-order-card-body">
                  <div className="admin-order-section">
                    <h3>고객 정보</h3>
                    <div className="admin-order-section-content">
                      <p>{order.userId?.email || order.recipient?.email || '이메일 없음'}</p>
                      <p>{order.recipient?.contactNumber || '전화번호 없음'}</p>
                    </div>
                  </div>

                  <div className="admin-order-section">
                    <h3>주문 상품</h3>
                    <div className="admin-order-section-content">
                      <p>{order.items?.length || 0}개 상품</p>
                    </div>
                  </div>

                  <div className="admin-order-section">
                    <h3>배송 주소</h3>
                    <div className="admin-order-section-content">
                      <p>
                        {order.address?.address1 || '주소 없음'}
                        {order.address?.address2 && ` ${order.address.address2}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="admin-order-card-actions">
                  {order.status === 'paid' && (
                    <button
                      className="admin-action-button primary"
                      onClick={() => handleShippingStart(order.orderId || order._id)}
                    >
                      배송 시작
                    </button>
                  )}
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <button
                      className="admin-action-button secondary"
                      onClick={() => handleOrderCancel(order.orderId || order._id)}
                    >
                      주문 취소
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrderManagementPage;

