import { useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import './AdminPage.css';

const stats = [
  {
    id: 'orders',
    label: '총 주문',
    value: '1,248',
    description: '지난주 대비 +12%',
    icon: '🧾',
  },
  {
    id: 'products',
    label: '총 상품',
    value: '312',
    description: '이번 주 신규 8개',
    icon: '🧺',
  },
  {
    id: 'customers',
    label: '총 고객',
    value: '5,430',
    description: '재구매율 36%',
    icon: '👥',
  },
  {
    id: 'revenue',
    label: '총 매출',
    value: '₩182,400,000',
    description: '월간 목표 대비 78%',
    icon: '💰',
  },
];

const quickActions = [
  {
    id: 'new-product',
    title: '새 상품 등록',
    description: '신규 상품을 등록하고 카테고리와 재고를 관리하세요.',
    icon: '🆕',
    actionLabel: '등록하기',
  },
  {
    id: 'order-management',
    title: '주문 관리',
    description: '주문 상태를 확인하고 배송을 빠르게 처리하세요.',
    icon: '📦',
    actionLabel: '주문 보기',
  },
  {
    id: 'revenue-analytics',
    title: '매출 분석',
    description: '기간별 매출 흐름을 분석하고 주요 지표를 확인하세요.',
    icon: '📊',
    actionLabel: '분석 보기',
  },
];

const recentOrders = [
  {
    id: 'ORD-20250218-01',
    customer: '김민수',
    amount: '₩89,000',
    status: '배송중',
    date: '2025.02.18',
    icon: '🚚',
  },
  {
    id: 'ORD-20250217-02',
    customer: '이서연',
    amount: '₩126,000',
    status: '결제완료',
    date: '2025.02.17',
    icon: '✅',
  },
  {
    id: 'ORD-20250216-03',
    customer: '박지훈',
    amount: '₩54,500',
    status: '준비중',
    date: '2025.02.16',
    icon: '🧺',
  },
];

const AdminPage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const user = outletContext?.user ?? null;

  useEffect(() => {
    // 관리자가 아닌 경우 홈으로 리다이렉트
    if (outletContext?.userLoading === false && user?.user_type !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, outletContext?.userLoading, navigate]);

  // 관리자가 아니면 아무것도 렌더링하지 않음
  if (user?.user_type !== 'admin') {
    return null;
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-text">
          <p className="admin-badge">ADMIN DASHBOARD</p>
          <h1>운영 현황 한눈에 보기</h1>
          <p className="admin-subtitle">
            주요 지표와 빠른 작업을 통해 쇼핑몰을 효율적으로 관리하세요.
          </p>
        </div>
      </header>

      <section className="admin-stats">
        {stats.map((stat) => (
          <article key={stat.id} className="admin-stat-card">
            <span className="admin-stat-icon" aria-hidden="true">
              {stat.icon}
            </span>
            <div className="admin-stat-info">
              <p className="admin-stat-label">{stat.label}</p>
              <p className="admin-stat-value">{stat.value}</p>
              <p className="admin-stat-desc">{stat.description}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-quick-actions">
        <div className="admin-section-header">
          <h2>빠른 작업</h2>
          <p>자주 사용하는 기능을 바로 선택하고 업무를 시작하세요.</p>
        </div>
        <div className="admin-quick-grid">
          {quickActions.map((action) => (
            <article key={action.id} className="admin-quick-card">
              <div className="admin-quick-icon" aria-hidden="true">
                {action.icon}
              </div>
              <div className="admin-quick-info">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
              <button
                type="button"
                className="admin-quick-button"
                onClick={
                  action.id === 'new-product'
                    ? () => navigate('/admin/products/new')
                    : action.id === 'order-management'
                    ? () => navigate('/admin/orders')
                    : undefined
                }
              >
                {action.actionLabel}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-recent-orders">
        <div className="admin-section-header">
          <h2>최근 주문</h2>
          <p>최신 주문 3건을 확인하고 신속하게 처리하세요.</p>
        </div>
        <ul className="admin-orders-list">
          {recentOrders.map((order) => (
            <li key={order.id} className="admin-order-item">
              <div className="admin-order-icon" aria-hidden="true">
                {order.icon}
              </div>
              <div className="admin-order-info">
                <p className="admin-order-id">{order.id}</p>
                <p className="admin-order-meta">
                  {order.customer} · {order.date}
                </p>
              </div>
              <div className="admin-order-amount">{order.amount}</div>
              <span className="admin-order-status">{order.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-bottom-actions">
        <button
          type="button"
          className="admin-bottom-button admin-bottom-button-primary"
          onClick={() => navigate('/admin/products')}
        >
          상품 관리 바로가기
        </button>
        <button
          type="button"
          className="admin-bottom-button admin-bottom-button-secondary"
          onClick={() => navigate('/admin/orders')}
        >
          주문 관리 바로가기
        </button>
      </section>
    </div>
  );
};

export default AdminPage;

