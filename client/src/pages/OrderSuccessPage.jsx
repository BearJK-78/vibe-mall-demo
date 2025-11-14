import { useLocation, useNavigate } from 'react-router-dom';
import './OrderResultPage.css';

const formatCurrency = (value) =>
  (value || 0).toLocaleString('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  });

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order ?? null;

  if (!order) {
    return (
      <div className="order-result-page">
        <div className="order-result-card">
          <h1>주문 내역을 확인할 수 없습니다.</h1>
          <p>주문 정보가 만료되었거나 존재하지 않습니다.</p>
          <button type="button" className="order-btn primary" onClick={() => navigate('/')}>
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-result-page success">
      <div className="order-result-card">
        <div className="result-icon success">
          <span>✓</span>
        </div>
        <h1>주문이 성공적으로 완료되었습니다!</h1>
        <p className="result-subtitle">주문해 주셔서 감사합니다. 주문 확인 이메일을 곧 받으실 수 있습니다.</p>

        <section className="result-section">
          <h2>주문 정보</h2>
          <div className="result-grid">
            <div>
              <span className="label">주문 번호</span>
              <p>{order.orderId}</p>
            </div>
            <div>
              <span className="label">주문 날짜</span>
              <p>{new Date(order.payment?.paidAt || Date.now()).toLocaleString('ko-KR')}</p>
            </div>
            <div>
              <span className="label">결제 금액</span>
              <p>{formatCurrency(order.grandTotal)}</p>
            </div>
            <div>
              <span className="label">결제 방식</span>
              <p>{order.payment?.method === 'card' ? '카드 결제' : order.payment?.method || '결제'}</p>
            </div>
          </div>
        </section>

        <section className="result-section">
          <h2>배송지 정보</h2>
          <div className="result-grid">
            <div>
              <span className="label">수령인</span>
              <p>{order.recipient?.name}</p>
            </div>
            <div>
              <span className="label">연락처</span>
              <p>{order.recipient?.contactNumber}</p>
            </div>
            <div className="grid-span">
              <span className="label">주소</span>
              <p>
                ({order.address?.postalCode}) {order.address?.address1} {order.address?.address2}
              </p>
            </div>
            {order.deliveryMessage && (
              <div className="grid-span">
                <span className="label">배송 요청사항</span>
                <p>{order.deliveryMessage}</p>
              </div>
            )}
          </div>
        </section>

        <section className="result-section">
          <h2>주문 상품</h2>
          <ul className="result-items">
            {order.items?.map((item) => (
              <li key={item.productId}>
                <div>
                  <strong>{item.productName}</strong>
                  {item.variant && <span className="item-variant">옵션: {item.variant}</span>}
                </div>
                <div className="item-summary">
                  <span>{item.quantity}개</span>
                  <span>{formatCurrency(item.lineTotal)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="result-actions">
          <button type="button" className="order-btn outline" onClick={() => navigate('/order-history')}>
            주문 목록 보기
          </button>
          <button type="button" className="order-btn primary" onClick={() => navigate('/')}>
            계속 쇼핑하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;

