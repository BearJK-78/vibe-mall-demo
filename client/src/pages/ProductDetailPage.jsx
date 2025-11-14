import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import api from '../utils/api';
import './ProductDetailPage.css';

const formatPrice = (value) =>
  typeof value === 'number'
    ? value.toLocaleString('ko-KR')
    : value;

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
];

const DEFAULT_MEMBERSHIP_BENEFITS = [
  { label: 'VIBE MALL 페이', description: '결제 시 최대 5% 즉시 적립' },
  { label: '신규 가입', description: '웰컴 쿠폰팩 3종 지급' },
  { label: 'VIBE MALL 카드', description: '최대 12개월 무이자 할부' },
];

const DEFAULT_DETAIL_INFO = [
  { title: 'CARE TIP', content: '첫 세탁은 드라이 클리닝을 권장하며, 저온에서 단독 세탁하세요.' },
  { title: 'FABRIC', content: '프리미엄 폴리/면 혼방 소재로 제작되어 뛰어난 내구성과 착용감을 제공합니다.' },
  { title: 'FIT GUIDE', content: '정사이즈 착용을 권장하며, 여유로운 실루엣으로 다양한 스타일 연출이 가능합니다.' },
];

const DEFAULT_REVIEW_SUMMARY = {
  average: 4.8,
  totalCount: 128,
  highlights: ['핏이 예뻐요', '재질이 좋아요', '색감이 세련돼요'],
  sizeFeedback: [
    { label: '크다', value: 14 },
    { label: '정사이즈', value: 94 },
    { label: '작다', value: 20 },
  ],
};

