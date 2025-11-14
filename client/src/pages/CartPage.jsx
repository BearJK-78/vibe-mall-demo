import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../utils/api';
import './CartPage.css';

const RESEEN_PRODUCTS = [
  {
    id: 'outer-1',
    name: 'MA-1 플라이트 자켓 블랙',
    brand: '알파 인더스트리',
    price: 289000,
    discountRate: 0,
    image:
      'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'outer-2',
    name: '울 블렌드 더블 브레스티드 코트',
    brand: 'VIBE MALL 스탠다드',
    price: 139000,
    discountRate: 21,
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'outer-3',
    name: '숏한감성 MA-1 보머 재킷',
    brand: 'VIBE MALL 스탠다드',
    price: 109900,
    discountRate: 25,
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'outer-4',
    name: '다운 블렌드 하프 패딩',
    brand: 'VIBE MALL 스탠다드',
    price: 109900,
    discountRate: 15,
    image:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'outer-5',
    name: '나사 MA-1 플라이트 재킷',
    brand: '알파 인더스트리',
    price: 319000,
    discountRate: 0,
    image:
      'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=400&q=80',
  },
];

const BRAND_RECOMMENDATIONS = [
  {
    id: 'rec-1',
    name: '트레일 러닝 테크 스니커즈',
    brand: '몽클레르',
    price: 262900,
    discountRate: 20,
    image:
      'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=420&q=80',
  },
  {
    id: 'rec-2',
    name: '스피드크루즈5 러닝화',
    brand: '살로몬',
    price: 190900,
    discountRate: 20,
    image:
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=420&q=80',
  },
  {
    id: 'rec-3',
    name: '에센셜 헤비 셋업',
    brand: '고프웨어',
    price: 348000,
    discountRate: 0,
    image:
      'https://images.unsplash.com/photo-1475178278683-8d9db51c3e82?auto=format&fit=crop&w=420&q=80',
  },
  {
    id: 'rec-4',
    name: '나일론 투웨이 트랙 팬츠',
    brand: '고프웨어',
    price: 198000,
    discountRate: 0,
    image:
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=420&q=80',
  },
  {
    id: 'rec-5',
    name: '윈드브레이커 하이넥 재킷',
    brand: '나이키',
    price: 128250,
    discountRate: 5,
    image:
      'https://images.unsplash.com/photo-1524629718900-1e854ec0107b?auto=format&fit=crop&w=420&q=80',
  },
];

