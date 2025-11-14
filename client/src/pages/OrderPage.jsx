import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './OrderPage.css';

const formatCurrency = (value) =>
  (value || 0).toLocaleString('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  });

const PAYMENT_METHODS = [
  { id: 'mmoney', label: 'M Money VIBE MALL 페이', benefit: '최대 8% 적립' },
  { id: 'tosspay', label: '토스페이', benefit: '혜택' },
  { id: 'kakaopay', label: '카카오페이', benefit: '혜택' },
  { id: 'payco', label: '페이코', benefit: '혜택' },
];

const INSTANT_DISCOUNT_OPTIONS = [
  { id: 'inst-1', label: 'VIBE MALL 현대카드 × 즉시 할인', amount: -8000 },
  { id: 'inst-2', label: 'VIBE MALL 페이 × 삼성카드', amount: -5000 },
  { id: 'inst-3', label: '카카오페이 × 페이머니', amount: -4000 },
  { id: 'inst-4', label: 'VIBE MALL 페이 × 우리카드', amount: -3000 },
];

const DELIVERY_OPTIONS = [
  { value: 'direct', label: '직접입력', message: null },
  { value: 'door', label: '문 앞', message: '문 앞에 놓아주세요' },
  { value: 'delivery-box', label: '경비실', message: '경비실에 맡겨주세요' },
  { value: 'parcel-box', label: '택배함', message: '택배함에 넣어주세요' },
  { value: 'neighbor', label: '이웃', message: '이웃에게 전달해주세요' },
];

const PORTONE_CLIENT_CODE = 'imp63734052';
const PORTONE_SDK_URL = 'https://cdn.iamport.kr/v1/iamport.js';

const OrderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state ?? {};
  const items = state.items ?? [];
  const stateOrderer = useMemo(() => state.orderer ?? null, [state.orderer]);

  const [orderer, setOrderer] = useState({
    name: '',
    contactNumber: '',
    postalCode: '',
    address1: '',
    address2: '',
    deliveryMessage: '',
  });
  const [deliveryOption, setDeliveryOption] = useState('direct');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [isImpReady, setIsImpReady] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const initializeIMP = () => {
      if (window.IMP && typeof window.IMP.init === 'function') {
        window.IMP.init(PORTONE_CLIENT_CODE);
        setIsImpReady(true);
      }
    };

    let script = document.querySelector(`script[src="${PORTONE_SDK_URL}"]`);

    if (!script) {
      script = document.createElement('script');
      script.src = PORTONE_SDK_URL;
      script.async = true;
      script.setAttribute('data-loaded', 'false');
      script.addEventListener('error', () => {
        console.error('PortOne SDK 로딩에 실패했습니다.');
        setIsImpReady(false);
      });
      document.head.appendChild(script);
    }

    const handleLoad = () => {
      script?.setAttribute('data-loaded', 'true');
      initializeIMP();
    };

    if (window.IMP && typeof window.IMP.init === 'function') {
      initializeIMP();
    } else if (script.getAttribute('data-loaded') === 'true') {
      initializeIMP();
    } else {
      script.addEventListener('load', handleLoad);
    }

    return () => {
      script?.removeEventListener('load', handleLoad);
    };
  }, []);

  useEffect(() => {
    const storedUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('user')) || null;
      } catch {
        return null;
      }
    })();

    setOrderer((prev) => ({
      name: stateOrderer?.name ?? storedUser?.name ?? prev.name,
      contactNumber: stateOrderer?.contactNumber ?? storedUser?.phone ?? prev.contactNumber,
      postalCode: stateOrderer?.postalCode ?? '',
      address1: stateOrderer?.address1 ?? storedUser?.address ?? '',
      address2: stateOrderer?.address2 ?? '',
      deliveryMessage: stateOrderer?.deliveryMessage ?? '부재 시 집 앞에 놔주세요',
    }));
    setBuyerEmail(stateOrderer?.email ?? storedUser?.email ?? '');
    setUserId(stateOrderer?.userId ?? storedUser?._id ?? null);

    const deliveryMessage = stateOrderer?.deliveryMessage ?? '부재 시 집 앞에 놔주세요';
    const matchedPreset =
      stateOrderer?.deliveryOption ??
      DELIVERY_OPTIONS.find((preset) => preset.message && preset.message === deliveryMessage)
        ?.value ??
      'direct';
    setDeliveryOption(matchedPreset);
  }, [stateOrderer]);

  const handleOrdererChange = useCallback((field, value) => {
    setOrderer((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  useEffect(() => {
    if (!items.length) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, navigate]);

  const { totalAmount, totalQuantity } = useMemo(() => {
    if (items.length === 0) {
      return { totalAmount: 0, totalQuantity: 0 };
    }
    return {
      totalAmount: items.reduce(
        (sum, item) =>
          sum + (item.priceSnapshot ?? item.product?.price ?? 0) * item.quantity,
        0
      ),
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [items]);

  const estimatedRewards = Math.floor(totalAmount * 0.015);
  const orderTitle = useMemo(() => {
    if (!items.length) return 'VIBE MALL 주문';
    const firstName = items[0].product?.name ?? items[0].productName ?? '상품';
    if (items.length === 1) {
      return firstName;
    }
    return `${firstName} 외 ${items.length - 1}건`;
  }, [items]);

  const handlePayment = useCallback(() => {
    if (!isImpReady || !window.IMP || typeof window.IMP.request_pay !== 'function') {
      alert('결제 모듈이 초기화되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    if (!orderer.name.trim()) {
      alert('주문자 성명을 입력해 주세요.');
      return;
    }
    if (!orderer.contactNumber.trim()) {
      alert('연락처를 입력해 주세요.');
      return;
    }
    if (!orderer.address1.trim()) {
      alert('기본 주소를 입력해 주세요.');
      return;
    }
    if (totalAmount <= 0) {
      alert('결제할 상품이 없습니다.');
      return;
    }

    const merchantUid = `order_${Date.now()}`;
    const imp = window.IMP;

    setIsPaying(true);

    imp.request_pay(
      {
        pg: 'html5_inicis',
        pay_method: 'card',
        merchant_uid: merchantUid,
        name: orderTitle,
        amount: totalAmount,
        buyer_email: buyerEmail || undefined,
        buyer_name: orderer.name,
        buyer_tel: orderer.contactNumber,
        buyer_addr: `${orderer.address1} ${orderer.address2}`.trim(),
        buyer_postcode: orderer.postalCode,
        custom_data: {
          items: items.map((item) => ({
            productId: item.product?._id ?? item.productId ?? item.product,
            quantity: item.quantity,
          })),
        },
      },
      async (response) => {
        setIsPaying(false);
        if (response.success) {
          try {
            const paidAt =
              response.paid_at && Number.isFinite(response.paid_at)
                ? new Date(response.paid_at * 1000)
                : new Date();

            const orderItems = items.map((item) => {
              const product = item.product || {};
              const unitPrice = item.priceSnapshot ?? product.price ?? 0;
              return {
                productId: product._id || item.productId || item.product,
                productName: product.name || item.productName || '상품',
                variant: item.selectedOptions?.size ?? null,
                skuId: product.sku || item.skuId || null,
                quantity: item.quantity,
                unitPrice,
                lineTotal: unitPrice * item.quantity,
              };
            });

            const orderPayload = {
              orderId: response.merchant_uid,
              userId,
              items: orderItems,
              payment: {
                method: response.pay_method || 'card',
                amount: response.paid_amount ?? totalAmount,
                paidAt,
                transactionId: response.imp_uid,
              },
              recipient: {
                name: orderer.name,
                contactNumber: orderer.contactNumber,
              },
              address: {
                postalCode: orderer.postalCode,
                address1: orderer.address1,
                address2: orderer.address2,
              },
              deliveryMessage: orderer.deliveryMessage,
              discounts: {
                couponCode: null,
                couponDiscount: 0,
                usedPoints: 0,
              },
              grandTotal: response.paid_amount ?? totalAmount,
              earnedPoints: estimatedRewards,
              source: 'web',
              userAgent: window.navigator.userAgent,
            };

            const apiResponse = await api.post('/api/orders', orderPayload);
            console.log('주문 생성 성공', apiResponse.data);
            navigate('/order/success', {
              replace: true,
              state: {
                order: apiResponse.data?.data ?? orderPayload,
              },
            });
          } catch (error) {
            console.error('주문 생성 실패', error);
            navigate('/order/failure', {
              replace: true,
              state: {
                message:
                  error.response?.data?.message ||
                  '결제는 완료되었으나 주문 생성 중 문제가 발생했습니다. 고객센터로 문의해 주세요.',
                orderId: response.merchant_uid,
                transactionId: response.imp_uid,
                orderPayload,
              },
            });
          }
        } else {
          console.warn('결제 실패', response);
          navigate('/order/failure', {
            replace: true,
            state: {
              message: response.error_msg || '결제가 취소되었거나 실패했습니다.',
              orderId: response.merchant_uid,
              transactionId: response.imp_uid,
              orderPayload,
            },
          });
        }
      }
    );
  }, [buyerEmail, estimatedRewards, isImpReady, items, navigate, orderTitle, orderer, totalAmount, userId]);

  if (!items.length) {
    return null;
  }

  return (
    <div className="order-page">
      <div className="order-container">
        <main className="order-main">
          <section className="order-section order-header">
            <h1>주문서</h1>
            <div className="order-header-actions">
              <button type="button" className="order-btn ghost">
                기본 배송지
              </button>
              <button type="button" className="order-btn outline">
                배송지 변경
              </button>
            </div>
          </section>

          <section className="order-section">
            <header className="section-title">
              <h2>주문자 정보</h2>
              <button type="button" className="order-badge-btn">
                기본 배송지
              </button>
            </header>
            <div className="section-body">
              <div className="order-form-grid">
                <label className="order-field">
                  <span>주문자 성명</span>
                  <input
                    type="text"
                    value={orderer.name}
                    placeholder="성명을 입력하세요"
                    onChange={(event) => handleOrdererChange('name', event.target.value)}
                  />
                </label>
                <label className="order-field">
                  <span>연락처</span>
                  <input
                    type="tel"
                    value={orderer.contactNumber}
                    placeholder="010-0000-0000"
                    onChange={(event) => handleOrdererChange('contactNumber', event.target.value)}
                  />
                </label>
              </div>
              <div className="order-form-grid">
                <label className="order-field">
                  <span>우편번호</span>
                  <input
                    type="text"
                    value={orderer.postalCode}
                    placeholder="우편번호"
                    onChange={(event) => handleOrdererChange('postalCode', event.target.value)}
                  />
                </label>
                <button type="button" className="order-btn outline small">
                  우편번호 찾기
                </button>
              </div>
              <label className="order-field">
                <span>기본 주소</span>
                <input
                  type="text"
                  value={orderer.address1}
                  placeholder="도로명 주소"
                  onChange={(event) => handleOrdererChange('address1', event.target.value)}
                />
              </label>
              <label className="order-field">
                <span>상세 주소</span>
                <input
                  type="text"
                  value={orderer.address2}
                  placeholder="상세 주소 (동/호수 등)"
                  onChange={(event) => handleOrdererChange('address2', event.target.value)}
                />
              </label>
              <label className="order-field">
                <span>배송 요청사항</span>
                <select
                  value={deliveryOption}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setDeliveryOption(nextValue);
                    const preset = DELIVERY_OPTIONS.find((option) => option.value === nextValue);
                    if (!preset || preset.message === null) {
                      return;
                    }
                    handleOrdererChange('deliveryMessage', preset.message);
                  }}
                >
                  {DELIVERY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <textarea
                className="order-textarea"
                rows={3}
                placeholder="배송 요청사항을 입력하세요"
                value={orderer.deliveryMessage}
                onChange={(event) => {
                  const nextMessage = event.target.value;
                  handleOrdererChange('deliveryMessage', nextMessage);
                  const presetMatch =
                    DELIVERY_OPTIONS.find(
                      (option) => option.message && option.message === nextMessage
                    )?.value ?? 'direct';
                  setDeliveryOption(presetMatch);
                }}
              />
            </div>
          </section>

          <section className="order-section">
            <header className="section-title">
              <h2>주문 상품 {totalQuantity}개</h2>
              <span className="order-delivery-info">모레(목) 도착 예정 · 무료배송</span>
            </header>
            <ul className="order-item-list">
              {items.map((item) => {
                const product = item.product || {};
                const productId = product._id || item.productId || item.product;
                const price =
                  item.priceSnapshot ?? product.price ?? item.unitPrice ?? 0;
                return (
                  <li key={productId} className="order-item">
                    <div className="order-item-thumb">
                      <img
                        src={
                          product.image ||
                          'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=200&q=80'
                        }
                        alt={product.name}
                      />
                    </div>
                    <div className="order-item-info">
                      <strong className="order-item-brand">
                        {product.brand || 'VIBE MALL'}
                      </strong>
                      <h3>{product.name || item.productName}</h3>
                      <p className="order-item-option">
                        옵션 · {item.selectedOptions?.size ?? 'FREE'}
                      </p>
                      <div className="order-item-meta">
                        <span>수량 {item.quantity}개</span>
                        <span>{formatCurrency(price)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="order-section">
            <header className="section-title">
              <h2>장바구니 쿠폰</h2>
            </header>
            <div className="section-body">
              <div className="order-empty-box">사용 가능한 쿠폰이 없습니다.</div>
            </div>
          </section>

          <section className="order-section">
            <header className="section-title">
              <h2>보유 적립금 사용</h2>
            </header>
            <div className="section-body column">
              <p className="order-info">
                최소 5,000원 이상 보유 시 사용 가능 · 현재 적립금 20,230원 중 사용 가능 3,005원
              </p>
              <div className="order-point-input">
                <input type="number" placeholder="0" min="0" />
                <button type="button" className="order-btn ghost">
                  모두 사용
                </button>
              </div>
            </div>
          </section>

          <section className="order-section">
            <header className="section-title">
              <h2>즉시 할인</h2>
            </header>
            <div className="section-body column">
              <p className="order-info">VIBE MALL 페이 즉시 할인은 결제창에서 선택 가능합니다.</p>
              <div className="order-discount-grid">
                {INSTANT_DISCOUNT_OPTIONS.map((option) => (
                  <article key={option.id} className="order-benefit-card">
                    <strong>{option.label}</strong>
                    <span>{formatCurrency(Math.abs(option.amount))} 즉시 할인</span>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="order-section">
            <header className="section-title">
              <h2>결제 수단</h2>
            </header>
            <div className="section-body column">
              <div className="order-payment-list">
                {PAYMENT_METHODS.map((method, index) => (
                  <label key={method.id} className="order-payment-option">
                    <input type="radio" name="payment" defaultChecked={index === 0} />
                    <div>
                      <strong>{method.label}</strong>
                      <span>{method.benefit}</span>
                    </div>
                  </label>
                ))}
              </div>
              <div className="order-card-select">
                <select defaultValue="hyundai">
                  <option value="hyundai">현대카드</option>
                  <option value="kb">KB국민카드</option>
                  <option value="samsung">삼성카드</option>
                </select>
                <select defaultValue="lump-sum">
                  <option value="lump-sum">일시불</option>
                  <option value="3months">3개월</option>
                  <option value="6months">6개월</option>
                </select>
              </div>
              <div className="order-progress-benefit">
                <strong>VIBE MALL 현대카드 청구 할인</strong>
                <span>5% 청구 할인 · 예상 -14,450원</span>
              </div>
            </div>
          </section>
        </main>

        <aside className="order-summary">
          <div className="summary-panel">
            <h2>결제 금액</h2>
            <dl>
              <div className="summary-row">
                <dt>상품 금액</dt>
                <dd>{formatCurrency(totalAmount)}</dd>
              </div>
              <div className="summary-row">
                <dt>배송비</dt>
                <dd>무료배송</dd>
              </div>
              <div className="summary-row">
                <dt>할인 금액</dt>
                <dd className="negative">{formatCurrency(0)}</dd>
              </div>
            </dl>
            <div className="summary-total">
              <span>총 결제 금액</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>
            <div className="summary-reward">
              <span>총 적립 혜택</span>
              <strong>{formatCurrency(estimatedRewards)}</strong>
            </div>
            <button
              type="button"
              className="order-btn primary large"
              onClick={handlePayment}
              disabled={isPaying || totalAmount <= 0 || !isImpReady}
            >
              {isPaying ? '결제 처리 중...' : `${formatCurrency(totalAmount)} 결제하기`}
            </button>
          </div>

          <div className="summary-panel">
            <h3>결제 혜택</h3>
            <ul className="benefit-list">
              <li>
                <strong>M Money 첫 결제</strong>
                <span>최대 10,780원 적립</span>
              </li>
              <li>
                <strong>현대카드</strong>
                <span>결제 시 즉시 할인 30,000원</span>
              </li>
              <li>
                <strong>VIBE MALL 페이</strong>
                <span>결제 즉시 10% 적립</span>
              </li>
            </ul>
          </div>

          <div className="summary-panel">
            <h3>고객센터 안내</h3>
            <p className="order-info">
              결제 및 주문 관련 문의는 1:1 문의 또는 고객센터(1644-0560)로 연락해 주세요.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default OrderPage;

