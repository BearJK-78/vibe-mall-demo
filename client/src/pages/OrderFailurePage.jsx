import { useLocation, useNavigate } from 'react-router-dom';
import './OrderResultPage.css';

const OrderFailurePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const failure = location.state ?? {};

  return (
    <div className="order-result-page failure">
      <div className="order-result-card">
        <div className="result-icon failure">
          <span>!</span>
        </div>
        <h1>주문이 정상적으로 완료되지 않았습니다.</h1>
        <p className="result-subtitle">
          잠시 후 다시 시도하시거나, 문제가 지속되면 고객센터로 문의해 주세요.
        </p>

        {failure.message && (
          <section className="result-section">
            <h2>오류 메시지</h2>
            <p className="error-message">{failure.message}</p>
          </section>
        )}

        {failure.orderId && (
          <section className="result-section">
            <h2>주문 정보</h2>
            <div className="result-grid">
              <div>
                <span className="label">주문 번호</span>
                <p>{failure.orderId}</p>
              </div>
              <div>
                <span className="label">결제 아이디</span>
                <p>{failure.transactionId}</p>
              </div>
            </div>
          </section>
        )}

        <div className="result-actions">
          <button type="button" className="order-btn outline" onClick={() => navigate('/cart')}>
            장바구니로 돌아가기
          </button>
          <button type="button" className="order-btn primary" onClick={() => navigate('/order')}>
            다시 시도하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderFailurePage;