const formatCurrency = (value) =>
  (value || 0).toLocaleString('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  });

const CartPage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const refreshCart = outletContext?.refreshCart;
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingAction, setPendingAction] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/cart');
      setCart(response.data?.data ?? { items: [] });
      setError(null);
      if (typeof refreshCart === 'function') {
        await refreshCart();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: '/cart' } });
        return;
      }
      setError(err.response?.data?.message || '장바구니를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateCart = useCallback((data) => {
    setCart(data?.data ?? data);
  }, []);

  const handleToggleItem = useCallback(
    async (productId, nextChecked) => {
      try {
        setPendingAction(true);
        const response = await api.patch(`/api/cart/items/${productId}`, {
          checked: nextChecked,
        });
        handleUpdateCart(response.data);
      } catch (err) {
        setError(err.response?.data?.message || '항목 상태를 변경하지 못했습니다.');
      } finally {
        setPendingAction(false);
      }
    },
    [handleUpdateCart]
  );

  const handleToggleAll = useCallback(async () => {
    if (!cart?.items?.length) return;
    const allChecked = cart.items.every((item) => item.checked);

    try {
      setPendingAction(true);
      await Promise.all(
        cart.items.map((item) =>
          api.patch(`/api/cart/items/${item.product._id || item.product}`, {
            checked: !allChecked,
          })
        )
      );
      await fetchCart();
      if (typeof refreshCart === 'function') {
        await refreshCart();
      }
    } catch (err) {
      setError(err.response?.data?.message || '전체 선택을 변경하지 못했습니다.');
      setPendingAction(false);
    }
  }, [cart, fetchCart]);

  const handleQuantityChange = useCallback(
    async (productId, delta) => {
      const item = cart?.items?.find(
        (entry) => (entry.product._id || entry.product) === productId
      );
      if (!item) return;

      const nextQuantity = item.quantity + delta;
      if (nextQuantity <= 0) {
        handleRemoveItem(productId);
        return;
      }

      try {
        setPendingAction(true);
        const response = await api.patch(`/api/cart/items/${productId}`, {
          quantity: nextQuantity,
        });
        handleUpdateCart(response.data);
        if (typeof refreshCart === 'function') {
          await refreshCart();
        }
      } catch (err) {
        setError(err.response?.data?.message || '수량을 변경하지 못했습니다.');
      } finally {
        setPendingAction(false);
      }
    },
    [cart, handleUpdateCart]
  );

  const handleRemoveItem = useCallback(
    async (productId) => {
      if (!window.confirm('장바구니에서 해당 상품을 삭제할까요?')) {
        return;
      }
      try {
        setPendingAction(true);
        const response = await api.delete(`/api/cart/items/${productId}`);
        handleUpdateCart(response.data);
        if (typeof refreshCart === 'function') {
          await refreshCart();
        }
      } catch (err) {
        setError(err.response?.data?.message || '상품을 삭제하지 못했습니다.');
      } finally {
        setPendingAction(false);
      }
    },
    [handleUpdateCart]
  );

  const handleClearCart = useCallback(async () => {
    if (!cart?.items?.length) return;
    if (!window.confirm('장바구니를 모두 비우시겠습니까?')) return;

    try {
      setPendingAction(true);
      const response = await api.delete('/api/cart');
      handleUpdateCart(response.data);
      if (typeof refreshCart === 'function') {
        await refreshCart();
      }
    } catch (err) {
      setError(err.response?.data?.message || '장바구니를 비우지 못했습니다.');
    } finally {
      setPendingAction(false);
    }
  }, [cart, handleUpdateCart]);

  const itemList = cart?.items ?? [];
  const selectedItems = useMemo(
    () => itemList.filter((item) => item.checked),
    [itemList]
  );

  const totals = useMemo(
    () => ({
      totalQuantity: selectedItems.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: selectedItems.reduce(
        (sum, item) =>
          sum + (item.priceSnapshot ?? item.product?.price ?? 0) * item.quantity,
        0
      ),
      totalDiscount: 0,
      shippingFee: selectedItems.length > 0 ? 0 : 0,
    }),
    [selectedItems]
  );

  const handleProceedCheckout = useCallback(() => {
    if (!selectedItems.length) return;
    navigate('/order', {
      state: {
        items: selectedItems,
        totals: {
          totalQuantity: totals.totalQuantity,
          totalAmount: totals.totalAmount,
        },
      },
    });
  }, [navigate, selectedItems, totals.totalAmount, totals.totalQuantity]);

  const isAllChecked =
    itemList.length > 0 && itemList.every((item) => item.checked);

  if (loading) {
    return (
      <div className="cart-page loading">
        <div className="cart-container">
          <p>장바구니 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-page error">
        <div className="cart-container">
          <p>{error}</p>
          <button type="button" onClick={fetchCart}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const renderEmptyState = itemList.length === 0;

  return (
    <div className={`cart-page ${pendingAction ? 'cart-disabled' : ''}`}>
      <div className="cart-container">
        <section className="cart-main">
          <header className="cart-header">
            <h1>장바구니</h1>
            <div className="cart-actions">
              <label className="cart-checkbox">
                <input
                  type="checkbox"
                  checked={isAllChecked}
                  onChange={handleToggleAll}
                />
                전체 선택
              </label>
              <button
                type="button"
                className="cart-btn ghost"
                onClick={handleToggleAll}
              >
                선택 삭제
              </button>
              <button
                type="button"
                className="cart-btn ghost"
                onClick={handleClearCart}
              >
                장바구니 비우기
              </button>
            </div>
          </header>

          {renderEmptyState ? (
            <div className="cart-empty">
              <p>장바구니가 비어 있습니다.</p>
              <button
                type="button"
                className="cart-btn primary"
                onClick={() => navigate('/')}
              >
                쇼핑 계속하기
              </button>
            </div>
          ) : (
            <ul className="cart-item-list">
              {itemList.map((item) => {
                const product = item.product || {};
                const productId = product._id || product;
                const price = item.priceSnapshot ?? product.price ?? 0;
                const discountedPrice = price;
                return (
                  <li key={productId} className="cart-item">
                    <div className="item-select">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(event) =>
                          handleToggleItem(productId, event.target.checked)
                        }
                      />
                    </div>
                    <div className="item-thumbnail">
                      <img
                        src={
                          product.image ||
                          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80'
                        }
                        alt={product.name}
                      />
                    </div>
                    <div className="item-info">
                      <div className="item-row">
                        <h2>{product.name}</h2>
                        <button
                          type="button"
                          className="item-remove"
                          onClick={() => handleRemoveItem(productId)}
                        >
                          삭제
                        </button>
                      </div>
                      <p className="item-brand">{product.brand || 'VIBE MALL'}</p>
                      <p className="item-option">
                        옵션 · {item.selectedOptions?.size ?? 'FREE'}
                      </p>
                      <div className="item-meta">
                        <span>모레(목) 도착 예정</span>
                        <span className="item-shipping">무료배송</span>
                      </div>
                      <div className="item-controls">
                        <div className="item-quantity">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(productId, -1)}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(productId, 1)}
                          >
                            +
                          </button>
                        </div>
                        <div className="item-price">
                          <strong>{formatCurrency(discountedPrice)}</strong>
                          {product.originalPrice && (
                            <span className="item-original">
                              {formatCurrency(product.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="item-buttons">
                        <button type="button" className="cart-btn ghost">
                          옵션 변경
                        </button>
                        <button type="button" className="cart-btn ghost">
                          쿠폰 사용
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <section className="cart-section">
            <h2>내가 전에 보고 놓쳤던 상품 다시보기</h2>
            <div className="product-carousel">
              {RESEEN_PRODUCTS.map((product) => (
                <article key={product.id} className="product-card">
                  <div className="product-thumb">
                    <img src={product.image} alt={product.name} />
                  </div>
                  <div className="product-info">
                    <p className="product-brand">{product.brand}</p>
                    <h3>{product.name}</h3>
                    <div className="product-price">
                      {product.discountRate > 0 && (
                        <span className="product-discount">
                          {product.discountRate}%
                        </span>
                      )}
                      <span>{formatCurrency(product.price)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="cart-section">
            <h2>고프코어 스타일 브랜드 아이템 추천</h2>
            <div className="product-carousel">
              {BRAND_RECOMMENDATIONS.map((product) => (
                <article key={product.id} className="product-card">
                  <div className="product-thumb">
                    <img src={product.image} alt={product.name} />
                  </div>
                  <div className="product-info">
                    <p className="product-brand">{product.brand}</p>
                    <h3>{product.name}</h3>
                    <div className="product-price">
                      {product.discountRate > 0 && (
                        <span className="product-discount">
                          {product.discountRate}%
                        </span>
                      )}
                      <span>{formatCurrency(product.price)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <aside className="cart-summary">
          <div className="summary-card">
            <h2>구매 금액</h2>
            <dl>
              <div>
                <dt>상품 금액</dt>
                <dd>{formatCurrency(totals.totalAmount)}</dd>
              </div>
              <div>
                <dt>할인 금액</dt>
                <dd className="summary-discount">
                  -{formatCurrency(totals.totalDiscount)}
                </dd>
              </div>
              <div>
                <dt>배송비</dt>
                <dd>{totals.shippingFee === 0 ? '무료배송' : formatCurrency(totals.shippingFee)}</dd>
              </div>
            </dl>
            <div className="summary-total">
              <span>총 구매 금액</span>
              <strong>{formatCurrency(totals.totalAmount + totals.shippingFee)}</strong>
            </div>
            <button
              type="button"
              className="cart-btn primary large"
              disabled={!selectedItems.length}
              onClick={handleProceedCheckout}
            >
              {selectedItems.length
                ? `${selectedItems.length}개 상품 주문하기`
                : '상품을 선택해 주세요'}
            </button>
          </div>

          <div className="summary-card">
            <h3>결제 혜택</h3>
            <ul className="summary-benefits">
              <li>
                <strong>VIBE MALL 현대카드 혜택</strong>
                <span>첫 결제 즉시 할인 3만원</span>
              </li>
              <li>
                <strong>VIBE MALL 페이</strong>
                <span>결제 즉시 10% 적립</span>
              </li>
              <li>
                <strong>VIBE MALL 머니</strong>
                <span>첫 결제 시 10% 추가 적립</span>
              </li>
            </ul>
            <button type="button" className="cart-btn outline">
              혜택 확인
            </button>
          </div>

          <div className="summary-card">
            <h3>즉시 할인</h3>
            <ul className="summary-benefits">
              <li>VIBE MALL 페이 × 삼성카드 7천원 즉시 할인</li>
              <li>VIBE MALL 페이 × 제이코퍼레이션 3천원 즉시 할인</li>
              <li>VIBE MALL 페이 × 우리카드 1만5천원 즉시 할인</li>
            </ul>
            <button type="button" className="cart-btn outline">
              혜택 더보기
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CartPage;