const DEFAULT_QNA = {
  total: 4,
  recent: [
    { question: '세탁 방법이 궁금해요.', answer: '케어라벨 기준 드라이 클리닝을 권장드립니다.' },
    { question: '교환/환불 정책이 어떻게 되나요?', answer: '상품 수령 후 7일 이내 미사용 시 교환/환불이 가능합니다.' },
  ],
};

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { productId } = useParams();

  const outletContext = useOutletContext();
  const refreshCart = outletContext?.refreshCart;
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [addingCart, setAddingCart] = useState(false);
  const [cartError, setCartError] = useState('');
  const [quantity, setQuantity] = useState(1);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get(`/api/products/${productId}`);
      if (data?.success && data.data) {
        setProduct(data.data);
      } else {
        setError('상품 정보를 불러오지 못했습니다.');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('요청하신 상품이 존재하지 않습니다.');
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            '상품 정보를 불러오는 중 오류가 발생했습니다.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setQuantity(1);
    setCartError('');
  }, [productId]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/products', {
          params: { limit: 6 },
        });
        if (data?.success) {
          setRelatedProducts(
            (data.data || []).filter((item) => item._id !== productId).slice(0, 4)
          );
        }
      } catch {
        setRelatedProducts([]);
      }
    })();
  }, [productId]);

  const galleryImages = useMemo(() => {
    if (!product) return FALLBACK_IMAGES;

    const fromProduct = [
      ...(Array.isArray(product.images) ? product.images : []),
      product.image,
    ]
      .filter(Boolean)
      .slice(0, 4);

    if (fromProduct.length > 0) {
      return fromProduct;
    }

    return FALLBACK_IMAGES;
  }, [product]);

  useEffect(() => {
    setActiveImage(galleryImages[0] || '');
  }, [galleryImages]);

  const increaseQuantity = useCallback(() => {
    setQuantity((prev) => prev + 1);
  }, []);

  const decreaseQuantity = useCallback(() => {
    setQuantity((prev) => Math.max(1, prev - 1));
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (!product?._id) return;

    try {
      setAddingCart(true);
      setCartError('');
      await api.post('/api/cart/items', {
        productId: product._id,
        quantity,
        priceSnapshot: product.price,
      });
      if (typeof refreshCart === 'function') {
        await refreshCart();
      }
      navigate('/cart');
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: `/products/${productId}` } });
        return;
      }
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        '장바구니에 상품을 담지 못했습니다.';
      setCartError(message);
    } finally {
      setAddingCart(false);
    }
  }, [navigate, product, productId, refreshCart, quantity]);

  const displayProduct = useMemo(() => {
    if (!product) return null;

    const summaryBase = [
      product.description?.replace(/\s+/g, ' ').trim() ||
        `${product.name}은(는) ${product.category || '프리미엄'} 카테고리의 상품입니다.`,
      `SKU: ${product.sku || '정보 없음'}`,
      `현재 판매가: ${formatPrice(product.price)}원`,
      '모든 상품은 무료 배송으로 제공되며, 회원 등급별 추가 혜택이 적용됩니다.',
    ];

    const specTable = [
      { key: '상품코드', value: product.sku || '-' },
      {
        key: '카테고리',
        value: product.category || '-',
      },
      {
        key: '가격',
        value: product.price !== undefined ? `${formatPrice(product.price)}원` : '-',
      },
      {
        key: '등록일',
        value: product.createdAt
          ? new Date(product.createdAt).toLocaleDateString('ko-KR')
          : '-',
      },
    ];

    return {
      ...product,
      brand: product.brand || product.category || 'VIBE SELECT',
      price: product.price ?? 0,
      originalPrice: product.originalPrice,
      discountRate: product.discountRate,
      rating: product.rating || 4.7,
      reviewCount: product.reviewCount || DEFAULT_REVIEW_SUMMARY.totalCount,
      benefitText:
        product.benefitText || '첫 구매 15% 쿠폰 적용 시 추가 할인 혜택을 확인하세요.',
      badges: product.badges || ['무료 배송', 'VIBE MALL 단독'],
      images: galleryImages,
      shipping: {
        company: 'CJ대한통운',
        cost: '무료배송',
        arrival: '2~3일 이내 도착 예정',
        ...(product.shipping || {}),
      },
      membershipBenefits: product.membershipBenefits || DEFAULT_MEMBERSHIP_BENEFITS,
      summary: product.summary?.length ? product.summary : summaryBase,
      officialNotice:
        product.officialNotice || {
          title: '공식 판매처 인증 안내',
          description:
            '본 상품은 정식 수입통관 절차를 거친 정품으로 안심하고 구매하실 수 있습니다.',
          cta: '인증 혜택 확인하기',
        },
      highlightVideos:
        product.highlightVideos ||
        [
          {
            title: `${product.category || 'VIBE SELECT'} 윈터 에디션`,
            description: '도심과 아웃도어를 모두 아우르는 프리미엄 스타일링 제안',
            thumbnail:
              'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80',
          },
        ],
      productStory:
        product.productStory ||
        [
          {
            title: '시즌 콘셉트',
            image:
              'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
            description:
              '겨울 시즌을 겨냥한 프리미엄 소재와 고급스러운 실루엣으로 완성된 캡슐 컬렉션.',
          },
          {
            title: '디자인 포인트',
            image:
              'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1200&q=80',
            description: '세련된 컬러 팔레트와 실용적인 디테일로 완성도 높은 디자인.',
          },
        ],
      specTable: product.specTable || specTable,
      detailInfo: product.detailInfo || DEFAULT_DETAIL_INFO,
      reviewSummary: product.reviewSummary || DEFAULT_REVIEW_SUMMARY,
      qna: product.qna || DEFAULT_QNA,
    };
  }, [galleryImages, product]);

  if (loading) {
    return (
      <div className="product-detail loading">
        <div className="detail-container">
          <p>상품 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error || !displayProduct) {
    return (
      <div className="product-detail not-found">
        <div className="detail-container">
          <h1>{error || '해당 상품을 찾을 수 없습니다.'}</h1>
          <p>요청하신 상품이 존재하지 않거나 판매가 종료되었을 수 있습니다.</p>
          <button
            type="button"
            className="detail-button primary"
            onClick={() => navigate('/')}
          >
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  const {
    name,
    brand,
    price,
    originalPrice,
    discountRate,
    rating,
    reviewCount,
    benefitText,
    badges,
    images,
    shipping,
    membershipBenefits,
    summary,
    officialNotice,
    highlightVideos = [],
    productStory = [],
    specTable,
    detailInfo,
    reviewSummary,
    qna,
  } = displayProduct;

  const reviewTotal = reviewSummary?.totalCount ?? 0;

  const breadcrumb = [
    { label: 'HOME', path: '/' },
    { label: brand, path: null },
    { label: name, path: null },
  ];

  return (
    <div className="product-detail">
      <div className="detail-container">
        <nav className="detail-breadcrumb">
          {breadcrumb.map((item, index) => (
            <span key={item.label}>
              {item.path ? (
                <button type="button" onClick={() => navigate(item.path)}>
                  {item.label}
                </button>
              ) : (
                item.label
              )}
              {index !== breadcrumb.length - 1 && (
                <span className="breadcrumb-divider">/</span>
              )}
            </span>
          ))}
        </nav>

        <section className="detail-hero">
          <div className="hero-gallery">
            <div className="gallery-main">
              {activeImage && <img src={activeImage} alt={`${name} 프리뷰`} />}
            </div>
            <div className="gallery-thumbs">
              {images?.map((image) => (
                <button
                  type="button"
                  key={image}
                  className={`thumb ${activeImage === image ? 'active' : ''}`}
                  onClick={() => setActiveImage(image)}
                >
                  <img src={image} alt={`${name} 썸네일`} />
                </button>
              ))}
            </div>
          </div>

          <div className="hero-summary">
            <div className="summary-header">
              <p className="summary-brand">{brand}</p>
              <h1>{name}</h1>
              {rating ? (
                <div className="summary-rating">
                  <span className="stars">★ {rating.toFixed(1)}</span>
                  <span className="rating-count">
                    리뷰 {reviewCount.toLocaleString()}개
                  </span>
                </div>
              ) : (
                <div className="summary-rating empty">첫 리뷰를 남겨주세요.</div>
              )}
            </div>

            <div className="summary-pricing">
              <div className="price-main">
                {discountRate && (
                  <span className="price-discount">{discountRate}%</span>
                )}
                <span className="price-current">{formatPrice(price)}원</span>
              </div>
              {originalPrice && (
                <span className="price-original">
                  {formatPrice(originalPrice)}원
                </span>
              )}
              {benefitText && (
                <div className="benefit-card">{benefitText}</div>
              )}
            </div>

            {badges?.length > 0 && (
              <div className="summary-badges">
                {badges.map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </div>
            )}

            <div className="summary-quantity">
              <span className="quantity-label">수량</span>
              <div className="quantity-control">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  aria-label="수량 감소"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={increaseQuantity}
                  aria-label="수량 증가"
                >
                  +
                </button>
              </div>
            </div>

            {cartError && <p className="cart-error-message">{cartError}</p>}

            <div className="summary-actions">
              <button type="button" className="detail-button primary">
                바로 구매
              </button>
              <button
                type="button"
                className="detail-button secondary"
                onClick={handleAddToCart}
                disabled={addingCart}
              >
                {addingCart ? '담는 중...' : '장바구니'}
              </button>
              <button type="button" className="detail-button ghost">
                ♡
              </button>
            </div>

            {shipping && (
              <div className="summary-shipping">
                <h3>배송 정보</h3>
                <dl>
                  <div>
                    <dt>택배사</dt>
                    <dd>{shipping.company}</dd>
                  </div>
                  <div>
                    <dt>배송비</dt>
                    <dd>{shipping.cost}</dd>
                  </div>
                  <div>
                    <dt>도착 예정</dt>
                    <dd>{shipping.arrival}</dd>
                  </div>
                </dl>
              </div>
            )}

            {membershipBenefits?.length > 0 && (
              <div className="summary-benefits">
                <h3>회원 혜택</h3>
                <ul>
                  {membershipBenefits.map((benefit) => (
                    <li key={benefit.label}>
                      <strong>{benefit.label}</strong>
                      <p>{benefit.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {summary?.length > 0 && (
          <section className="detail-highlights">
            <h2>이 상품의 핵심 포인트</h2>
            <ul>
              {summary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {officialNotice && (
          <section className="detail-official">
            <div className="official-card">
              <h2>{officialNotice.title}</h2>
              <p>{officialNotice.description}</p>
              <button type="button">{officialNotice.cta}</button>
            </div>
          </section>
        )}

        {highlightVideos?.length > 0 && (
          <section className="detail-media">
            {highlightVideos.map((video) => (
              <article key={video.title} className="media-card">
                <div className="media-thumb">
                  <img src={video.thumbnail} alt={video.title} />
                  <span className="media-badge">VIDEO</span>
                </div>
                <div className="media-content">
                  <h3>{video.title}</h3>
                  <p>{video.description}</p>
                  <button type="button">VIBE MALL TV에서 보기</button>
                </div>
              </article>
            ))}
          </section>
        )}

        {productStory?.length > 0 && (
          <section className="detail-story">
            <h2>Product Story</h2>
            <div className="story-grid">
              {productStory.map((story) => (
                <article key={story.title} className="story-card">
                  <img src={story.image} alt={story.title} />
                  <div className="story-text">
                    <h3>{story.title}</h3>
                    <p>{story.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {detailInfo?.length > 0 && (
          <section className="detail-insights">
            <h2>DETAIL INFO</h2>
            <div className="insight-grid">
              {detailInfo.map((info) => (
                <article key={info.title}>
                  <h3>{info.title}</h3>
                  <p>{info.content}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {specTable?.length > 0 && (
          <section className="detail-spec">
            <h2>상품정보 제공고시</h2>
            <table>
              <tbody>
                {specTable.map((item) => (
                  <tr key={item.key}>
                    <th>{item.key}</th>
                    <td>{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {reviewSummary && (
          <section className="detail-review">
            <div className="review-header">
              <div>
                <h2>REVIEW</h2>
                <p>구매자 총평 {reviewTotal}건</p>
              </div>
              <div className="review-score">
                <strong>{reviewSummary.average.toFixed(1)}</strong>
                <span>/ 5.0</span>
              </div>
            </div>

            <div className="review-body">
              <div className="review-highlights">
                <h3>키워드</h3>
                <div className="review-tags">
                  {reviewSummary.highlights.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className="review-size">
                <h3>사이즈 체감</h3>
                <ul>
                  {reviewSummary.sizeFeedback.map((item) => (
                    <li key={item.label}>
                      <span>{item.label}</span>
                      <div className="gauge">
                        <div
                          className="gauge-fill"
                          style={{
                            width: `${reviewTotal ? (item.value / reviewTotal) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="count">{item.value}명</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {qna && (
          <section className="detail-qna">
            <div className="qna-header">
              <h2>상품문의 {qna.total}건</h2>
              <button type="button">문의하기</button>
            </div>
            {qna.recent?.length > 0 ? (
              <ul className="qna-list">
                {qna.recent.map((item) => (
                  <li key={item.question}>
                    <div className="qna-question">
                      <span className="badge">Q</span>
                      <p>{item.question}</p>
                    </div>
                    <div className="qna-answer">
                      <span className="badge answer">A</span>
                      <p>{item.answer}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="qna-empty">
                아직 등록된 문의가 없습니다. 상품에 대해 궁금한 점을 남겨주세요.
              </div>
            )}
          </section>
        )}

        {relatedProducts.length > 0 && (
          <section className="detail-related">
            <h2>함께 보면 좋은 상품</h2>
            <div className="related-grid">
              {relatedProducts.map((item) => (
                <article
                  key={item._id || item.id}
                  className="related-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/products/${item._id || item.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/products/${item._id || item.id}`);
                    }
                  }}
                >
                  <div className="related-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="related-info">
                    <p className="related-brand">
                      {item.brand || item.category || 'VIBE SELECT'}
                    </p>
                    <h3>{item.name}</h3>
                    <p className="related-price">
                      {formatPrice(item.price)}원
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;

